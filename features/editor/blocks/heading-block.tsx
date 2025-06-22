import React from 'react'
import { NodeViewContent } from '@tiptap/react'
import { BlockWrapper } from '../components/block-wrapper'
import { BlockErrorBoundary } from '../components/block-error-boundary'

export const HeadingBlock = (props: any) => {
  const level = props.node.attrs.level || 1
  
  return (
    <BlockErrorBoundary>
      <BlockWrapper {...props} className={`heading-${level}`}>
        <NodeViewContent 
          as={`h${level}` as any} 
          className="heading-content" 
        />
      </BlockWrapper>
    </BlockErrorBoundary>
  )
} 