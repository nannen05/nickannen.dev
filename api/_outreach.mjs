import { createClient } from "@supabase/supabase-js";
import { clean, choose, domain, email, key, parseCsv, scoreLead, renderMessage } from "../server/lib.mjs";

export const siteUrl = () => (process.env.OUTREACH_WEBSITE_URL || "https://www.nickannenofficial.com").replace(/\/$/, "");
export const apiUrl = () => (process.env.OUTREACH_API_URL || siteUrl()).replace(/\/$/, "");
export const supabase = () => createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } });
export const json = (res, status, body, headers = {}) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.end(JSON.stringify(body));
};
export function requireAdmin(req, res) { const expected = `Basic ${Buffer.from(`${process.env.OUTREACH_ADMIN_USER}:${process.env.OUTREACH_ADMIN_PASSWORD}`).toString("base64")}`; if (process.env.OUTREACH_ADMIN_USER && req.headers.authorization === expected) return true; json(res, 401, { error: "Authentication required" }); return false; }
export async function readJson(req) { return typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}"); }
export function normalize(row) { const website = key(row, ["Website"]); const linkedinUrl = key(row,["Person Linkedin Url"]); const apolloContactId = key(row,["Apollo Contact Id"]); return { first_name: key(row,["First Name"]), last_name: key(row,["Last Name"]), title: key(row,["Title"]), company_name: key(row,["Company Name"]), email: email(key(row,["Email"])), email_status: key(row,["Email Status"]), catch_all_status: key(row,["Primary Email Catch-all Status"]), linkedin_url: linkedinUrl || null, company_domain: domain(website) || domain(key(row,["Email"])), technologies: key(row,["Technologies"]), employees: key(row,["# Employees"]), industry: key(row,["Industry"]), apollo_contact_id: apolloContactId || null, raw_data: row }; }
export async function send(message) {
  const reason = message.dryRun ? "campaign dry-run is enabled" : process.env.OUTREACH_LIVE_SENDING !== "true" ? "OUTREACH_LIVE_SENDING is not true" : !process.env.RESEND_API_KEY ? "RESEND_API_KEY is missing" : null;
  if (reason) return { id: `dry_${crypto.randomUUID()}`, dryRun: true, reason };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: `${process.env.OUTREACH_FROM_NAME || "Nick Annen"} <${process.env.OUTREACH_FROM_EMAIL}>`, to: [message.to], subject: message.subject, html: message.html, text: message.text, reply_to: process.env.OUTREACH_REPLY_TO || undefined }) });
  if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || detail.name || `Email provider returned ${response.status}`); }
  return response.json();
}
export async function runDueSteps() {
  // Resend Free is limited to 100 deliveries a day. The database also enforces
  // each campaign's configurable daily_limit, including follow-up messages.
  const db = supabase(); const { data: steps, error } = await db.rpc("claim_due_steps", { limit_count: 100 }); if (error) throw error;
  const summary = { claimed: steps?.length || 0, sent: 0, dryRun: 0, failed: 0, dryRunReasons: [], failures: [] };
  for (const step of steps || []) {
    const suffix = { A: "", B: "?a-b=1", C: "?a-b=2" }[step.website_variant]; const website = `${siteUrl()}/${suffix}${suffix ? "&" : "?"}ref=${step.attribution_token}`;
    const message = renderMessage({ template: step.body, lead: step, websiteUrl: website, unsubscribeUrl: `${apiUrl()}/api/outreach/unsubscribe/${step.attribution_token}`, postalAddress: process.env.OUTREACH_POSTAL_ADDRESS || "" });
    try {
      const result = await send({ to: step.email, subject: step.subject, ...message, dryRun: step.dry_run });
      if (result.dryRun) {
        summary.dryRun++; if (!summary.dryRunReasons.includes(result.reason)) summary.dryRunReasons.push(result.reason);
        await db.from("sequence_steps").update({ status: "pending", claimed_at: null, error: `Not sent: ${result.reason}` }).eq("id", step.step_id);
        continue;
      }
      await db.from("sequence_steps").update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.id, error: null }).eq("id", step.step_id);
      await db.from("messages").insert({ enrollment_id: step.enrollment_id, sequence_step_id: step.step_id, direction: "outbound", provider_message_id: result.id, thread_id: step.thread_id, subject: step.subject, body_text: message.text, status: "sent" });
      await db.from("enrollments").update({ status: step.step_number === 3 ? "complete" : "active", original_sent_at: step.step_number === 0 ? new Date().toISOString() : undefined, thread_id: step.thread_id || result.id }).eq("id", step.enrollment_id);
      summary.sent++;
    } catch (failure) {
      const message = String(failure).slice(0, 500); summary.failed++; summary.failures.push(message);
      await db.from("sequence_steps").update({ status: "pending", claimed_at: null, error: message }).eq("id", step.step_id);
    }
  }
  return summary;
}
export { clean, choose, email, parseCsv, scoreLead };
