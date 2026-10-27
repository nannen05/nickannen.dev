import { json, readJson, requireAdmin, send, siteUrl } from "../_outreach.mjs";

const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const { to } = await readJson(req);
  if (!validEmail(to)) return json(res, 400, { error: "Enter a valid test recipient email address." });
  if (process.env.OUTREACH_LIVE_SENDING !== "true") return json(res, 409, { error: "Set OUTREACH_LIVE_SENDING=true temporarily before sending a test." });
  if (!process.env.RESEND_API_KEY || !process.env.OUTREACH_FROM_EMAIL) return json(res, 409, { error: "RESEND_API_KEY and OUTREACH_FROM_EMAIL must both be set." });

  const website = siteUrl();
  const postal = String(process.env.OUTREACH_POSTAL_ADDRESS || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
  try {
    const result = await send({
      to: String(to).trim().toLowerCase(),
      subject: "[Test] Shopify development support",
      html: `<p>Hi Nick,</p><p>This is a delivery test for your outreach sender. If you received it, Resend, your verified sending domain, and this application are connected correctly.</p><p>Website: <a href="${website}">${website}</a></p><hr><p style="font-size:12px;color:#666">${postal}</p>`,
      text: `Hi Nick,\n\nThis is a delivery test for your outreach sender. If you received it, Resend, your verified sending domain, and this application are connected correctly.\n\nWebsite: ${website}\n\n${process.env.OUTREACH_POSTAL_ADDRESS || ""}`,
      dryRun: false
    });
    return json(res, 200, { ok: true, messageId: result.id });
  } catch (error) {
    return json(res, 502, { error: error.message || "Resend rejected the test email." });
  }
}
