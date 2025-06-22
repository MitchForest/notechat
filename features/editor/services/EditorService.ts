import { Editor as TiptapEditor, Extension } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EventEmitter } from 'events';
import { CheckOrchestrator, CheckResult } from './CheckOrchestrator';
import { ErrorRegistry } from './ErrorRegistry';
import { ChangeDetector } from './ChangeDetector';
import { PerformanceMonitor } from './PerformanceMonitor';
import { debounce } from 'lodash';
import { getEditorExtensions } from '../config/extensions';
import { TextError } from '../workers/grammar.worker';
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { StarterKit } from '@tiptap/starter-kit'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TrailingNode } from '../extensions/trailing-node'
import { SlashCommand } from '../extensions/slash-command'
import { SpellCheckExtension } from '../services/SpellCheckExtension'
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const lowlight = createLowlight(common)

const performanceMonitor = new PerformanceMonitor();

export class EditorService extends EventEmitter {
  private _editor: TiptapEditor;
  private checkOrchestrator: CheckOrchestrator;
  private errorRegistry: ErrorRegistry;
  private changeDetector: ChangeDetector;
  private container: HTMLElement;
  private debouncedCheck: (text: string, paragraphId: string, range: { from: number; to: number }) => void;
  private debouncedOnUpdate: (args: { editor: TiptapEditor, transaction: any }) => void;

  constructor(
    container: HTMLElement, 
    customExtensions: Extension[] = []
  ) {
    super();
    
    // Validate container
    if (!container) {
      throw new Error(
        'EditorService requires a valid container element. ' +
        'Ensure the component is mounted before initializing the editor.'
      );
    }
    
    // Check if container is visible
    if (!container.offsetParent) {
      console.warn(
        'EditorService: Container element is not visible. ' +
        'This may cause layout issues with block handles.'
      );
    }
    
    // Validate container dimensions
    this.validateContainer(container);
    
    // Store container reference
    this.container = container;
    
    this.errorRegistry = new ErrorRegistry();
    this.changeDetector = new ChangeDetector();
    
    this.debouncedCheck = debounce((text: string, paragraphId: string, range: { from: number; to: number }) => {
      if (text.trim().length === 0) {
        this.errorRegistry.clearParagraph(paragraphId);
      } else {
        this.checkOrchestrator.check(text, paragraphId, { scope: 'paragraph', range });
      }
    }, 300);

    this.debouncedOnUpdate = debounce(({ editor, transaction }) => {
      this.emit('update');
      if (transaction.docChanged) {
        this.handleDocChange({ editor, transaction });
      } else {
        this.handleBoundaryCheck({ editor, transaction });
      }
    }, 300);

    const baseExtensions = getEditorExtensions(this.errorRegistry, container);

    this._editor = new TiptapEditor({
      extensions: [...baseExtensions, ...customExtensions],
      content: `<p></p>`,
      editable: true,
      editorProps: {
        attributes: {
          class: "focus:outline-none min-h-[500px] px-8 py-4 selection:bg-primary/20",
          spellcheck: "false",
          autocorrect: 'off',
          autocapitalize: 'off',
          'data-gramm': 'false'
        },
        clipboardTextSerializer: slice => {
          return slice.content.textBetween(0, slice.content.size, '\n\n');
        },
        transformPastedHTML: html => {
          // Basic sanitization
          return html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, '');
        },
        handlePaste: (view, event, slice) => {
          let textContent = '';
          slice.content.forEach(node => {
            textContent += node.textContent;
          });

          if (textContent.length > 100) {
            this.handleBulkInsert(textContent, view.state.selection.from, 'paste');
          }
          return false;
        },
        handleDrop: (view, event, slice) => {
          let textContent = '';
          slice.content.forEach(node => {
            textContent += node.textContent;
          });

          if (textContent.length > 100) {
            this.handleBulkInsert(textContent, view.state.selection.from, 'drop');
          }
          return false;
        },
      },
    });

    // --- NEW DEBUG VERIFICATION ---
    console.log('=== EXTENSION DEBUG ===');
    this._editor.extensionManager.extensions.forEach(ext => {
      const anyExt = ext as any;
      if (anyExt.config.addInputRules) {
        const rules = anyExt.config.addInputRules.call(anyExt);
        if (rules.length > 0) {
          console.log(`Extension: ${anyExt.name}, Input rules: ${rules.length}`);
        }
      }
    });
    // --- END NEW DEBUG VERIFICATION ---

    // Debug: Check for drag handle extension
    console.log('[EditorService] Checking for drag handle extension...');
    const dragHandleExt = this._editor.extensionManager.extensions.find(ext => ext.name === 'globalDragHandle');
    console.log('[EditorService] Drag handle extension loaded:', !!dragHandleExt);
    
    if (dragHandleExt) {
      console.log('[EditorService] Drag handle config:', (dragHandleExt as any).options);
      
      // Check DOM after editor is ready
      setTimeout(() => {
        const dragHandle = document.querySelector('.drag-handle');
        console.log('[EditorService] Drag handle in DOM:', !!dragHandle);
        
        if (dragHandle) {
          console.log('[EditorService] Drag handle element:', dragHandle);
          const styles = window.getComputedStyle(dragHandle);
          console.log('[EditorService] Drag handle computed styles:', {
            position: styles.position,
            opacity: styles.opacity,
            display: styles.display,
            zIndex: styles.zIndex,
            left: styles.left,
            top: styles.top,
            width: styles.width,
            height: styles.height
          });
        } else {
          // Try to find any elements that might be the drag handle
          const allElements = document.querySelectorAll('[data-drag-handle], [draggable="true"]');
          console.log('[EditorService] Found draggable elements:', allElements.length);
          allElements.forEach((el, i) => {
            console.log(`[EditorService] Draggable element ${i}:`, el);
          });
        }
      }, 1000);
    }

    this.checkOrchestrator = new CheckOrchestrator();

    this.setupEventListeners();
  }

  private validateContainer(container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      throw new Error(
        'EditorService: Container has zero dimensions. ' +
        'The editor requires a container with defined width and height.'
      );
    }
  }

  private setupEventListeners() {
    this.editor.on('transaction', ({ editor, transaction }) => {
      if (!transaction.docChanged) return;
      
      const timerId = performanceMonitor.startTimer('change_detection');
      const changedParagraphs = this.changeDetector.getChangedParagraphs(editor.state.doc, transaction);
      performanceMonitor.endTimer(timerId);

      changedParagraphs.forEach(p => {
        if (p.node) {
          this.debouncedCheck(p.text, p.id, { from: p.pos, to: p.pos + p.node.nodeSize });
        }
      });
    });

    this.editor.on('update', ({ editor, transaction }) => {
      this.debouncedOnUpdate({ editor, transaction });
    });

    this.editor.on('update', () => {
      const json = this._editor.getJSON();
      console.log('Document structure:', json);
    });

    this.checkOrchestrator.on('results', (result: CheckResult) => this.onResults(result));

    // Wait for the orchestrator to be ready before running the initial check
    this.checkOrchestrator.on('ready', () => {
      this.initialCheck();
    });
  }

  private initialCheck() {
    this.editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'paragraph') {
        const paragraphId = `p-${pos}`;
        const text = node.textContent;
        if (text.trim().length > 0) {
          this.checkOrchestrator.check(text, paragraphId, {
            scope: 'paragraph',
            range: { from: pos, to: pos + node.nodeSize },
          });
        }
      }
    });
  }

  private handleDocChange({ editor, transaction }: { editor: TiptapEditor; transaction: any }) {
    const changedParagraphs = this.changeDetector.getChangedParagraphs(editor.state.doc, transaction);
    changedParagraphs.forEach((p: { id: string, text: string, pos: number, node: ProseMirrorNode }) => {
      if (p.node) {
        this.debouncedCheck(p.text, p.id, { from: p.pos, to: p.pos + p.node.nodeSize });
      }
    });
  }

  private requestCheck(text: string, paragraphId: string, range: { from: number; to: number }) {
    this.errorRegistry.clearParagraph(paragraphId);
    if (text.trim().length > 0) {
      this.checkOrchestrator.check(text, paragraphId, { scope: 'paragraph', range });
    }
    
    // We still want to clear decorations instantly so they don't linger.
    const timerId = performanceMonitor.startTimer('decorationUpdate');
    this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
    performanceMonitor.endTimer(timerId);
  }

  private handleBoundaryCheck({ editor, transaction }: { editor: TiptapEditor, transaction: any }) {
    if (!transaction.selection.empty) return;
  
    const { from } = transaction.selection;
    const charBefore = editor.state.doc.textBetween(from - 1, from, '\n');
    
    let checkScope: 'word' | 'sentence' | null = null;
    let textToCheck: { text: string; from: number; to: number } | null = null;
    
    if (/[.!?]/.test(charBefore)) {
      checkScope = 'sentence';
      // For sentences, the boundary is the punctuation itself, plus any preceding punctuation.
      textToCheck = this.extractTextBefore(editor.state.doc, from -1, /[.!?]/);
    } else if (/\s/.test(charBefore)) {
      checkScope = 'word';
      textToCheck = this.extractTextBefore(editor.state.doc, from - 1, /\s/);
    }

    if (checkScope && textToCheck) {
      const paragraphInfo = this.findParagraph(textToCheck.from);
      if (paragraphInfo) {
        this.checkOrchestrator.check(textToCheck.text, paragraphInfo.paragraphId, { scope: checkScope, range: textToCheck });
      }
    }
  }

  private extractTextBefore(doc: ProseMirrorNode, position: number, boundary: RegExp): { text: string; from: number; to: number } | null {
    let to = position;
    let from = position;
    let char = doc.textBetween(from - 1, from);
  
    // Scan backwards to find the start of the text segment
    while (char && !boundary.test(char)) {
      from--;
      char = doc.textBetween(from - 1, from);
    }
  
    // Adjust 'from' to be after the boundary if found, for sentence extraction
    if (boundary.source.includes('[.!?]')) {
      if (boundary.test(char)) {
        from++;
      }
    }

    const extractedText = doc.textBetween(from, to).trim();
    if (extractedText.length === 0) return null;
    
    return { text: extractedText, from, to };
  }

  private handleBulkInsert(content: string, position: number, type: 'paste' | 'drop'): void {
    if (content.length > 500) {
      this.checkBulk(content, position);
    }
  }

  private checkBulk(text: string, startPosition: number): void {
    console.log(`[EditorService] Starting bulk check for content of length ${text.length} at position ${startPosition}`);
    const timerId = performanceMonitor.startTimer('bulk_check');

    const chunks = this.splitIntoParagraphs(text);

    this.performProgressiveCheck(chunks, startPosition, () => {
      console.log(`[EditorService] Completed progressive bulk check.`);
      performanceMonitor.endTimer(timerId);
      this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
    });
  }

  private performProgressiveCheck(chunks: string[], positionOffset: number, onComplete: () => void): void {
    if (chunks.length === 0) {
      onComplete();
      return;
    }

    const chunk = chunks.shift() as string;
    
    // Find the paragraph node at the current position
    const paragraphInfo = this.findParagraph(positionOffset);
    if (paragraphInfo) {
      console.log(`[EditorService] Progressively checking chunk for paragraph ${paragraphInfo.paragraphId}`);
      this.checkOrchestrator.check(chunk, paragraphInfo.paragraphId, { scope: 'paragraph' });
    }

    // Schedule the next check
    setTimeout(() => {
      const nextPosition = positionOffset + chunk.length + 1; // +1 for the newline character.
      this.performProgressiveCheck(chunks, nextPosition, onComplete);
    }, 50); // Small delay to keep UI responsive.
  }

  /**
   * Splits a large block of text into an array of its constituent paragraphs.
   */
  private splitIntoParagraphs(text: string): string[] {
    return text.split(/\n+/).filter(p => p.trim().length > 0);
  }

  public get editor(): TiptapEditor {
    if (!this._editor) {
      throw new Error("Editor not initialized");
    }
    return this._editor;
  }

  public destroy(): void {
    this.checkOrchestrator.destroy();
    this.editor.destroy();
    this.removeAllListeners();
  }

  public clearErrors(): void {
    this.errorRegistry.clearAll();
    this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
  }

  private findParagraph(position: number): { node: ProseMirrorNode, paragraphId: string, text: string, startPos: number } | null {
    let result: { node: ProseMirrorNode, paragraphId: string, text: string, startPos: number } | null = null;
    this.editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'paragraph') {
            const start = pos;
            const end = pos + node.nodeSize;
            if (position >= start && position <= end) {
                result = {
                    node,
                    paragraphId: `p-${pos}`,
                    text: node.textContent,
                    startPos: pos,
                };
                return false; // stop iterating
            }
        }
        return !result;
    });
    return result;
  }

  private onResults(result: CheckResult): void {
    const { id, errors, paragraphId, range } = result;
    if (!this.editor || !paragraphId || !range) {
      return;
    }
    const timerId = performanceMonitor.startTimer('onResults');

    // The worker returns errors with positions relative to the checked text.
    // We must convert them to absolute document positions before storing them.
    const absoluteErrors = errors.map(error => ({
      ...error,
      start: error.start + range.from,
      end: error.end + range.from,
    }));

    this.errorRegistry.updateErrorsForRange(paragraphId, absoluteErrors as TextError[], range);

    this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
    performanceMonitor.endTimer(timerId);
  }
}