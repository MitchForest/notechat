import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { EventEmitter } from 'events';
import StarterKit from '@tiptap/starter-kit';
import { CheckOrchestrator, CheckResult } from './CheckOrchestrator';
import { SpellCheckExtension } from './DecorationManager';
import { TextError } from '../workers/grammar.worker';
import { ErrorRegistry } from './ErrorRegistry';
import { ChangeDetector } from './ChangeDetector';
import { performanceMonitor } from './PerformanceMonitor';

export class EditorService extends EventEmitter {
  private _editor: Editor;
  private checkOrchestrator: CheckOrchestrator;
  private errorRegistry: ErrorRegistry;
  private changeDetector: ChangeDetector;

  constructor() {
    super();
    this.checkOrchestrator = new CheckOrchestrator();
    this.errorRegistry = new ErrorRegistry();
    this.changeDetector = new ChangeDetector();
    
    this._editor = new Editor({
      extensions: [
        StarterKit,
        SpellCheckExtension.configure({
          registry: this.errorRegistry,
        }),
      ],
      content: `<p>i cant spell gud. This is a testt of the spell checker.</p>`,
      editable: true,
      editorProps: {
        attributes: {
          class: "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[500px]",
          spellcheck: "false",
          autocorrect: 'off',
          autocapitalize: 'off',
          'data-gramm': 'false'
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

    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.editor.on('update', ({ editor, transaction }) => {
      this.emit('update');
      if (transaction.docChanged) {
        this.handleDocChange({ editor, transaction });
      }
    });

    this.checkOrchestrator.on('results', (result: CheckResult) => {
      if (this.editor && result.paragraphId) {
        this.errorRegistry.addConfirmed(result.paragraphId, result.errors as TextError[]);
        const timerId = performanceMonitor.startTimer('decorationUpdate');
        this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
        performanceMonitor.endTimer(timerId);
      }
    });
  }

  private handleDocChange({ editor, transaction }: { editor: Editor, transaction: any }) {
    const changeType = this.changeDetector.detectChangeType(transaction);
    if (changeType === 'paste') {
      return;
    }

    const changedParagraphs = new Map<number, { text: string; pos: number }>();
    
    transaction.steps.forEach((step: any) => {
      step.getMap().forEach((oldStart: any, oldEnd: any, newStart: any, newEnd: any) => {
        editor.state.doc.nodesBetween(newStart, newEnd, (node, pos) => {
          if (node.isTextblock) {
            changedParagraphs.set(pos, { text: node.textContent, pos });
          }
        });
      });
    });

    changedParagraphs.forEach(({ text, pos }) => {
      const paragraphId = `p-${pos}`;
      this.errorRegistry.clearParagraph(paragraphId);
      if (text.trim().length > 0) {
        this.checkOrchestrator.check(text, paragraphId);
      }
    });
    
    const timerId = performanceMonitor.startTimer('decorationUpdate');
    this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
    performanceMonitor.endTimer(timerId);
  }

  private handleBulkInsert(content: string, position: number, type: 'paste' | 'drop'): void {
    if (content.length > 500) {
      this.performProgressiveCheck(content, position);
    } else {
      this.checkOrchestrator.checkBulk(content, `p-${position}`);
    }
  }

  private async performProgressiveCheck(content: string, initialPosition: number): Promise<void> {
    const CHUNK_SIZE = 500;
    const chunks: string[] = [];

    for (let i = 0; i < content.length; i += CHUNK_SIZE) {
      chunks.push(content.substring(i, i + CHUNK_SIZE));
    }

    if (chunks.length > 0) {
      this.checkOrchestrator.checkBulk(chunks[0], `p-${initialPosition}`);
    }

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        const chunk = chunks[i];
        const chunkPosition = initialPosition + (i * CHUNK_SIZE);
        this.checkOrchestrator.checkBulk(chunk, `p-${chunkPosition}`);
      }, i * 150);
    }
  }
  
  public get editor(): Editor {
    if (!this._editor) {
      throw new Error("Editor not initialized");
    }
    return this._editor;
  }

  public destroy() {
    this.checkOrchestrator.destroy();
    this.editor.destroy();
    this.removeAllListeners();
  }

  public clearErrors(): void {
    this.errorRegistry.clearAll();
    this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
  }
}