# Sprint 3: How It Works & Testimonials

## Sprint Overview
Create an interactive "How It Works" section and implement a sophisticated testimonials carousel with auto-scroll functionality.

## Tasks

### 1. How It Works Section
- [ ] Create `components/landing/sections/how-it-works-section.tsx`
- [ ] Design 4-step process visualization
- [ ] Implement interactive tabs or timeline
- [ ] Add animations for step transitions
- [ ] Create mini-demos or illustrations for each step

### 2. Step Content Design
- [ ] Step 1: Create your first note
- [ ] Step 2: Organize with spaces
- [ ] Step 3: Chat with your knowledge
- [ ] Step 4: Extract and iterate

### 3. Testimonials Section
- [ ] Create `components/landing/sections/testimonials-section.tsx`
- [ ] Design minimal testimonial cards
- [ ] Implement auto-scrolling carousel
- [ ] Add pause on hover functionality
- [ ] Create smooth infinite scroll effect

### 4. Testimonial Card Component
- [ ] Create `components/landing/shared/testimonial-card.tsx`
- [ ] Design clean, minimal card layout
- [ ] Add user avatar, name, role
- [ ] Implement quote formatting
- [ ] Add subtle animations

### 5. Social Proof Elements
- [ ] Add user count badge
- [ ] Include star rating
- [ ] Add company logos (if applicable)
- [ ] Create trust indicators

## Component Specifications

### How It Works Layout
```typescript
interface Step {
  number: number
  title: string
  description: string
  visual: React.ReactNode
}

const steps: Step[] = [
  {
    number: 1,
    title: "Create your first note",
    description: "Start typing and watch as AI understands your context and offers intelligent suggestions.",
    visual: <CreateNoteVisual />
  },
  {
    number: 2,
    title: "Organize with spaces",
    description: "Group related notes into spaces and collections. Drag and drop to arrange your knowledge.",
    visual: <OrganizeVisual />
  },
  {
    number: 3,
    title: "Chat with your knowledge",
    description: "Ask questions about your notes. Get summaries, find connections, and discover insights.",
    visual: <ChatVisual />
  },
  {
    number: 4,
    title: "Extract and iterate",
    description: "Turn conversations into new notes. Build on your ideas and watch your knowledge grow.",
    visual: <ExtractVisual />
  }
]
```

### Interactive Timeline Component
```typescript
const HowItWorksTimeline = () => {
  const [activeStep, setActiveStep] = useState(0)
  
  return (
    <div className="space-y-12">
      {/* Timeline navigation */}
      <div className="flex justify-between items-center relative">
        {/* Progress line */}
        <div className="absolute left-0 right-0 h-0.5 bg-border top-1/2 -translate-y-1/2" />
        <div 
          className="absolute left-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 transition-all duration-500"
          style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
        />
        
        {/* Step indicators */}
        {steps.map((step, index) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(index)}
            className={cn(
              "relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all",
              "border-2 bg-background",
              activeStep >= index 
                ? "border-primary bg-primary text-primary-foreground" 
                : "border-border hover:border-primary/50"
            )}
          >
            {step.number}
          </button>
        ))}
      </div>
      
      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="grid lg:grid-cols-2 gap-12 items-center"
        >
          <div className="space-y-4">
            <h3 className="text-2xl font-bold">{steps[activeStep].title}</h3>
            <p className="text-lg text-muted-foreground">
              {steps[activeStep].description}
            </p>
          </div>
          <div className="relative">
            {steps[activeStep].visual}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

### Testimonial Card Design
```typescript
interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  company?: string
  avatar?: string
}

const TestimonialCard = ({ quote, author, role, company, avatar }: TestimonialCardProps) => (
  <Card className="p-6 h-full flex flex-col justify-between">
    <div className="space-y-4">
      {/* Quote */}
      <blockquote className="text-lg leading-relaxed">
        "{quote}"
      </blockquote>
    </div>
    
    {/* Author */}
    <div className="flex items-center gap-4 mt-6">
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatar} alt={author} />
        <AvatarFallback>{author.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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
```

### Auto-Scrolling Carousel
```typescript
const TestimonialsCarousel = () => {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    if (isPaused || !scrollRef.current) return
    
    const scroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 1
        
        if (isAtEnd) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
        } else {
          scrollRef.current.scrollBy({ left: 1, behavior: 'auto' })
        }
      }
    }
    
    const interval = setInterval(scroll, 30)
    return () => clearInterval(interval)
  }, [isPaused])
  
  return (
    <div
      ref={scrollRef}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="flex gap-6 overflow-x-auto scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {/* Duplicate testimonials for infinite scroll effect */}
      {[...testimonials, ...testimonials].map((testimonial, index) => (
        <div key={index} className="flex-none w-96">
          <TestimonialCard {...testimonial} />
        </div>
      ))}
    </div>
  )
}
```

### Step Visuals (Minimal Illustrations)
```typescript
// Example: Create Note Visual
const CreateNoteVisual = () => (
  <div className="relative">
    <div className="bg-card rounded-lg border p-6 shadow-lg">
      {/* Editor mockup with ghost text */}
      <div className="space-y-4">
        <div className="h-4 bg-foreground/10 rounded w-3/4" />
        <div className="h-4 bg-foreground/10 rounded w-full" />
        <div className="h-4 bg-primary/20 rounded w-1/2 animate-pulse" />
      </div>
    </div>
    
    {/* AI indicator */}
    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2">
      <Sparkles className="w-4 h-4" />
    </div>
  </div>
)
```

## Animation Strategies

### Step Transitions
```typescript
// Smooth step indicator animation
const stepIndicatorVariants = {
  inactive: { scale: 1, backgroundColor: 'var(--background)' },
  active: { 
    scale: 1.1, 
    backgroundColor: 'var(--primary)',
    transition: { duration: 0.3 }
  }
}

// Content fade and slide
const contentVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 }
}
```

### Testimonial Animations
```typescript
// Fade in on scroll
const testimonialVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
}
```

## Content Examples

### Testimonials
```typescript
const testimonials = [
  {
    quote: "NoteChat has transformed how I manage my research. The AI chat feature helps me find connections I never noticed before.",
    author: "Sarah Chen",
    role: "PhD Researcher",
    company: "Stanford University"
  },
  {
    quote: "The ghost completions are incredible. It's like having a writing partner who knows exactly what I'm thinking.",
    author: "Marcus Johnson",
    role: "Content Strategist",
    company: "TechCorp"
  },
  {
    quote: "I've tried every note-taking app. NoteChat is the first that actually helps me think better, not just organize better.",
    author: "Emily Rodriguez",
    role: "Product Designer",
    company: "Designlab"
  },
  {
    quote: "The ability to chat with my notes has been a game-changer for my workflow. It's like having a personal knowledge assistant.",
    author: "David Kim",
    role: "Software Engineer",
    company: "StartupXYZ"
  }
]
```

## Responsive Considerations

### How It Works
- Mobile: Vertical timeline with stacked content
- Tablet: Side-by-side layout maintained
- Desktop: Full timeline with animations

### Testimonials
- Mobile: Single card, swipe enabled
- Tablet: 2 cards visible
- Desktop: 3-4 cards with auto-scroll

## Performance Optimizations
- [ ] Use `will-change` for animated elements
- [ ] Implement intersection observer for animations
- [ ] Optimize carousel performance with virtual scrolling
- [ ] Debounce scroll events
- [ ] Use CSS transforms over position changes

## Accessibility
- [ ] Keyboard navigation for timeline
- [ ] Pause auto-scroll on focus
- [ ] Proper ARIA labels for carousel
- [ ] Screen reader announcements for step changes
- [ ] Respect prefers-reduced-motion

## Testing Checklist
- [ ] Timeline navigation works smoothly
- [ ] Auto-scroll pauses on hover
- [ ] Animations are performant
- [ ] Content is readable at all sizes
- [ ] Touch gestures work on mobile
- [ ] No layout shift during transitions

## Files to Create
1. `components/landing/sections/how-it-works-section.tsx`
2. `components/landing/sections/testimonials-section.tsx`
3. `components/landing/shared/testimonial-card.tsx`
4. `components/landing/shared/step-visuals.tsx`
5. `components/landing/shared/timeline-navigation.tsx`

## Estimated Time: 8-10 hours

## Definition of Done
- [ ] How it works section fully interactive
- [ ] All 4 steps have visuals and content
- [ ] Testimonials carousel auto-scrolls smoothly
- [ ] Pause on hover works correctly
- [ ] All animations are smooth
- [ ] Responsive design implemented
- [ ] Accessibility requirements met
- [ ] Performance optimized 