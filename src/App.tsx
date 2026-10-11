import { ScrollProvider } from './app/ScrollProvider';
import { Nav } from './components/Nav';
import { SheetStack } from './components/SheetStack';
import { AboutStub, ContactStub } from './sections/_stubs';
import { Hero } from './sections/Hero';
import './App.css';

/**
 * Main application entry for RC Constructions.
 * Phase 4 renders Nav and SheetStack containing Hero, AboutStub, and ContactStub.
 */
export function App() {
  return (
    <ScrollProvider>
      <Nav />
      <main id="main">
        <SheetStack>
          <Hero />
          <AboutStub />
          <ContactStub />
        </SheetStack>
      </main>
    </ScrollProvider>
  );
}
