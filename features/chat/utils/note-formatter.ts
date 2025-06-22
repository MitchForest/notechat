import { ExtractOptions } from '../hooks/use-extract-to-note'

export interface ExtractedContent {
  title: string
  summary: string
  contentType: 'code' | 'qa' | 'brainstorm' | 'tutorial' | 'general'
  mainPoints: string[]
  codeSnippets?: Array<{
    language: string
    code: string
    explanation?: string
  }>
  questions?: Array<{
    question: string
    answer: string
  }>
  actionItems?: string[]
  tags: string[]
  suggestedCollection?: string
}

export function formatNoteContent(
  extracted: ExtractedContent,
  options: ExtractOptions
): string {
  switch (extracted.contentType) {
    case 'code':
      return formatCodeNote(extracted)
    case 'qa':
      return formatQANote(extracted)
    case 'brainstorm':
      return formatBrainstormNote(extracted)
    case 'tutorial':
      return formatTutorialNote(extracted)
    default:
      return formatGeneralNote(extracted)
  }
}

function formatCodeNote(extracted: ExtractedContent): string {
  let content = `<h2>${escapeHtml(extracted.title)}</h2>\n\n`
  
  if (extracted.summary) {
    content += `<p>${escapeHtml(extracted.summary)}</p>\n\n`
  }

  if (extracted.codeSnippets && extracted.codeSnippets.length > 0) {
    extracted.codeSnippets.forEach((snippet, index) => {
      if (snippet.explanation) {
        content += `<h3>${escapeHtml(snippet.explanation)}</h3>\n\n`
      }
      content += `<pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>\n\n`
    })
  }

  if (extracted.mainPoints.length > 0) {
    content += `<h3>Key Points</h3>\n<ul>\n`
    extracted.mainPoints.forEach(point => {
      content += `<li>${escapeHtml(point)}</li>\n`
    })
    content += `</ul>\n\n`
  }

  return content
}

function formatQANote(extracted: ExtractedContent): string {
  let content = `<h2>${escapeHtml(extracted.title)}</h2>\n\n`
  
  if (extracted.summary) {
    content += `<p><em>${escapeHtml(extracted.summary)}</em></p>\n\n`
  }

  if (extracted.questions && extracted.questions.length > 0) {
    extracted.questions.forEach((qa, index) => {
      content += `<h3>Q: ${escapeHtml(qa.question)}</h3>\n`
      content += `<p><strong>A:</strong> ${escapeHtml(qa.answer)}</p>\n\n`
    })
  }

  if (extracted.mainPoints.length > 0) {
    content += `<h3>Additional Notes</h3>\n<ul>\n`
    extracted.mainPoints.forEach(point => {
      content += `<li>${escapeHtml(point)}</li>\n`
    })
    content += `</ul>\n\n`
  }

  return content
}

function formatBrainstormNote(extracted: ExtractedContent): string {
  let content = `<h2>${escapeHtml(extracted.title)}</h2>\n\n`
  
  if (extracted.summary) {
    content += `<p><strong>Overview:</strong> ${escapeHtml(extracted.summary)}</p>\n\n`
  }

  if (extracted.mainPoints.length > 0) {
    content += `<h3>Ideas</h3>\n<ul>\n`
    extracted.mainPoints.forEach(point => {
      content += `<li>${escapeHtml(point)}</li>\n`
    })
    content += `</ul>\n\n`
  }

  if (extracted.actionItems && extracted.actionItems.length > 0) {
    content += `<h3>Action Items</h3>\n<ul>\n`
    extracted.actionItems.forEach(item => {
      content += `<li>[ ] ${escapeHtml(item)}</li>\n`
    })
    content += `</ul>\n\n`
  }

  return content
}

function formatTutorialNote(extracted: ExtractedContent): string {
  let content = `<h2>${escapeHtml(extracted.title)}</h2>\n\n`
  
  if (extracted.summary) {
    content += `<p><strong>Goal:</strong> ${escapeHtml(extracted.summary)}</p>\n\n`
  }

  if (extracted.mainPoints.length > 0) {
    content += `<h3>Steps</h3>\n<ol>\n`
    extracted.mainPoints.forEach((step, index) => {
      content += `<li>${escapeHtml(step)}</li>\n`
    })
    content += `</ol>\n\n`
  }

  if (extracted.codeSnippets && extracted.codeSnippets.length > 0) {
    content += `<h3>Code Examples</h3>\n\n`
    extracted.codeSnippets.forEach((snippet) => {
      if (snippet.explanation) {
        content += `<p>${escapeHtml(snippet.explanation)}</p>\n`
      }
      content += `<pre><code class="language-${snippet.language}">${escapeHtml(snippet.code)}</code></pre>\n\n`
    })
  }

  return content
}

function formatGeneralNote(extracted: ExtractedContent): string {
  let content = `<h2>${escapeHtml(extracted.title)}</h2>\n\n`
  
  if (extracted.summary) {
    content += `<p>${escapeHtml(extracted.summary)}</p>\n\n`
  }

  if (extracted.mainPoints.length > 0) {
    extracted.mainPoints.forEach(point => {
      content += `<p>${escapeHtml(point)}</p>\n\n`
    })
  }

  return content
}

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