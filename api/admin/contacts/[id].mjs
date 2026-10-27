import { json, requireAdmin, supabase } from "../../_outreach.mjs";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "DELETE") return json(res, 405, { error: "Method not allowed" });

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) return json(res, 400, { error: "Invalid contact id" });

  try {
    const db = supabase();
    const { data: contact, error: contactError } = await db.from("contacts").select("id,email").eq("id", id).maybeSingle();
    if (contactError) throw contactError;
    if (!contact) return json(res, 404, { error: "Contact not found" });

    const { data: enrollments, error: enrollmentError } = await db.from("enrollments").select("id").eq("contact_id", id);
    if (enrollmentError) throw enrollmentError;
    const enrollmentIds = (enrollments || []).map((enrollment) => enrollment.id);

    if (enrollmentIds.length) {
      const { error: replyError } = await db.from("replies").delete().in("enrollment_id", enrollmentIds);
      if (replyError) throw replyError;
      const { error: messageError } = await db.from("messages").delete().in("enrollment_id", enrollmentIds);
      if (messageError) throw messageError;
      // sequence_steps are removed through their enrollment foreign key cascade.
      const { error: deleteEnrollmentError } = await db.from("enrollments").delete().in("id", enrollmentIds);
      if (deleteEnrollmentError) throw deleteEnrollmentError;
    }

    const { error: deleteContactError } = await db.from("contacts").delete().eq("id", id);
    if (deleteContactError) throw deleteContactError;
    // Deliberately retain suppressions: an opt-out must survive contact deletion.
    return json(res, 200, { ok: true, email: contact.email });
  } catch (error) {
    return json(res, 500, { error: error.message });
  }
}
