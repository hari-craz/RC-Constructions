import { ScrollProvider } from './app/ScrollProvider';
import { Building } from './components/Building';
import { Nav } from './components/Nav';
import { SheetStack } from './components/SheetStack';
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
 * Phase 7 renders Nav, Building elevation canvas, and SheetStack containing
 * Hero (Survey), About (Foundation), Services (Structure), Projects (Envelope),
 * Process (Fit-out), Completion (Handover stats), Founder monograph, and Contact.
 */
export function App() {
  return (
    <ScrollProvider>
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
