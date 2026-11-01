import { Contact } from "./components/contact";
import { Features } from "./components/features";
import { Footer } from "./components/footer";
import { Header, TopBar } from "./components/header";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { Pilot } from "./components/pilot";
import { Problem } from "./components/problem";
import { Tape } from "./components/tape";
import { Trust } from "./components/trust";

export default function Home() {
  return (
    <>
      <TopBar />
      <Header />
      <main>
        <Hero />
        <Tape />
        <Problem />
        <HowItWorks />
        <Features />
        <Trust />
        <Pilot />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
