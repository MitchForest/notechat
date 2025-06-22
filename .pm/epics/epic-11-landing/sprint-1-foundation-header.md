# Sprint 1: Foundation & Header

## Sprint Overview
Set up the landing page foundation and implement the sophisticated sticky header with hide-on-scroll behavior.

## Tasks

### 1. Landing Page Route Setup
- [x] Create new route at `app/(landing)/page.tsx`
- [x] Set up landing-specific layout without sidebar
- [x] Configure metadata for SEO
- [x] Add Open Graph tags

### 2. Landing Header Component
- [x] Create `components/landing/header/landing-header.tsx`
- [x] Implement sticky positioning with minimal design (no glass morphism)
- [x] Add hide-on-scroll-down, show-on-scroll-up behavior
- [x] Create navigation items (Features, How it Works, Pricing, FAQ)
- [x] Add smooth scroll to sections

### 3. Authentication CTAs
- [x] Add "Sign in with GitHub" button
- [x] Add "Sign in with Google" button  
- [x] Link to existing `/signin` page
- [x] Style buttons to match our design system

### 4. Mobile Menu
- [x] Create `components/landing/header/mobile-menu.tsx`
- [x] Implement hamburger menu for mobile
- [x] Add slide-in drawer animation
- [x] Ensure proper focus management

### 5. Logo Design
- [x] Create text-based logo "NoteChat.AI"
- [x] Use our primary font (Inter)
- [x] Add subtle hover effect
- [x] No gradients - keep it minimal

## Technical Requirements

### Header Behavior Implementation
```typescript
// Hide on scroll down, show on scroll up
const [prevScrollY, setPrevScrollY] = useState(0)
const [visible, setVisible] = useState(true)

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY
    
    if (currentScrollY > prevScrollY && currentScrollY > 80) {
      setVisible(false) // Hide on scroll down
    } else {
      setVisible(true) // Show on scroll up
    }
    
    setPrevScrollY(currentScrollY)
  }
  
  window.addEventListener('scroll', handleScroll, { passive: true })
  return () => window.removeEventListener('scroll', handleScroll)
}, [prevScrollY])
```

### Glass Morphism Effect
```css
.header-scrolled {
  background: oklch(var(--background) / 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid oklch(var(--border) / 0.5);
}
```

### Smooth Scroll Implementation
```typescript
const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId)
  element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
```

## Component Structure

### LandingHeader Props
```typescript
interface LandingHeaderProps {
  className?: string
}

interface NavItem {
  label: string
  href: string
  isSection?: boolean // For smooth scroll vs page navigation
}
```

### Mobile Menu Animation
```typescript
// Using Framer Motion
const menuVariants = {
  closed: {
    x: '100%',
    transition: { type: 'spring', stiffness: 400, damping: 40 }
  },
  open: {
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 40 }
  }
}
```

## Styling Guidelines
- Use existing color tokens from our design system
- Maintain consistent spacing (px-4 on mobile, px-8 on desktop)
- Header height: 64px
- Z-index: 50 (to stay above content)
- Transition duration: 200ms for all animations

## Testing Checklist
- [x] Header hides smoothly on scroll down
- [x] Header reappears on scroll up
- [x] ~~Glass morphism effect activates after 80px scroll~~ Simple border appears after scroll
- [x] Mobile menu opens/closes properly
- [x] All navigation links work
- [x] Smooth scroll to sections is working
- [x] Authentication buttons link correctly
- [x] Responsive on all breakpoints
- [x] Keyboard navigation works
- [x] Screen reader accessible

## Accessibility Requirements
- [x] Proper ARIA labels on mobile menu button
- [x] Focus trap in mobile menu when open
- [x] Escape key closes mobile menu
- [x] Skip navigation link for keyboard users
- [x] Proper heading hierarchy

## Performance Considerations
- [x] Use `passive: true` for scroll event listeners
- [x] ~~Debounce scroll events if needed~~ Using requestAnimationFrame
- [x] ~~Lazy load Framer Motion components~~ Imported directly for better performance
- [x] Minimize re-renders with proper memoization

## Files to Create
1. `app/(landing)/page.tsx` - Landing page route ✅
2. `app/(landing)/layout.tsx` - Landing-specific layout ✅
3. `components/landing/header/landing-header.tsx` - Main header component ✅
4. `components/landing/header/mobile-menu.tsx` - Mobile navigation ✅
5. `components/landing/header/nav-items.ts` - Navigation configuration ✅

## Dependencies
- Framer Motion (already installed) ✅
- No new dependencies needed ✅

## Estimated Time: 4-6 hours
**Actual Time**: ~2 hours

## Definition of Done
- [x] All components created and styled
- [x] Hide-on-scroll behavior working smoothly
- [x] Mobile responsive design complete
- [x] All tests passing (lint, typecheck, build)
- [x] Accessibility audit passed
- [x] Code reviewed and documented

## Session Summary
**Completed:**
- Created complete landing page route structure with SEO metadata
- Implemented sticky header with hide-on-scroll behavior
- Added smooth scroll navigation to page sections
- Created mobile menu with proper animations and focus management
- Followed existing design system (removed glass morphism per feedback)
- All authentication CTAs link to existing `/signin` page
- Full accessibility support with ARIA labels and keyboard navigation

**Files Changed:**
- `created: app/(landing)/page.tsx`
- `created: app/(landing)/layout.tsx`
- `created: components/landing/header/landing-header.tsx`
- `created: components/landing/header/mobile-menu.tsx`
- `created: components/landing/header/nav-items.ts`
- `modified: app/globals.css` (added smooth scroll support)

**Design Decisions:**
- Removed glass morphism effect to stay consistent with minimal design system
- Used simple border on scroll instead of blur effects
- Maintained Claude-inspired minimal aesthetic throughout
- Used existing Button components and design tokens

**Notes:**
- Header properly hides on scroll down and shows on scroll up
- Mobile menu has proper focus trap and keyboard navigation
- All TypeScript types are properly defined
- Build passes with no errors 