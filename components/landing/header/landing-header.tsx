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
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false)

  useEffect(() => {
    let rafId: number | null = null
    const heroHeight = 600 // Approximate hero height

    const handleScroll = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        
        // Check if we've scrolled past hero
        if (currentScrollY > heroHeight) {
          setHasScrolledPastHero(true)
          
          // Show when scrolling down, hide when scrolling up
          if (currentScrollY > lastScrollY) {
            setIsVisible(true)
          } else {
            setIsVisible(false)
          }
        } else {
          setHasScrolledPastHero(false)
          setIsVisible(false)
        }
        
        setLastScrollY(currentScrollY)
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [lastScrollY])

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault()
    const element = document.querySelector(sectionId)
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: offsetTop, behavior: 'smooth' })
    }
  }

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm transition-all duration-300 ease-in-out",
          hasScrolledPastHero && isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0",
          hasScrolledPastHero && "border-b"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="font-semibold text-xl">
              NoteChat.AI
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => item.isSection && handleNavigate(e, item.href)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/signin">
                  <Github className="w-4 h-4 mr-2" />
                  Sign In with GitHub
                </Link>
              </Button>
              <Button size="sm" asChild className="hidden sm:inline-flex">
                <Link href="/signin">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign In with Google
                </Link>
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isOpen && (
        <MobileMenu
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          navItems={navItems}
          onNavigate={handleNavigate}
        />
      )}
    </>
  )
} 