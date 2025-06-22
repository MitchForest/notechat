'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
}

interface PricingCardProps {
  tier: PricingTier
  delay?: number
}

export function PricingCard({ tier, delay = 0 }: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="relative h-full"
    >
      {tier.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 shadow-md">
            Most Popular
          </Badge>
        </div>
      )}
      
      <Card className={cn(
        "h-full p-8 transition-shadow duration-300",
        tier.popular && "border-primary shadow-lg"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="space-y-2 mb-6">
            <h3 className="text-2xl font-bold">{tier.name}</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">{tier.price}</span>
              {tier.price !== "$0" && (
                <span className="text-muted-foreground">/month</span>
              )}
            </div>
            <p className="text-muted-foreground">{tier.description}</p>
          </div>
          
          {/* Features */}
          <ul className="space-y-3 flex-grow mb-8">
            {tier.features.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start gap-3"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: delay + index * 0.05 }}
                viewport={{ once: true }}
              >
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm leading-relaxed">{feature}</span>
              </motion.li>
            ))}
          </ul>
          
          {/* CTA */}
          <Button 
            className="w-full" 
            variant={tier.variant}
            size="lg"
          >
            {tier.cta}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
} 