'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Github } from 'lucide-react'
import Link from 'next/link'

export function FinalCTASection() {
  return (
    <section className="relative py-24 overflow-hidden bg-muted/30">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
      </div>
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center space-y-8"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
            Ready to write smarter, not harder?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground">
            Join thousands of users who are already thinking better with an AI that learns how they write
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button size="lg" className="min-w-[200px]" asChild>
                <Link href="/signin">
                  <Github className="w-5 h-5 mr-2" />
                  Sign in with GitHub
                </Link>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button size="lg" variant="outline" className="min-w-[200px]" asChild>
                <Link href="/signin">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Link>
              </Button>
            </motion.div>
          </div>
          
          <p className="text-sm text-muted-foreground pt-4">
            No credit card required • Free forever with 10 AI requests/day
          </p>
        </motion.div>
      </div>
    </section>
  )
} 