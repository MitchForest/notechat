/**
 * Test utility for verifying the new block handle system
 */

export const testNewHandles = {
  checkSetup() {
    console.log('🔍 Checking new handle system setup...')
    
    // Check if BlockUi is removed
    const hasBlockUi = document.querySelector('.block-ui-portal')
    if (hasBlockUi) {
      console.warn('❌ BlockUi portal still exists - should be removed')
    } else {
      console.log('✅ BlockUi removed successfully')
    }
    
    // Check for new handle portal
    const handlePortal = document.querySelector('.block-handle-portal')
    if (handlePortal) {
      console.log('✅ New handle portal found:', {
        parent: handlePortal.parentElement?.className,
        position: window.getComputedStyle(handlePortal).position,
        display: window.getComputedStyle(handlePortal).display
      })
    } else {
      console.error('❌ No handle portal found')
    }
    
    // Check editor wrapper
    const editorWrapper = document.querySelector('.editor-wrapper')
    if (editorWrapper) {
      const position = window.getComputedStyle(editorWrapper).position
      console.log('✅ Editor wrapper found:', {
        position,
        hasRelativePosition: position === 'relative'
      })
    }
    
    // Check blocks
    const blocks = document.querySelectorAll('[data-block-id]')
    console.log(`📦 Found ${blocks.length} blocks with IDs`)
    
    return {
      hasOldSystem: !!hasBlockUi,
      hasNewSystem: !!handlePortal,
      blockCount: blocks.length
    }
  },
  
  simulateHover(blockIndex = 0) {
    const blocks = document.querySelectorAll('[data-block-id]')
    if (blocks[blockIndex]) {
      const block = blocks[blockIndex] as HTMLElement
      const rect = block.getBoundingClientRect()
      
      console.log('🖱️ Simulating hover on block:', {
        id: block.getAttribute('data-block-id'),
        type: block.getAttribute('data-block-type'),
        rect
      })
      
      // Create and dispatch mouse event
      const event = new MouseEvent('mousemove', {
        clientX: rect.left + 10,
        clientY: rect.top + rect.height / 2,
        bubbles: true
      })
      
      const editorWrapper = document.querySelector('.editor-wrapper')
      if (editorWrapper) {
        editorWrapper.dispatchEvent(event)
        
        // Check if handle appeared
        setTimeout(() => {
          const portal = document.querySelector('.block-handle-portal') as HTMLElement
          if (portal && portal.style.display !== 'none') {
            console.log('✅ Handle appeared!', {
              transform: portal.style.transform,
              display: portal.style.display
            })
          } else {
            console.warn('❌ Handle did not appear')
          }
        }, 100)
      }
    }
  }
}

// Attach to window in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testNewHandles = testNewHandles
  console.log('🧪 New handle tester available at window.testNewHandles')
} 