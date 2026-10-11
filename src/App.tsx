import { ScrollProvider } from './app/ScrollProvider';
import { Building } from './components/Building';
import { Nav } from './components/Nav';
import { SheetStack } from './components/SheetStack';
import {
  CompletionStage,
  EnvelopeStage,
  FitoutStage,
  FoundationStage,
  StructureStage,
} from './sections/_stages';
import { ContactStub } from './sections/_stubs';
import { Hero } from './sections/Hero';
import './App.css';

/**
 * Main application entry for RC Constructions.
 * Phase 6 renders Nav, Building elevation canvas, and SheetStack containing
 * Hero (Survey), Foundation, Structure, Envelope, Fit-out, Completion, and ContactStub.
 */
export function App() {
  return (
    <ScrollProvider>
      <Nav />
      <Building />
      <main id="main">
        <SheetStack>
          <Hero />
          <FoundationStage />
          <StructureStage />
          <EnvelopeStage />
          <FitoutStage />
          <CompletionStage />
          <ContactStub />
        </SheetStack>
      </main>
    </ScrollProvider>
  );
}
