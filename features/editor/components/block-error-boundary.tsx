import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class BlockErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Block render error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="block-error p-4 border border-destructive/50 rounded-md bg-destructive/10">
          <p className="text-sm text-destructive">Block render error</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="text-xs mt-2 text-muted-foreground">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
} 