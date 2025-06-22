'use client'

import { LandingHeader } from '@/components/landing/header/landing-header'
import { HeroWrapper } from '@/components/landing/sections/hero-wrapper'
import { FeaturesSection } from '@/components/landing/sections/features-section'
import { HowItWorksSection } from '@/components/landing/sections/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/sections/testimonials-section'

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroWrapper />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        {/* TODO: Add more sections in future sprints */}
        {/* <PricingSection /> */}
        {/* <FAQSection /> */}
        {/* <CTASection /> */}
      </main>
    </>
  )
} 