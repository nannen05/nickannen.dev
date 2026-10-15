import { supabase } from "./_outreach.mjs";

export default async function handler(_req, res) {
  const configured = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
  if (!configured) return res.status(503).json({ ok: false, database: "Supabase", configured: false, error: "SUPABASE_URL or SUPABASE_SECRET_KEY is missing" });
  try {
    const { error } = await supabase().from("campaigns").select("id", { head: true, count: "exact" }).limit(1);
    if (error) return res.status(503).json({ ok: false, database: "Supabase", configured: true, error: error.message, code: error.code || null });
    return res.status(200).json({ ok: true, sendingEnabled: false, database: "Supabase", configured: true });
  } catch (error) {
    return res.status(503).json({ ok: false, database: "Supabase", configured: true, error: error.message });
  }
}
