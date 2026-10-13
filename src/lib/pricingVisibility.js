const COOKIE_NAME = "hide_pricing";
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

function getCookie(name) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function setPricingCookie(value, maxAge) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function shouldHidePricing() {
  if (typeof window === "undefined") return false;

  const value = new URLSearchParams(window.location.search).get("hide-pricing");

  if (value === "1" || value === "true") {
    setPricingCookie("1", THIRTY_DAYS_IN_SECONDS);
    return true;
  }

  if (value === "0" || value === "false") {
    setPricingCookie("", 0);
    return false;
  }

  return getCookie(COOKIE_NAME) === "1";
}
