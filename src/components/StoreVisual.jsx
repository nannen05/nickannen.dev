export default function StoreVisual({
  variant = "product",
  image = "",
  alt = "Ecommerce project preview",
}) {
  if (image)
    return (
      <div className={`store-visual store-visual--${variant}`}>
        <img
          className="project-card__image"
          src={image}
          alt={alt}
          loading="lazy"
        />
      </div>
    );
  const headline =
    variant === "bottle"
      ? "Nutrition That Fits Your Life"
      : variant === "bundle"
        ? "Build Your Bundle"
        : variant === "funnel"
          ? "Feel Your Best."
          : "Pup Starts Here";
  return (
    <div
      className={`store-visual store-visual--${variant}`}
      aria-label="Ecommerce project preview placeholder"
      role="img"
    >
      <div className="browser">
        <div className="browser__bar">
          <b>{variant === "bottle" ? "BetterVits" : "PAWFY"}</b>
          <span>Shop &nbsp; Learn &nbsp; About</span>
          <em />
        </div>
        <div className="browser__body">
          <div className="visual-copy">
            <small>
              {variant === "funnel"
                ? "THE BETTER WAY TO"
                : "A HEALTHIER, HAPPIER"}
            </small>
            <strong>{headline}</strong>
            <button type="button">Shop now</button>
          </div>
          <div className={`visual-object visual-object--${variant}`} />
        </div>
      </div>
    </div>
  );
}
