import { useEffect, useRef, useState } from "react";

const stats = [
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 50, suffix: "+", label: "Projects Shipped" },
  { value: 100, suffix: "%", label: "Focused on Ecommerce" },
  { value: null, display: "Multiple", label: "DTC Brands & Teams" },
];

const COUNT_DURATION = 1200;

export default function Stats() {
  const sectionRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setProgress(1);
      return undefined;
    }

    if (!("IntersectionObserver" in window)) {
      setHasStarted(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return undefined;

    let animationFrame;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = Math.min((now - startTime) / COUNT_DURATION, 1);
      setProgress(1 - (1 - elapsed) ** 3);
      if (elapsed < 1) animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [hasStarted]);

  return (
    <section ref={sectionRef} className="stats section" aria-label="Experience statistics">
      {stats.map(({ value, suffix, display, label }) => (
        <div key={label}>
          <strong>
            {value === null ? display : `${Math.round(value * progress)}${suffix}`}
          </strong>
          <span>{label}</span>
        </div>
      ))}
    </section>
  );
}
