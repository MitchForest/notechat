/**
 * Test utility for debugging hover behavior
 * Usage in browser console:
 * - enableHoverDebug() - turns on hover debugging
 * - disableHoverDebug() - turns off hover debugging
 */

export function enableHoverDebug() {
  if (typeof window !== 'undefined') {
    (window as any).debugHover = true
    console.log('🔍 Hover debugging enabled. You will see hover events in the console.')
    console.log('Disable with: disableHoverDebug()')
    
    // Add visual debugging styles
    const style = document.createElement('style')
    style.id = 'hover-debug-styles'
    style.textContent = `
      /* Show the hover zones */
      .block-wrapper::before {
        background: rgba(239, 68, 68, 0.2) !important;
        border: 2px dashed rgba(239, 68, 68, 0.5) !important;
      }
      
      /* Highlight active hover state */
      .block-wrapper.is-hovering {
        background: rgba(59, 130, 246, 0.1) !important;
      }
      
      .block-wrapper.is-hovering::before {
        background: rgba(59, 130, 246, 0.2) !important;
        border-color: rgba(59, 130, 246, 0.5) !important;
      }
      
      /* Make handle more visible */
      .block-handle {
        background: rgba(34, 197, 94, 0.9) !important;
        border: 2px solid rgba(34, 197, 94, 1) !important;
      }
      
      /* Show editor boundaries */
      .editor-wrapper {
        outline: 2px solid purple !important;
        outline-offset: -2px;
      }
    `
    document.head.appendChild(style)
  }
}

export function disableHoverDebug() {
  if (typeof window !== 'undefined') {
    (window as any).debugHover = false
    console.log('🔍 Hover debugging disabled')
    
    // Remove visual debugging styles
    const style = document.getElementById('hover-debug-styles')
    if (style) {
      style.remove()
    }
  }
}

// Expose to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).enableHoverDebug = enableHoverDebug;
  (window as any).disableHoverDebug = disableHoverDebug;
} 