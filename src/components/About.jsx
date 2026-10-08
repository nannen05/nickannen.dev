import { Eyebrow } from "./ui";
import { CodeXml, FlaskConical, ShoppingBag } from "lucide-react";
import nickAtStonehenge from "../assets/nick-annen-stonehenge.jpg";
const skills = [
  {
    title: "Shopify & Ecommerce",
    description: "Liquid, Shopify Plus, custom themes, subscriptions & bundles",
    icon: ShoppingBag,
  },
  {
    title: "Frontend Development",
    description: "React, Next.js, JavaScript & headless commerce",
    icon: CodeXml,
  },
  {
    title: "CRO & Experimentation",
    description: "Intelligems, A/B testing, PDP experiments & landing pages",
    icon: FlaskConical,
  },
];
export default function About() {
  return (
    <section id="about" className="about section">
      <div>
        <Eyebrow>ABOUT</Eyebrow>
        <h2>
          Developer first.
          <br />
          Growth minded.
        </h2>
        <p>
          I'm Nick, a senior frontend developer specializing in Shopify and
          ecommerce. I've spent years building production storefront experiences
          for DTC brands — from custom themes and headless commerce to PDP
          experiments, subscription experiences, bundles and CRO tests.
        </p>
        <div className="about__experience">
          <strong>10+</strong>
          <div>
            <span>Years of frontend development</span>
            <small>Building production experiences for brands and agencies.</small>
          </div>
        </div>
      </div>
      <div className="about__details">
        <div className="portrait">
          <img
            src={nickAtStonehenge}
            alt="Nick standing in front of Stonehenge"
          />
        </div>
        <dl className="about__capabilities">
          {skills.map(({ title, description, icon: Icon }) => (
            <div key={title}>
              <Icon aria-hidden="true" />
              <div>
                <dt>{title}</dt>
                <dd>{description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
