/**
 * Component: Panels
 * Purpose: Resizable panels wrapper for main content and AI chat
 * Features:
 * - Horizontal resizable panels
 * - Customizable default layout
 * - Smooth resize handling
 * - Responsive design
 * 
 * Modified: 2024-12-19 - Initial implementation
 */
"use client"

import { ReactNode } from "react"
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels"

interface PanelsProps {
  defaultLayout?: number[]
  children: [ReactNode, ReactNode]
  className?: string
}

export function ResizablePanels({ defaultLayout = [60, 40], children, className }: PanelsProps) {
  return (
    <PanelGroup
      direction="horizontal"
      className={className}
    >
      <Panel defaultSize={defaultLayout[0]} minSize={30}>
        <div className="h-full overflow-auto scrollbar-thin">
          {children[0]}
        </div>
      </Panel>
      
      <PanelResizeHandle className="w-px bg-border hover:bg-ai-primary/50 transition-colors data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full" />
      
      <Panel defaultSize={defaultLayout[1]} minSize={20}>
        <div className="h-full overflow-auto scrollbar-thin">
          {children[1]}
        </div>
      </Panel>
    </PanelGroup>
  )
} 