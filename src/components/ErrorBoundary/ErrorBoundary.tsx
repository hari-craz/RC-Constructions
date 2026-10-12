import { Component, type ErrorInfo, type ReactNode } from 'react';
import { CONTACT_CONFIG } from '../../content/contact';
import { SITE } from '../../content/site';
import './ErrorBoundary.css';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env.DEV) {
      // In development mode only, keep diagnostics accessible

      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-wrapper" role="alert" aria-live="assertive">
          <div className="error-boundary-card">
            <header className="error-boundary-header">
              <h1 className="error-boundary-title">{SITE.companyName}</h1>
            </header>

            <div className="error-boundary-body">
              <p className="error-boundary-message">
                The drawing interface encountered an unexpected runtime exception. All project
                materials and site records remain intact.
              </p>

              <dl className="error-boundary-contacts" aria-label="Direct site contact">
                <div className="error-boundary-contact-item">
                  <dt className="error-boundary-contact-key">Telephone</dt>
                  <dd className="error-boundary-contact-val">
                    <a href={`tel:${CONTACT_CONFIG.rawPhone}`} className="error-boundary-link">
                      {CONTACT_CONFIG.displayPhone}
                    </a>
                  </dd>
                </div>
                <div className="error-boundary-contact-item">
                  <dt className="error-boundary-contact-key">Email</dt>
                  <dd className="error-boundary-contact-val">
                    <a href={`mailto:${CONTACT_CONFIG.email}`} className="error-boundary-link">
                      {CONTACT_CONFIG.email}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="error-boundary-actions">
                <button
                  type="button"
                  className="error-boundary-reload-btn"
                  onClick={this.handleReload}
                >
                  Reload drawing interface
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
