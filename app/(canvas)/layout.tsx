/**
 * Layout: Canvas - App Shell
 * Purpose: Main application shell with proper layout management
 * Features:
 * - Collapsible sidebar that doesn't break layout
 * - Flexible main content area
 * - Proper state management for different view modes
 * 
 * Modified: 2024-12-19 - Complete rewrite as app shell
 */
import { getCurrentUser } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import CanvasShell from "@/components/layout/canvas-shell";
import type { User } from "@/lib/db/schema";

export default async function CanvasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <CanvasShell user={user as User}>
        {children}
    </CanvasShell>
  )
} 