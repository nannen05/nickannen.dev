const COOKIE_NAME = "portfolio_variant";
const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

function getCookie(name) {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function setVariantCookie(value, maxAge) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

export function getPortfolioVariant() {
  if (typeof window === "undefined") return null;

  const value = new URLSearchParams(window.location.search).get("a-b");

  if (value === "1" || value === "2") {
    setVariantCookie(value, THIRTY_DAYS_IN_SECONDS);
    return value;
  }

  if (value === "0") {
    setVariantCookie("", 0);
    return null;
  }

  const storedVariant = getCookie(COOKIE_NAME);
  return storedVariant === "1" || storedVariant === "2" ? storedVariant : null;
}
