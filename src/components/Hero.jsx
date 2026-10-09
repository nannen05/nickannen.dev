import { Arrow, Button, Eyebrow, MarkReveal } from "./ui";

function MumuTemplatePreview() {
  return (
    <div className="mumu-preview" aria-label="Show Me Your Mumu storefront previews">
      <a className="mumu-template mumu-template--shop" href="https://showmeyourmumu.com/" target="_blank" rel="noreferrer" aria-label="Open the Show Me Your Mumu storefront">
        <img src="/work/show-me-your-mumu-shop-desktop.png" alt="Show Me Your Mumu Shopify storefront" fetchPriority="high" />
      </a>

      <a className="mumu-template mumu-template--weddings" href="https://showmeyourmumu.com/?view=weddings" target="_blank" rel="noreferrer" aria-label="Open the Show Me Your Mumu weddings storefront">
        <img src="/work/show-me-your-mumu-weddings-desktop.png" alt="Show Me Your Mumu weddings Shopify storefront" loading="lazy" decoding="async" />
      </a>

      <div className="mumu-preview__label" aria-hidden="true">
        <span>SHOW ME YOUR MUMU</span>
        <b>Two storefront experiences, one brand.</b>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="hero section">
      <div className="hero__copy">
        <Eyebrow>FOR DTC BRANDS & CRO AGENCIES</Eyebrow>
        <h1>
          Shopify development
          <br />
          built for <MarkReveal>growth.</MarkReveal>
        </h1>
        <p className="hero__lead">
          I turn CRO experiments, landing pages, and custom storefront ideas into conversion-focused Shopify experiences.
        </p>
        {/* <p className="hero__capabilities">
          A/B tests. Landing pages. PDPs. Bundles. Subscriptions. Custom
          development.
        </p> */}
        <div className="hero__actions">
          <Button>
            Start a project <Arrow />
          </Button>
          <Button secondary href="#work">
            See my work ↓
          </Button>
        </div>
        <p className="hero__availability">
          <i className="hero__availability-dot" /> Available for select projects
          &amp; agency partnerships
        </p>
      </div>
      <div className="hero__visual">
        <MumuTemplatePreview />
        <div className="hero__floating-card" aria-hidden="true">
          <span>STOREFRONT</span>
          <b>
            Distinct experiences.
            <br />
            Built to convert.
          </b>
        </div>
      </div>
    </section>
  );
}
