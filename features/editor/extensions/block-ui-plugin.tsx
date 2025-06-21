import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { Editor, Extension } from '@tiptap/core';
import { BlockHandle } from '../components/block-handle';
import { Slice } from 'prosemirror-model';

const blockUiPluginKey = new PluginKey('block-ui');

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
  private hideTimeout: NodeJS.Timeout | null = null;
  private isHandleHovered: boolean = false;
  public mouseMoveTimeout: NodeJS.Timeout | null = null;

  constructor(view: EditorView, container: HTMLElement, editor: Editor) {
    this.view = view;
    this.container = container;
    this.editor = editor;
    this.portal = document.createElement('div');
    this.portal.className = 'block-handle-portal';
    container.appendChild(this.portal);
    this.reactRoot = createRoot(this.portal);

    this.portal.addEventListener('mouseenter', () => {
      this.isHandleHovered = true;
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
        this.hideTimeout = null;
      }
    });
    this.portal.addEventListener('mouseleave', () => {
      this.isHandleHovered = false;
      // Use requestAnimationFrame to avoid race conditions with React state
      requestAnimationFrame(() => {
        handleMouseMove(this.view, new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
      });
    });
    
    this.update(view, view.state);
  }

  handleMenuToggle(isOpen: boolean) {
    this.view.dispatch(this.view.state.tr.setMeta(blockUiPluginKey, { isMenuOpen: isOpen }));
  }

  update(view: EditorView, prevState: any) {
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
        const left = 24; // Position handle in the new gutter area
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
      if (!this.isHandleHovered) {
        this.hideTimeout = setTimeout(() => {
          this.portal.style.display = 'none';
        }, 100);
      }
    }
  }

  destroy() {
    if (this.hideTimeout) clearTimeout(this.hideTimeout);
    setTimeout(() => {
      if (this.reactRoot) {
          this.reactRoot.unmount();
      }
      this.portal.remove();
    }, 0);
  }
}

function findHoveredBlock(view: EditorView, event: MouseEvent): { pos: number; node: any } | null {
  const container = (view as any).dom.closest('.editor-wrapper');
  if (!container) return null;
  
  // Check if the cursor is vertically within the editor's content area
  const editorRect = view.dom.getBoundingClientRect();
  if (event.clientY < editorRect.top || event.clientY > editorRect.bottom) {
    return null;
  }

  // Find the block whose vertical range includes the mouse position.
  // This logic now ignores the horizontal cursor position, effectively extending
  // the hover area to the full width of the editor.
  let hoveredBlockInfo: { pos: number; node: any } | null = null;
  view.state.doc.forEach((node, pos) => {
    if (hoveredBlockInfo) return; // Already found
    if (node.isBlock) {
      const domNode = view.nodeDOM(pos) as HTMLElement;
      if (domNode) {
        const rect = domNode.getBoundingClientRect();
        if (event.clientY >= rect.top && event.clientY <= rect.bottom) {
          hoveredBlockInfo = { pos, node };
        }
      }
    }
  });

  return hoveredBlockInfo;
}

function handleMouseMove(view: EditorView, event: MouseEvent) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.isDragging || pluginState?.isMenuOpen) return;

  const target = event.target as HTMLElement;
  if (target?.closest('.block-handle-portal')) return;
  
  const blockInfo = findHoveredBlock(view, event);
  const newHoveredPos = blockInfo ? blockInfo.pos : null;

  if (newHoveredPos !== pluginState.hoveredBlockPos) {
    view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { hoveredBlockPos: newHoveredPos }));
  }
}

function handleMouseLeave(view: EditorView) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.hoveredBlockPos !== null) {
    const portal = view.dom.closest('.editor-wrapper')?.querySelector('.block-handle-portal');
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
  let pluginView: BlockUIView;
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
      pluginView = new BlockUIView(editorView, container, editor);
      return pluginView;
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
          // This is the correct way to reset state in Prosemirror.
          // It guarantees the isDragging state and dragging class are removed.
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
          const pluginState = blockUiPluginKey.getState(view.state);
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
          handleMouseMove(view, event as MouseEvent);
          return false;
        },
        mouseleave: (view) => handleMouseLeave(view),
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
    if (!this.options.container) {
      return [];
    }
    return [blockUiPlugin(this.options.container, this.editor)];
  },
}); 