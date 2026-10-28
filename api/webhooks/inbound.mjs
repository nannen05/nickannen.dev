import crypto from "node:crypto";
import { clean, email, json, supabase } from "../_outreach.mjs";

export const config = { api: { bodyParser: false } };

const addressFrom = (value) => email(String(value || "").match(/<([^>]+)>/)?.[1] || value);
const maskEmail = (value) => {
  const [local, domain] = String(value || "").split("@");
  return local && domain ? `${local.slice(0, 2)}***@${domain}` : "unknown";
};
const escapeHtml = (value) => String(value || "").replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
const htmlFromDataUri = (value) => {
  const source = String(value || "");
  if (!source.startsWith("data:text/html")) return source;
  const comma = source.indexOf(",");
  if (comma < 0) return "";
  const payload = source.slice(comma + 1);
  try { return /;base64/i.test(source.slice(0, comma)) ? Buffer.from(payload, "base64").toString("utf8") : decodeURIComponent(payload); } catch { return ""; }
};
const decodeQuotedPrintable = (value) => String(value || "").replace(/=\r?\n/g, "").replace(/=([A-Fa-f0-9]{2})/g, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
const textFromRawEmail = (raw) => {
  const parts = String(raw || "").split(/\r?\n(?=--)/);
  const part = parts.find((item) => /content-type:\s*text\/plain/i.test(item));
  if (!part) return "";
  const splitAt = part.search(/\r?\n\r?\n/);
  if (splitAt < 0) return "";
  const headers = part.slice(0, splitAt);
  const body = part.slice(splitAt).replace(/^\r?\n\r?\n/, "").replace(/\r?\n--[\s\S]*$/, "");
  if (/content-transfer-encoding:\s*base64/i.test(headers)) return Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8").trim();
  return decodeQuotedPrintable(body).trim();
};
const usefulText = (value, subject) => {
  const text = String(value || "").trim();
  return text && text !== String(subject || "").trim() ? text : "";
};
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const equal = (left, right) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
async function rawBody(req) {
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (typeof req.body === "string") return req.body;
  // Vercel should leave this stream untouched when bodyParser is disabled. This
  // fallback makes the runtime behavior visible and supports local adapters
  // that have already parsed the JSON body.
  if (req.body && typeof req.body === "object") {
    console.warn("[inbound-webhook] request body was already parsed; rebuilding JSON for verification");
    return JSON.stringify(req.body);
  }
  const chunks = []; for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}
function verifiedByResend(req, body) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  // Resend has used both Svix (`svix-*`) and Standard Webhooks
  // (`webhook-*`) header names. Both carry the same signed payload.
  const id = req.headers["svix-id"] || req.headers["webhook-id"];
  const timestamp = req.headers["svix-timestamp"] || req.headers["webhook-timestamp"];
  const signature = req.headers["svix-signature"] || req.headers["webhook-signature"];
  if (!secret || !id || !timestamp || !signature) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto.createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest("base64");
  return String(signature).split(" ").some((part) => {
    const [version, value] = part.split(","); return version === "v1" && value && equal(value, expected);
  });
}
async function retrieveReceivedEmail(emailId) {
  if (!emailId || !process.env.RESEND_API_KEY) return null;
  let lastStatus = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const response = await fetch(`https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    lastStatus = response.status;
    if (response.ok) {
      const received = await response.json();
      if (received?.text || received?.html || received?.raw?.download_url) return received;
    }
    if (attempt < 4) await wait(750);
  }
  console.warn("[inbound-webhook] inbound content was unavailable after retries", { lastStatus });
  return null;
}
async function forwardReplyToInbox(event, sender, fallbackText) {
  const recipient = email(process.env.OUTREACH_REPLY_NOTIFICATION_TO);
  if (!recipient) return false;
  const received = await retrieveReceivedEmail(event.data?.email_id);
  const subject = received?.subject || event.data?.subject || "New outreach reply";
  let rawText = "";
  if (received?.raw?.download_url) {
    try {
      const response = await fetch(received.raw.download_url);
      if (response.ok) rawText = textFromRawEmail(await response.text());
    } catch (error) { console.warn("[inbound-webhook] could not retrieve raw inbound body", { message: error.message }); }
  }
  const receivedText = usefulText(htmlFromDataUri(received?.text), subject);
  const text = receivedText || rawText || usefulText(fallbackText, subject) || "Open Resend to view this reply.";
  const receivedHtml = htmlFromDataUri(received?.html);
  const replyHtml = rawText || !usefulText(receivedHtml, subject) ? `<pre style="white-space:pre-wrap;font:14px/1.5 Arial,sans-serif">${escapeHtml(text)}</pre>` : receivedHtml;
  const html = `<p style="font:14px/1.5 Arial,sans-serif"><strong>New outreach reply</strong><br>From: ${escapeHtml(sender)}<br>Subject: ${escapeHtml(subject)}</p><hr>${replyHtml}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${process.env.OUTREACH_FROM_NAME || "Nick Annen"} <${process.env.OUTREACH_FROM_EMAIL}>`,
      to: [recipient],
      reply_to: sender,
      subject: `Reply from ${sender}: ${subject}`,
      html,
      text: `New outreach reply\nFrom: ${sender}\nSubject: ${subject}\n\n${text}`,
    }),
  });
  if (!response.ok) { const detail = await response.json().catch(() => ({})); throw new Error(detail.message || `Reply forwarding failed (${response.status})`); }
  return true;
}

export default async function handler(req, res) {
  console.info("[inbound-webhook] request received", { method: req.method });
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  const raw = await rawBody(req);
  if (!verifiedByResend(req, raw)) {
    console.warn("[inbound-webhook] rejected: invalid signature", {
      hasSecret: Boolean(process.env.RESEND_WEBHOOK_SECRET),
      hasSvixId: Boolean(req.headers["svix-id"]),
      hasSvixTimestamp: Boolean(req.headers["svix-timestamp"]),
      hasSvixSignature: Boolean(req.headers["svix-signature"]),
      hasWebhookId: Boolean(req.headers["webhook-id"]),
      hasWebhookTimestamp: Boolean(req.headers["webhook-timestamp"]),
      hasWebhookSignature: Boolean(req.headers["webhook-signature"]),
      bodyBytes: Buffer.byteLength(raw),
    });
    return json(res, 401, { error: "Invalid Resend webhook signature" });
  }
  try {
    const event = JSON.parse(raw);
    console.info("[inbound-webhook] signature verified", { eventType: event.type || "unknown" });
    if (event.type !== "email.received") return json(res, 202, { ignored: event.type || "unknown" });
    const sender = addressFrom(event.data?.from);
    if (!sender) {
      console.warn("[inbound-webhook] rejected: sender missing");
      return json(res, 400, { error: "Inbound event has no sender" });
    }
    console.info("[inbound-webhook] inbound email parsed", { sender: maskEmail(sender) });
    const text = clean([event.data?.subject, event.data?.text, event.data?.html].filter(Boolean).join("\n"));
    const db = supabase();
    const { data: enrollment, error } = await db.from("enrollments").select("id,contact_id,contacts!inner(email)").eq("contacts.email", sender).order("id", { ascending: false }).limit(1).maybeSingle();
    if (error || !enrollment) {
      console.warn("[inbound-webhook] no enrollment matched", { sender: maskEmail(sender), databaseError: error?.message || null });
      try { await forwardReplyToInbox(event, sender, text); } catch (forwardError) { console.error("[inbound-webhook] reply forwarding failed", { message: forwardError.message }); }
      return json(res, 202, { matched: false });
    }
    try {
      const forwarded = await forwardReplyToInbox(event, sender, text);
      if (forwarded) console.info("[inbound-webhook] reply forwarded to notification inbox", { sender: maskEmail(sender) });
    } catch (forwardError) {
      // A notification failure must never prevent the reply from stopping its sequence.
      console.error("[inbound-webhook] reply forwarding failed", { message: forwardError.message });
    }
    const classification = /unsubscribe|remove me|stop emailing/i.test(text) ? "unsubscribe" : /out of office|automatic reply/i.test(text) ? "out_of_office" : /not interested|no thanks/i.test(text) ? "negative" : /interested|book|chat|call/i.test(text) ? "positive" : "review";
    await db.from("replies").insert({ enrollment_id: enrollment.id, sender_email: sender, classification, body: text, automated: classification === "out_of_office" });
    if (classification === "unsubscribe") {
      await db.from("contacts").update({ unsubscribed_at: new Date().toISOString() }).eq("id", enrollment.contact_id);
      await db.from("suppressions").upsert({ email: sender, reason: "inbound opt-out" }, { onConflict: "email" });
    }
    if (classification !== "out_of_office") await db.from("enrollments").update({ status: "replied", reply_status: "received", reply_classification: classification }).eq("id", enrollment.id);
    console.info("[inbound-webhook] reply recorded", { enrollmentId: enrollment.id, classification });
    return json(res, 202, { matched: true, classification });
  } catch (error) {
    console.error("[inbound-webhook] processing failed", { message: error.message });
    return json(res, 500, { error: error.message });
  }
}
