import { ScrollProvider } from './app/ScrollProvider';
import { Building } from './components/Building';
import { LoadingLine } from './components/LoadingLine';
import { Nav } from './components/Nav';
import { SheetStack } from './components/SheetStack';
import { SurveyCursor } from './components/SurveyCursor';
import { About } from './sections/About';
import { Completion } from './sections/Completion';
import { Contact } from './sections/Contact';
import { Founder } from './sections/Founder';
import { Hero } from './sections/Hero';
import { Process } from './sections/Process';
import { Projects } from './sections/Projects';
import { Services } from './sections/Services';
import './App.css';

/**
 * Main application entry for RC Constructions.
 * Phase 8 integrates LoadingLine sequence, SurveyCursor, and ProjectOverlay.
 */
export function App() {
  return (
    <ScrollProvider>
      <LoadingLine />
      <SurveyCursor />
      <Nav />
      <Building />
      <main id="main">
        <SheetStack>
          <Hero />
          <About />
          <Services />
          <Projects />
          <Process />
          <Completion />
          <Founder />
          <Contact />
        </SheetStack>
      </main>
    </ScrollProvider>
  );
}
