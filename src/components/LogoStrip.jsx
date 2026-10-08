import { Eyebrow } from "./ui";
import pawfyLogo from "../assets/pawfy.svg";
import showMeYourMumuLogo from "../assets/show-me-your-mumu.svg";
export default function LogoStrip() {
  return (
    <section className="logos section">
      <Eyebrow>TRUSTED BY BRANDS AND TEAMS</Eyebrow>
      <div>
        <img className="logos__pawfy" src={pawfyLogo} alt="Pawfy" />
        <img
          className="logos__bettervits"
          src="https://cdn.shopify.com/s/files/1/0533/0970/2320/files/logo_d12ebcd9-15bb-44c8-8305-9bb35e62c264.svg?v=1758024918"
          alt="BetterVits"
        />
        <img
          className="logos__gardencup"
          src="https://gardencup.com/cdn/shop/files/gardencup-logo-dark-green.png?v=1726841729&width=360"
          alt="GardenCup"
        />
        <img
          className="logos__show-me-your-mumu"
          src={showMeYourMumuLogo}
          alt="Show Me Your Mumu"
        />
        <img
          className="logos__clearly-filtered"
          src="https://clearlyfiltered.com/cdn/shop/files/clearblue-cf-icon-2bwordmarkup-lockup-small-51cebc6ee571.png"
          alt="Clearly Filtered"
        />
        <img
          className="logos__mvmt"
          src="https://mvmt.com/cdn/shop/files/mvmt-logo.svg?v=1784137576&width=145"
          alt="MVMT"
        />
        <span>and more...</span>
      </div>
    </section>
  );
}
