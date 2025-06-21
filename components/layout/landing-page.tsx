import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to NoteChat
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          The intelligent note-taking app that understands you.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button asChild size="lg">
            <Link href="/auth/signin">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  )
} 