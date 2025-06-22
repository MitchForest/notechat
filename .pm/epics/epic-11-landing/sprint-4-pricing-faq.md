# Sprint 4: Pricing & FAQ Sections

## Sprint Overview
Implement the pricing cards with clear value propositions and create an accessible FAQ accordion component that addresses questions about our block editor, AI learning, and customization features.

## Tasks

### 1. Pricing Section
- [ ] Create `components/landing/sections/pricing-section.tsx`
- [ ] Design pricing card component
- [ ] Implement Free vs Pro comparison
- [ ] Add popular badge to Pro plan
- [ ] Create enterprise contact link

### 2. Pricing Card Component
- [ ] Create `components/landing/shared/pricing-card.tsx`
- [ ] Design feature list with checkmarks
- [ ] Add hover effects and animations
- [ ] Implement responsive layout
- [ ] Add CTA buttons with proper styling

### 3. FAQ Section (Updated)
- [ ] Create `components/landing/sections/faq-section.tsx`
- [ ] Implement accordion component
- [ ] Add smooth expand/collapse animations
- [ ] Include questions about block editor
- [ ] Address AI learning and privacy
- [ ] Explain customization options

### 4. Final CTA Section
- [ ] Create `components/landing/sections/final-cta-section.tsx`
- [ ] Update copy to emphasize "write smarter"
- [ ] Add email capture form (optional)
- [ ] Create background animation/pattern
- [ ] Implement responsive design

### 5. Content Creation
- [ ] Write comprehensive FAQ questions and answers
- [ ] Define detailed pricing tiers and features
- [ ] Create compelling CTA copy
- [ ] Add legal links (privacy, terms)

## Component Specifications

### Pricing Card Design (Updated)
```typescript
interface PricingTier {
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  popular?: boolean
  variant?: 'default' | 'primary'
}

const pricingTiers: PricingTier[] = [
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
    variant: "default"
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
    variant: "primary"
  }
]
```

### Pricing Card Component
```typescript
const PricingCard = ({ tier }: { tier: PricingTier }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -8 }}
    className="relative"
  >
    {tier.popular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <Badge className="bg-primary text-primary-foreground">
          Most Popular
        </Badge>
      </div>
    )}
    
    <Card className={cn(
      "h-full p-8",
      tier.popular && "border-primary shadow-lg"
    )}>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">{tier.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold">{tier.price}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-muted-foreground">{tier.description}</p>
        </div>
        
        {/* Features */}
        <ul className="space-y-3">
          {tier.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
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
```

### FAQ Accordion Component (Updated)
```typescript
interface FAQItem {
  question: string
  answer: string
  category?: string
}

const faqItems: FAQItem[] = [
  {
    question: "How does the block editor work?",
    answer: "Our block editor works just like Notion - each paragraph, heading, or element is a block that you can drag and drop to reorganize. Use '/' to access commands for formatting, or simply start typing. It's intuitive and powerful.",
    category: "Editor"
  },
  {
    question: "How do AI completions learn my writing style?",
    answer: "Our AI observes which suggestions you accept or reject, learning your vocabulary, tone, and writing patterns over time. The more you use it, the better it becomes at predicting what you want to write. Your data is never shared with other users.",
    category: "AI Features"
  },
  {
    question: "Can I customize AI commands for my needs?",
    answer: "Yes! When you highlight text, you can create custom AI commands like 'Rewrite for 8th grade reading level' or 'Make this more technical.' Save your favorite transformations as presets for one-click access.",
    category: "AI Features"
  },
  {
    question: "How sophisticated is the grammar checking?",
    answer: "Our grammar checker goes beyond basic spelling and punctuation. It catches contextual errors, suggests style improvements, checks for clarity and conciseness, and can even adapt to different writing styles (academic, business, creative).",
    category: "Grammar & Style"
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Your notes are encrypted both in transit and at rest. We never train our AI models on your personal data, and you maintain full ownership of all your content. You can export or delete your data at any time.",
    category: "Privacy & Security"
  },
  {
    question: "What happens to my AI personalization if I cancel?",
    answer: "Your AI personalization data is yours. If you downgrade to Free, you'll keep your learned preferences but with limited daily AI requests. If you cancel entirely, you can export your data including AI preferences.",
    category: "Account"
  },
  {
    question: "Can I use keyboard shortcuts with the block editor?",
    answer: "Yes! All the shortcuts you'd expect work perfectly. Cmd/Ctrl+B for bold, / for commands, Tab to indent blocks, and many more. We also support custom keyboard shortcuts for power users.",
    category: "Editor"
  },
  {
    question: "How do spaces and collections work?",
    answer: "Think of spaces as different notebooks for major areas of your life (Work, Personal, Research). Collections are folders within spaces. Everything is drag-and-drop, so you can reorganize anytime.",
    category: "Organization"
  },
  {
    question: "What makes this different from Notion + ChatGPT?",
    answer: "Deep integration. Your AI understands your entire knowledge base, learns your writing style, and works seamlessly within your editor. No copy-pasting between apps - it's all in one intelligent workspace.",
    category: "General"
  }
]

const FAQAccordion = () => (
  <Accordion type="single" collapsible className="space-y-4">
    {faqItems.map((item, index) => (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        viewport={{ once: true }}
      >
        <AccordionItem value={`item-${index}`} className="border rounded-lg px-6">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="text-left">
              <div className="font-semibold">{item.question}</div>
              {item.category && (
                <div className="text-sm text-muted-foreground mt-1">
                  {item.category}
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4 text-muted-foreground">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      </motion.div>
    ))}
  </Accordion>
)
```

### Final CTA Design (Updated)
```typescript
const FinalCTA = () => (
  <section className="relative py-24 overflow-hidden">
    {/* Background pattern */}
    <div className="absolute inset-0 bg-muted/30" />
    
    <div className="container relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center space-y-8"
      >
        <h2 className="text-4xl font-bold">
          Ready to write smarter, not harder?
        </h2>
        <p className="text-xl text-muted-foreground">
          Join thousands of users who are already thinking better with an AI that learns how they write
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="min-w-[200px]">
            <Github className="w-5 h-5 mr-2" />
            Sign in with GitHub
          </Button>
          <Button size="lg" variant="outline" className="min-w-[200px]">
            <Chrome className="w-5 h-5 mr-2" />
            Sign in with Google
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          No credit card required • Free forever with 10 AI requests/day
        </p>
      </motion.div>
    </div>
  </section>
)
```

## Animation Specifications

### Pricing Cards Animation
```typescript
// Stagger animation for cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
}

// Individual card animation
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
}

// Popular badge pulse
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.popular-badge {
  animation: pulse 2s infinite;
}
```

### FAQ Accordion Animations
```typescript
// Smooth height animation for accordion
const accordionVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2 }
    }
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: 0.3 },
      opacity: { duration: 0.2, delay: 0.1 }
    }
  }
}
```

## Responsive Design

### Pricing Section
- Mobile: Stack cards vertically
- Tablet: 2 columns
- Desktop: 2 columns with optimal spacing

### FAQ Section
- Mobile: Full width accordions
- Tablet/Desktop: Max-width container
- Categories visible on all sizes

### Final CTA
- Mobile: Stack buttons vertically
- Desktop: Side-by-side buttons

## Content Guidelines

### Pricing
- Emphasize AI learning and customization in Pro
- Make feature differences clear
- Use positive language (what's included)
- Highlight unique features (adaptive AI, custom commands)

### FAQ
- Answer real concerns about AI and privacy
- Explain technical features simply
- Address comparison to competitors
- Keep answers concise but complete
- Use friendly, conversational tone

## Accessibility Requirements
- [ ] Keyboard navigation for accordion
- [ ] ARIA labels for expand/collapse
- [ ] Focus management in accordion
- [ ] Color contrast for all text
- [ ] Screen reader announcements

## Performance Considerations
- [ ] Lazy load animations below fold
- [ ] Optimize accordion transitions
- [ ] Minimize layout shift
- [ ] Use CSS transforms for animations

## Testing Checklist
- [ ] Pricing cards align properly
- [ ] Popular badge displays correctly
- [ ] FAQ accordion expands/collapses smoothly
- [ ] All animations perform well
- [ ] CTAs link to correct pages
- [ ] Responsive design works
- [ ] Keyboard navigation functions
- [ ] Categories help organize FAQs

## Files to Create
1. `components/landing/sections/pricing-section.tsx`
2. `components/landing/sections/faq-section.tsx`
3. `components/landing/sections/final-cta-section.tsx`
4. `components/landing/shared/pricing-card.tsx`
5. `components/landing/shared/faq-accordion.tsx`

## Estimated Time: 6-8 hours

## Definition of Done
- [ ] Pricing section complete with updated features
- [ ] FAQ accordion includes all new questions
- [ ] Final CTA has updated copy
- [ ] All content finalized
- [ ] Animations performant
- [ ] Responsive design tested
- [ ] Accessibility audit passed
- [ ] Links functional 