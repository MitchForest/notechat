// Block UI Debug Utility
// This helps debug why block handles aren't showing

export const blockUiDebug = {
  // Check if blocks are properly identified
  checkBlocks() {
    const blocks = document.querySelectorAll('[data-block-type]')
    console.log('=== Block Debug ===')
    console.log(`Found ${blocks.length} blocks with data-block-type`)
    
    blocks.forEach((block, i) => {
      const rect = block.getBoundingClientRect()
      console.log(`Block ${i}:`, {
        type: block.getAttribute('data-block-type'),
        tag: block.tagName.toLowerCase(),
        text: block.textContent?.substring(0, 50) + '...',
        position: { top: rect.top, left: rect.left },
        size: { width: rect.width, height: rect.height }
      })
    })
  },

  // Check editor structure
  checkEditor() {
    const wrapper = document.querySelector('.editor-wrapper')
    const prosemirror = document.querySelector('.ProseMirror')
    const portal = document.querySelector('.block-handle-portal')
    
    console.log('=== Editor Structure ===')
    console.log('Editor wrapper exists:', !!wrapper)
    console.log('ProseMirror exists:', !!prosemirror)
    console.log('Block handle portal exists:', !!portal)
    
    if (portal) {
      const style = window.getComputedStyle(portal)
      console.log('Portal display:', style.display)
      console.log('Portal visibility:', style.visibility)
      console.log('Portal position:', style.position)
    }
  },

  // Simulate hover to test handle appearance
  simulateHover() {
    const firstBlock = document.querySelector('[data-block-type]')
    if (firstBlock) {
      const event = new MouseEvent('mousemove', {
        bubbles: true,
        cancelable: true,
        clientX: firstBlock.getBoundingClientRect().left + 50,
        clientY: firstBlock.getBoundingClientRect().top + 10
      })
      
      const prosemirror = document.querySelector('.ProseMirror')
      if (prosemirror) {
        console.log('Simulating hover on first block...')
        prosemirror.dispatchEvent(event)
      }
    }
  },

  // Run all checks
  runAll() {
    this.checkEditor()
    this.checkBlocks()
    console.log('\nTo test hover, run: blockUiDebug.simulateHover()')
  },

  // Check after a delay to ensure everything is initialized
  runDelayed() {
    console.log('Waiting 500ms for editor initialization...')
    setTimeout(() => {
      this.runAll()
    }, 500)
  }
}

// Add to window for console access
if (typeof window !== 'undefined') {
  (window as any).blockUiDebug = blockUiDebug
} 