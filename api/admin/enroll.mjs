import { choose, json, readJson, requireAdmin, supabase } from "../_outreach.mjs";

const OFFSETS = [0, 3, 7, 30];
const dueAt = (days) => new Date(Date.now() + days * 86_400_000).toISOString();

export default async function handler(req,res) {
  if (!requireAdmin(req,res)) return;
  if (req.method !== "POST") return json(res,405,{error:"Method not allowed"});
  try {
    const { campaignId, contactIds = [] } = await readJson(req); const db = supabase();
    const { data: campaign, error: campaignError } = await db.from("campaigns").select("id").eq("id",campaignId).single(); if(campaignError) throw campaignError;
    const { data: variants, error: variantsError } = await db.from("subject_variants").select("id,subject").eq("campaign_id",campaign.id).eq("enabled",true); if(variantsError) throw variantsError; if(!variants?.length) return json(res,400,{error:"No enabled subject variants"});
    let enrolled = 0; const skipped = [];
    for (const id of contactIds) {
      const { data: existing } = await db.from("enrollments").select("id").eq("contact_id",id).eq("campaign_id",campaign.id).maybeSingle(); if(existing){skipped.push({id,reason:"already enrolled"});continue;}
      const { data: contact, error: contactError } = await db.from("contacts").select("id,email,first_name,companies(name)").eq("id",id).single(); if(contactError){skipped.push({id,reason:"contact not found"});continue;}
      const { data: suppressed } = await db.from("suppressions").select("id").eq("email",contact.email).maybeSingle(); if(suppressed){skipped.push({id,reason:"suppressed"});continue;}
      const variant = choose(variants, `${contact.id}:${campaign.id}`); const websiteVariant = choose(["A","B","C"], `${campaign.id}:${contact.id}:website`); const subjectLine = variant.subject.replaceAll("{{company}}",contact.companies?.name || "your team");
      const { data: enrollment, error: enrollmentError } = await db.from("enrollments").insert({contact_id:contact.id,campaign_id:campaign.id,subject_variant_id:variant.id,subject_line:subjectLine,website_variant:websiteVariant,next_due_at:dueAt(0)}).select("id").single(); if(enrollmentError){skipped.push({id,reason:enrollmentError.message});continue;}
      const { error: stepError } = await db.from("sequence_steps").insert(OFFSETS.map((days,step_number)=>({enrollment_id:enrollment.id,step_number,due_at:dueAt(days)}))); if(stepError) throw stepError;
      enrolled++;
    }
    return json(res,200,{enrolled,skipped});
  } catch(error) { return json(res,500,{error:error.message}); }
}
