import { Eyebrow } from "./ui";
import pawfyLogo from "../assets/pawfy.svg";
import showMeYourMumuLogo from "../assets/show-me-your-mumu.svg";
export default function LogoStrip() {
  const logos = [
    { className: "logos__pawfy", src: pawfyLogo, alt: "Pawfy" },
    {
      className: "logos__bettervits",
      src: "https://cdn.shopify.com/s/files/1/0533/0970/2320/files/logo_d12ebcd9-15bb-44c8-8305-9bb35e62c264.svg?v=1758024918",
      alt: "BetterVits",
    },
    {
      className: "logos__gardencup",
      src: "https://gardencup.com/cdn/shop/files/gardencup-logo-dark-green.png?v=1726841729&width=360",
      alt: "GardenCup",
    },
    { className: "logos__show-me-your-mumu", src: showMeYourMumuLogo, alt: "Show Me Your Mumu" },
    {
      className: "logos__clearly-filtered",
      src: "https://clearlyfiltered.com/cdn/shop/files/clearblue-cf-icon-2bwordmarkup-lockup-small-51cebc6ee571.png",
      alt: "Clearly Filtered",
    },
    {
      className: "logos__mvmt",
      src: "https://mvmt.com/cdn/shop/files/mvmt-logo.svg?v=1784137576&width=145",
      alt: "MVMT",
    },
  ];

  return (
    <section className="logos section">
      <Eyebrow>TRUSTED BY BRANDS AND TEAMS</Eyebrow>
      <div className="logos__rail" aria-label="Selected client brands">
        {logos.map((logo) => (
          <div className="logos__item" key={logo.alt}>
            <img className={logo.className} src={logo.src} alt={logo.alt} />
          </div>
        ))}
        <div className="logos__item logos__more">and more...</div>
      </div>
    </section>
  );
}
