'use client'

import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  company?: string
  avatar?: string
}

export function TestimonialCard({ quote, author, role, company, avatar }: TestimonialCardProps) {
  const initials = author.split(' ').map(n => n[0]).join('')
  
  return (
    <Card className="p-6 h-full flex flex-col justify-between bg-card/50 border-muted hover:border-muted-foreground/20 transition-colors">
      <div className="space-y-4">
        {/* Quote */}
        <blockquote className="text-lg leading-relaxed">
          &ldquo;{quote}&rdquo;
        </blockquote>
      </div>
      
      {/* Author */}
      <div className="flex items-center gap-4 mt-6">
        <Avatar className="h-12 w-12">
          <AvatarImage src={avatar} alt={author} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-semibold">{author}</div>
          <div className="text-sm text-muted-foreground">
            {role}{company && ` at ${company}`}
          </div>
        </div>
      </div>
    </Card>
  )
} 