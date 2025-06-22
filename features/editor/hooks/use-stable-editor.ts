import { useEffect, useRef, useState } from 'react'
import { EditorService } from '../services/EditorService'

export const useStableEditor = ({
  elementRef
}: {
  elementRef: React.RefObject<HTMLDivElement>
}) => {
  const editorServiceRef = useRef<EditorService | null>(null)
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (elementRef.current && !editorServiceRef.current) {
      editorServiceRef.current = new EditorService(elementRef.current)
      forceUpdate({})
    }

    return () => {
      editorServiceRef.current?.destroy()
      editorServiceRef.current = null
    }
  }, [elementRef])

  return editorServiceRef.current
} 