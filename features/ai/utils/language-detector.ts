/**
 * Language Detector
 * Purpose: Detect programming languages from content and prompts
 * Features:
 * - Pattern-based language detection
 * - Prompt keyword matching
 * - File extension detection
 */

// Language patterns for content detection
const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  javascript: /\b(function|const|let|var|=>|console\.log|require|import\s+.*from|export\s+(default|const))\b/,
  typescript: /\b(interface|type\s+\w+\s*=|:\s*(string|number|boolean|void)|enum\s+|namespace|declare)\b/,
  python: /\b(def\s+\w+|import\s+\w+|from\s+\w+\s+import|print\(|if\s+.*:|class\s+\w+|__init__|self\.)\b/,
  java: /\b(public\s+class|private\s+|protected\s+|static\s+void|System\.out\.|import\s+java\.)\b/,
  csharp: /\b(using\s+System|namespace\s+|public\s+class|private\s+|static\s+void|Console\.WriteLine)\b/,
  cpp: /\b(#include\s*<|using\s+namespace\s+std|int\s+main\(|cout\s*<<|cin\s*>>|std::)\b/,
  c: /\b(#include\s*<.*\.h>|int\s+main\(|printf\(|scanf\(|malloc\(|free\()\b/,
  rust: /\b(fn\s+\w+|let\s+mut|impl\s+|struct\s+|use\s+|pub\s+fn|match\s+|Some\(|None)\b/,
  go: /\b(func\s+\w+|package\s+\w+|import\s+\(|fmt\.Print|var\s+\w+\s+|:=)\b/,
  swift: /\b(func\s+\w+|var\s+\w+\s*:|let\s+\w+\s*:|class\s+\w+|struct\s+\w+|import\s+\w+)\b/,
  kotlin: /\b(fun\s+\w+|val\s+|var\s+|class\s+\w+|object\s+|companion\s+object|import\s+)\b/,
  ruby: /\b(def\s+\w+|class\s+\w+|module\s+|require\s+|puts\s+|attr_\w+|end\b)\b/,
  php: /\b(<\?php|\$\w+|function\s+\w+|echo\s+|require_once|namespace\s+|use\s+)\b/,
  sql: /\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE\s+TABLE|ALTER|DROP|JOIN|GROUP\s+BY)\b/i,
  solidity: /\b(pragma\s+solidity|contract\s+\w+|function\s+\w+.*\s+(public|private|external)|uint256|address|mapping)\b/,
  html: /<\w+.*>|<\/\w+>|<!DOCTYPE|<html|<head|<body|<div|<span|<script|<style/,
  css: /\b(\w+\s*{[\s\S]*}|\.[\w-]+|#[\w-]+|@media|@import|:hover|:active|margin:|padding:|display:)\b/,
  json: /^\s*{[\s\S]*}\s*$|^\s*\[[\s\S]*\]\s*$/,
  yaml: /^[\w-]+:\s*|^\s*-\s+\w+|^\s{2,}\w+:/m,
  markdown: /^#{1,6}\s+|^\*\*.*\*\*|^```|^\|.*\|/m,
  jsx: /\b(import\s+React|export\s+default|return\s*\(?\s*<|className=|onClick=|useState|useEffect)\b/,
  tsx: /\b(import\s+React|interface\s+\w+Props|:\s*React\.FC|export\s+const.*:\s*React\.FC)\b/,
  vue: /\b(<template>|<script>|<style|v-if=|v-for=|@click=|:class=|export\s+default\s*{)\b/,
  shell: /\b(#!\/bin\/(bash|sh)|echo\s+|cd\s+|ls\s+|mkdir\s+|rm\s+|cp\s+|mv\s+|\$\w+|export\s+)\b/,
  powershell: /\b(\$\w+\s*=|Write-Host|Get-|Set-|New-|Remove-|param\(|function\s+\w+-\w+)\b/,
}

// Prompt keywords for language detection
const PROMPT_KEYWORDS: Record<string, string[]> = {
  javascript: ['javascript', 'js', 'node', 'nodejs', 'express', 'react', 'vue', 'angular', 'jquery'],
  typescript: ['typescript', 'ts', 'type', 'interface', 'angular', 'react typescript'],
  python: ['python', 'py', 'django', 'flask', 'pandas', 'numpy', 'tensorflow', 'pytorch'],
  java: ['java', 'spring', 'springboot', 'android', 'junit', 'maven', 'gradle'],
  csharp: ['c#', 'csharp', 'dotnet', '.net', 'asp.net', 'unity', 'xamarin'],
  cpp: ['c++', 'cpp', 'qt', 'opencv', 'unreal', 'arduino'],
  c: ['c language', 'c programming', 'embedded', 'kernel', 'system programming'],
  rust: ['rust', 'cargo', 'rustlang', 'wasm', 'webassembly'],
  go: ['go', 'golang', 'gin', 'echo', 'goroutine'],
  swift: ['swift', 'ios', 'macos', 'swiftui', 'uikit', 'xcode'],
  kotlin: ['kotlin', 'android', 'ktor', 'coroutines'],
  ruby: ['ruby', 'rails', 'sinatra', 'rspec', 'bundler'],
  php: ['php', 'laravel', 'symfony', 'wordpress', 'composer'],
  sql: ['sql', 'mysql', 'postgresql', 'sqlite', 'oracle', 'database', 'query'],
  solidity: ['solidity', 'smart contract', 'ethereum', 'blockchain', 'web3', 'defi', 'nft'],
  html: ['html', 'webpage', 'website', 'markup', 'dom'],
  css: ['css', 'style', 'stylesheet', 'sass', 'scss', 'tailwind', 'bootstrap'],
  json: ['json', 'api response', 'configuration', 'package.json'],
  yaml: ['yaml', 'yml', 'config', 'docker-compose', 'kubernetes'],
  markdown: ['markdown', 'md', 'readme', 'documentation'],
  jsx: ['jsx', 'react component', 'react element'],
  tsx: ['tsx', 'typescript react', 'react typescript'],
  vue: ['vue', 'vuejs', 'vue component', 'nuxt'],
  shell: ['bash', 'shell', 'terminal', 'command line', 'script', 'sh'],
  powershell: ['powershell', 'ps1', 'windows script', 'cmdlet'],
}

// File extensions mapping
const FILE_EXTENSIONS: Record<string, string> = {
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.jsx': 'jsx',
  '.py': 'python',
  '.java': 'java',
  '.cs': 'csharp',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.c': 'c',
  '.h': 'c',
  '.hpp': 'cpp',
  '.rs': 'rust',
  '.go': 'go',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.sql': 'sql',
  '.sol': 'solidity',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.json': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.vue': 'vue',
  '.sh': 'shell',
  '.bash': 'shell',
  '.ps1': 'powershell',
}

/**
 * Detect programming language from content and optional prompt
 */
export function detectLanguage(content: string, prompt?: string): string {
  // First, check the prompt for explicit language mentions
  if (prompt) {
    const lowerPrompt = prompt.toLowerCase()
    
    // Check for file extensions in prompt
    const extensionMatch = lowerPrompt.match(/\.(js|ts|py|java|cs|cpp|c|rs|go|swift|kt|rb|php|sql|sol|html|css|json|yaml|yml|md|vue|sh|ps1)\b/)
    if (extensionMatch) {
      const ext = `.${extensionMatch[1]}`
      const lang = FILE_EXTENSIONS[ext]
      if (lang) return lang
    }
    
    // Check for language keywords
    for (const [lang, keywords] of Object.entries(PROMPT_KEYWORDS)) {
      if (keywords.some(keyword => lowerPrompt.includes(keyword))) {
        return lang
      }
    }
  }
  
  // Then analyze the content patterns
  let bestMatch = { language: 'plaintext', score: 0 }
  
  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const matches = content.match(pattern)
    if (matches) {
      const score = matches.length
      if (score > bestMatch.score) {
        bestMatch = { language: lang, score }
      }
    }
  }
  
  // Special case: JSX vs JavaScript
  if (bestMatch.language === 'javascript' && /<\w+/.test(content)) {
    // Check if it's actually JSX
    if (/return\s*\(?\s*</.test(content) || /className=/.test(content)) {
      return 'jsx'
    }
  }
  
  // Special case: TSX vs TypeScript
  if (bestMatch.language === 'typescript' && /<\w+/.test(content)) {
    // Check if it's actually TSX
    if (/return\s*\(?\s*</.test(content) || /:\s*React\.FC/.test(content)) {
      return 'tsx'
    }
  }
  
  return bestMatch.language
}

/**
 * Get language from file extension
 */
export function getLanguageFromExtension(filename: string): string {
  const ext = filename.match(/\.[^.]+$/)?.[0]
  return ext ? FILE_EXTENSIONS[ext] || 'plaintext' : 'plaintext'
}

/**
 * Get file extension for a language
 */
export function getExtensionForLanguage(language: string): string {
  // Find the first extension that maps to this language
  for (const [ext, lang] of Object.entries(FILE_EXTENSIONS)) {
    if (lang === language) {
      return ext
    }
  }
  return '.txt'
}

/**
 * Check if a language supports syntax highlighting
 */
export function supportsSyntaxHighlighting(language: string): boolean {
  return language in LANGUAGE_PATTERNS && language !== 'plaintext'
} 