// AI operation types - what the AI can do
export type AIOperation =
  | 'continue' // Ghost completion
  | 'improve' // Make writing better
  | 'shorter' // Make more concise
  | 'longer' // Add more detail
  | 'fix' // Fix grammar/spelling
  | 'simplify' // Simpler language
  | 'formal' // Professional tone
  | 'casual' // Conversational tone
  | 'custom' // User-defined instruction

// Context for AI operations
export interface AIContext {
  text: string // The text to work with
  operation: AIOperation // What to do
  customPrompt?: string // For custom operations
}

// Error types for better error handling
export interface AIError {
  message: string
  code: 'rate_limit' | 'invalid_request' | 'api_error'
  details?: any
} 