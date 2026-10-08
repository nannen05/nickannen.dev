import { ArrowUpRight, Check, CircleDashed, CircleDot } from "lucide-react";
import { valueProps } from "../data/projects";
import { Eyebrow, MarkReveal } from "./ui";

const valuePropIcons = [  ArrowUpRight,
  CircleDot,
  CircleDashed,
  Check];

export default function ValueProps() {
  return (
    <section className="value section">
      <Eyebrow>WHY WORK WITH ME</Eyebrow>
      <h2>
        A development partner
        <br />
        focused on <MarkReveal>outcomes.</MarkReveal>
      </h2>
      <div className="value__grid">
        {valueProps.map((valueProp, index) => {
          const Icon = valuePropIcons[index];

          return (
            <article key={valueProp.title}>
              <span className="value__icon" aria-hidden="true">
                <Icon />
              </span>
              <h3>{valueProp.title}</h3>
              <p>{valueProp.text}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
