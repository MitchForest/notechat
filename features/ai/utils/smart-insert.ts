/**
 * Smart Insert System
 * Purpose: Intelligently insert AI-generated content into the editor
 * Features:
 * - Detects content type and creates appropriate blocks
 * - Handles code blocks with language detection
 * - Creates lists, headings, and other structured content
 * - Preserves formatting and structure
 */

import { Editor } from '@tiptap/core'
import { detectIntent, parseAIResponse, markdownToTiptapHTML } from './content-parser'
import { detectLanguage } from './language-detector'

export interface InsertContext {
  userPrompt: string
  operation?: string
  selection?: { from: number; to: number }
  createNewBlock?: boolean
}

export class SmartInsert {
  constructor(private editor: Editor) {}

  /**
   * Main entry point for inserting AI content
   */
  async insertContent(content: string, context: InsertContext) {
    const intent = detectIntent(context.userPrompt)
    const parsed = parseAIResponse(content, context.userPrompt)
    
    // Handle code blocks specially
    if (intent.wantsCode || this.hasCodeBlock(content)) {
      await this.insertCodeBlock(content, context)
      return
    }
    
    // Handle lists
    if (intent.wantsList || this.hasList(content)) {
      await this.insertList(content, intent.listType || 'bullet')
      return
    }
    
    // Handle headings
    if (intent.wantsHeading || this.hasHeading(content)) {
      await this.insertHeading(content, intent.headingLevel)
      return
    }
    
    // Handle quotes
    if (intent.wantsQuote || this.hasQuote(content)) {
      await this.insertQuote(content)
      return
    }
    
    // Handle multiple blocks
    if (parsed.blocks.length > 1) {
      await this.insertMultipleBlocks(parsed.blocks)
      return
    }
    
    // Default: insert as formatted HTML
    await this.insertFormattedText(content)
  }

  /**
   * Insert a code block with proper language detection
   */
  private async insertCodeBlock(content: string, context: InsertContext) {
    // Extract code from markdown code fences if present
    const codeMatch = content.match(/```(\w*)\n?([\s\S]*?)```/)
    
    let code: string
    let language: string
    
    if (codeMatch) {
      language = codeMatch[1] || detectLanguage(codeMatch[2], context.userPrompt)
      code = codeMatch[2].trim()
    } else {
      // No code fences, treat entire content as code
      code = content.trim()
      language = detectLanguage(code, context.userPrompt)
    }
    
    // Insert the code block
    this.editor
      .chain()
      .focus()
      .insertContent({
        type: 'codeBlock',
        attrs: { language },
        content: [{ type: 'text', text: code }]
      })
      .run()
  }

  /**
   * Insert a list (bullet, ordered, or task)
   */
  private async insertList(content: string, listType: 'bullet' | 'ordered' | 'task') {
    const parsed = parseAIResponse(content)
    
    // Find list blocks
    const listBlocks = parsed.blocks.filter(block => 
      block.type === 'bulletList' || 
      block.type === 'orderedList' || 
      block.type === 'taskList'
    )
    
    if (listBlocks.length > 0) {
      // Use parsed list structure
      const html = markdownToTiptapHTML(content)
      this.editor.chain().focus().insertContent(html).run()
    } else {
      // Create list from lines
      const lines = content.split('\n').filter(line => line.trim())
      
      if (listType === 'task') {
        this.editor.chain().focus().toggleTaskList().run()
      } else if (listType === 'ordered') {
        this.editor.chain().focus().toggleOrderedList().run()
      } else {
        this.editor.chain().focus().toggleBulletList().run()
      }
      
      // Insert list items
      lines.forEach((line, index) => {
        if (index > 0) {
          this.editor.chain().focus().splitListItem('listItem').run()
        }
        this.editor.chain().focus().insertContent(line).run()
      })
    }
  }

  /**
   * Insert a heading
   */
  private async insertHeading(content: string, level?: number) {
    const headingLevel = level || 2 // Default to h2
    const text = content.replace(/^#{1,6}\s*/, '').trim()
    
    this.editor
      .chain()
      .focus()
      .setHeading({ level: headingLevel as any })
      .insertContent(text)
      .run()
  }

  /**
   * Insert a blockquote
   */
  private async insertQuote(content: string) {
    const text = content.replace(/^>\s*/gm, '').trim()
    
    this.editor
      .chain()
      .focus()
      .setBlockquote()
      .insertContent(text)
      .run()
  }

  /**
   * Insert multiple blocks
   */
  private async insertMultipleBlocks(blocks: any[]) {
    const html = markdownToTiptapHTML(blocks.map(b => this.blockToMarkdown(b)).join('\n\n'))
    this.editor.chain().focus().insertContent(html).run()
  }

  /**
   * Insert formatted text (default)
   */
  private async insertFormattedText(content: string) {
    // Check if content has markdown formatting
    if (this.hasMarkdownFormatting(content)) {
      const html = markdownToTiptapHTML(content)
      this.editor.chain().focus().insertContent(html).run()
    } else {
      // Plain text
      this.editor.chain().focus().insertContent(content).run()
    }
  }

  /**
   * Check if content has a code block
   */
  private hasCodeBlock(content: string): boolean {
    return /```[\s\S]*```/.test(content) || 
           /^\s{4,}/.test(content) // Indented code
  }

  /**
   * Check if content has a list
   */
  private hasList(content: string): boolean {
    return /^[-*+]\s+/m.test(content) || // Bullet list
           /^\d+\.\s+/m.test(content) || // Ordered list
           /^[-*+]\s+\[[ x]\]/m.test(content) // Task list
  }

  /**
   * Check if content has a heading
   */
  private hasHeading(content: string): boolean {
    return /^#{1,6}\s+/m.test(content)
  }

  /**
   * Check if content has a quote
   */
  private hasQuote(content: string): boolean {
    return /^>\s+/m.test(content)
  }

  /**
   * Check if content has markdown formatting
   */
  private hasMarkdownFormatting(content: string): boolean {
    return this.hasCodeBlock(content) ||
           this.hasList(content) ||
           this.hasHeading(content) ||
           this.hasQuote(content) ||
           /\*\*.*\*\*/.test(content) || // Bold
           /\*[^*]+\*/.test(content) || // Italic
           /\[.*\]\(.*\)/.test(content) // Links
  }

  /**
   * Convert block structure back to markdown
   */
  private blockToMarkdown(block: any): string {
    switch (block.type) {
      case 'heading':
        return `${'#'.repeat(block.attrs?.level || 1)} ${block.content}`
      case 'codeBlock':
        return `\`\`\`${block.attrs?.language || ''}\n${block.content}\n\`\`\``
      case 'bulletList':
        return (block.content as any[]).map(item => `- ${item.content}`).join('\n')
      case 'orderedList':
        return (block.content as any[]).map((item, i) => `${i + 1}. ${item.content}`).join('\n')
      case 'taskList':
        return (block.content as any[]).map(item => 
          `- [${item.attrs?.checked ? 'x' : ' '}] ${item.content}`
        ).join('\n')
      case 'blockquote':
        return `> ${block.content}`
      default:
        return block.content || ''
    }
  }
} 