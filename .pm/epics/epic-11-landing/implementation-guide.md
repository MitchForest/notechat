# Landing Page Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing the NoteChat.AI landing page according to our Claude-inspired minimal design system.

## Design System Alignment

### Core Principles
1. **Minimal & Clean**: No visual clutter, lots of whitespace
2. **Typography-First**: Let content speak through beautiful type
3. **Subtle Interactions**: Purposeful micro-animations
4. **No Gradients**: Solid colors only, teal accent used sparingly
5. **Card-Based**: Consistent with app design

### Color Palette
```css
/* Light Mode */
--primary: #0D7377 /* Teal accent - use sparingly */
--background: #FAF9F5 /* Warm off-white */
--foreground: #1A1A1A /* Near black text */
--card: #FFFFFF /* Pure white cards */
--muted: #F5F4ED /* Subtle backgrounds */
--border: #E6E4DB /* Soft borders */

/* Dark Mode */
--primary: #14B8A6 /* Brighter teal */
--background: #0A0A0A /* True dark */
--foreground: #F0F0F0 /* Light text */
--card: #141414 /* Elevated surfaces */
```

### Typography Scale
```css
/* Headings */
h1: 3.75rem (60px) - Hero only
h2: 2.5rem (40px) - Section headings  
h3: 1.875rem (30px) - Subsection headings
h4: 1.25rem (20px) - Card headings

/* Body */
body: 1rem (16px) - Default
large: 1.125rem (18px) - Important text
small: 0.875rem (14px) - Secondary text

/* Font Weight */
Regular: 400
Medium: 500
Semibold: 600
Bold: 700
```

### Spacing System
```css
/* Based on 4px grid */
spacing-1: 0.25rem (4px)
spacing-2: 0.5rem (8px)
spacing-3: 0.75rem (12px)
spacing-4: 1rem (16px)
spacing-6: 1.5rem (24px)
spacing-8: 2rem (32px)
spacing-12: 3rem (48px)
spacing-16: 4rem (64px)
spacing-24: 6rem (96px)
```

## Component Implementation Order

### Phase 1: Foundation (Sprint 1)
1. Create landing page route structure
2. Implement sticky header with hide-on-scroll
3. Add authentication buttons
4. Create mobile menu

### Phase 2: Core Content (Sprint 2)
1. Build hero section with two-column layout
2. Create app mockup component
3. Implement features grid (3x2)
4. Add feature cards with icons

### Phase 3: Interactive Elements (Sprint 3)
1. Build how-it-works timeline
2. Create step visuals
3. Implement testimonials carousel
4. Add auto-scroll functionality

### Phase 4: Conversion (Sprint 4)
1. Create pricing cards
2. Build FAQ accordion
3. Implement final CTA section
4. Add legal links

### Phase 5: Polish (Sprint 5)
1. Fine-tune all animations
2. Optimize performance
3. Add SEO meta tags
4. Complete accessibility audit

## Animation Guidelines

### Framer Motion Setup
```typescript
// Consistent animation values
export const transitions = {
  fast: { duration: 0.2, ease: "easeOut" },
  normal: { duration: 0.3, ease: "easeOut" },
  slow: { duration: 0.5, ease: "easeOut" }
}

export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 }
  }
}
```

### Animation Best Practices
1. Use CSS transforms over position changes
2. Implement will-change for heavy animations
3. Respect prefers-reduced-motion
4. Keep animations under 300ms for snappy feel
5. Use stagger for list items (100ms delay)

## Responsive Breakpoints

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
}

// Container max-widths
const containers = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1400px' // Custom max for landing
}
```

## File Structure

```
app/
  (landing)/
    page.tsx              # Landing page
    layout.tsx            # Landing-specific layout
    
components/
  landing/
    header/
      landing-header.tsx  # Sticky header
      mobile-menu.tsx     # Mobile navigation
      nav-items.ts        # Navigation config
    sections/
      hero-section.tsx    # Hero with CTAs
      features-section.tsx # 6-feature grid
      how-it-works-section.tsx # Timeline
      testimonials-section.tsx # Carousel
      pricing-section.tsx # Pricing cards
      faq-section.tsx     # Accordion
      final-cta-section.tsx # Bottom CTA
    shared/
      feature-card.tsx    # Reusable feature card
      pricing-card.tsx    # Pricing tier card
      testimonial-card.tsx # Testimonial card
      section-wrapper.tsx # Consistent spacing
      app-mockup.tsx      # CSS-based mockup
```

## Key Implementation Details

### Header Hide-on-Scroll
```typescript
// Debounced scroll handler
const [scrollY, setScrollY] = useState(0)
const [visible, setVisible] = useState(true)

useEffect(() => {
  let lastScrollY = window.scrollY
  let ticking = false

  const updateScrollDir = () => {
    const scrollY = window.scrollY
    
    if (Math.abs(scrollY - lastScrollY) < 10) {
      ticking = false
      return
    }
    
    setVisible(scrollY < lastScrollY || scrollY < 80)
    lastScrollY = scrollY
    ticking = false
  }

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateScrollDir)
      ticking = true
    }
  }

  window.addEventListener('scroll', onScroll)
  return () => window.removeEventListener('scroll', onScroll)
}, [])
```

### Testimonials Auto-Scroll
```typescript
// Smooth infinite scroll
useEffect(() => {
  if (isPaused) return
  
  const interval = setInterval(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      const maxScroll = scrollWidth - clientWidth
      
      if (scrollLeft >= maxScroll - 1) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'auto' })
      } else {
        scrollRef.current.scrollBy({ left: 1, behavior: 'auto' })
      }
    }
  }, 30) // 30ms for ~33fps
  
  return () => clearInterval(interval)
}, [isPaused])
```

### FAQ Accordion
```typescript
// Using Radix UI Accordion
<Accordion type="single" collapsible>
  {faqs.map((faq, i) => (
    <AccordionItem key={i} value={`item-${i}`}>
      <AccordionTrigger>{faq.question}</AccordionTrigger>
      <AccordionContent>{faq.answer}</AccordionContent>
    </AccordionItem>
  ))}
</Accordion>
```

## Performance Optimization

### Critical CSS
```css
/* Inline critical styles in layout */
<style dangerouslySetInnerHTML={{__html: `
  /* Anti-FOUC */
  html { visibility: hidden; opacity: 0; }
  /* Critical layout styles */
  .hero { min-height: 100vh; }
`}} />
```

### Image Optimization
```typescript
// Use Next.js Image with blur placeholder
import { getPlaiceholder } from 'plaiceholder'

const { base64 } = await getPlaiceholder('/hero-image.jpg')

<Image
  src="/hero-image.jpg"
  placeholder="blur"
  blurDataURL={base64}
  priority
/>
```

### Bundle Splitting
```typescript
// Dynamic imports for below-fold sections
const PricingSection = dynamic(
  () => import('@/components/landing/sections/pricing-section'),
  { ssr: true }
)
```

## Testing Checklist

### Before Each Sprint
- [ ] Set up component structure
- [ ] Review design requirements
- [ ] Plan animations
- [ ] Consider mobile-first

### After Each Sprint
- [ ] Run `bun lint`
- [ ] Run `bun typecheck`
- [ ] Run `bun build`
- [ ] Test responsive design
- [ ] Check animations performance
- [ ] Verify accessibility

### Final Testing
- [ ] Lighthouse audit (all 90+)
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Screen reader testing
- [ ] Keyboard navigation
- [ ] Form validation

## Common Pitfalls to Avoid

1. **Over-animating**: Keep it subtle and purposeful
2. **Gradient temptation**: Stick to solid colors
3. **Too many fonts**: Use Inter only
4. **Cluttered cards**: Maintain breathing room
5. **Slow animations**: Keep under 300ms
6. **Layout shift**: Reserve space for dynamic content
7. **Poor contrast**: Test in both themes
8. **Missing states**: Include hover, focus, active

## Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Radix UI Components](https://www.radix-ui.com/)
- [Web.dev Performance](https://web.dev/performance/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

## Questions to Address

1. **Domain**: Is notechat.ai registered?
2. **Analytics**: Which service to use?
3. **Error Tracking**: Sentry integration?
4. **CDN**: Vercel Edge Network sufficient?
5. **A/B Testing**: Implement from start?

## Next Steps

1. Review this guide with the team
2. Set up tracking for conversions
3. Plan content updates post-launch
4. Schedule performance monitoring
5. Prepare launch announcement 