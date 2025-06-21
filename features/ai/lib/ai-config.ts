import { openai } from '@ai-sdk/openai'

// Model configuration
export const AI_MODELS = {
  fast: openai('gpt-4o-mini'), // For quick operations
  accurate: openai('gpt-4o-mini') // Same for now, can upgrade later
} as const

// Temperature settings (0 = deterministic, 1 = creative)
export const AI_TEMPERATURES = {
  continue: 0.7, // More creative for completions
  transform: 0.3, // More consistent for edits
  assistant: 0.5 // Balanced for chat
} as const

// Token limits to prevent runaway costs
export const AI_MAX_TOKENS = {
  continue: 100, // Short completions
  transform: 1000, // Longer for rewrites
  assistant: 1500 // Longest for chat
} as const

// System prompts - instructions for the AI
export const AI_SYSTEM_PROMPTS = {
  continue:
    'You are a helpful writing assistant. Continue the text naturally, maintaining the same style and tone. Respond with only the continuation, no explanations.',

  improve:
    'Improve the clarity, flow, and style of this text while preserving its meaning and tone. Respond with only the improved text.',

  shorter:
    'Make this text more concise without losing important information. Remove unnecessary words and simplify where possible. Respond with only the shortened text.',

  longer:
    'Expand this text with more detail, examples, or explanation while maintaining the same tone. Respond with only the expanded text.',

  fix: 'Fix all grammar, spelling, and punctuation errors in this text. Maintain the original style and meaning. Respond with only the corrected text.',

  simplify:
    'Rewrite this text using simpler, more accessible language. Avoid jargon and complex sentences. Respond with only the simplified text.',

  formal: 'Rewrite this text in a more formal, professional tone. Respond with only the formal text.',

  casual: 'Rewrite this text in a more casual, conversational tone. Respond with only the casual text.',

  custom: (instruction: string) =>
    `Follow this instruction: "${instruction}". Respond with only the transformed text, no explanations.`
} as const 