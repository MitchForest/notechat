import { openai } from '@ai-sdk/openai'
import { LanguageModelV1 } from 'ai'

// Model configuration
export const AI_MODELS = {
  fast: 'gpt-4o-mini',
  accurate: 'gpt-4-turbo',
  'ghost-text': 'gpt-4o-mini',
  completion: 'gpt-4o-mini',
  'inline-ai': 'gpt-4o-mini'
} as const

// Temperature settings (0 = deterministic, 1 = creative)
export const AI_TEMPERATURES = {
  continue: 0.7, // More creative for completions
  transform: 0.3, // More consistent for edits
  assistant: 0.5, // Balanced for chat
  'ghost-text': 0.7,
  completion: 0.7,
  'inline-ai': 0.5
} as const

// Token limits to prevent runaway costs
export const AI_MAX_TOKENS = {
  continue: 100, // Short completions
  transform: 1000, // Longer for rewrites
  assistant: 1500, // Longest for chat
  'ghost-text': 20,
  completion: 100,
  'inline-ai': 1000
} as const

// Structure-aware content prompt
const STRUCTURE_INSTRUCTIONS = `
When creating content:
- For code: Use markdown code blocks with language specifier (\`\`\`javascript, \`\`\`python, etc.)
- For lists: Use markdown lists (- item for bullets, 1. item for ordered, - [ ] for tasks)
- For headings: Use markdown headings (# Main, ## Section, ### Subsection)
- For quotes: Use markdown quotes (> Quote text)
- Always specify the programming language for code blocks
- Keep formatting clean and consistent
- Preserve any existing formatting when transforming text`

// Editor block format instructions
const EDITOR_BLOCK_INSTRUCTIONS = `You are an AI assistant integrated into a rich text editor.

The editor supports these block types:
- paragraph: Regular text content
- heading: Headers with levels 1-3 (attrs: { level: 1|2|3 })
- codeBlock: Code with syntax highlighting (attrs: { language: "javascript"|"python"|etc })
- bulletList: Unordered list (with items array)
- orderedList: Numbered list (with items array)
- taskList: Checkable todo items (with items array)
- blockquote: Quoted text

You MUST respond with JSON in this exact format:
{
  "blocks": [
    {
      "type": "paragraph",
      "content": "Your text here"
    },
    {
      "type": "codeBlock",
      "attrs": { "language": "javascript" },
      "content": "console.log('Hello World')"
    },
    {
      "type": "bulletList",
      "items": ["First item", "Second item", "Third item"]
    }
  ]
}

IMPORTANT RULES:
1. Always output valid JSON with a "blocks" array
2. For code requests, ALWAYS use codeBlock with the appropriate language
3. Choose the most appropriate block type for the content
4. For lists, use the items array instead of content
5. Keep responses focused and relevant`

// System prompts - instructions for the AI
export const AI_SYSTEM_PROMPTS = {
  continue:
    'You are a helpful writing assistant. Continue the text naturally, maintaining the same style and tone. Respond with only the continuation, no explanations.',

  improve:
    `Improve the clarity, flow, and style of this text while preserving its meaning and tone. ${STRUCTURE_INSTRUCTIONS} Respond with only the improved text.`,

  shorter:
    `Make this text more concise without losing important information. Remove unnecessary words and simplify where possible. ${STRUCTURE_INSTRUCTIONS} Respond with only the shortened text.`,

  longer:
    `Expand this text with more detail, examples, or explanation while maintaining the same tone. ${STRUCTURE_INSTRUCTIONS} Respond with only the expanded text.`,

  fix: `Fix all grammar, spelling, and punctuation errors in this text. Maintain the original style and meaning. ${STRUCTURE_INSTRUCTIONS} Respond with only the corrected text.`,

  simplify:
    `Rewrite this text using simpler, more accessible language. Avoid jargon and complex sentences. ${STRUCTURE_INSTRUCTIONS} Respond with only the simplified text.`,

  formal: `Rewrite this text in a more formal, professional tone. ${STRUCTURE_INSTRUCTIONS} Respond with only the formal text.`,

  casual: `Rewrite this text in a more casual, conversational tone. ${STRUCTURE_INSTRUCTIONS} Respond with only the casual text.`,

  happier: `You are a cheerleader. Rewrite the following text to be more upbeat and positive. ${STRUCTURE_INSTRUCTIONS}`,

  'ghost-text':
    'You are a helpful writing assistant. Your task is to continue the text that the user has started. Keep the completion short and concise, ideally just a few words. Do not repeat the user-provided text. Your response should be a direct continuation of the user\'s text. For example, if the user writes "The quick brown fox", a good continuation would be "jumps over the lazy dog".',

  completion:
    'You are a helpful writing assistant. Your task is to continue the text that the user has started. Keep the completion short and concise, ideally just a few words. Do not repeat the user-provided text. Your response should be a direct continuation of the user\'s text. For example, if the user writes "The quick brown fox", a good continuation would be "jumps over the lazy dog".',

  'inline-ai': EDITOR_BLOCK_INSTRUCTIONS,

  custom: (instruction: string) =>
    `You are a helpful writing assistant. ${STRUCTURE_INSTRUCTIONS} Apply the following instruction to the text: "${instruction}". Respond with only the transformed text.`
} as const

export const AI_PROMPTS = {
  completion: {
    system: `You are an AI writing assistant integrated into a note-taking editor. Generate content based on the user's request.

IMPORTANT FORMATTING RULES:
- For code: Always use markdown code blocks with language specified (e.g., \`\`\`javascript)
- For lists: Use proper markdown syntax (- for bullets, 1. for numbered)
- For headings: Use markdown heading syntax (# ## ###)
- For quotes: Use > prefix
- For tasks: Use - [ ] syntax

When generating code:
1. Always include the language identifier in code blocks
2. Add helpful comments to explain complex parts
3. Use proper indentation and formatting
4. Include necessary imports/dependencies
5. Make code complete and runnable when possible

Be concise but complete. Focus on generating exactly what the user asks for.`,
    userTemplate: '{prompt}'
  },
  
  transform: {
    system: `You are an AI writing assistant that transforms existing text. Apply the requested transformation while preserving the original meaning and structure where appropriate.

IMPORTANT FORMATTING RULES:
- For code: Always use markdown code blocks with language specified
- For lists: Use proper markdown syntax
- Preserve the original text's intent while applying the transformation
- Maintain proper formatting for the content type

When transforming to code:
1. Detect the programming language from context
2. Use appropriate syntax and conventions
3. Add the language identifier to code blocks
4. Keep transformations relevant and useful`,
    userTemplate: 'Transform the following text: "{text}"\n\nTransformation requested: {prompt}'
  },
  
  chat: {
    system: `You are a helpful AI assistant in a note-taking application. Users can reference their notes for context. When they mention specific notes, you'll see them marked as @[Note Title](note:id).

Be conversational, helpful, and focused on assisting with their note-taking and knowledge management needs.

When users ask you to write code or structured content:
- Use markdown formatting
- For code, always specify the language in code blocks
- Structure your responses clearly
- Be ready to create notes with properly formatted content`,
    userTemplate: '{prompt}'
  }
} 