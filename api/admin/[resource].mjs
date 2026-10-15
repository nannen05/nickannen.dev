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
  if (resource === "leads" && req.method === "GET") { const {data,error}=await db.from("contacts").select("*,companies(name,domain)").order("updated_at",{ascending:false}).limit(500);if(error)throw error;return json(res,200,data); }
  if (resource === "campaigns" && req.method === "GET") { const {data,error}=await db.from("campaigns").select("*").order("id");if(error)throw error;return json(res,200,data); }
  if (resource === "campaigns" && req.method === "PATCH") { const payload=await readJson(req);if(!["paused","active"].includes(payload.status))return json(res,400,{error:"Invalid campaign status"});const {error}=await db.from("campaigns").update({status:payload.status}).eq("id",payload.id);if(error)throw error;return json(res,200,{ok:true}); }
  return json(res,404,{error:"Not found"});
 } catch(error) { return json(res,500,{error:error.message}); } }
