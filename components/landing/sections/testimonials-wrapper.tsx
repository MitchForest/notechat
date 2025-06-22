'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton for testimonials
function TestimonialsSkeleton() {
  return (
    <div className="py-24">
      <div className="container mx-auto px-4 space-y-12">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        
        {/* Carousel skeleton */}
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-none w-[400px]">
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lazy load the testimonials section
export const TestimonialsWrapper = dynamic(
  () => import('./testimonials-section').then(mod => ({ default: mod.TestimonialsSection })),
  {
    loading: () => <TestimonialsSkeleton />,
    ssr: true
  }
) 