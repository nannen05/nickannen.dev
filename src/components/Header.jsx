import { Arrow, Button } from "./ui";
export default function Header() {
  return (
    <header className="site-header">
      <div className="header">
        <a className="header__brand" href="#top" aria-label="Nick Annen home">
          <i className="header__mark" />
          <span className="header__identity">
            <strong>NICK ANNEN</strong>
            <small>Shopify CRO &amp; Growth Development</small>
          </span>
        </a>
        <nav className="header__nav" aria-label="Primary navigation">
          <a href="#work">Work</a>
          <a href="#results">Results</a>
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>
        <Button>
          Start a project <Arrow />
        </Button>
      </div>
    </header>
  );
}
