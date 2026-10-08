import { Arrow, Button, Eyebrow, MarkReveal } from "./ui";
export default function FooterCTA() {
  return (
    <footer id="contact-cta" className="footer section">
      <div>
        <Eyebrow>READY TO SHIP?</Eyebrow>
        <h2>
          Let's build something that <MarkReveal>converts.</MarkReveal>
        </h2>
        <p>
          Whether you've got one experiment ready to build or an entire backlog,
          let's talk.
        </p>
      </div>
      <div>
        <Button>
          Start a project <Arrow />
        </Button>
        {/* <a className="email" href="mailto:nick@yourdomain.com">
          nick@yourdomain.com
        </a>
        <a className="linkedin" href="#" aria-label="LinkedIn placeholder">
          in
        </a> */}
      </div>
    </footer>
  );
}
