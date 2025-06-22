import { Editor } from '@tiptap/core'

export const EditorDebugger = {
  /**
   * Check all blocks have IDs
   */
  checkBlockIds() {
    const blocks = document.querySelectorAll('[data-block-id]')
    const missing = document.querySelectorAll('p:not([data-block-id]), h1:not([data-block-id]), h2:not([data-block-id]), h3:not([data-block-id]), li:not([data-block-id])')
    
    console.log(`✅ Blocks with IDs: ${blocks.length}`)
    console.log(`❌ Blocks missing IDs: ${missing.length}`)
    
    if (missing.length > 0) {
      console.warn('Blocks without IDs:', missing)
    }
    
    // Log block details
    console.table(Array.from(blocks).map((block, i) => ({
      index: i,
      id: block.getAttribute('data-block-id'),
      type: block.getAttribute('data-block-type'),
      tag: block.tagName.toLowerCase(),
      text: (block.textContent || '').substring(0, 50)
    })))
  },
  
  /**
   * Visualize block boundaries
   */
  visualizeBlocks() {
    // Remove any existing debug styles
    const existingStyle = document.getElementById('block-debug-styles')
    if (existingStyle) {
      existingStyle.remove()
    }
    
    // Add debug styles
    const style = document.createElement('style')
    style.id = 'block-debug-styles'
    style.textContent = `
      [data-block-id] {
        outline: 1px dashed rgba(59, 130, 246, 0.5) !important;
        outline-offset: 2px !important;
        position: relative !important;
      }
      
      [data-block-id]::before {
        content: attr(data-block-type) " - " attr(data-block-id) !important;
        position: absolute !important;
        top: -20px !important;
        left: 0 !important;
        font-size: 10px !important;
        background: rgba(59, 130, 246, 0.9) !important;
        color: white !important;
        padding: 2px 4px !important;
        border-radius: 2px !important;
        z-index: 9999 !important;
        pointer-events: none !important;
        white-space: nowrap !important;
        max-width: 200px !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      
      .block-handle-portal {
        outline: 2px solid red !important;
      }
    `
    document.head.appendChild(style)
    
    console.log('📐 Block visualization enabled')
  },
  
  /**
   * Hide block visualization
   */
  hideVisualization() {
    const style = document.getElementById('block-debug-styles')
    if (style) {
      style.remove()
      console.log('📐 Block visualization disabled')
    }
  },
  
  /**
   * Test ghost text
   */
  testGhostText(editor: Editor) {
    if (!editor) {
      console.error('No editor provided')
      return
    }
    
    // Trigger ghost text at current position
    const { state } = editor
    const { tr } = state
    
    tr.setMeta('ghostTextUpdate', {
      ghostText: 'This is a test ghost text suggestion',
      isActive: true,
      position: state.selection.from
    })
    
    editor.view.dispatch(tr)
    
    // Check decorations after a moment
    setTimeout(() => {
      const decorations = document.querySelectorAll('.ghost-text')
      console.log('Ghost text decorations found:', decorations.length)
      decorations.forEach(d => {
        console.log('Ghost text:', d.getAttribute('data-ghost-text'))
      })
    }, 100)
  },
  
  /**
   * Monitor block handle events
   */
  monitorHandles() {
    let logCount = 0
    const maxLogs = 20
    
    // Monitor mouse events on editor
    const editor = document.querySelector('.editor-wrapper')
    if (!editor) {
      console.error('No editor wrapper found')
      return
    }
    
    const logEvent = (type: string, detail: any) => {
      if (logCount >= maxLogs) return
      logCount++
      console.log(`[${type}]`, detail)
    }
    
    const mouseHandler = (e: Event) => {
      if (!(e instanceof MouseEvent)) return
      
      const target = e.target as HTMLElement
      const block = target.closest('[data-block-id]')
      if (block) {
        logEvent('Mouse over block', {
          blockId: block.getAttribute('data-block-id'),
          blockType: block.getAttribute('data-block-type'),
          mouseX: e.clientX,
          mouseY: e.clientY
        })
      }
    }
    
    editor.addEventListener('mousemove', mouseHandler)
    
    console.log('🖱️ Handle monitoring started (limited to', maxLogs, 'events)')
    
    // Return cleanup function
    return () => {
      editor.removeEventListener('mousemove', mouseHandler)
      console.log('🖱️ Handle monitoring stopped')
    }
  }
}

// Attach to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).editorDebug = EditorDebugger
  console.log('🔧 Editor debugger available at window.editorDebug')
} 