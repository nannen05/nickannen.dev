import { useEffect, useState } from "react";
import { Arrow, Button } from "./ui";

const navItems = [
  ["#work", "Work"],
  ["#results", "Results"],
  ["#services", "Services"],
  ["#pricing", "Pricing"],
  ["#about", "About"],
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const { body, documentElement } = document;
    const previousBodyOverflow = body.style.overflow;
    const previousHtmlOverflow = documentElement.style.overflow;
    body.style.overflow = "hidden";
    documentElement.style.overflow = "hidden";

    return () => {
      body.style.overflow = previousBodyOverflow;
      documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isMenuOpen]);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header">
        <a className="header__brand" href="#top" aria-label="Nick Annen home">
          <i className="header__mark" />
          <span className="header__identity">
            <strong>NICK ANNEN</strong>
            <small>
              Shopify CRO &amp;
              <br className="hide-desktop" /> Growth Development
            </small>
          </span>
        </a>
        <nav
          className="header__nav header__nav--desktop"
          aria-label="Primary navigation"
        >
          {navItems.map(([href, label]) => (
            <a href={href} key={href}>
              {label}
            </a>
          ))}
        </nav>
        <Button>
          Start a project <Arrow />
        </Button>
        <button
          className="header__menu-toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={
            isMenuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav
          className={`header__nav header__nav--mobile${isMenuOpen ? " is-open" : ""}`}
          id="mobile-navigation"
          aria-label="Mobile navigation"
        >
          {navItems.map(([href, label]) => (
            <a href={href} key={href} onClick={closeMenu}>
              {label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
