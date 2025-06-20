import { Editor } from '@tiptap/core'
import { EventEmitter } from 'events'
import StarterKit from '@tiptap/starter-kit'
import { CheckOrchestrator, CheckResult } from './CheckOrchestrator'
import { debounce } from 'lodash-es'
import { DecorationManager } from './DecorationManager'

export class EditorService extends EventEmitter {
  private _editor: Editor | null = null;
  private checkOrchestrator: CheckOrchestrator;
  private decorationManager: DecorationManager | null = null;

  constructor() {
    super();
    this.checkOrchestrator = new CheckOrchestrator();
    this.initializeEditor();
    
    // The DecorationManager needs access to the created editor instance
    this.decorationManager = new DecorationManager(this.editor);
    
    this.setupEventListeners();
  }

  private initializeEditor() {
    this._editor = new Editor({
      extensions: [
        StarterKit,
      ],
      content: `<p>i cant spell gud. This is a testt of the spell checker.</p>`,
      editable: true,
      editorProps: {
        attributes: {
          class: "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[500px]",
          spellCheck: "false",
        },
      },
    });
  }

  private setupEventListeners() {
    // Debounce the check to avoid excessive processing
    const debouncedCheck = debounce(() => {
      const text = this.editor.getText();
      console.log('[EditorService] Document changed, dispatching check.');
      this.checkOrchestrator.check(text);
    }, 500); // 500ms debounce delay

    this.editor.on('update', debouncedCheck);

    // Also emit a generic update for the React component to re-render
    this.editor.on('update', () => {
      this.emit('update');
    });

    this.checkOrchestrator.on('results', (result: CheckResult) => {
      // Instead of logging, pass the errors to the DecorationManager
      console.log('[EditorService] Received check results:', JSON.stringify(result, null, 2));
      console.log('[EditorService] Passing', result.errors.length, 'errors to DecorationManager');
      
      if (this.decorationManager) {
        this.decorationManager.updateDecorations(result.errors);
      } else {
        console.error('[EditorService] DecorationManager is null!');
      }
    });
  }

  public get editor(): Editor {
    if (!this._editor) {
      throw new Error("Editor not initialized");
    }
    return this._editor;
  }

  public destroy() {
    this.editor?.destroy();
    this.checkOrchestrator.destroy();
    this.removeAllListeners();
  }
} 