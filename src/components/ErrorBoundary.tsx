import { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches React errors and displays a fallback UI
 *
 * In production, we would:
 * - Log errors to a monitoring service (Sentry, LogRocket, etc.)
 * - Show more user-friendly messages
 * - Provide recovery options
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // In production: log to error tracking service
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>😕 Oops! Something went wrong</h1>
            <p>We encountered an unexpected error. Don't worry, your progress has been saved.</p>
            {this.state.error && (
              <details className="error-details">
                <summary>Error Details</summary>
                <pre>{this.state.error.message}</pre>
                <pre>{this.state.error.stack}</pre>
              </details>
            )}
            <button className="button button-primary" onClick={this.handleReset}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
