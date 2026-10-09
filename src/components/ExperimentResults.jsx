import { useEffect, useRef, useState } from "react";
import { BarChart3, ChevronLeft, ChevronRight, CodeXml, FlaskConical, UsersRound } from "lucide-react";
import { experiments } from "../data/experiments";
import { Button, Eyebrow } from "./ui";

const featureRows = [
  [FlaskConical, "Intelligems Expertise", "Hands-on experience developing, launching, and QA testing Intelligems experiments."],
  [CodeXml, "Development Focused", "Custom Shopify themes, dynamic sections, and complex purchase experiences."],
  [UsersRound, "Built for Growth Teams", "Working alongside CRO and marketing teams to turn designs and hypotheses into production-ready tests."],
];

const formatMetric = (value, metric) => (metric.displayFormat === "currency" ? `${metric.unit}${value.toFixed(2)}` : `${value.toFixed(2)}%`);
const formatUplift = (value) => `+${value.toFixed(2)}%`;

function chartScale(metric) {
  const target = Math.max(metric.controlValue, metric.variationValue);
  // Keep a modest amount of headroom above the leading value. This preserves
  // a zero baseline while making close control/test differences easier to read.
  return Number((target * 1.1).toFixed(2));
}

function MetricChart({ metric, animate }) {
  const max = chartScale(metric);
  const ticks = Array.from({ length: 5 }, (_, index) => max - (max / 4) * index);
  const bars = [
    ["Control Group", metric.controlValue, "control"],
    ["Test Group", metric.variationValue, "variation"],
  ];

  return (
    <section className={`experiment-chart${animate ? " is-animated" : ""}`} aria-label={`${metric.name} comparison`}>
      <header className="experiment-chart__header">
        <div>
          <BarChart3 aria-hidden="true" />
          <h3>{metric.name}</h3>
        </div>
        <p><strong>{formatUplift(metric.uplift)}</strong><span>{metric.upliftIntervalLow}% to +{metric.upliftIntervalHigh}%</span>{metric.estimate && <em>Est. {metric.estimate}</em>}</p>
      </header>
      <div className="experiment-chart__plot">
        <div className="experiment-chart__axis" aria-hidden="true">
          {ticks.map((tick) => <span key={tick}>{metric.displayFormat === "currency" ? `${metric.unit}${tick.toFixed(2)}` : `${tick.toFixed(2)}%`}</span>)}
        </div>
        <div className="experiment-chart__bars">
          <div className="experiment-chart__grid" aria-hidden="true">
            {ticks.map((tick) => <i key={tick} />)}
          </div>
          {bars.map(([label, value, tone]) => (
            <div className="experiment-chart__bar-group" key={label}>
              <div className="experiment-chart__bar-area">
                <div className={`experiment-chart__bar experiment-chart__bar--${tone}`} style={{ "--bar-height": `${(value / max) * 100}%` }}>
                  <span>{formatMetric(value, metric)}</span>
                </div>
              </div>
              <small>{label}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperimentCarousel() {
  const carouselRef = useRef(null);
  const touchStart = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasEntered, setHasEntered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [animate, setAnimate] = useState(false);
  const activeExperiment = experiments[activeIndex];
  const hasMultipleExperiments = experiments.length > 1;

  useEffect(() => {
    const node = carouselRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        setHasEntered(true);
      }
    }, { threshold: 0.2 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasEntered) return undefined;
    setAnimate(false);
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setAnimate(true)));
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, hasEntered]);

  useEffect(() => {
    if (!hasEntered || !isVisible || isPaused || !hasMultipleExperiments || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const rotation = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % experiments.length);
    }, 5000);
    return () => window.clearInterval(rotation);
  }, [hasEntered, isVisible, isPaused, hasMultipleExperiments]);

  const goTo = (nextIndex) => setActiveIndex((nextIndex + experiments.length) % experiments.length);
  const onKeyDown = (event) => {
    if (!hasMultipleExperiments) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); goTo(activeIndex - 1); }
    if (event.key === "ArrowRight") { event.preventDefault(); goTo(activeIndex + 1); }
  };
  const onTouchEnd = (event) => {
    if (!hasMultipleExperiments || touchStart.current === null) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(distance) > 45) goTo(activeIndex + (distance < 0 ? 1 : -1));
    touchStart.current = null;
  };

  return (
    <div
      className="experiment-carousel"
      ref={carouselRef}
      tabIndex="0"
      onKeyDown={onKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={onTouchEnd}
      aria-roledescription="carousel"
      aria-label="Experiment results"
    >
      <article className="experiment-slide" key={activeExperiment.id} aria-roledescription="slide" aria-label={`${activeIndex + 1} of ${experiments.length}`}>
        <header className="experiment-slide__header">
          <div>
            <p>{activeExperiment.category}</p>
            <h3>{activeExperiment.title}</h3>
          </div>
          {hasMultipleExperiments && <div className="experiment-carousel__controls">
            <span>{String(activeIndex + 1).padStart(2, "0")} / {String(experiments.length).padStart(2, "0")}</span>
            <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Previous experiment"><ChevronLeft /></button>
            <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Next experiment"><ChevronRight /></button>
          </div>}
        </header>
        <div className="experiment-slide__charts">
          {activeExperiment.metrics.map((metric) => <MetricChart metric={metric} animate={animate} key={metric.name} />)}
        </div>
        {activeExperiment.description && <p className="experiment-slide__description">{activeExperiment.description}</p>}
      </article>
    </div>
  );
}

export default function ExperimentResults() {
  return (
    <section id="results" className="experiments section" aria-labelledby="experiments-title">
      <div className="experiments__intro">
        <Eyebrow>REAL EXPERIMENTS. MEASURABLE RESULTS.</Eyebrow>
        <h2 id="experiments-title">Built to test.<br />Proven to perform.</h2>
        <p className="experiments__summary">A look at real Intelligems experiments I&apos;ve developed and helped bring to production. From purchase experiences to subscription flows, I build and launch Shopify variations that help growth teams turn ideas into measurable outcomes.</p>
        <div className="experiments__features">
          {featureRows.map(([Icon, title, description]) => <div className="experiments__feature" key={title}>
            <span><Icon aria-hidden="true" /></span><p><strong>{title}</strong>{description}</p>
          </div>)}
        </div>
        <Button>Let&apos;s talk about your experiments <span aria-hidden="true">→</span></Button>
      </div>
      <ExperimentCarousel />
    </section>
  );
}
