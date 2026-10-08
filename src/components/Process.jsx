import { process } from "../data/projects";
import { Eyebrow } from "./ui";
export default function Process() {
  return (
    <section className="process section">
      <Eyebrow>HOW IT WORKS</Eyebrow>
      <h2>A straightforward process.</h2>
      <div>
        {process.map(([number, title, text]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
