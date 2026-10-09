import { useEffect, useState } from "react";
import { projects } from "../data/projects";
import { Arrow, Eyebrow, MarkReveal } from "./ui";

function ProjectGallery({ project, activeSlide, onNavigate }) {
  const slides = project.gallery;
  const [, url] = slides[activeSlide];
  const siteAddress = new URL(url).hostname.replace(/^www\./, "");

  return (
    <div className="project-preview" aria-label={`${project.client} project gallery`}>
      <span className="project-preview__chrome" aria-hidden="true">
        <i /><i /><i />
        <b>{siteAddress}</b>
      </span>
      <span className="project-preview__viewport">
        <img
          key={slides[activeSlide][2]}
          className="is-active"
          src={`/work/${slides[activeSlide][2]}.png`}
          alt={`${project.client} — ${slides[activeSlide][0]}`}
          loading="lazy"
          decoding="async"
        />
      </span>
      {slides.length > 1 && (
        <span className="project-preview__controls">
          <button type="button" onClick={() => onNavigate(activeSlide - 1, true)} aria-label="Previous project screen"><Arrow /></button>
          <em>{activeSlide + 1}/{slides.length}</em>
          <button type="button" onClick={() => onNavigate(activeSlide + 1, true)} aria-label="Next project screen"><Arrow /></button>
        </span>
      )}
    </div>
  );
}

function ProjectCard({ project }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const slides = project.gallery;

  useEffect(() => {
    if (isPaused || slides.length < 2) return undefined;

    const rotation = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(rotation);
  }, [isPaused, slides.length]);

  const navigateToSlide = (nextSlide, pauseRotation = false) => {
    setActiveSlide((nextSlide + slides.length) % slides.length);
    if (pauseRotation) setIsPaused(true);
  };

  return (
    <article
      className={`project-card project-card--${project.tone}`}
    >
      <div className="project-card__info">
        <small>{project.client}</small>
        <h3>{project.title}</h3>
        <div className="project-card__tags">
          {project.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <p>{project.description}</p>
        {slides.length > 1 && (
          <div className="project-card__gallery-index" aria-label={`${project.client} gallery pages`}>
            <span>Explore the build</span>
            {slides.map(([label], index) => (
              <button
                className={index === activeSlide ? "is-active" : ""}
                key={`${project.client}-${index}`}
                type="button"
                onClick={() => navigateToSlide(index, true)}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <ProjectGallery project={project} activeSlide={activeSlide} onNavigate={navigateToSlide} />
    </article>
  );
}
export default function Work() {
  return (
    <section id="work" className="work section">
      <div className="work__header">
        <div>
          <Eyebrow>SELECTED WORK</Eyebrow>
          <h2>
            A closer look at Shopify work
            <br />
            built for <MarkReveal>real brands.</MarkReveal>
          </h2>
          <p className="work__intro">
            A selection of storefront features, test variations, and custom purchase experiences. Use the labels on each project to see what was built.
          </p>
        </div>
        {/* <a href="#contact">
          View all work <Arrow />
        </a> */}
      </div>
      <div className="work__projects">
        {projects.map((project) => (
          <ProjectCard project={project} key={project.title} />
        ))}
      </div>
    </section>
  );
}
