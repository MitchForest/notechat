import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            Something went wrong during the authentication process. Please try again.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/auth/signin">Back to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 