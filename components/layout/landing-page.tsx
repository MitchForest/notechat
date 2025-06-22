'use client'

import { SkipLink } from '@/components/landing/shared/skip-link'
import { StructuredData } from '@/components/landing/shared/structured-data'
import { LandingHeader } from '@/components/landing/header/landing-header'
import { HeroWrapper } from '@/components/landing/sections/hero-wrapper'
import { FeaturesSection } from '@/components/landing/sections/features-section'
import { HowItWorksSection } from '@/components/landing/sections/how-it-works-section'
import { TestimonialsSection } from '@/components/landing/sections/testimonials-section'
import { PricingSection } from '@/components/landing/sections/pricing-section'
import { FAQSection } from '@/components/landing/sections/faq-section'
import { FinalCTASection } from '@/components/landing/sections/final-cta-section'
import { FooterSection } from '@/components/landing/sections/footer-section'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <StructuredData />
      <SkipLink />
      <LandingHeader />
      <main id="main-content" className="flex-1">
        <HeroWrapper />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <FinalCTASection />
      </main>
      <FooterSection />
    </div>
  )
} 