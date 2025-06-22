export const HoverDebugger = {
  checkBlockStructure() {
    console.log('=== HOVER DEBUG: Block Structure ===');
    
    // Check for block wrappers
    const blockWrappers = document.querySelectorAll('.block-wrapper');
    console.log(`Found ${blockWrappers.length} block wrappers`);
    
    blockWrappers.forEach((wrapper, index) => {
      const hoverTarget = wrapper.querySelector('.hover-target');
      const blockHandle = wrapper.querySelector('.block-handle');
      const blockContent = wrapper.querySelector('.block-content');
      
      console.log(`Block ${index}:`, {
        hasHoverTarget: !!hoverTarget,
        hasBlockHandle: !!blockHandle,
        hasBlockContent: !!blockContent,
        blockId: wrapper.getAttribute('data-block-id'),
        blockType: wrapper.getAttribute('data-block-type'),
        classes: wrapper.className,
        computedStyles: {
          position: getComputedStyle(wrapper).position,
          display: getComputedStyle(wrapper).display,
        }
      });
      
      if (hoverTarget) {
        const htStyles = getComputedStyle(hoverTarget);
        console.log(`  Hover Target:`, {
          position: htStyles.position,
          left: htStyles.left,
          right: htStyles.right,
          zIndex: htStyles.zIndex,
          pointerEvents: htStyles.pointerEvents,
          dimensions: `${hoverTarget.clientWidth}x${hoverTarget.clientHeight}`
        });
      }
      
      if (blockHandle) {
        const bhStyles = getComputedStyle(blockHandle);
        console.log(`  Block Handle:`, {
          position: bhStyles.position,
          left: bhStyles.left,
          opacity: bhStyles.opacity,
          display: bhStyles.display,
          zIndex: bhStyles.zIndex,
          pointerEvents: bhStyles.pointerEvents,
          visible: blockHandle.classList.contains('visible')
        });
      }
    });
  },
  
  testHover() {
    console.log('=== HOVER DEBUG: Testing Hover ===');
    
    const blockWrappers = document.querySelectorAll('.block-wrapper');
    
    blockWrappers.forEach((wrapper, index) => {
      // Add hover state programmatically
      wrapper.classList.add('hover-debug');
      
      setTimeout(() => {
        const blockHandle = wrapper.querySelector('.block-handle');
        if (blockHandle) {
          const styles = getComputedStyle(blockHandle);
          console.log(`Block ${index} handle after hover:`, {
            opacity: styles.opacity,
            pointerEvents: styles.pointerEvents
          });
        }
        wrapper.classList.remove('hover-debug');
      }, 100);
    });
  },
  
  addVisualDebug() {
    const style = document.createElement('style');
    style.id = 'hover-debug-styles';
    style.textContent = `
      /* Visual debug styles */
      .block-wrapper {
        border: 1px dashed red !important;
      }
      
      .hover-target {
        background: rgba(0, 255, 0, 0.1) !important;
        border: 1px solid green !important;
      }
      
      .block-handle {
        background: rgba(255, 0, 0, 0.3) !important;
        opacity: 1 !important;
      }
      
      .block-content {
        border: 1px solid blue !important;
      }
      
      /* Force hover state */
      .hover-debug .block-handle {
        opacity: 1 !important;
        pointer-events: all !important;
      }
    `;
    document.head.appendChild(style);
  },
  
  removeVisualDebug() {
    const style = document.getElementById('hover-debug-styles');
    if (style) {
      style.remove();
    }
  },
  
  checkEditorPadding() {
    const prosemirror = document.querySelector('.ProseMirror');
    if (prosemirror) {
      const styles = getComputedStyle(prosemirror);
      console.log('ProseMirror padding:', {
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        paddingTop: styles.paddingTop,
        paddingBottom: styles.paddingBottom,
      });
    }
  }
};

// Attach to window for console access
if (typeof window !== 'undefined') {
  (window as any).hoverDebug = HoverDebugger;
} 