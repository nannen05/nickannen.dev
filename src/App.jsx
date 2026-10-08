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

function App() {
  return (
    <>
      <Header />
      <main id="top">
        <Hero />
        <LogoStrip />
        <Intro />
        <Stats />
        <Work />
        <ValueProps />
        <Services />
        <Pricing />
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
