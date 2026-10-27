import crypto from "node:crypto";

export const DAY_OFFSETS = [0, 3, 7, 30];
export const SUBJECTS = [
  ["A", "Quick question about {{company}}"],
  ["B", "Shopify development support for {{company}}"],
  ["C", "Extra Shopify dev capacity?"],
  ["D", "Who handles Shopify development at {{company}}?"],
];

export const SUBJECTS_BY_CAMPAIGN = {
  agency: [
    ["A", "Extra Shopify dev support for ?"],
    ["B", "Need another developer without another hire?"],
    ["C", "Extra Shopify dev capacity?"],
    ["D", "Who handles Shopify development at {{company}}?"],
  ],
  dtc: [
    ["A", "A little extra Shopify firepower for {{company}}?"],
    ["B", "Helping move faster on Shopify"],
    ["C", "Extra Shopify dev capacity?"],
    ["D", "Who handles Shopify development at {{company}}?"],
  ],
};

export const TEMPLATES = [
  `Hi {{first_name}},\n\nI'm a Shopify developer working with ecommerce brands on custom storefront experiences, PDP improvements, and conversion-focused development.\n\nWanted to reach out and see if {{company}} ever works with outside developers for ongoing improvements or new projects.\n\nYou can see some of my work at {{website_link}}.\n\nIf it makes sense to connect, here's my calendar:\n{{calendar_link}}\n\nThanks,\nNick`,
  `Hey {{first_name}},\n\nJust following up on my last email.\n\nI help ecommerce teams with Shopify development, whether that's improving product pages, building custom sections, or testing new experiences to improve conversions.\n\nIf {{company}} could use an extra developer on upcoming projects, I'd be happy to chat.\n\nHere's my work again: {{website_link}}\n\nAnd my calendar if you'd like to connect:\n{{calendar_link}}\n\nThanks,\nNick`,
  `Hey {{first_name}},\n\nOne more quick follow-up.\n\nA lot of my work involves improving the shopping experience through better PDPs, custom functionality, landing pages, and A/B testing.\n\nIf there's anything on {{company}}'s Shopify roadmap that could use additional development support, I'd be glad to help.\n\nSome examples of my work: {{website_link}}\n\nHappy to connect whenever convenient:\n{{calendar_link}}\n\nBest,\nNick`,
  `Hey {{first_name}},\n\nWanted to check in one last time in case the timing wasn't right earlier.\n\nIf {{company}} ever needs an extra hand with Shopify development, CRO experiments, or new storefront features, I'd love to be considered.\n\nYou can find my work at {{website_link}} or grab a time here: {{calendar_link}}.\n\nEither way, appreciate your time!\n\nBest,\nNick`,
];

// DTC brands get the more detailed initial positioning; agency copy remains unchanged.
export const DTC_DAY0_TEMPLATE_V1 = `Hey {{first_name}},\n\nI'm Nick, a Shopify developer helping ecommerce brands build better shopping experiences and turn new ideas into live, conversion-focused features.\n\nI work on everything from custom PDPs, landing pages, and storefront functionality to A/B testing, subscription experiences, and ongoing site improvements.\n\nWhether your team has a growing development backlog, wants to test new ideas, or just needs an extra experienced developer to keep things moving, I'd love to help as a flexible extension of your team without the need to bring on another full-time hire.\n\nYou can check out some of my work at {{website_link}}.\n\nIf you're open to chatting, here's my calendar: {{calendar_link}}.\n\nCheers,\nNick`;

export const DTC_TEMPLATES = [
  DTC_DAY0_TEMPLATE_V1,
  ...TEMPLATES.slice(1),
];

export const clean = (value) => String(value ?? "").trim();
export const email = (value) => clean(value).toLowerCase();
export const domain = (value) => {
  const input = clean(value).replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  return input || (email(value).split("@")[1] || "");
};
export const key = (row, names) => names.map((name) => row[name] ?? row[name.toLowerCase()] ?? "").find(Boolean) || "";
export function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += char; i++; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); if (row.some(clean)) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell); if (row.some(clean)) rows.push(row);
  const [headers = [], ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, i) => [clean(header), clean(values[i])] )));
}
export function scoreLead(lead) {
  let score = 0; const tech = clean(lead.technologies).toLowerCase(); const title = clean(lead.title).toLowerCase();
  if (/shopify/.test(tech)) score += 30;
  if (/(founder|owner|director|head|vp|chief|ecommerce|digital|growth|engineering|marketing)/.test(title)) score += 25;
  if (/verified|valid/.test(clean(lead.emailStatus).toLowerCase())) score += 25;
  if (/catch/.test(clean(lead.catchAllStatus).toLowerCase())) score -= 20;
  const employees = Number(String(lead.employees).replace(/\D/g, "")); if (employees >= 2 && employees <= 500) score += 10;
  if (/ecommerce|retail|consumer|apparel|beauty|food/.test(clean(lead.industry).toLowerCase())) score += 10;
  return Math.max(0, Math.min(100, score));
}
export function token() { return crypto.randomBytes(16).toString("hex"); }
export function choose(items, seed) { return items[Math.abs([...seed].reduce((n, c) => n + c.charCodeAt(0), 0)) % items.length]; }
export const htmlEscape = (value) => String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export function renderMessage({ template, lead, websiteUrl, unsubscribeUrl, postalAddress }) {
  const firstName = clean(lead.first_name) || "there"; const company = clean(lead.company_name) || "your team";
  const text = template.replaceAll("{{first_name}}", firstName).replaceAll("{{company}}", company)
    .replaceAll("{{website_link}}", websiteUrl).replaceAll("{{calendar_link}}", "https://calendly.com/nannen05/30min")
    + `\n\n${postalAddress}\nTo stop receiving these emails, unsubscribe: ${unsubscribeUrl}`;
  const html = text.split("\n\n").map((p) => `<p>${htmlEscape(p).replace(/(https:\/\/www\.nickannenofficial\.com[^\s<]*)/, `<a href="${htmlEscape(websiteUrl)}">nickannenofficial.com</a>`).replace("https://calendly.com/nannen05/30min", '<a href="https://calendly.com/nannen05/30min">Schedule a quick call</a>').replace(/(https:\/\/[^\s<]*\/unsubscribe\/[^\s<]*)/, `<a href="${htmlEscape(unsubscribeUrl)}">unsubscribe</a>`)}</p>`).join("");
  return { text, html };
}
