/**
 * Component: EditorErrorBoundary
 * Purpose: Provides graceful error handling for editor initialization failures
 * Features:
 * - Catches and displays editor initialization errors
 * - Provides user-friendly error UI with recovery options
 * - Logs errors for debugging
 * 
 * Created: 2024-01-01
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  attemptCount: number;
}

export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      attemptCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
      attemptCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('Editor Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // Update state with error details
    this.setState({
      errorInfo,
      attemptCount: this.state.attemptCount + 1
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: sendToErrorTracker(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      attemptCount: 0
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[500px] p-8">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
              <h2 className="text-lg font-semibold">Editor Failed to Load</h2>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                We encountered an error while loading the editor. This might be temporary.
              </p>
              
              {this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md font-mono text-xs overflow-auto">
                    <div className="font-semibold text-destructive">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div className="mt-2 text-muted-foreground">
                        {this.state.errorInfo.componentStack}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                size="sm"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            {this.state.attemptCount > 2 && (
              <p className="text-xs text-muted-foreground text-center">
                If this problem persists, please contact support.
              </p>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to use error boundary
export function useEditorError() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return {
    throwError: setError,
    clearError: () => setError(null)
  };
} 