import { CalendarDays, FlaskConical, Handshake, MessagesSquare } from "lucide-react";
import { Arrow, Button, Eyebrow } from "./ui";

const benefits = [
  {
    label: "White-label development for your clients",
    icon: Handshake,
  },
  {
    label: "Shopify & CRO experimentation expertise",
    icon: FlaskConical,
  },
  {
    label: "Flexible project or monthly capacity",
    icon: CalendarDays,
  },
  {
    label: "Direct communication, no extra handoffs",
    icon: MessagesSquare,
  },
];
export default function AgencyCallout() {
  return (
    <section className="agency section">
      <div>
        <Eyebrow>FOR CRO &amp; GROWTH AGENCIES</Eyebrow>
        <h2>
          Need another developer
          <br />
          without another hire?
        </h2>
        <p>
          I work behind the scenes with CRO and growth agencies, turning experiment backlogs, Figma designs, and Shopify requirements into production-ready experiences — without adding another full-time developer.
        </p>
        <Button secondary>
          Let's work together <Arrow />
        </Button>
      </div>
      <ul className="agency__benefits">
        {benefits.map(({ label, icon: Icon }) => (
          <li key={label} className="agency__benefit">
            <Icon aria-hidden="true" />
            <p>{label}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
