import { Editor } from '@tiptap/core'
import { EventEmitter } from 'events'
import StarterKit from '@tiptap/starter-kit'
import { CheckOrchestrator, CheckResult } from './CheckOrchestrator'
import { debounce } from 'lodash-es'
import { SpellCheckExtension } from './DecorationManager'
import { TextError } from '../workers/grammar.worker'

export class EditorService extends EventEmitter {
  private _editor: Editor;
  private checkOrchestrator: CheckOrchestrator;

  constructor() {
    super();
    this.checkOrchestrator = new CheckOrchestrator();
    
    this._editor = new Editor({
      extensions: [
        StarterKit,
        SpellCheckExtension,
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
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    const debouncedCheck = debounce(() => {
      const text = this.editor.getText();
      this.checkOrchestrator.check(text);
    }, 500);

    this.editor.on('update', debouncedCheck);

    this.editor.on('update', () => {
      this.emit('update');
    });

    this.checkOrchestrator.on('results', (result: CheckResult) => {
      if (this.editor) {
        // Set the errors in the extension's storage
        this.editor.storage.spellCheckExtension.errors = result.errors as TextError[];
        // Force the editor to update, which will re-apply decorations
        this.editor.view.dispatch(this.editor.state.tr.setMeta('updated_errors', true));
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