import { openDb } from "./db.mjs";
import { DAY_OFFSETS, choose, renderMessage } from "./lib.mjs";

const db = openDb(); const now = new Date();
function isoAtDay(offset) { return new Date(now.getTime() + offset * 86400000).toISOString(); }
export function enroll(db, contactId, campaignId) {
  const existing = db.prepare("SELECT id FROM enrollments WHERE contact_id=? AND campaign_id=?").get(contactId, campaignId); if (existing) return existing.id;
  const contact = db.prepare("SELECT * FROM contacts WHERE id=?").get(contactId);
  if (!contact || contact.unsubscribed_at || contact.bounced_at || contact.paused_at || db.prepare("SELECT 1 FROM suppressions WHERE email=?").get(contact.email)) return null;
  const variants = db.prepare("SELECT * FROM subject_variants WHERE campaign_id=? AND enabled=1").all(campaignId); if (!variants.length) return null;
  const subject = choose(variants, `${contact.id}:${campaignId}`); const website = choose(["A", "B", "C"], `${campaignId}:${contact.id}:website`);
  const subjectLine = subject.subject.replaceAll("{{company}}", contact.company_name || "your team");
  const result = db.prepare("INSERT INTO enrollments(contact_id,campaign_id,subject_variant_id,subject_line,website_variant,attribution_token,next_due_at) VALUES (?,?,?,?,?,?,?)").run(contactId, campaignId, subject.id, subjectLine, website, crypto.randomUUID(), isoAtDay(0));
  DAY_OFFSETS.forEach((day, step) => db.prepare("INSERT INTO sequence_steps(enrollment_id,step_number,due_at) VALUES (?,?,?)").run(result.lastInsertRowid, step, isoAtDay(day)));
  return result.lastInsertRowid;
}
export async function processDueSteps(db, transport = sendResend) {
  const steps = db.prepare(`SELECT ss.*, e.*, c.email,c.first_name,c.company_name, ca.status campaign_status,ca.dry_run, COALESCE(e.subject_line,sv.subject) subject,t.body
    FROM sequence_steps ss JOIN enrollments e ON e.id=ss.enrollment_id JOIN contacts c ON c.id=e.contact_id JOIN campaigns ca ON ca.id=e.campaign_id JOIN subject_variants sv ON sv.id=e.subject_variant_id JOIN templates t ON t.campaign_id=e.campaign_id AND t.step_number=ss.step_number
    WHERE ss.status='pending' AND ss.due_at <= ? LIMIT 25`).all(new Date().toISOString());
  for (const step of steps) {
    const claim = db.prepare("UPDATE sequence_steps SET status='sending', claimed_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").run(step.id); if (!claim.changes) continue;
    const stopped = step.campaign_status !== "active" || step.reply_status || db.prepare("SELECT 1 FROM contacts WHERE id=? AND (unsubscribed_at IS NOT NULL OR bounced_at IS NOT NULL OR paused_at IS NOT NULL)").get(step.contact_id) || db.prepare("SELECT 1 FROM suppressions WHERE email=?").get(step.email);
    if (stopped) { db.prepare("UPDATE sequence_steps SET status='skipped' WHERE id=?").run(step.id); continue; }
    const websiteBase = (process.env.OUTREACH_WEBSITE_URL || process.env.OUTREACH_PUBLIC_URL || "https://www.nickannenofficial.com").replace(/\/$/, "");
    const apiBase = (process.env.OUTREACH_API_URL || process.env.OUTREACH_PUBLIC_URL || websiteBase).replace(/\/$/, "");
    const variant = { A: "", B: "?a-b=1", C: "?a-b=2" }[step.website_variant]; const website = `${websiteBase}/${variant}${variant ? "&" : "?"}ref=${step.attribution_token}`;
    const rendered = renderMessage({ template: step.body, lead: step, websiteUrl: website, unsubscribeUrl: `${apiBase}/api/outreach/unsubscribe/${step.attribution_token}`, postalAddress: process.env.OUTREACH_POSTAL_ADDRESS || "Postal address required before live sending" });
    try { const result = await transport({ to: step.email, subject: step.subject, ...rendered, threadId: step.thread_id, dryRun: Boolean(step.dry_run) });
      db.prepare("UPDATE sequence_steps SET status='sent', sent_at=CURRENT_TIMESTAMP, provider_message_id=? WHERE id=?").run(result.id, step.id);
      db.prepare("INSERT INTO messages(enrollment_id,sequence_step_id,direction,provider_message_id,thread_id,subject,body_text,status) VALUES (?,?,'outbound',?,?,?,?,?)").run(step.enrollment_id, step.id, result.id, result.threadId || step.thread_id, step.subject, rendered.text, "sent");
      db.prepare("UPDATE enrollments SET status=?, original_sent_at=COALESCE(original_sent_at,CURRENT_TIMESTAMP), thread_id=COALESCE(thread_id,?), next_due_at=? WHERE id=?").run(step.step_number === 3 ? "complete" : "active", result.threadId || null, step.step_number === 3 ? null : DAY_OFFSETS[step.step_number + 1] ? isoAtDay(DAY_OFFSETS[step.step_number + 1] - DAY_OFFSETS[step.step_number]) : null, step.enrollment_id);
    } catch (error) { db.prepare("UPDATE sequence_steps SET status='pending', error=? WHERE id=?").run(String(error).slice(0, 500), step.id); }
  }
}
async function sendResend(message) {
  if (!process.env.OUTREACH_LIVE_SENDING || !process.env.RESEND_API_KEY || message.dryRun) return { id: `dry_${crypto.randomUUID()}`, threadId: null };
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: `${process.env.OUTREACH_FROM_NAME || "Nick Annen"} <${process.env.OUTREACH_FROM_EMAIL}>`, to: [message.to], subject: message.subject, html: message.html, text: message.text, headers: message.threadId ? { "In-Reply-To": message.threadId, References: message.threadId } : undefined }) });
  if (!response.ok) throw new Error(`Provider error ${response.status}`); const body = await response.json(); return { id: body.id, threadId: body.id };
}
if (import.meta.url === `file://${process.argv[1]}`) { await processDueSteps(db); db.close(); }
