import { useEffect, useState } from "react";
import About from "./components/About";
import AgencyCallout from "./components/AgencyCallout";
import FooterCTA from "./components/FooterCTA";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Intro from "./components/Intro";
import LogoStrip from "./components/LogoStrip";
import Pricing from "./components/Pricing";
import Process from "./components/Process";
import Services from "./components/Services";
import Stats from "./components/Stats";
import ValueProps from "./components/ValueProps";
import Work from "./components/Work";
import ContactOverlay from "./components/ContactOverlay";
import ExperimentResults from "./components/ExperimentResults";
import { getPortfolioVariant } from "./lib/pricingVisibility";
import { trackOutreachVisit } from "./lib/outreachTracking";

function App() {
  const [portfolioVariant] = useState(getPortfolioVariant);
  const hidePricing = portfolioVariant === "1";
  const resultsFirst = portfolioVariant === "2";

  useEffect(() => trackOutreachVisit(), []);

  return (
    <>
      <Header showPricing={!hidePricing} resultsFirst={resultsFirst} />
      <main id="top">
        <Hero />
        <LogoStrip />
        <Intro />
        <Stats />
        {resultsFirst ? <ExperimentResults /> : <Work />}
        {resultsFirst ? <Work /> : <ExperimentResults />}
        <ValueProps />
        <Services />
        {!hidePricing && <Pricing />}
        <AgencyCallout />
        <Process />
        <About />
      </main>
      <FooterCTA />
      <ContactOverlay />
    </>
  );
}

export default App;
