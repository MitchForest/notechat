import React from 'react'
import { NodeViewContent } from '@tiptap/react'
import { BlockWrapper } from '../components/block-wrapper'
import { BlockErrorBoundary } from '../components/block-error-boundary'

export const ParagraphBlock = (props: any) => (
  <BlockErrorBoundary>
    <BlockWrapper {...props}>
      <NodeViewContent as="p" className="paragraph-content" />
    </BlockWrapper>
  </BlockErrorBoundary>
) 