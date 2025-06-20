import { EventEmitter } from 'events'
import PQueue from 'p-queue'
import { v4 as uuidv4 } from 'uuid';

// We'll define a more structured error type later
export interface CheckResult {
  id: string;
  errors: any[];
}

export class CheckOrchestrator extends EventEmitter {
  private worker: Worker;
  private checkQueue: PQueue;

  constructor() {
    super();
    console.log('[CheckOrchestrator] Creating worker...');
    
    try {
      this.worker = new Worker('/grammar-worker.js');
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

    this.worker.addEventListener('message', this.handleWorkerMessage.bind(this));
    this.worker.addEventListener('error', (error) => {
      console.error('[CheckOrchestrator] Worker error:', error);
    });
    
    console.log('[CheckOrchestrator] Initialization complete');
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, id, errors } = event.data;
    console.log(`[CheckOrchestrator] Received worker message:`, { type, id, errorsCount: errors?.length });
    
    if (type === 'result') {
      console.log(`[CheckOrchestrator] Emitting results for ${id}:`, errors);
      this.emit('results', { id, errors });
    } else if (type === 'error') {
      console.error(`[CheckOrchestrator] Worker error for check ${id}:`, event.data.error);
    } else if (type === 'ready') {
      console.log('[CheckOrchestrator] Worker is ready');
    } else {
      console.log(`[CheckOrchestrator] Unknown message type:`, type, event.data);
    }
  }

  public check(text: string): string {
    const checkId = uuidv4();
    console.log(`[CheckOrchestrator] Queuing check ${checkId} for text:`, text.substring(0, 50) + '...');
    console.log(`[CheckOrchestrator] Queue size before add:`, this.checkQueue.size, 'pending:', this.checkQueue.pending);
    
    this.checkQueue.add(async () => {
      console.log(`[CheckOrchestrator] Executing check ${checkId} - sending to worker`);
      this.worker.postMessage({ type: 'check', id: checkId, text });
      console.log(`[CheckOrchestrator] Message sent to worker for ${checkId}`);
    }).then(() => {
      console.log(`[CheckOrchestrator] Queue task completed for ${checkId}`);
    }).catch((error) => {
      console.error(`[CheckOrchestrator] Queue task failed for ${checkId}:`, error);
    });
    
    console.log(`[CheckOrchestrator] Queue size after add:`, this.checkQueue.size, 'pending:', this.checkQueue.pending);
    return checkId;
  }

  public destroy() {
    this.worker.terminate();
    this.checkQueue.clear();
    this.removeAllListeners();
  }
} 