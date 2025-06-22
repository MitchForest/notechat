'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number
}

export function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -4 }}
      className="group h-full"
    >
      <Card className="h-full p-6 hover:shadow-lg transition-shadow duration-300 border-muted hover:border-muted-foreground/20">
        <div className="space-y-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
            {icon}
          </div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </Card>
    </motion.div>
  )
} 