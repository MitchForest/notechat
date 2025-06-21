import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getCurrentUser } from '@/lib/auth/session'
import { Github, Sparkles } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser()
  const awaitedSearchParams = await searchParams;
  const callbackUrl = awaitedSearchParams?.callbackUrl ?? '/canvas'
  
  if (user) {
    const redirectUrl = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;
    redirect(redirectUrl)
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Choose your preferred sign-in method to continue to NoteChat.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/signin/github">
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </a>
          </Button>
          <Button variant="outline" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/signin/google">
              <Sparkles className="mr-2 h-4 w-4" />
              Continue with Google
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
} 