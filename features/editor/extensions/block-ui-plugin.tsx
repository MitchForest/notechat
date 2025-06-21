import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import { createRoot, Root } from 'react-dom/client';
import React from 'react';
import { Editor, Extension } from '@tiptap/core';
import { BlockHandle } from '../components/block-handle';

const blockUiPluginKey = new PluginKey('block-ui');

export interface BlockUiOptions {
  container: HTMLElement | null;
}

// --- Plugin State ---
interface BlockUIPluginState {
  isDragging: boolean;
  draggedNodePos: number | null;
  dropTargetPos: number | null;
  hoveredBlockPos: number | null;
}

function getInitialState(): BlockUIPluginState {
  return {
    isDragging: false,
    draggedNodePos: null,
    dropTargetPos: null,
    hoveredBlockPos: null,
  };
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
      handleMouseMove(this.view, new MouseEvent('mousemove', { bubbles: true, cancelable: true }));
    });
    
    this.update(view, view.state);
  }

  update(view: EditorView, prevState: any) {
    const state = blockUiPluginKey.getState(view.state);
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    if (state?.hoveredBlockPos !== null && !state.isDragging) {
      const node = view.state.doc.nodeAt(state.hoveredBlockPos);
      const domNode = view.nodeDOM(state.hoveredBlockPos) as HTMLElement;
      if (domNode && node) {
        const containerRect = this.container.getBoundingClientRect();
        const nodeRect = domNode.getBoundingClientRect();
        const top = nodeRect.top - containerRect.top;
        const left = (60 - 52) / 2;
        this.portal.style.display = 'block';
        this.portal.style.position = 'absolute';
        this.portal.style.top = `${top}px`;
        this.portal.style.left = `${left}px`;
        this.reactRoot.render(
          <BlockHandle
            editor={this.editor}
            blockPos={state.hoveredBlockPos}
            blockNode={node}
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
  const containerRect = container.getBoundingClientRect();
  if (event.clientX < containerRect.left || event.clientX > containerRect.right || event.clientY < containerRect.top || event.clientY > containerRect.bottom) {
    return null;
  }
  let hoveredBlockInfo: { pos: number; node: any } | null = null;
  const deadZoneSize = 3;
  view.state.doc.forEach((node, pos) => {
    if (hoveredBlockInfo) return;
    if (node.isBlock) {
      const domNode = view.nodeDOM(pos) as HTMLElement;
      if (domNode) {
        const rect = domNode.getBoundingClientRect();
        if (event.clientY >= rect.top + deadZoneSize && event.clientY <= rect.bottom - deadZoneSize) {
          hoveredBlockInfo = { pos, node };
        }
      }
    }
  });
  return hoveredBlockInfo;
}

function handleMouseMove(view: EditorView, event: MouseEvent) {
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.isDragging) return;

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

function handleDragStart(view: EditorView, event: DragEvent) {
  const target = event.target as HTMLElement;
  const handle = target.closest('[data-drag-handle]');
  if (!handle || !view.dom.contains(handle)) return false;
  const pluginState = blockUiPluginKey.getState(view.state);
  if (pluginState?.hoveredBlockPos === null) return false;
  view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { isDragging: true, draggedNodePos: pluginState.hoveredBlockPos }));
  return true;
}

function findDropTarget(view: EditorView, event: DragEvent): number | null {
  const posAtCoords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!posAtCoords) return null;
  const resolvedPos = view.state.doc.resolve(posAtCoords.pos);
  for (let i = resolvedPos.depth; i > 0; i--) {
    const node = resolvedPos.node(i);
    if (node.isBlock) {
      const nodeDom = view.nodeDOM(resolvedPos.before(i)) as HTMLElement;
      if (nodeDom) {
        const nodeRect = nodeDom.getBoundingClientRect();
        const isAfter = event.clientY > nodeRect.top + nodeRect.height / 2;
        return isAfter ? resolvedPos.after(i) : resolvedPos.before(i);
      }
    }
  }
  return resolvedPos.pos;
}

function handleDragOver(view: EditorView, event: DragEvent) {
  event.preventDefault();
  const pluginState = blockUiPluginKey.getState(view.state);
  if (!pluginState?.isDragging) return false;
  const dropPos = findDropTarget(view, event);
  if (pluginState.dropTargetPos !== dropPos) {
    view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { dropTargetPos: dropPos }));
  }
  return true;
}

function handleDrop(view: EditorView, event: DragEvent) {
  event.preventDefault();
  const pluginState = blockUiPluginKey.getState(view.state);
  if (!pluginState || !pluginState.isDragging || pluginState.draggedNodePos === null || pluginState.dropTargetPos === null) {
    return false;
  }
  const { draggedNodePos, dropTargetPos } = pluginState;
  const resolvedPos = view.state.doc.resolve(draggedNodePos);
  const draggedNode = resolvedPos.nodeAfter;
  if (!draggedNode) return false;
  let finalDropPos = dropTargetPos;
  if (finalDropPos > draggedNodePos && finalDropPos < draggedNodePos + draggedNode.nodeSize) {
    finalDropPos = draggedNodePos;
  }
  const newTr = view.state.tr.delete(draggedNodePos, draggedNodePos + draggedNode.nodeSize);
  const insertPos = newTr.mapping.map(finalDropPos);
  newTr.insert(insertPos, draggedNode);
  view.dispatch(newTr.setMeta(blockUiPluginKey, getInitialState()));
  return true;
}

function handleDragEnd(view: EditorView) {
  view.dispatch(view.state.tr.setMeta(blockUiPluginKey, { isDragging: false, dropTargetPos: null }));
  return true;
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
          return { ...value, hoveredBlockPos: null };
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
        if (!pluginState || !pluginState.isDragging || pluginState.dropTargetPos === null) {
          return DecorationSet.empty;
        }
        return DecorationSet.create(state.doc, [
          Decoration.widget(pluginState.dropTargetPos, createDropIndicator()),
        ]);
      },
      handleDOMEvents: {
        mousemove: (view, event) => {
          if (pluginView && pluginView.mouseMoveTimeout) {
            clearTimeout(pluginView.mouseMoveTimeout);
          }
          if (pluginView) {
            pluginView.mouseMoveTimeout = setTimeout(() => {
              handleMouseMove(view, event as MouseEvent);
            }, 10);
          }
          return false;
        },
        dragstart: (view, event) => handleDragStart(view, event as DragEvent),
        dragover: (view, event) => handleDragOver(view, event as DragEvent),
        drop: (view, event) => handleDrop(view, event as DragEvent),
        dragend: (view) => handleDragEnd(view),
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