import { useEffect, useRef, useState } from "react";

export const Arrow = () => <span aria-hidden="true">→</span>;
export const Eyebrow = ({ children }) => <p className="eyebrow">{children}</p>;

export function MarkReveal({ children }) {
  const markRef = useRef(null);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    const mark = markRef.current;
    if (!mark) return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setStatus("visible");
      return undefined;
    }

    setStatus("pending");
    let animationFrame;
    let isListening = false;
    const revealIfInView = () => {
      const { top, bottom } = mark.getBoundingClientRect();
      if (top < window.innerHeight * 0.85 && bottom > 0) {
        setStatus("visible");
        return true;
      }
      return false;
    };
    const checkPosition = () => {
      if (revealIfInView() && isListening) {
        window.removeEventListener("scroll", checkPosition);
        window.removeEventListener("resize", checkPosition);
        isListening = false;
      }
    };

    animationFrame = requestAnimationFrame(() => {
      if (!revealIfInView()) {
        window.addEventListener("scroll", checkPosition, { passive: true });
        window.addEventListener("resize", checkPosition);
        isListening = true;
      }
    });

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", checkPosition);
      window.removeEventListener("resize", checkPosition);
    };
  }, []);

  return (
    <mark ref={markRef} className={`mark-reveal${status === "idle" ? "" : ` is-${status}`}`}>
      {children}
    </mark>
  );
}

export function Button({ children, secondary = false, href = "#contact" }) {
  const handleClick = (event) => {
    if (href !== "#contact") return;

    event.preventDefault();
    window.history.pushState(null, "", "#contact");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  };

  return (
    <a
      className={secondary ? "button button--secondary" : "button"}
      href={href}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
