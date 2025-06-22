/**
 * BlockDebugger - Development utilities for block editor debugging
 * 
 * Provides visual debugging tools for hover zones, block structure,
 * and drag-and-drop operations. Only active in development mode.
 * 
 * Usage in console: window.blockDebugger.enable()
 */

export interface DebugMetrics {
  hoverEvents: number;
  dragOperations: number;
  blockCount: number;
  lastUpdate: Date;
}

export class BlockDebugger {
  private static instance: BlockDebugger;
  private enabled: boolean;
  private metrics: DebugMetrics;
  private visualMode: boolean = false;
  private logLevel: 'verbose' | 'normal' | 'quiet' = 'normal';

  private constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
    this.metrics = {
      hoverEvents: 0,
      dragOperations: 0,
      blockCount: 0,
      lastUpdate: new Date()
    };
  }

  static getInstance(): BlockDebugger {
    if (!BlockDebugger.instance) {
      BlockDebugger.instance = new BlockDebugger();
    }
    return BlockDebugger.instance;
  }

  // --- Public API ---

  enable(): void {
    this.enabled = true;
    this.log('BlockDebugger enabled');
  }

  disable(): void {
    this.enabled = false;
    this.removeVisualDebug();
    this.log('BlockDebugger disabled');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setLogLevel(level: 'verbose' | 'normal' | 'quiet'): void {
    this.logLevel = level;
  }

  // --- Visual Debugging ---

  toggleVisualDebug(): void {
    this.visualMode = !this.visualMode;
    if (this.visualMode) {
      this.showHoverZones();
    } else {
      this.removeVisualDebug();
    }
  }

  showHoverZones(): void {
    if (!this.enabled) return;

    const style = document.createElement('style');
    style.id = 'block-debug-styles';
    style.textContent = `
      .hover-target {
        background: rgba(255, 0, 0, 0.1) !important;
        border: 1px dashed red !important;
      }
      .block-wrapper {
        position: relative;
        border: 1px dotted blue !important;
      }
      .block-wrapper::before {
        content: attr(data-block-id);
        position: absolute;
        top: -20px;
        left: 0;
        font-size: 10px;
        background: blue;
        color: white;
        padding: 2px 4px;
        border-radius: 2px;
        z-index: 10000;
      }
      .drop-indicator {
        background: rgba(0, 255, 0, 0.5) !important;
        height: 4px !important;
      }
    `;
    document.head.appendChild(style);
    this.log('Visual debug mode enabled - hover zones visible');
  }

  removeVisualDebug(): void {
    const style = document.getElementById('block-debug-styles');
    if (style) {
      style.remove();
      this.log('Visual debug mode disabled');
    }
  }

  // --- Block Structure Logging ---

  logBlockStructure(): void {
    if (!this.enabled) return;

    const blocks = document.querySelectorAll('.block-wrapper');
    const structure = Array.from(blocks).map((block, index) => ({
      index,
      id: block.getAttribute('data-block-id') || 'unknown',
      type: block.getAttribute('data-block-type') || 'unknown',
      position: block.getAttribute('data-block-pos') || 'unknown',
      dimensions: {
        width: (block as HTMLElement).offsetWidth,
        height: (block as HTMLElement).offsetHeight,
        top: (block as HTMLElement).offsetTop,
        left: (block as HTMLElement).offsetLeft
      },
      hasHandle: !!block.querySelector('.block-handle'),
      isVisible: (block as HTMLElement).offsetParent !== null
    }));

    console.group('🔍 Block Structure');
    console.table(structure);
    console.groupEnd();

    this.metrics.blockCount = blocks.length;
    this.metrics.lastUpdate = new Date();
  }

  // --- Drag State Monitoring ---

  logDragStart(blockId: string, position: number): void {
    if (!this.enabled || this.logLevel === 'quiet') return;
    
    this.metrics.dragOperations++;
    console.log(`🎯 Drag Start: Block ${blockId} at position ${position}`);
  }

  logDragOver(event: DragEvent, targetPos: number | null): void {
    if (!this.enabled || this.logLevel !== 'verbose') return;
    
    console.log(`📍 Drag Over: Target position ${targetPos}`, {
      clientX: event.clientX,
      clientY: event.clientY
    });
  }

  logDrop(sourcePos: number, targetPos: number): void {
    if (!this.enabled || this.logLevel === 'quiet') return;
    
    console.log(`✅ Drop: Block moved from ${sourcePos} to ${targetPos}`);
  }

  // --- Hover Detection Monitoring ---

  logHoverEnter(blockId: string): void {
    if (!this.enabled || this.logLevel !== 'verbose') return;
    
    this.metrics.hoverEvents++;
    console.log(`👆 Hover Enter: Block ${blockId}`);
  }

  logHoverLeave(blockId: string): void {
    if (!this.enabled || this.logLevel !== 'verbose') return;
    
    console.log(`👇 Hover Leave: Block ${blockId}`);
  }

  // --- Performance Monitoring ---

  measurePerformance<T>(operation: string, fn: () => T): T {
    if (!this.enabled || this.logLevel === 'quiet') {
      return fn();
    }

    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;

    if (duration > 16.67) { // Longer than one frame (60fps)
      console.warn(`⚠️ Slow operation "${operation}": ${duration.toFixed(2)}ms`);
    } else if (this.logLevel === 'verbose') {
      console.log(`⏱️ Operation "${operation}": ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  // --- Metrics ---

  getMetrics(): DebugMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      hoverEvents: 0,
      dragOperations: 0,
      blockCount: 0,
      lastUpdate: new Date()
    };
    this.log('Metrics reset');
  }

  // --- Container Validation ---

  validateContainer(container: HTMLElement | null): void {
    if (!this.enabled) return;

    console.group('🏗️ Container Validation');
    
    if (!container) {
      console.error('❌ Container is null');
      console.groupEnd();
      return;
    }

    const rect = container.getBoundingClientRect();
    const computed = window.getComputedStyle(container);
    
    console.log('Container Info:', {
      className: container.className,
      id: container.id,
      dimensions: {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left
      },
      visibility: {
        display: computed.display,
        visibility: computed.visibility,
        opacity: computed.opacity,
        offsetParent: container.offsetParent ? 'exists' : 'null'
      },
      hasEditorWrapper: container.classList.contains('editor-wrapper')
    });

    if (rect.width === 0 || rect.height === 0) {
      console.warn('⚠️ Container has zero dimensions');
    }

    if (!container.offsetParent) {
      console.warn('⚠️ Container is not visible (offsetParent is null)');
    }

    console.groupEnd();
  }

  // --- Private Methods ---

  private log(message: string, ...args: any[]): void {
    if (this.enabled && this.logLevel !== 'quiet') {
      console.log(`[BlockDebugger] ${message}`, ...args);
    }
  }
}

// Export singleton instance for development console access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).blockDebugger = BlockDebugger.getInstance();
  console.log(
    '%c🔧 BlockDebugger available %c\nUsage: blockDebugger.enable() | blockDebugger.toggleVisualDebug() | blockDebugger.logBlockStructure()',
    'background: #4CAF50; color: white; padding: 2px 8px; border-radius: 3px;',
    'color: #666; font-family: monospace;'
  );
}

// Export for use in components
export const blockDebugger = BlockDebugger.getInstance(); 