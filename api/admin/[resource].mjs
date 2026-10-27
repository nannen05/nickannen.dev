import { json, normalize, parseCsv, readJson, requireAdmin, scoreLead, supabase } from "../_outreach.mjs";

async function importCsv(payload) {
  const db = supabase(); const rows = parseCsv(payload.csv || ""); let created = 0; let updated = 0;
  for (const raw of rows) {
    const lead = normalize(raw); if (!lead.email) continue; let companyId = null;
    if (lead.company_name) { const { data: company } = await db.from("companies").upsert({ name: lead.company_name, domain: lead.company_domain || null }, { onConflict: "domain" }).select("id").single(); companyId = company?.id || null; }
    const { data: existing } = await db.from("contacts").select("id").eq("email", lead.email).maybeSingle();
    const score = scoreLead({ technologies: lead.technologies, title: lead.title, emailStatus: lead.email_status, catchAllStatus: lead.catch_all_status, employees: lead.employees, industry: lead.industry });
    const record = { ...lead, company_id: companyId, score, status: /invalid|risky|unverified/i.test(`${lead.email_status} ${lead.catch_all_status}`) ? "quarantine" : "review", updated_at: new Date().toISOString() }; delete record.company_name; delete record.company_domain;
    const { error } = await db.from("contacts").upsert(record, { onConflict: "email" }); if (error) throw error; if (existing) updated++; else created++;
  }
  await db.from("imports").insert({ filename: payload.filename || "upload.csv", rows_total: rows.length, rows_created: created, rows_updated: updated }); return { created, updated };
}
export default async function handler(req,res) { if (!requireAdmin(req,res)) return; const resource = req.query.resource; const db = supabase(); try {
  if (resource === "imports" && req.method === "POST") return json(res,201,await importCsv(await readJson(req)));
  if (resource === "stats" && req.method === "GET") { const count = async (table, filter) => { let q=db.from(table).select("id",{count:"exact",head:true}); if(filter) q=filter(q); const {count:n,error}=await q;if(error)throw error;return n||0; }; return json(res,200,{ total:await count("contacts"), qualified:await count("contacts",q=>q.gte("score",50).eq("status","review")), active:await count("enrollments",q=>q.eq("status","active")), sent:await count("messages",q=>q.eq("direction","outbound")), replies:await count("replies") }); }
  if (resource === "leads" && req.method === "GET") {
    const page=Math.max(1,Number.parseInt(req.query.page,10)||1);
    const pageSize=Math.min(100,Math.max(10,Number.parseInt(req.query.pageSize,10)||50));
    const search=String(req.query.search||"").trim().slice(0,80).replace(/[^a-zA-Z0-9@._ -]/g,"");
    const sort=req.query.sort === "sequence" ? "sequence" : "updated";
    const {data,error}=await db.rpc("admin_lead_queue",{search_term:search,page_number:page,rows_per_page:pageSize,order_mode:sort});if(error)throw error;
    const total=Number(data?.[0]?.total_count||0);
    const items=(data||[]).map(row=>({
      id:row.id,company_id:row.company_id,first_name:row.first_name,last_name:row.last_name,email:row.email,title:row.title,score:row.score,status:row.status,unsubscribed_at:row.unsubscribed_at,bounced_at:row.bounced_at,paused_at:row.paused_at,created_at:row.created_at,updated_at:row.updated_at,
      companies:row.company_name?{name:row.company_name,domain:row.company_domain}:null,
      enrollments:row.enrollment_id?[{id:row.enrollment_id,status:row.enrollment_status,subject_line:row.subject_line,enrolled_at:row.enrolled_at,next_due_at:row.next_due_at,reply_status:row.reply_status,reply_classification:row.reply_classification,sequence_steps:row.next_step_status?[{step_number:row.next_step_number,status:row.next_step_status,due_at:row.next_step_due_at,sent_at:row.next_step_sent_at}]:[]}]:[]
    }));
    return json(res,200,{items,page,pageSize,total,totalPages:Math.max(1,Math.ceil(total/pageSize))});
  }
  if (resource === "campaigns" && req.method === "GET") { const {data,error}=await db.from("campaigns").select("*").order("id");if(error)throw error;return json(res,200,data); }
  if (resource === "campaigns" && req.method === "PATCH") {
    const payload=await readJson(req); const update={};
    if (payload.status !== undefined) { if(!["paused","active"].includes(payload.status)) return json(res,400,{error:"Invalid campaign status"}); update.status=payload.status; }
    if (payload.dailyLimit !== undefined) { const dailyLimit=Number(payload.dailyLimit); if(!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>100) return json(res,400,{error:"Daily limit must be a whole number from 1 to 100"}); update.daily_limit=dailyLimit; }
    if (!Object.keys(update).length) return json(res,400,{error:"No campaign changes supplied"});
    const {error}=await db.from("campaigns").update(update).eq("id",payload.id);if(error)throw error;return json(res,200,{ok:true});
  }
  return json(res,404,{error:"Not found"});
 } catch(error) { return json(res,500,{error:error.message}); } }
