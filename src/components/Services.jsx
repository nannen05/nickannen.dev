import {
  FlaskConical,
  PanelsTopLeft,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { services } from "../data/projects";
import { Eyebrow, MarkReveal } from "./ui";

const serviceIcons = {
  "CRO Development": FlaskConical,
  "PDP & Purchase Experiences": ShoppingCart,
  "Landing Pages & Funnels": PanelsTopLeft,
  "Shopify Development": Settings,
};

export default function Services() {
  return (
    <section id="services" className="services">
      <div className="section">
        <Eyebrow>SERVICES</Eyebrow>
        <h2>
          I build the things your
          <br />
          growth roadmap <MarkReveal>depends on.</MarkReveal>
        </h2>
        <div className="services__grid">
          {services.map((service) => {
            const Icon = serviceIcons[service.title];

            return (
              <article key={service.title}>
                <span className="services__icon" aria-hidden="true">
                  <Icon />
                </span>
                <h3>{service.title}</h3>
                <p>{service.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
