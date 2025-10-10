import React from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>
            
            <h1 className="error-title">Oops! Something went wrong</h1>
            
            <p className="error-description">
              We're sorry, but something unexpected happened. Our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button 
                onClick={this.handleRetry}
                className="error-button primary"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw size={20} />
                Try Again {this.state.retryCount > 0 && `(${this.state.retryCount}/3)`}
              </button>
              
              <button 
                onClick={this.handleReload}
                className="error-button secondary"
              >
                <RefreshCw size={20} />
                Reload Page
              </button>
              
              <button 
                onClick={this.handleGoHome}
                className="error-button secondary"
              >
                <Home size={20} />
                Go Home
              </button>
            </div>

            {this.state.retryCount >= 3 && (
              <p className="error-limit">
                Maximum retry attempts reached. Please reload the page or contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;