export const TestHoverHandles = {
  // Enable debug mode
  enableDebug() {
    (window as any).debugHover = true;
    console.log('Hover debug mode enabled. Reload the page to see debug logs.');
  },
  
  // Force show all handles
  showAllHandles() {
    document.body.classList.add('debug-handles');
    console.log('All handles forced visible');
  },
  
  // Hide all handles
  hideAllHandles() {
    document.body.classList.remove('debug-handles');
    console.log('Handles back to normal hover behavior');
  },
  
  // Test CSS hover
  testCSSHover() {
    const style = document.createElement('style');
    style.id = 'test-css-hover';
    style.textContent = `
      .block-wrapper:hover {
        background: rgba(59, 130, 246, 0.1) !important;
        outline: 2px solid blue !important;
      }
    `;
    document.head.appendChild(style);
    console.log('CSS hover test enabled - blocks should highlight blue on hover');
  },
  
  // Check computed styles
  checkBlockStyles() {
    const blocks = document.querySelectorAll('.block-wrapper');
    blocks.forEach((block, i) => {
      const handle = block.querySelector('.block-handle');
      if (handle) {
        const styles = getComputedStyle(handle);
        console.log(`Block ${i} handle:`, {
          opacity: styles.opacity,
          position: styles.position,
          left: styles.left,
          zIndex: styles.zIndex,
          display: styles.display,
          pointerEvents: styles.pointerEvents
        });
      }
    });
  },
  
  // Simulate hover
  simulateHover() {
    const blocks = document.querySelectorAll('.block-wrapper');
    if (blocks.length > 0) {
      const firstBlock = blocks[0];
      const hoverTarget = firstBlock.querySelector('.hover-target');
      if (hoverTarget) {
        const event = new MouseEvent('mouseenter', {
          bubbles: true,
          cancelable: true,
          view: window
        });
        hoverTarget.dispatchEvent(event);
        console.log('Simulated hover on first block');
      }
    }
  },
  
  // Check editor structure
  checkStructure() {
    console.log('=== Editor Structure Check ===');
    
    const editor = document.querySelector('.editor-wrapper');
    const prosemirror = document.querySelector('.ProseMirror');
    const blocks = document.querySelectorAll('.block-wrapper');
    
    console.log('Editor wrapper:', !!editor);
    console.log('ProseMirror:', !!prosemirror);
    console.log('Block count:', blocks.length);
    
    if (prosemirror) {
      const pmStyles = getComputedStyle(prosemirror);
      console.log('ProseMirror padding:', {
        left: pmStyles.paddingLeft,
        right: pmStyles.paddingRight
      });
    }
    
    blocks.forEach((block, i) => {
      const wrapper = block as HTMLElement;
      const hoverTarget = wrapper.querySelector('.hover-target');
      const handle = wrapper.querySelector('.block-handle');
      const content = wrapper.querySelector('.block-content');
      
      console.log(`Block ${i}:`, {
        type: wrapper.getAttribute('data-block-type'),
        hasHoverTarget: !!hoverTarget,
        hasHandle: !!handle,
        hasContent: !!content,
        handleVisible: handle ? getComputedStyle(handle).opacity : 'N/A'
      });
    });
  }
};

// Attach to window
if (typeof window !== 'undefined') {
  (window as any).testHover = TestHoverHandles;
  console.log('Test utilities loaded. Use window.testHover to debug hover handles.');
} 