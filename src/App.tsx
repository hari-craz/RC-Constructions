import { Playground } from './app/Playground';
import { ScrollProvider } from './app/ScrollProvider';
import './App.css';

/**
 * Main application entry.
 * Renders temporary Phase 3 Playground for motion and sheet-stack verification.
 */
export function App() {
  return (
    <ScrollProvider>
      <main>
        <h1 className="sr-only">RC Constructions</h1>
        <Playground />
      </main>
    </ScrollProvider>
  );
}
