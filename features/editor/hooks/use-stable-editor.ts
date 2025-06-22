import { useEffect, useRef, useState } from 'react'
import { EditorService } from '../services/EditorService'

export const useStableEditor = ({
  elementRef,
  dragManager
}: {
  elementRef: React.RefObject<HTMLDivElement>
  dragManager?: any
}) => {
  const editorServiceRef = useRef<EditorService | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (elementRef.current && !editorServiceRef.current) {
      editorServiceRef.current = new EditorService(elementRef.current, [], dragManager)
      forceUpdate({})
    }

    return () => {
      editorServiceRef.current?.destroy()
      editorServiceRef.current = null
    }
  }, [elementRef, dragManager])

  return editorServiceRef.current
} 