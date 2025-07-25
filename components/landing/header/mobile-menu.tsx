'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, Variants } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { NavItem } from './nav-items'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navItems: NavItem[]
  onNavigate: (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => void
}

export function MobileMenu({ isOpen, onClose, navItems, onNavigate }: MobileMenuProps) {
  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleTabKey = (e: KeyboardEvent) => {
      const focusableElements = document.querySelectorAll(
        '#mobile-menu a, #mobile-menu button'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.key === 'Tab') {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    
    // Focus first element when menu opens
    const timer = setTimeout(() => {
      const firstLink = document.querySelector('#mobile-menu a') as HTMLElement
      firstLink?.focus()
    }, 100)

    return () => {
      document.removeEventListener('keydown', handleTabKey)
      clearTimeout(timer)
    }
  }, [isOpen])

  const menuVariants: Variants = {
    closed: {
      x: '100%',
      transition: { 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 40 
      }
    },
    open: {
      x: 0,
      transition: { 
        type: 'spring' as const, 
        stiffness: 400, 
        damping: 40 
      }
    }
  }

  const backdropVariants: Variants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial="closed"
        animate="open"
        exit="closed"
        variants={backdropVariants}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={onClose}
      />

      {/* Menu */}
      <motion.div
        id="mobile-menu"
        initial="closed"
        animate="open"
        exit="closed"
        variants={menuVariants}
        className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l z-50 md:hidden"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (item.isSection) {
                        onNavigate(e, item.href)
                      }
                      onClose()
                    }}
                    className="block px-4 py-3 rounded-md text-base font-medium hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* CTAs */}
          <div className="p-4 border-t space-y-3">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/signin" onClick={onClose}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Sign In with GitHub
              </Link>
            </Button>
            <Button className="w-full" asChild>
              <Link href="/signin" onClick={onClose}>
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Sign In with Google
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  )
} 