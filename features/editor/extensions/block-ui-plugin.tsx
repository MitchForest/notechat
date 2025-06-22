import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { Editor, Extension } from '@tiptap/core';
import { BlockHandle } from '../components/block-handle';
import { Slice } from 'prosemirror-model';
import { blockDebugger } from '../utils/block-debug';

const blockUiPluginKey = new PluginKey('block-ui');

// --- Utilities for Robustness & Debugging ---
const DEBUG = process.env.NODE_ENV === 'development';

function log(message: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[BlockUI] ${message}`, ...args);
  }
}

function safeExecute<T extends (...args: any[]) => any>(
  fn: T,
  description: string
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  return (...args: Parameters<T>) => {
    try {
      log(`Executing: ${description}`);
      return fn(...args);
    } catch (error) {
      console.error(`[BlockUI] Error in ${description}:`, error);
      return undefined;
    }
  };
}

export interface BlockUiOptions {
  container: HTMLElement | null;
}

// --- Plugin State ---
interface BlockUIPluginState {
  isDragging: boolean;
  hoveredBlockPos: number | null;
  dropTargetPos: number | null;
  draggedNodePos: number | null; // Keep track of the source node
  isMenuOpen: boolean; // Prevent handle from moving while menu is open
}

function getInitialState(): BlockUIPluginState {
  return {
    isDragging: false,
    hoveredBlockPos: null,
    dropTargetPos: null,
    draggedNodePos: null,
    isMenuOpen: false,
  };
}

// --- Custom Drag Preview ---
let dragPreview: HTMLElement | null = null;

function showDragPreview(event: DragEvent, text: string) {
  if (!dragPreview) {
    dragPreview = document.createElement('div');
    dragPreview.className = 'drag-preview';
    document.body.appendChild(dragPreview);
  }
  dragPreview.textContent = text;
  moveDragPreview(event);
}

function moveDragPreview(event: DragEvent) {
  if (dragPreview) {
    dragPreview.style.left = `${event.clientX + 15}px`;
    dragPreview.style.top = `${event.clientY + 15}px`;
  }
}

function hideDragPreview() {
  if (dragPreview) {
    dragPreview.remove();
    dragPreview = null;
  }
}

// --- Plugin View ---
class BlockUIView {
  private view: EditorView;
  private portal: HTMLElement;
  private reactRoot: Root;
  private container: HTMLElement;
  private editor: Editor;

  constructor(view: EditorView, container: HTMLElement, editor: Editor) {
    this.view = view;
    this.container = container;
    this.editor = editor;
    
    // Log container info for debugging
    log('BlockUIView constructor - container:', {
      className: container.className,
      id: container.id,
      hasEditorWrapper: container.classList.contains('editor-wrapper')
    });
    
    // Create portal in the provided container
    this.portal = document.createElement('div');
    this.portal.className = 'block-handle-portal';
    this.container.appendChild(this.portal);
    this.reactRoot = createRoot(this.portal);
    
    log('Portal created and appended to container', {
      portal: this.portal,
      container: this.container.className,
      portalInDOM: document.contains(this.portal)
    });

    // Remove the hover tracking on portal - let the block handle manage its own hover
    // The CSS pointer-events changes will handle the hover behavior
    
    this.update(view, view.state);
  }

  handleMenuToggle(isOpen: boolean) {
    this.view.dispatch(this.view.state.tr.setMeta(blockUiPluginKey, { isMenuOpen: isOpen }));
  }

  update(view: EditorView, prevState: any) {
    // Check if portal is still in DOM, re-append if needed
    if (!document.contains(this.portal)) {
      const currentContainer = view.dom.closest('.editor-wrapper');
      if (currentContainer && currentContainer !== this.container) {
        log('Container changed, re-appending portal to new container');
        this.container = currentContainer as HTMLElement;
        this.container.appendChild(this.portal);
      }
    }
    
    const state = blockUiPluginKey.getState(view.state);
    const prevPluginState = blockUiPluginKey.getState(prevState);

    // Sync dragging class with plugin state
    if (state?.isDragging && !prevPluginState?.isDragging) {
      view.dom.classList.add('is-dragging');
    }
    if (!state?.isDragging && prevPluginState?.isDragging) {
      view.dom.classList.remove('is-dragging');
    }

    if (state?.hoveredBlockPos !== null && !state.isDragging) {
      const node = view.state.doc.nodeAt(state.hoveredBlockPos);
      const domNode = view.nodeDOM(state.hoveredBlockPos) as HTMLElement;
      if (domNode && node) {
        const containerRect = this.container.getBoundingClientRect();
        const nodeRect = domNode.getBoundingClientRect();
        const top = nodeRect.top - containerRect.top;
        const left = 8; // Position handle further left in the gutter
        this.portal.style.display = 'block';
        this.portal.style.position = 'absolute';
        this.portal.style.top = `${top}px`;
        this.portal.style.left = `${left}px`;
        this.reactRoot.render(
          <BlockHandle
            editor={this.editor}
            blockPos={state.hoveredBlockPos}
            blockNode={node}
            onMenuToggle={(isOpen) => this.handleMenuToggle(isOpen)}
          />
        );
      }
    } else {
      this.portal.style.display = 'none';
    }
  }

  destroy() {
    setTimeout(() => {
      if (this.reactRoot) {
          this.reactRoot.unmount();
      }
      this.portal.remove();
    }, 0);
  }
}

function findHoveredBlock(view: EditorView, container: HTMLElement, event: MouseEvent): { pos: number; node: any } | null {
  // Use the provided container instead of searching for it
  if (!container) {
    log('findHoveredBlock: No container provided');
    return null;
  }
  
  // Check if the cursor is vertically within the editor's content area
  const editorRect = view.dom.getBoundingClientRect();
  if (event.clientY < editorRect.top || event.clientY > editorRect.bottom) {
    return null;
  }

  // Find the block whose vertical range includes the mouse position.
  // This logic now ignores the horizontal cursor position, effectively extending
  // the hover area to the full width of the editor.
  let hoveredBlockInfo: { pos: number; node: any } | null = null;
  let debugInfo: any[] = [];
  
  view.state.doc.forEach((node, pos) => {
    if (hoveredBlockInfo) return; // Already found
    if (node.isBlock) {
      const domNode = view.nodeDOM(pos) as HTMLElement;
      if (domNode) {
        const rect = domNode.getBoundingClientRect();
        debugInfo.push({
          pos,
          type: node.type.name,
          dom: domNode.tagName,
          rect: { top: rect.top, bottom: rect.bottom },
          mouseY: event.clientY,
          inRange: event.clientY >= rect.top && event.clientY <= rect.bottom
        });
        
        if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
          hoveredBlockInfo = { pos, node };
        }
      }
    }
  });
  
  if (DEBUG && debugInfo.length > 0) {
    log('findHoveredBlock debug:', debugInfo);
  }

  return hoveredBlockInfo;
}

function handleMouseMove(view: EditorView, container: HTMLElement, event: MouseEvent) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.isDragging || pluginState?.isMenuOpen) return;

  const target = event.target as HTMLElement;
  if (target?.closest('.block-handle-portal')) return;
  
  const blockInfo = findHoveredBlock(view, container, event);
  const newHoveredPos = blockInfo ? blockInfo.pos : null;

  if (newHoveredPos !== pluginState.hoveredBlockPos) {
    view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { hoveredBlockPos: newHoveredPos }));
  }
}

function handleMouseLeave(view: EditorView, container: HTMLElement) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.hoveredBlockPos !== null) {
    // Use the stored portal reference instead of searching for it
    const portal = container.querySelector('.block-handle-portal');
    if (portal && portal.matches(':hover')) {
      return;
    }
    view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { hoveredBlockPos: null }));
  }
}

function showDropIndicator(view: EditorView, pos: number) {
  const pluginState = blockUiPluginKey.getState(view.state);
  // Do not show drop indicator at the position of the dragged block
  if (pluginState?.draggedNodePos === pos) return;

  if (pluginState?.dropTargetPos === pos) {
    return;
  }
  view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { dropTargetPos: pos }));
}

function hideDropIndicator(view: EditorView) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.dropTargetPos === null) {
    return;
  }
  view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { dropTargetPos: null, draggedNodePos: null, isDragging: false }));
}

function createDropIndicator() {
  const indicator = document.createElement('div');
  indicator.className = 'drop-indicator';
  return indicator;
}

const blockUiPlugin = (container: HTMLElement, editor: Editor) => {
  // Validate container on plugin creation
  if (!container) {
    console.error('[BlockUI] No container provided to plugin');
    throw new Error('BlockUI plugin requires a valid container element');
  }
  
  log('Creating blockUiPlugin with container:', container.className);
  blockDebugger.validateContainer(container);
  
  return new Plugin({
    key: blockUiPluginKey,
    state: {
      init: getInitialState,
      apply: (tr, value) => {
        const meta = tr.getMeta(blockUiPluginKey);
        if (meta) {
          return { ...value, ...meta };
        }
        if (tr.docChanged || tr.selectionSet) {
          // Reset hover and dragging state on document changes
          return { ...value, hoveredBlockPos: null, isDragging: false };
        }
        return value;
      },
    },
    view(editorView) {
      return new BlockUIView(editorView, container, editor);
    },
    props: {
      decorations(state) {
        const pluginState = blockUiPluginKey.getState(state);
        const decorations: Decoration[] = [];
        
        // Add decoration for the dragged block
        if (pluginState?.isDragging && pluginState.draggedNodePos !== null) {
          const node = state.doc.nodeAt(pluginState.draggedNodePos);
          if (node) {
            decorations.push(
              Decoration.node(
                pluginState.draggedNodePos, 
                pluginState.draggedNodePos + node.nodeSize, 
                { class: 'dragging-block' }
              )
            );
          }
        }
        
        // Add decoration for the drop indicator
        if (pluginState?.dropTargetPos !== null) {
          decorations.push(
            Decoration.widget(pluginState.dropTargetPos, createDropIndicator, {
              key: 'drop-indicator',
            })
          );
        }
        
        return DecorationSet.create(state.doc, decorations);
      },
      handleDOMEvents: {
        dragstart: (view, event) => {
          const data = (event as DragEvent).dataTransfer?.getData('application/vnd.tiptap-block');
          if (!data) return false;
          
          try {
            const { pos, content } = JSON.parse(data);
            view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { isDragging: true, draggedNodePos: pos }));

            const node = Slice.fromJSON(view.state.schema, content).content.firstChild;
            const textContent = node?.textContent || 'Block';
            showDragPreview(event as DragEvent, textContent);

            // Hide the default drag preview
            (event as DragEvent).dataTransfer?.setDragImage(new Image(), 0, 0);

          } catch (e) {
            console.error("Error on drag start:", e);
          }

          return true;
        },
        dragover: (view, event) => {
          const data = (event as DragEvent).dataTransfer?.getData('application/vnd.tiptap-block');
          if (!data) return false;
          (event as DragEvent).preventDefault();
          moveDragPreview(event as DragEvent);

          const pos = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY });
          if (pos) {
            showDropIndicator(view, pos.pos);
          }
          return true;
        },
        dragend: (view) => {
          const { state, dispatch } = view;
          const tr = state.tr.setMeta(blockUiPluginKey, { 
            isDragging: false, 
            draggedNodePos: null, 
            dropTargetPos: null 
          });
          dispatch(tr);
          hideDragPreview();
          return true;
        },
        drop: (view, event) => {
          const data = (event as DragEvent).dataTransfer?.getData('application/vnd.tiptap-block');
          if (!data) return false;

          (event as DragEvent).preventDefault();
          hideDragPreview();
          
          try {
            const { pos: sourcePos, content: contentJSON } = JSON.parse(data);
            const slice = Slice.fromJSON(view.state.schema, contentJSON);

            const targetInfo = view.posAtCoords({ left: (event as DragEvent).clientX, top: (event as DragEvent).clientY });
            if (!targetInfo) {
              hideDropIndicator(view);
              return false;
            }
            let targetPos = targetInfo.pos;

            // Prevent dropping inside the dragged node itself
            if (targetPos >= sourcePos && targetPos <= sourcePos + slice.size) {
              hideDropIndicator(view);
              return false;
            }

            const tr = view.state.tr;
            
            tr.delete(sourcePos, sourcePos + slice.size);
            const insertPos = tr.mapping.map(targetPos);
            tr.insert(insertPos, slice.content);
            tr.setMeta(blockUiPluginKey, { dropTargetPos: null, isDragging: false, draggedNodePos: null });
            
            view.dispatch(tr);

            // Prevent the "ghost click" and unfocus the editor
            view.dom.blur();
            
            const clickHandler = (e: MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              window.removeEventListener('click', clickHandler, true);
            };
            window.addEventListener('click', clickHandler, true);
            setTimeout(() => window.removeEventListener('click', clickHandler, true), 50);

          } catch (e) {
            console.error('Failed to handle drop event:', e);
            hideDropIndicator(view);
          }
          return true;
        },
        dragleave: (view, event) => {
          // Hide indicator if we are leaving the editor bounds
          const editorRect = (view.dom as HTMLElement).getBoundingClientRect();
          if (
            (event as DragEvent).clientX <= editorRect.left || (event as DragEvent).clientX >= editorRect.right ||
            (event as DragEvent).clientY <= editorRect.top || (event as DragEvent).clientY >= editorRect.bottom
          ) {
            hideDropIndicator(view);
          }
          return false;
        },
        mousemove: (view, event) => {
          handleMouseMove(view, container, event as MouseEvent);
          return false;
        },
        mouseleave: (view) => {
          handleMouseLeave(view, container);
        },
      },
    },
  });
};

export const BlockUi = Extension.create<BlockUiOptions>({
  name: 'block-ui',
  addOptions() {
    return {
      container: null,
    };
  },
  onException(error: Error) {
    console.error("Error in BlockUi extension:", error);
  },
  addProseMirrorPlugins() {
    console.log('[BlockUI] addProseMirrorPlugins called with options:', this.options);
    if (!this.options.container) {
      console.warn('[BlockUI] No container provided to extension');
      return [];
    }
    console.log('[BlockUI] Creating plugin with container:', this.options.container.className);
    return [blockUiPlugin(this.options.container, this.editor)];
  },
});