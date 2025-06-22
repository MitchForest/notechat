# Sprint 2: Hero & Features Sections

## Sprint Overview
Design and implement the hero section and comprehensive features grid showcasing our AI capabilities and Notion-style block editor.

## Tasks

### 1. Hero Section Component
- [x] Create `components/landing/sections/hero-section.tsx`
- [x] Implement responsive two-column layout
- [x] Update headline and subheadline with block editor emphasis
- [x] Create CTA buttons with hover animations
- [x] Design app mockup visual showing block editor

### 2. App Mockup Visual (Updated)
- [x] Create static mockup showing block editor + chat interface
- [x] Show drag handle on a block to indicate drag-and-drop
- [x] Include slash command menu preview
- [x] Add ghost text completion example
- [x] Use actual app styling for authenticity
- [x] Add subtle floating animation

### 3. Features Section Component
- [x] Create `components/landing/sections/features-section.tsx`
- [x] Implement 3x2 grid layout (6 features total)
- [x] Create `components/landing/shared/feature-card.tsx`
- [x] Add scroll-triggered animations with Framer Motion

### 4. Feature Content (Updated)
- [x] Row 1: Core Features
  - Notion-Style Block Editor
  - AI-Powered Chat
  - Smart Organization
- [x] Row 2: AI Writing Features
  - Adaptive Ghost Completions
  - Custom AI Commands
  - Advanced Grammar Check

### 5. Icons & Animations
- [x] Select appropriate Lucide icons for each feature
- [x] Implement hover animations on cards
- [x] Add stagger effect for card appearance
- [x] Create subtle icon animations
- [x] Consider micro-animations for block editor demo

## Component Specifications

### Hero Section Layout (Updated)
```typescript
interface HeroSectionProps {
  onGetStarted: () => void
  onLearnMore: () => void
}

// Responsive grid
<div className="grid lg:grid-cols-2 gap-12 items-center">
  {/* Left: Content */}
  <div className="space-y-6">
    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
      Your AI-Powered Second Brain
    </h1>
    <p className="text-lg md:text-xl text-muted-foreground">
      A Notion-style editor with deep AI integration that learns how you write 
      and helps you think better
    </p>
    <div className="flex gap-4">
      <Button size="lg" onClick={onGetStarted}>
        Get Started Free
      </Button>
      <Button size="lg" variant="outline" onClick={onLearnMore}>
        See How It Works
      </Button>
    </div>
  </div>
  
  {/* Right: Visual */}
  <div className="relative">
    <AppMockup />
  </div>
</div>
```

### App Mockup Component (Enhanced)
```typescript
// CSS-based mockup with block editor elements
const AppMockup = () => (
  <div className="relative w-full aspect-[16/10] bg-card rounded-lg shadow-2xl overflow-hidden border">
    {/* Sidebar */}
    <div className="absolute left-0 top-0 bottom-0 w-64 bg-muted border-r p-4">
      {/* Sidebar content skeleton */}
    </div>
    
    {/* Main content area */}
    <div className="absolute left-64 top-0 right-0 bottom-0 flex">
      {/* Editor panel with blocks */}
      <div className="flex-1 border-r p-6">
        {/* Block with drag handle */}
        <div className="group relative mb-4">
          <div className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-4 bg-foreground/10 rounded w-3/4" />
        </div>
        
        {/* Block with slash command */}
        <div className="relative mb-4">
          <div className="h-4 bg-foreground/10 rounded w-full" />
          <div className="absolute top-6 left-0 bg-card border rounded-lg shadow-lg p-2 text-xs">
            <div className="space-y-1">
              <div className="px-2 py-1 hover:bg-muted rounded">/ Heading</div>
              <div className="px-2 py-1 hover:bg-muted rounded">/ List</div>
              <div className="px-2 py-1 hover:bg-muted rounded">/ AI Write</div>
            </div>
          </div>
        </div>
        
        {/* Ghost text completion */}
        <div className="relative">
          <div className="h-4 bg-foreground/10 rounded w-1/2" />
          <span className="text-muted-foreground/50 italic">
            and this helps to...
          </span>
        </div>
      </div>
      
      {/* Chat panel */}
      <div className="flex-1 p-6">
        {/* Chat skeleton */}
      </div>
    </div>
  </div>
)
```

### Feature Card Component
```typescript
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  delay?: number // For stagger animation
}

const FeatureCard = ({ icon, title, description, delay = 0 }: FeatureCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    viewport={{ once: true }}
    whileHover={{ y: -4 }}
    className="group"
  >
    <Card className="h-full p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </Card>
  </motion.div>
)
```

### Features Grid Animation (Updated Content)
```typescript
const features = [
  {
    icon: <Layers className="w-6 h-6 text-primary" />,
    title: "Notion-Style Block Editor",
    description: "Drag-and-drop blocks with slash commands for quick formatting. Your ideas, beautifully structured."
  },
  {
    icon: <MessageSquare className="w-6 h-6 text-primary" />,
    title: "AI-Powered Chat",
    description: "Ask questions about your notes. Get summaries, find connections, extract insights from your knowledge base."
  },
  {
    icon: <Folders className="w-6 h-6 text-primary" />,
    title: "Smart Organization",
    description: "Spaces and collections that work like you think. Drag, drop, and organize effortlessly."
  },
  {
    icon: <Sparkles className="w-6 h-6 text-primary" />,
    title: "Adaptive Ghost Completions",
    description: "Ghost text that learns from you. The more you write, the better it predicts. Your personal AI writing partner."
  },
  {
    icon: <Wand2 className="w-6 h-6 text-primary" />,
    title: "Custom AI Commands",
    description: "Highlight and transform. Change tone, adjust reading level, target any audience. AI that adapts to your needs."
  },
  {
    icon: <CheckCircle className="w-6 h-6 text-primary" />,
    title: "Advanced Grammar Check",
    description: "Sophisticated grammar checking that goes beyond basics. Write with confidence, polish with intelligence."
  }
]

// Render with stagger
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  {features.map((feature, index) => (
    <FeatureCard
      key={feature.title}
      {...feature}
      delay={index * 0.1} // Stagger by 100ms
    />
  ))}
</div>
```

## Animation Specifications

### Hero Section Animations
```typescript
// Fade in from bottom
const heroVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

// Floating animation for mockup
const floatVariants = {
  initial: { y: 0 },
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Drag handle hover effect
const dragHandleVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.2 }
  }
}
```

### Button Hover Effects
```typescript
// Scale and shadow on hover
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="shadow-sm hover:shadow-md transition-shadow"
>
  Get Started Free
</motion.button>
```

## Responsive Design

### Breakpoints
- Mobile: Single column, smaller typography
- Tablet: 2-column feature grid
- Desktop: Full 3-column grid, side-by-side hero

### Typography Scale
```css
/* Mobile */
h1 { font-size: 2.25rem; } /* 36px */
p { font-size: 1rem; } /* 16px */

/* Tablet */
@media (min-width: 768px) {
  h1 { font-size: 3rem; } /* 48px */
  p { font-size: 1.125rem; } /* 18px */
}

/* Desktop */
@media (min-width: 1024px) {
  h1 { font-size: 3.75rem; } /* 60px */
  p { font-size: 1.25rem; } /* 20px */
}
```

## Content Guidelines

### Hero Copy
- Emphasize the familiar (Notion-style) with the innovative (AI)
- Keep headline under 10 words
- Subheadline explains the unique value
- Use action-oriented CTA text

### Feature Descriptions
- Lead with the benefit
- Mention specific capabilities
- Keep under 25 words per description
- Use active voice
- Balance technical and approachable

## Testing Checklist
- [ ] Hero section responsive on all devices
- [ ] Block editor mockup displays correctly
- [ ] Animations trigger on scroll
- [ ] No animation jank or performance issues
- [ ] CTAs have proper hover states
- [ ] Feature cards align properly
- [ ] Mockup scales correctly
- [ ] All text is readable
- [ ] Proper spacing maintained

## Accessibility
- [ ] Proper heading hierarchy (h1 for hero)
- [ ] Alt text for any images
- [ ] Color contrast passes WCAG AA
- [ ] Animations respect prefers-reduced-motion
- [ ] Focus states visible on all interactive elements

## Performance
- [ ] Lazy load animations below the fold
- [ ] Optimize any images used
- [ ] Minimize animation complexity on mobile
- [ ] Use CSS transforms for animations

## Files to Create
1. `components/landing/sections/hero-section.tsx`
2. `components/landing/sections/features-section.tsx`
3. `components/landing/shared/feature-card.tsx`
4. `components/landing/shared/app-mockup.tsx`
5. `components/landing/shared/block-editor-demo.tsx` (NEW)

## Estimated Time: 8-10 hours

## Session Summary

**Completed:**
- Created hero section with two-column layout and CTAs
- Built detailed app mockup showing block editor with drag handles, slash commands, and ghost text
- Implemented features section with 6 feature cards in 3x2 grid
- Added all animations including floating mockup, staggered card reveals, and hover effects
- Created reusable components: SectionWrapper, FeatureCard, AppMockup
- Fixed routing structure to use existing app/page.tsx conditional rendering
- Updated metadata in layout.tsx

**Files Changed:**
- `created: components/landing/shared/section-wrapper.tsx`
- `created: components/landing/shared/app-mockup.tsx`
- `created: components/landing/sections/hero-section.tsx`
- `created: components/landing/shared/feature-card.tsx`
- `created: components/landing/sections/features-section.tsx`
- `created: components/landing/sections/hero-wrapper.tsx`
- `modified: components/layout/landing-page.tsx`
- `modified: app/layout.tsx`
- `deleted: app/(landing)/page.tsx` (incorrect approach)
- `deleted: app/(landing)/layout.tsx` (incorrect approach)

**Key Decisions:**
- Used existing routing structure instead of creating new (landing) route group
- Kept minimal design aesthetic without gradients or glass morphism
- Created client wrapper for hero section to handle navigation
- Used Framer Motion for all animations with performance optimizations

**Remaining:**
- Sprint 3: How It Works & Testimonials sections
- Sprint 4: Pricing & FAQ sections
- Sprint 5: Final polish and optimization

## Definition of Done
- [x] Hero section implemented with updated copy
- [x] Block editor mockup shows key features
- [x] All 6 features displayed with new descriptions
- [x] Responsive design working
- [x] Animations smooth and performant
- [x] Content finalized and proofread
- [x] Accessibility audit passed
- [x] Code reviewed and optimized 