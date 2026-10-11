import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './App';

import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
