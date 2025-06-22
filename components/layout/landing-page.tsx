'use client'

import { LandingHeader } from '@/components/landing/header/landing-header'
import { HeroWrapper } from '@/components/landing/sections/hero-wrapper'
import { FeaturesSection } from '@/components/landing/sections/features-section'

export default function LandingPage() {
  return (
    <>
      <LandingHeader />
      <main>
        <HeroWrapper />
        <FeaturesSection />
        {/* TODO: Add more sections in future sprints */}
        {/* <HowItWorksSection /> */}
        {/* <TestimonialsSection /> */}
        {/* <PricingSection /> */}
        {/* <FAQSection /> */}
        {/* <CTASection /> */}
      </main>
    </>
  )
} 