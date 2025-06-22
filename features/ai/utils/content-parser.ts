/**
 * Content Parser Utilities
 * Purpose: Parse and transform AI responses into structured editor blocks
 * Features:
 * - Detect content types (code, lists, headings)
 * - Convert between markdown and Tiptap HTML
 * - Parse AI responses into block structures
 */

export interface BlockStructure {
  type: 'paragraph' | 'heading' | 'codeBlock' | 'bulletList' | 'orderedList' | 'taskList' | 'blockquote'
  attrs?: Record<string, any>
  content: string | BlockStructure[]
}

export interface ParsedContent {
  type: 'html' | 'markdown' | 'tiptap'
  blocks: BlockStructure[]
}

export interface ContentIntent {
  wantsCode: boolean
  wantsList: boolean
  wantsHeading: boolean
  wantsQuote: boolean
  language?: string
  listType?: 'bullet' | 'ordered' | 'task'
  headingLevel?: number
}

/**
 * Detect user intent from their prompt
 */
export function detectIntent(prompt: string): ContentIntent {
  const lowerPrompt = prompt.toLowerCase()
  
  // Code detection
  const codeKeywords = [
    'write', 'create', 'code', 'function', 'class', 'component',
    'script', 'program', 'implement', 'smart contract', 'algorithm'
  ]
  const wantsCode = codeKeywords.some(keyword => lowerPrompt.includes(keyword))
  
  // List detection
  const listKeywords = ['list', 'items', 'steps', 'todo', 'task', 'checklist', 'bullets']
  const wantsList = listKeywords.some(keyword => lowerPrompt.includes(keyword))
  
  // Heading detection
  const headingKeywords = ['heading', 'title', 'header', 'section']
  const wantsHeading = headingKeywords.some(keyword => lowerPrompt.includes(keyword))
  
  // Quote detection
  const quoteKeywords = ['quote', 'citation', 'excerpt']
  const wantsQuote = quoteKeywords.some(keyword => lowerPrompt.includes(keyword))
  
  // Determine list type
  let listType: 'bullet' | 'ordered' | 'task' | undefined
  if (wantsList) {
    if (lowerPrompt.includes('todo') || lowerPrompt.includes('task') || lowerPrompt.includes('checklist')) {
      listType = 'task'
    } else if (lowerPrompt.includes('ordered') || lowerPrompt.includes('numbered') || lowerPrompt.includes('steps')) {
      listType = 'ordered'
    } else {
      listType = 'bullet'
    }
  }
  
  return {
    wantsCode,
    wantsList,
    wantsHeading,
    wantsQuote,
    listType
  }
}

/**
 * Parse AI response into structured blocks
 */
export function parseAIResponse(response: string, userPrompt?: string): ParsedContent {
  const blocks: BlockStructure[] = []
  const lines = response.split('\n')
  let currentBlock: BlockStructure | null = null
  let inCodeBlock = false
  let codeLanguage = ''
  let codeContent: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    
    // Check for code block start
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push({
          type: 'codeBlock',
          attrs: { language: codeLanguage || 'plaintext' },
          content: codeContent.join('\n')
        })
        inCodeBlock = false
        codeContent = []
        codeLanguage = ''
      } else {
        // Start code block
        inCodeBlock = true
        codeLanguage = line.slice(3).trim()
      }
      continue
    }
    
    // Handle code block content
    if (inCodeBlock) {
      codeContent.push(line)
      continue
    }
    
    // Check for markdown headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/)
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: headingMatch[2]
      })
      continue
    }
    
    // Check for list items
    const bulletMatch = line.match(/^[-*+]\s+(.+)/)
    const orderedMatch = line.match(/^\d+\.\s+(.+)/)
    const taskMatch = line.match(/^[-*+]\s+\[([ x])\]\s+(.+)/)
    
    if (taskMatch) {
      // Task list item
      if (!currentBlock || currentBlock.type !== 'taskList') {
        currentBlock = { type: 'taskList', content: [] }
        blocks.push(currentBlock)
      }
      (currentBlock.content as BlockStructure[]).push({
        type: 'paragraph',
        attrs: { checked: taskMatch[1] === 'x' },
        content: taskMatch[2]
      })
    } else if (bulletMatch) {
      // Bullet list item
      if (!currentBlock || currentBlock.type !== 'bulletList') {
        currentBlock = { type: 'bulletList', content: [] }
        blocks.push(currentBlock)
      }
      (currentBlock.content as BlockStructure[]).push({
        type: 'paragraph',
        content: bulletMatch[1]
      })
    } else if (orderedMatch) {
      // Ordered list item
      if (!currentBlock || currentBlock.type !== 'orderedList') {
        currentBlock = { type: 'orderedList', content: [] }
        blocks.push(currentBlock)
      }
      (currentBlock.content as BlockStructure[]).push({
        type: 'paragraph',
        content: orderedMatch[1]
      })
    } else if (line.startsWith('>')) {
      // Blockquote
      blocks.push({
        type: 'blockquote',
        content: line.slice(1).trim()
      })
      currentBlock = null
    } else if (line.trim()) {
      // Regular paragraph
      blocks.push({
        type: 'paragraph',
        content: line
      })
      currentBlock = null
    } else {
      // Empty line - reset current block
      currentBlock = null
    }
  }
  
  // Handle unclosed code block
  if (inCodeBlock && codeContent.length > 0) {
    blocks.push({
      type: 'codeBlock',
      attrs: { language: codeLanguage || 'plaintext' },
      content: codeContent.join('\n')
    })
  }
  
  return {
    type: 'markdown',
    blocks
  }
}

/**
 * Convert markdown to Tiptap-compatible HTML
 */
export function markdownToTiptapHTML(markdown: string): string {
  const parsed = parseAIResponse(markdown)
  return blocksToHTML(parsed.blocks)
}

/**
 * Convert block structures to HTML
 */
export function blocksToHTML(blocks: BlockStructure[]): string {
  return blocks.map(block => blockToHTML(block)).join('\n')
}

/**
 * Convert a single block to HTML
 */
function blockToHTML(block: BlockStructure): string {
  switch (block.type) {
    case 'paragraph':
      return `<p>${escapeHtml(block.content as string)}</p>`
    
    case 'heading':
      const level = block.attrs?.level || 1
      return `<h${level}>${escapeHtml(block.content as string)}</h${level}>`
    
    case 'codeBlock':
      const lang = block.attrs?.language || 'plaintext'
      return `<pre><code class="language-${lang}">${escapeHtml(block.content as string)}</code></pre>`
    
    case 'bulletList':
      const bulletItems = (block.content as BlockStructure[])
        .map(item => `<li>${escapeHtml(item.content as string)}</li>`)
        .join('\n')
      return `<ul>${bulletItems}</ul>`
    
    case 'orderedList':
      const orderedItems = (block.content as BlockStructure[])
        .map(item => `<li>${escapeHtml(item.content as string)}</li>`)
        .join('\n')
      return `<ol>${orderedItems}</ol>`
    
    case 'taskList':
      const taskItems = (block.content as BlockStructure[])
        .map(item => {
          const checked = item.attrs?.checked ? 'checked' : ''
          return `<li data-type="taskItem" data-checked="${!!item.attrs?.checked}">
            <label><input type="checkbox" ${checked}><span>${escapeHtml(item.content as string)}</span></label>
          </li>`
        })
        .join('\n')
      return `<ul data-type="taskList">${taskItems}</ul>`
    
    case 'blockquote':
      return `<blockquote>${escapeHtml(block.content as string)}</blockquote>`
    
    default:
      return `<p>${escapeHtml(block.content as string)}</p>`
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m])
} 