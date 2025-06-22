'use client'

import { useRouter } from 'next/navigation'
import { HeroSection } from './hero-section'

export function HeroWrapper() {
  const router = useRouter()

  const handleGetStarted = () => {
    router.push('/signin')
  }

  const handleLearnMore = () => {
    const element = document.getElementById('how-it-works')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <HeroSection 
      onGetStarted={handleGetStarted}
      onLearnMore={handleLearnMore}
    />
  )
} 