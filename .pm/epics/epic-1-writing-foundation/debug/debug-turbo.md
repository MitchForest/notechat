Summary
The issue is that Turbopack throws error TP1001 new Worker(...) is not statically analyse-able Stack OverflowGitHub when trying to create Web Workers with dynamic URLs. This is because webpack (and Turbopack) cannot analyse the syntax statically when using variables in the Worker constructor Web Workers | webpack - JS.ORG.
The Solution
Use the new URL() pattern with import.meta.url and a relative path:
typescript// ✅ CORRECT - Turbopack can statically analyze this
this.worker = new Worker(
  new URL('../workers/grammar.worker.ts', import.meta.url),
  { type: 'module' }
)

// ❌ WRONG - These patterns cause TP1001 error
new Worker('/grammar-worker.js')
new Worker(workerUrl) // where workerUrl is a variable
Key Requirements:

Move worker from public/ to source directory (e.g., features/editor/workers/)
Use relative path in new URL()
Include import.meta.url as the second parameter
Add { type: 'module' } for ES modules support

Why This Works:
The webpack documentation shows that using new URL('./path/to/worker.js', import.meta.url) is the correct pattern for Web Workers, as it allows static analysis Web Workers | webpack - JS.ORG. Turbopack follows the same pattern.
Important Notes:

Some users report that "disabling turbopack fixed it for me" Typescript error TP1001 when creating a Web Worker in Next.js 15.0.2 with Stockfish chess engine - Stack Overflow, but this isn't necessary with the correct pattern
The issue affects Next.js 15 with Turbopack and is being tracked by the Turbopack team Typescript error TP1001 when creating a Web Worker in Next.js 15.1.3 · Issue #74621 · vercel/next.js
The worker will still function despite the warning, but fixing it provides a cleaner development experience

This solution eliminates the TP1001 warning while maintaining full Turbopack compatibility and performance benefits.

// SOLUTION: Turbopack-Compatible Web Worker Implementation

// Option 1: Move Worker to Source Directory with Proper Import
// ============================================================

// Step 1: Move your worker from public/ to the source directory
// Move: public/grammar-worker.js → features/editor/workers/grammar.worker.ts

// Step 2: Update CheckOrchestrator.ts to use import.meta.url pattern
// features/editor/services/CheckOrchestrator.ts
import { EventEmitter } from 'events'

export class CheckOrchestrator extends EventEmitter {
  private worker: Worker | null = null
  private initializationPromise: Promise<void>

  constructor() {
    super()
    this.initializationPromise = this.initializeWorker()
  }

  private async initializeWorker(): Promise<void> {
    try {
      // SOLUTION: Use new URL with import.meta.url and relative path
      // This is the pattern Turbopack can statically analyze
      this.worker = new Worker(
        new URL('../workers/grammar.worker.ts', import.meta.url),
        { type: 'module' }
      )
      
      // Set up message handlers
      this.worker.onmessage = this.handleWorkerMessage.bind(this)
      this.worker.onerror = this.handleWorkerError.bind(this)
      
      // Initialize the worker
      await this.sendInitMessage()
      
      console.log('[CheckOrchestrator] Worker initialized successfully')
    } catch (error) {
      console.error('[CheckOrchestrator] Failed to initialize worker:', error)
      throw error
    }
  }
  
  // ... rest of the implementation
}

// Option 2: Use a Worker Wrapper Pattern (if Option 1 doesn't work)
// =================================================================

// features/editor/workers/worker-loader.ts
export function createGrammarWorker(): Worker {
  // This pattern helps Turbopack analyze the worker statically
  return new Worker(
    new URL('./grammar.worker.ts', import.meta.url),
    { type: 'module' }
  )
}

// Then in CheckOrchestrator.ts:
import { createGrammarWorker } from '../workers/worker-loader'

export class CheckOrchestrator extends EventEmitter {
  private async initializeWorker(): Promise<void> {
    try {
      this.worker = createGrammarWorker()
      // ... rest of initialization
    } catch (error) {
      console.error('[CheckOrchestrator] Failed to initialize worker:', error)
      throw error
    }
  }
}

// Option 3: Configure Turbopack to Handle Worker Files
// ====================================================

// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // Tell Turbopack how to handle worker files
        '*.worker.ts': {
          loaders: ['@/lib/worker-loader'],
          as: '*.js',
        },
      },
    },
  },
  
  // Alternative: Use webpack config for workers (fallback)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.module.rules.push({
        test: /\.worker\.ts$/,
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
          publicPath: '/_next/',
        },
      })
    }
    return config
  },
}

export default nextConfig

// Option 4: Inline Worker with Blob URL (Workaround)
// ==================================================

// features/editor/workers/grammar-worker-inline.ts
// This approach bundles the worker code inline and creates a blob URL

const workerCode = `
// Your entire worker code as a string
import { unified } from 'unified'
// ... rest of your worker code

self.addEventListener('message', async (event) => {
  // ... your message handler
})
`

export function createInlineWorker(): Worker {
  const blob = new Blob([workerCode], { type: 'application/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  return new Worker(workerUrl, { type: 'module' })
}

// Option 5: Dynamic Import Pattern (Next.js Specific)
// ===================================================

// features/editor/hooks/use-grammar-worker.ts
import { useEffect, useState } from 'react'

export function useGrammarWorker() {
  const [worker, setWorker] = useState<Worker | null>(null)
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    let mounted = true
    let workerInstance: Worker | null = null
    
    async function initWorker() {
      try {
        // Dynamic import to ensure client-side only
        if (typeof window !== 'undefined') {
          const GrammarWorker = (await import('../workers/grammar.worker.ts?worker')) as any
          workerInstance = new GrammarWorker()
          
          if (mounted) {
            setWorker(workerInstance)
            setIsReady(true)
          }
        }
      } catch (error) {
        console.error('Failed to initialize worker:', error)
      }
    }
    
    initWorker()
    
    return () => {
      mounted = false
      workerInstance?.terminate()
    }
  }, [])
  
  return { worker, isReady }
}

// RECOMMENDED SOLUTION: Option 1 with TypeScript Types
// ====================================================

// features/editor/workers/grammar.worker.ts
// Ensure your worker file uses ES modules syntax

/// <reference lib="webworker" />
declare const self: DedicatedWorkerGlobalScope

import { unified } from 'unified'
import retextEnglish from 'retext-english'
// ... other imports

// Your worker implementation
self.addEventListener('message', async (event) => {
  const { type, payload, id } = event.data
  
  switch (type) {
    case 'init':
      // ... initialization logic
      self.postMessage({ type: 'initialized', id })
      break
      
    case 'check':
      // ... checking logic
      self.postMessage({ type: 'checkResult', payload: result, id })
      break
  }
})

// Export empty object to make it a module
export {}

// Additional: Package.json Script Update
// =====================================

// If issues persist, you can temporarily disable Turbopack warnings
// package.json
{
  "scripts": {
    // For development with less strict checking
    "dev": "NEXT_TURBOPACK_WARNING=false next dev --turbo",
    
    // Or use webpack for now if Turbopack issues persist
    "dev:webpack": "next dev",
    "dev:turbo": "next dev --turbo"
  }
}

// Testing Your Solution
// ====================

// Create a test file to verify the worker loads correctly
// __tests__/worker-loading.test.ts
import { CheckOrchestrator } from '@/features/editor/services/CheckOrchestrator'

describe('Worker Loading', () => {
  it('should create worker without Turbopack errors', async () => {
    const orchestrator = new CheckOrchestrator()
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Test worker communication
    const result = await orchestrator.checkText('test text')
    expect(result).toBeDefined()
  })
})