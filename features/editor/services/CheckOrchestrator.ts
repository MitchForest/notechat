import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import { v4 as uuidv4 } from 'uuid';
import { LRUCache } from 'lru-cache';
import { TextError } from '../workers/grammar.worker';
import { performanceMonitor } from './PerformanceMonitor';

// We'll define a more structured error type later
export interface CheckResult {
  id: string;
  paragraphId: string;
  errors: TextError[];
  range?: { from: number; to: number };
}

export class CheckOrchestrator extends EventEmitter {
  private worker: Worker;
  private checkQueue: PQueue;
  private pendingChecks = new Map<string, { resolver: (result: CheckResult) => void; timerId: string }>();

  private checkedWords = new Set<string>();

  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    totalChecks: 0,
  };

  private paragraphCache = new LRUCache<string, TextError[]>({
    max: 500, // Cache up to 500 paragraphs
    ttl: 1000 * 60 * 10, // 10-minute time-to-live
  });

  constructor() {
    super();
    console.log('[CheckOrchestrator] Creating worker...');
    
    try {
      this.worker = new Worker(
        new URL('../workers/grammar.worker.ts', import.meta.url),
        { type: 'module' }
      );
      console.log('[CheckOrchestrator] Worker created successfully');
    } catch (error) {
      console.error('[CheckOrchestrator] Failed to create worker:', error);
      throw error;
    }
    
    this.checkQueue = new PQueue({ concurrency: 1 });
    console.log('[CheckOrchestrator] Queue created');

    console.log('[CheckOrchestrator] Sending init message to worker...');
    this.worker.postMessage({
      type: 'init',
      baseUrl: window.location.origin,
    });

    if (!this.worker) return;

    this.worker.onmessage = this.handleWorkerMessage.bind(this);
    this.worker.addEventListener('error', (error) => {
      console.error('[CheckOrchestrator] Worker error:', error);
    });
    
    // Periodically log performance stats to the console.
    setInterval(() => {
      performanceMonitor.logReport();
    }, 30000); // every 30 seconds

    console.log('[CheckOrchestrator] Initialization complete');
  }

  private handleWorkerMessage(event: MessageEvent) {
    console.log('[CheckOrchestrator] Received message from worker:', event.data);
    const { type, id, errors, paragraphId, range } = event.data;

    if (type === 'result') {
      const pending = this.pendingChecks.get(id);
      if (pending) {
        console.log(`[DEBUG] CheckOrchestrator: Resolving pending check`);
        performanceMonitor.endTimer(pending.timerId);
        pending.resolver({ id, errors, paragraphId, range });
        this.pendingChecks.delete(id);
        
        // THIS IS CRITICAL - Make sure this happens!
        console.log(`[DEBUG] CheckOrchestrator: Emitting results event`);
        this.emit('results', { id, errors, paragraphId, range });
      } else {
        console.warn(`[DEBUG] CheckOrchestrator: No pending check found for ${id}`);
      }
    } else if (type === 'error') {
      console.error(`[DEBUG] CheckOrchestrator: Worker error:`, event.data);
    } else if (type === 'ready') {
      console.log('[DEBUG] CheckOrchestrator: Worker is ready');
      this.emit('ready');
    }
  }

  private quickHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = (hash << 5) - hash + text.charCodeAt(i);
        hash |= 0; // Ensure 32-bit integer
    }
    return hash.toString(36);
  }

  private getCacheHitRate(): string {
    if (this.stats.totalChecks === 0) {
      return "0.0%";
    }
    const rate = (this.stats.cacheHits / this.stats.totalChecks) * 100;
    return `${rate.toFixed(1)}%`;
  }

  private extractWords(text: string): string[] {
    return text.match(/\b\w+\b/g) || [];
  }

  /**
   * Sends text to the worker for checking. It will not check if the text is in the cache.
   */
  public check(text: string, paragraphId: string, options?: { scope?: 'word' | 'sentence' | 'paragraph', range?: { from: number, to: number } }): void {
    console.log(`[CheckOrchestrator] Received check request. Paragraph: ${paragraphId}, Scope: ${options?.scope}`);
    const cacheKey = this.quickHash(text);
    const cachedErrors = this.paragraphCache.get(cacheKey);

    if (cachedErrors) {
      performanceMonitor.recordCacheHit();
      this.emit('results', { id: 'cached', paragraphId, errors: cachedErrors });
      return;
    }

    performanceMonitor.recordCacheMiss();
    
    const checkId = uuidv4();
    const timerId = performanceMonitor.startTimer('check_request');

    console.log(`[CheckOrchestrator] Posting message to worker. Check ID: ${checkId}`);
    this.checkQueue.add(async () => {
      const result = await new Promise<CheckResult>((resolve) => {
        this.pendingChecks.set(checkId, { resolver: resolve, timerId });
        this.worker.postMessage({
          type: 'check',
          id: checkId,
          text: text,
          paragraphId: paragraphId,
          scope: options?.scope || 'paragraph',
          range: options?.range,
        });
      });

      // Add the newly checked words to our set for future deduplication.
      const wordsInParagraph = this.extractWords(text);
      wordsInParagraph.forEach(word => this.checkedWords.add(word.toLowerCase()));

      // Cache the result for next time
      this.paragraphCache.set(cacheKey, result.errors);
      
      this.emit('results', result);
    }).catch((error) => {
      console.error(`[CheckOrchestrator] Queue task failed for ${checkId}:`, error);
    });
  }

  public async checkBulk(text: string, paragraphId: string): Promise<void> {
    const words = this.extractWords(text);
    const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
    const wordsToCheck = uniqueWords.filter(word => !this.checkedWords.has(word));

    if (wordsToCheck.length === 0) {
      console.log('[CheckOrchestrator] Bulk check skipped, all words already checked.');
      return;
    }
    
    // For simplicity, we'll send unique words as a single block.
    // A more advanced implementation could batch them.
    const textToCheck = wordsToCheck.join(' ');
    const checkId = uuidv4();

    this.checkQueue.add(async () => {
      const result = await new Promise<CheckResult>((resolve) => {
        const timerId = performanceMonitor.startTimer('workerBulkCheck');
        this.pendingChecks.set(checkId, { resolver: resolve, timerId });
        // We send a special 'checkBulk' type to the worker.
        this.worker.postMessage({ type: 'check', id: checkId, text: textToCheck, paragraphId });
      });

      // Since the worker returns errors for the concatenated string of unique words,
      // we need to map these errors back to their original positions in the full text.
      const mappedErrors = this.mapBulkErrors(result.errors, text);

      // Add newly checked words to our global set
      wordsToCheck.forEach(word => this.checkedWords.add(word));

      this.emit('results', { ...result, errors: mappedErrors });

    }).catch((error) => {
      console.error(`[CheckOrchestrator] Queue task failed for bulk check ${checkId}:`, error);
    });
  }

  private mapBulkErrors(errors: TextError[], originalText: string): TextError[] {
    const mapped: TextError[] = [];
    const lowerCaseText = originalText.toLowerCase();

    errors.forEach(error => {
      // The worker now tells us exactly which word was flagged.
      const errorWord = error.word.toLowerCase();
      let matchIndex = lowerCaseText.indexOf(errorWord);

      while (matchIndex !== -1) {
        mapped.push({
          ...error,
          start: matchIndex,
          end: matchIndex + errorWord.length,
        });
        matchIndex = lowerCaseText.indexOf(errorWord, matchIndex + 1);
      }
    });

    return mapped;
  }

  public destroy() {
    this.worker.terminate();
    this.checkQueue.clear();
    this.pendingChecks.clear();
    this.paragraphCache.clear();
    this.removeAllListeners();
  }
} 