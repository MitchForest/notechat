/**
 * React Node View Renderer
 * Purpose: Integrates React components with Tiptap's node view system
 * Features:
 * - Preserves all Tiptap functionality
 * - Wraps content in BlockWrapper for consistent UI
 * - Maintains contentDOM for editable content
 * 
 * Created: 2024-01-01
 */

import React from 'react';
import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import { BlockWrapper } from '../components/block-wrapper';
import { Editor } from '@tiptap/core';
import { Node as ProseMirrorNode } from 'prosemirror-model';

interface ReactNodeViewProps {
  editor: Editor;
  node: ProseMirrorNode;
  decorations: any;
  selected: boolean;
  extension: any;
  getPos: () => number;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}

/**
 * Generic block component that wraps content in BlockWrapper
 */
const BlockNodeComponent: React.FC<ReactNodeViewProps> = ({
  editor,
  node,
  getPos,
  selected,
  extension
}) => {
  return (
    <NodeViewWrapper>
      <BlockWrapper
        editor={editor}
        node={node}
        getPos={getPos}
        className={selected ? 'ProseMirror-selectednode' : ''}
      >
        {/* This div will be replaced by contentDOM */}
        <div />
      </BlockWrapper>
    </NodeViewWrapper>
  );
};

/**
 * Creates a React node view for block nodes
 */
export const createBlockNodeView = (nodeName: string) => {
  return ReactNodeViewRenderer(BlockNodeComponent, {
    // For certain node types, we might not want content
    contentDOMElementTag: nodeName === 'horizontalRule' || nodeName === 'image' ? undefined : 'div',
  });
}; 