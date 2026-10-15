export function trackOutreachVisit() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("ref");
  if (!token || !/^[a-f0-9-]{16,64}$/i.test(token)) return;
  const endpoint = import.meta.env.VITE_OUTREACH_EVENT_ENDPOINT || "/api/outreach/events";
  const payload = JSON.stringify({ token, type: "visit", metadata: { path: window.location.pathname, variant: params.get("a-b") || "A" } });
  if (navigator.sendBeacon) navigator.sendBeacon(endpoint, new Blob([payload], { type: "application/json" }));
  else fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
}
