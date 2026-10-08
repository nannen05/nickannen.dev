import { Eyebrow, MarkReveal } from "./ui";
export default function Intro() {
  return (
    <section className="intro section">
      <Eyebrow>IDEAS + DEVELOPMENT + IMPACT</Eyebrow>
      <h2>
        Your growth team has ideas.
        <br className="hide-small" /> I make them <MarkReveal>shippable.</MarkReveal>
      </h2>
      <p>
        From Figma to production, I build the experiments, landing pages and
        Shopify experiences your team needs to keep testing and growing.
      </p>
    </section>
  );
}
