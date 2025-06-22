/**
 * Component: ErrorBoundary
 * Purpose: Catch and display errors gracefully in chat interface
 * Features:
 * - Catches React errors
 * - User-friendly error messages
 * - Retry mechanism
 * - Error reporting
 * 
 * Created: December 2024
 */

'use client'

import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, retry: () => void) => React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat error boundary caught:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry)
      }

      return <ErrorFallback error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  retry: () => void
}

export function ErrorFallback({ error, retry }: ErrorFallbackProps) {
  const getErrorMessage = () => {
    if (error.message.includes('rate limit')) {
      return 'Too many requests. Please wait a moment and try again.'
    }
    if (error.message.includes('network')) {
      return 'Connection error. Please check your internet connection.'
    }
    if (error.message.includes('unauthorized')) {
      return 'Authentication error. Please sign in again.'
    }
    return 'Something went wrong. Please try again.'
  }

  return (
    <Card className="m-4 border-destructive/50">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-3 bg-destructive/10 rounded-full">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Oops! Something went wrong</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {getErrorMessage()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
            <Button onClick={retry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-left w-full mt-4">
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Error details (development only)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Hook for error handling in functional components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  const resetError = () => setError(null)
  const captureError = (error: Error) => setError(error)

  return { resetError, captureError }
} 