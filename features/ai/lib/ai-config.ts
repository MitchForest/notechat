import { openai } from '@ai-sdk/openai'
import { LanguageModelV1 } from 'ai'

// Model configuration
export const AI_MODELS = {
  fast: 'gpt-4o-mini',
  accurate: 'gpt-4-turbo',
  'ghost-text': 'gpt-4o-mini',
  completion: 'gpt-4o-mini'
} as const

// Temperature settings (0 = deterministic, 1 = creative)
export const AI_TEMPERATURES = {
  continue: 0.7, // More creative for completions
  transform: 0.3, // More consistent for edits
  assistant: 0.5, // Balanced for chat
  'ghost-text': 0.7,
  completion: 0.7
} as const

// Token limits to prevent runaway costs
export const AI_MAX_TOKENS = {
  continue: 100, // Short completions
  transform: 1000, // Longer for rewrites
  assistant: 1500, // Longest for chat
  'ghost-text': 20,
  completion: 100
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

  happier: 'You are a cheerleader. Rewrite the following text to be more upbeat and positive.',

  'ghost-text':
    'You are a helpful writing assistant. Your task is to continue the text that the user has started. Keep the completion short and concise, ideally just a few words. Do not repeat the user-provided text. Your response should be a direct continuation of the user\'s text. For example, if the user writes "The quick brown fox", a good continuation would be "jumps over the lazy dog".',

  completion:
    'You are a helpful writing assistant. Your task is to continue the text that the user has started. Keep the completion short and concise, ideally just a few words. Do not repeat the user-provided text. Your response should be a direct continuation of the user\'s text. For example, if the user writes "The quick brown fox", a good continuation would be "jumps over the lazy dog".',

  custom: (instruction: string) =>
    `You are a helpful writing assistant. Apply the following instruction to the text: "${instruction}"`
} as const 