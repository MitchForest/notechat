import React from 'react'
import { NodeViewContent } from '@tiptap/react'
import { BlockWrapper } from '../components/block-wrapper'
import { BlockErrorBoundary } from '../components/block-error-boundary'

export const ListItemBlock = (props: any) => (
  <BlockErrorBoundary>
    <BlockWrapper {...props} className="list-item nested-block">
      <NodeViewContent as="li" className="list-item-content" />
    </BlockWrapper>
  </BlockErrorBoundary>
) 