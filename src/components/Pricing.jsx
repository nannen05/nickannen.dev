import { pricing } from "../data/projects";
import { Button, Eyebrow } from "./ui";
export default function Pricing() {
  return (
    <section id="pricing" className="pricing section">
      <Eyebrow>PRICING</Eyebrow>
      <h2>Simple ways to work together.</h2>
      <div className="pricing__offer" role="note">
        <span className="pricing__offer-label">FOUNDING CLIENT OFFER</span>
        <p>
          <strong>Founding Client Rates — Save 20%</strong> <br/>Special pricing for my first five independent brand and agency partnerships.
        </p>
      </div>
      <div className="pricing__grid">
        {pricing.map((plan) => (
          <article
            className={`pricing__card ${plan.popular ? "pricing__card--featured" : ""}`}
            key={plan.name}
          >
            {plan.popular && (
              <span className="pricing__badge">Best for ongoing teams</span>
            )}
            <h3>{plan.name}</h3>
            <div className="pricing__price">
              <strong>{plan.price}</strong>
              <span>was {plan.regularPrice}</span>
            </div>
            <small>Introductory rate · next 5 clients</small>
            <p>{plan.text}</p>
            <ul>
              {plan.items.map((item) => (
                <li key={item}>✓ {item}</li>
              ))}
            </ul>
            <Button secondary={!plan.popular}>{plan.cta}</Button>
          </article>
        ))}
      </div>
      <p className="pricing__disclaimer">
        All engagements are scoped individually. Final pricing, deliverables,
        and timelines are agreed upon before work begins.
      </p>
    </section>
  );
}
