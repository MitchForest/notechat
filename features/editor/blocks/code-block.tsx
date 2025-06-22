import React from 'react'
import { NodeViewContent } from '@tiptap/react'
import { BlockWrapper } from '../components/block-wrapper'
import { BlockErrorBoundary } from '../components/block-error-boundary'

export const CodeBlock = (props: any) => {
  const language = props.node.attrs.language || 'plaintext'
  
  return (
    <BlockErrorBoundary>
      <BlockWrapper {...props} className="code-block">
        <select 
          value={language} 
          onChange={(e) => props.updateAttributes({ language: e.target.value })}
          contentEditable={false}
          className="code-language-select"
        >
          <option value="javascript">JavaScript</option>
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
          <option value="html">HTML</option>
          <option value="css">CSS</option>
          <option value="json">JSON</option>
          <option value="plaintext">Plain Text</option>
        </select>
        <NodeViewContent as="pre" className={`language-${language}`}>
          <code />
        </NodeViewContent>
      </BlockWrapper>
    </BlockErrorBoundary>
  )
} 