import { useEffect, useRef, useState } from "react";

export const Arrow = () => <span aria-hidden="true">→</span>;
export const DownArrow = () => <span aria-hidden="true">↓</span>;
export const Eyebrow = ({ children }) => <p className="eyebrow">{children}</p>;

export function MarkReveal({ children, revealOffset = 0 }) {
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
    let observer;
    const revealIfInView = () => {
      const { top, bottom } = mark.getBoundingClientRect();
      if (top < window.innerHeight * 0.85 && bottom > 0) {
        setStatus("visible");
        return true;
      }
      return false;
    };

    // IntersectionObserver detects entry even when a scroll event was missed
    // before this component mounted (for example, in an unfocused preview).
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setStatus("visible");
          observer.disconnect();
        },
        { threshold: 0, rootMargin: `0px 0px ${revealOffset}px` },
      );
      observer.observe(mark);
    } else {
      const checkPosition = () => {
        if (!revealIfInView()) return;
        window.removeEventListener("scroll", checkPosition);
        window.removeEventListener("resize", checkPosition);
      };

      checkPosition();
      window.addEventListener("scroll", checkPosition, { passive: true });
      window.addEventListener("resize", checkPosition);

      return () => {
        window.removeEventListener("scroll", checkPosition);
        window.removeEventListener("resize", checkPosition);
      };
    }

    return () => {
      observer?.disconnect();
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
