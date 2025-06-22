/**
 * Test utility for verifying BlockUI container fixes
 * Usage: Run in browser console after editor loads
 */

export function testBlockUI() {
  console.group('🧪 BlockUI Container Test');
  
  // Check if editor wrapper exists
  const editorWrapper = document.querySelector('.editor-wrapper');
  console.log('1. Editor wrapper found:', !!editorWrapper, editorWrapper);
  
  // Check if block handle portal exists
  const portal = document.querySelector('.block-handle-portal');
  console.log('2. Block handle portal found:', !!portal, portal);
  
  // Check portal parent
  if (portal) {
    console.log('3. Portal parent:', portal.parentElement);
    console.log('   Is inside editor-wrapper:', portal.parentElement?.classList.contains('editor-wrapper'));
  }
  
  // Check ProseMirror editor
  const proseMirror = document.querySelector('.ProseMirror');
  console.log('4. ProseMirror editor found:', !!proseMirror);
  
  // Check for any blocks
  const blocks = proseMirror?.querySelectorAll('p, h1, h2, h3, ul, ol, blockquote, pre');
  console.log('5. Number of blocks found:', blocks?.length || 0);
  
  // Simulate hover to test handle appearance
  if (blocks && blocks.length > 0) {
    const firstBlock = blocks[0] as HTMLElement;
    const rect = firstBlock.getBoundingClientRect();
    console.log('6. First block position:', {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    });
    
    // Create and dispatch mouse event
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
      bubbles: true,
      cancelable: true
    });
    
    console.log('7. Dispatching hover event to first block...');
    firstBlock.dispatchEvent(mouseEvent);
    
    // Check if handle appeared after a short delay
    setTimeout(() => {
      const handle = document.querySelector('.block-handle');
      console.log('8. Block handle visible after hover:', !!handle && (handle as HTMLElement).style.display !== 'none');
      console.groupEnd();
    }, 100);
  } else {
    console.log('6. No blocks found to test hover');
    console.groupEnd();
  }
}

// Export to window for console access in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).testBlockUI = testBlockUI;
} 