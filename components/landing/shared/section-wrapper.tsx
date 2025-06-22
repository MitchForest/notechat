import { cn } from '@/lib/utils'

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export function SectionWrapper({ children, className, id }: SectionWrapperProps) {
  return (
    <section id={id} className={cn('py-24', className)}>
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  )
} 