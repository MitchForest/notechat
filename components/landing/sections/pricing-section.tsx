'use client'

import { motion } from 'framer-motion'
import { SectionWrapper } from '@/components/landing/shared/section-wrapper'
import { PricingCard } from '@/components/landing/shared/pricing-card'

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Unlimited notes & blocks",
      "Drag-and-drop block editor",
      "Basic AI completions (10/day)",
      "Grammar checking",
      "Basic organization with spaces",
      "Export to Markdown",
      "Basic search"
    ],
    cta: "Start Free",
    variant: "default" as const
  },
  {
    name: "Pro",
    price: "$10",
    description: "For power users and professionals",
    features: [
      "Everything in Free",
      "Unlimited adaptive AI completions",
      "AI learns your writing style",
      "Custom AI commands & personas",
      "Advanced grammar & style checking",
      "Priority AI processing",
      "API access",
      "Advanced search & filters",
      "Version history",
      "Collaboration features (coming soon)"
    ],
    cta: "Upgrade to Pro",
    popular: true,
    variant: "default" as const
  }
]

export function PricingSection() {
  return (
    <SectionWrapper id="pricing" className="bg-muted/30">
      <div className="space-y-12">
        {/* Section header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center space-y-4"
        >
          <h2 className="text-3xl md:text-4xl font-bold">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free and upgrade when you need more AI power. No hidden fees, no surprises.
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingCard 
              key={tier.name} 
              tier={tier} 
              delay={index * 0.2}
            />
          ))}
        </div>

        {/* Enterprise option */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <p className="text-muted-foreground">
            Need custom features or team collaboration?{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Contact us for Enterprise pricing
            </a>
          </p>
        </motion.div>
      </div>
    </SectionWrapper>
  )
} 