interface RetryOptions {
  maxRetries?: number
  initialDelay?: number
  maxDelay?: number
  backoffFactor?: number
  timeout?: number
  onRetry?: (error: Error, attempt: number) => void
  shouldRetry?: (error: Error) => boolean
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  timeout: 30000,
  onRetry: () => {},
  shouldRetry: (error) => {
    // Retry on network errors or 5xx status codes
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return true
    }
    
    // Check if it's an HTTP error with status code
    const statusMatch = error.message.match(/status: (\d+)/)
    if (statusMatch) {
      const status = parseInt(statusMatch[1])
      return status >= 500 && status < 600
    }
    
    return true // Default to retry
  }
}

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message)
    this.name = 'RetryError'
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error = new Error('Unknown error')
  
  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${opts.timeout}ms`))
        }, opts.timeout)
      })
      
      // Race between the actual function and timeout
      const result = await Promise.race([fn(), timeoutPromise])
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Check if we should retry
      if (!opts.shouldRetry(lastError)) {
        throw lastError
      }
      
      // If this was the last attempt, throw
      if (attempt === opts.maxRetries) {
        throw new RetryError(
          `Failed after ${opts.maxRetries} attempts: ${lastError.message}`,
          attempt,
          lastError
        )
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )
      
      // Call retry callback
      opts.onRetry(lastError, attempt)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError
}

// Specialized retry for streaming responses
export async function* withStreamingRetry<T>(
  fn: () => AsyncGenerator<T>,
  options: RetryOptions = {}
): AsyncGenerator<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  let lastError: Error = new Error('Unknown error')
  let buffer: T[] = []
  
  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const generator = fn()
      let hasStartedStreaming = false
      
      for await (const chunk of generator) {
        hasStartedStreaming = true
        buffer.push(chunk)
        yield chunk
      }
      
      // If we successfully completed streaming, we're done
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // If streaming had started, we can't retry (partial data)
      if (buffer.length > 0) {
        throw new Error('Streaming failed after partial data received')
      }
      
      // Check if we should retry
      if (!opts.shouldRetry(lastError)) {
        throw lastError
      }
      
      // If this was the last attempt, throw
      if (attempt === opts.maxRetries) {
        throw new RetryError(
          `Streaming failed after ${opts.maxRetries} attempts: ${lastError.message}`,
          attempt,
          lastError
        )
      }
      
      // Calculate delay
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )
      
      // Call retry callback
      opts.onRetry(lastError, attempt)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

// Helper to check if an error is retryable
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  
  const errorMessage = error.message.toLowerCase()
  
  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('econnrefused')
  ) {
    return true
  }
  
  // Rate limit errors (usually 429)
  if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
    return true
  }
  
  // Server errors (5xx)
  const statusMatch = errorMessage.match(/status: (\d+)/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1])
    return status >= 500 && status < 600
  }
  
  return false
} 