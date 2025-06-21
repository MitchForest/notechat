import CanvasShell from '@/components/layout/canvas-shell'
import CanvasView from '@/components/layout/canvas-view'
import LandingPage from '@/components/layout/landing-page'
import { getCurrentUser } from '@/lib/auth/session'
import { User } from '@/lib/db/schema'

export default async function RootPage() {
  const user = await getCurrentUser()

  if (!user) {
    return <LandingPage />
  }

  return (
    <CanvasShell user={user as User}>
      <CanvasView />
    </CanvasShell>
  )
} 