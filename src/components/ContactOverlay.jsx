import { useEffect, useRef, useState } from "react";
import { Arrow } from "./ui";

const CALENDLY_URL = import.meta.env.VITE_CALENDLY_URL || "";
const CONTACT_FORM_ENDPOINT = import.meta.env.VITE_CONTACT_FORM_ENDPOINT || "";

function closeOverlay() {
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export default function ContactOverlay() {
  const [isOpen, setIsOpen] = useState(window.location.hash === "#contact");
  const [view, setView] = useState("brief");
  const [status, setStatus] = useState("idle");
  const closeButton = useRef(null);

  useEffect(() => {
    const syncOverlay = () => setIsOpen(window.location.hash === "#contact");
    window.addEventListener("hashchange", syncOverlay);
    return () => window.removeEventListener("hashchange", syncOverlay);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeOverlay();
    };
    document.body.classList.add("has-contact-overlay");
    closeButton.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("has-contact-overlay");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  async function submitBrief(event) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!CONTACT_FORM_ENDPOINT) {
      setStatus("missing-endpoint");
      return;
    }

    setStatus("sending");
    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error("Request failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="contact-overlay" role="dialog" aria-modal="true" aria-labelledby="contact-title">
      <button className="contact-overlay__backdrop" onClick={closeOverlay} aria-label="Close contact form" />
      <section className="contact-overlay__panel">
        <div className="contact-overlay__header">
          <p className="eyebrow">LET'S TALK</p>
          <button className="contact-overlay__close" onClick={closeOverlay} ref={closeButton} aria-label="Close contact form">×</button>
        </div>
        <h2 id="contact-title">Let’s make your site work harder.</h2>
        <p className="contact-overlay__intro">Prefer to write it out, or find a time to talk?</p>

        <div className="contact-overlay__tabs" role="tablist" aria-label="Contact options">
          <button className={view === "brief" ? "is-active" : ""} onClick={() => setView("brief")} role="tab" aria-selected={view === "brief"}>Send a project brief</button>
          <button className={view === "call" ? "is-active" : ""} onClick={() => setView("call")} role="tab" aria-selected={view === "call"}>Book a call</button>
        </div>

        {view === "brief" ? (
          <form className="contact-form" onSubmit={submitBrief}>
            <div className="contact-form__row">
              <label>Name<input name="name" autoComplete="name" required /></label>
              <label>Work email<input name="email" type="email" autoComplete="email" required /></label>
            </div>
            <div className="contact-form__row">
              <label>Company or store URL<input name="website" type="url" placeholder="https://" /></label>
              <label>Timeline<input name="timeline" placeholder="e.g. This month" /></label>
            </div>
            <label>Approximate budget<select name="budget" defaultValue="">
              <option value="" disabled>Select a range</option>
              <option value="Under $2,500">Under $2,500</option>
              <option value="$2,500–$5,000">$2,500–$5,000</option>
              <option value="$5,000–$10,000">$5,000–$10,000</option>
              <option value="$10,000+">$10,000+</option>
              <option value="Not sure yet">Not sure yet</option>
            </select></label>
            <label>What do you need help with?<textarea name="message" rows="5" placeholder="A quick outline of the project, goals, and scope." required /></label>
            <label className="contact-form__honeypot" aria-hidden="true">Company<input name="company" tabIndex="-1" autoComplete="off" /></label>
            <button className="button" type="submit" disabled={status === "sending"}>{status === "sending" ? "Sending…" : <>Send project brief <Arrow /></>}</button>
            {status === "success" && <p className="contact-form__message is-success">Thanks — I’ll get back to you shortly.</p>}
            {status === "error" && <p className="contact-form__message is-error">Something went wrong. Please try again or book a call instead.</p>}
            {status === "missing-endpoint" && <p className="contact-form__message is-error">The contact form is being connected. Please book a call for now.</p>}
          </form>
        ) : (
          <div className="contact-calendly">
            {CALENDLY_URL ? <iframe src={CALENDLY_URL} title="Book a call with Nick Annen" /> : <p>Set <code>VITE_CALENDLY_URL</code> to display your Calendly booking page here.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
