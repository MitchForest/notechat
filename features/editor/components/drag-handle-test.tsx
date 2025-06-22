'use client'

import { useEffect, useRef } from 'react'
import { Editor } from '@tiptap/core'

interface DragHandleTestProps {
  editor: Editor
}

export function DragHandleTest({ editor }: DragHandleTestProps) {
  const handleRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (!editor || !handleRef.current) return
    
    // Create a test drag handle to verify CSS
    const testHandle = document.createElement('div')
    testHandle.className = 'drag-handle show'
    testHandle.style.position = 'fixed'
    testHandle.style.left = '50px'
    testHandle.style.top = '200px'
    testHandle.style.width = '20px'
    testHandle.style.height = '20px'
    
    document.body.appendChild(testHandle)
    
    console.log('[DragHandleTest] Test handle created')
    
    return () => {
      testHandle.remove()
    }
  }, [editor])
  
  return null
} 