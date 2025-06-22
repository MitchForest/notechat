'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Github, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileMenu } from './mobile-menu'
import { navItems } from './nav-items'
import { ThemeToggle } from '@/components/theme/theme-toggle'

export function LandingHeader() {
  const [showHeader, setShowHeader] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const heroHeight = window.innerHeight // Approximate hero height
      
      if (currentScrollY > heroHeight) {
        // Only show header after scrolling past hero
        // Hide on scroll down, show on scroll up
        setShowHeader(currentScrollY < lastScrollY)
      } else {
        // Always hide when in hero section
        setShowHeader(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    // Use requestAnimationFrame for smooth performance
    let rafId: number
    const throttledHandleScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(handleScroll)
    }

    window.addEventListener('scroll', throttledHandleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll)
      cancelAnimationFrame(rafId)
    }
  }, [lastScrollY])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-background transition-transform duration-300',
        showHeader ? 'translate-y-0 border-b' : '-translate-y-full'
      )}
    >
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">NoteChat.AI</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost" className="hidden md:inline-flex">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/signin">
                <Github className="w-4 h-4 mr-2" />
                Sign In
              </Link>
            </Button>
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-md transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        onNavigate={(e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
          e.preventDefault()
          const element = document.querySelector(href)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
          setIsMobileMenuOpen(false)
        }}
      />
    </header>
  )
} 