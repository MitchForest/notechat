# Sprint 6: Final Fixes & Polish

## Overview
Address user feedback to perfect the landing page experience with theme toggle, improved header behavior, layout fixes, and animation improvements.

## Issues to Fix

### 1. Theme Toggle in Header
**Current State:** No theme toggle in landing header
**Required Changes:**
- Add theme toggle button to landing header (left of Sign In buttons)
- Use existing Sun/Moon icons from theme-toggle.tsx
- Ensure consistent styling with app theme toggle
- Position: Right side of nav, before Sign In buttons

### 2. Sign In Button Text
**Current State:** Buttons say "Sign in with GitHub" and "Sign in with Google"
**Required Changes:**
- Change both buttons to just say "Sign In"
- Keep the GitHub and Google icons
- Icons make it obvious which service is being used

### 3. Light/Dark Mode Compatibility
**Current State:** Not tested for both themes
**Required Changes:**
- Audit all components for proper theme support
- Check color contrasts in both modes
- Ensure backgrounds, borders, and text are visible in both themes
- Pay special attention to:
  - Card backgrounds
  - Border colors
  - Hover states
  - Shadow visibility
  - Gradient overlays

### 4. Header Scroll Behavior
**Current State:** Header is always visible and hides on scroll down
**Required Changes:**
- Header should NOT be visible initially
- Header should appear AFTER scrolling past hero section
- Keep existing hide-on-scroll-down behavior
- Smooth transitions for appear/disappear

### 5. Page Left Cutoff Issue
**Current State:** Content appears cut off on left side
**Potential Causes:**
- Container padding issues
- Negative margins
- Overflow hidden on parent elements
- Transform translate issues
**Investigation Needed:**
- Check app globals.css
- Inspect container classes
- Review layout wrapper components
- Check for any absolute positioning

### 6. FAQ Improvements
**Current State:** Categories shown below questions
**Required Changes:**
- Remove category display from FAQ items
- Keep categories in data for potential future use
- Cleaner, simpler appearance

### 7. Testimonial Avatars
**Current State:** Initials only in avatar fallback
**Required Changes:**
- Add fake avatar images using placeholder service
- Use service like ui-avatars.com or pravatar.cc
- Ensure avatars load quickly
- Keep initials as fallback

### 8. Accordion Animation
**Current State:** Basic slide animation
**Required Changes:**
- Add spring-based animation for snappy feel
- Smooth height transitions
- Improve chevron rotation animation
- Add subtle fade for content
- Consider using Framer Motion for better control

## Implementation Plan

### Phase 1: Layout Investigation & Fix (Priority 1)
1. **Inspect Layout Issue**
   - Check all parent containers for overflow settings
   - Review global CSS for any negative margins
   - Inspect container max-width and padding
   - Check for transform or position issues

2. **Fix Layout**
   - Remove any problematic CSS
   - Ensure proper container alignment
   - Test on different screen sizes

### Phase 2: Header Improvements
1. **Add Theme Toggle**
   - Import ThemeToggle component
   - Position in header navigation
   - Ensure proper spacing

2. **Update Sign In Buttons**
   - Change text to "Sign In"
   - Keep icons visible
   - Adjust button sizing if needed

3. **Implement New Scroll Behavior**
   - Track hero section height
   - Show header after hero is scrolled past
   - Maintain hide-on-scroll-down behavior
   - Add smooth transitions

### Phase 3: Theme Compatibility
1. **Audit Components**
   - Test each section in light/dark mode
   - Document issues found
   - Fix color/contrast problems

2. **Common Fixes Needed**
   - Card backgrounds: `bg-card`
   - Borders: `border-border`
   - Muted backgrounds: `bg-muted`
   - Text colors: `text-foreground`, `text-muted-foreground`

### Phase 4: Content Improvements
1. **FAQ Updates**
   - Remove category rendering
   - Simplify item display

2. **Testimonial Avatars**
   - Implement avatar service
   - Add as src to Avatar component
   - Test loading performance

### Phase 5: Animation Polish
1. **Accordion Improvements**
   - Switch to Framer Motion for accordion
   - Add spring animations
   - Smooth height transitions
   - Improve interaction feedback

## Technical Specifications

### Theme Toggle Integration
```typescript
// In landing-header.tsx
import { ThemeToggle } from '@/components/theme/theme-toggle'

// Add before Sign In button
<ThemeToggle />
```

### Header Scroll Logic
```typescript
const [showHeader, setShowHeader] = useState(false)
const [lastScrollY, setLastScrollY] = useState(0)
const heroRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  const handleScroll = () => {
    const currentScrollY = window.scrollY
    const heroHeight = heroRef.current?.offsetHeight || 600
    
    // Show header after scrolling past hero
    if (currentScrollY > heroHeight) {
      // Hide on scroll down, show on scroll up
      setShowHeader(currentScrollY < lastScrollY)
    } else {
      setShowHeader(false)
    }
    
    setLastScrollY(currentScrollY)
  }
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [lastScrollY])
```

### Avatar Service
```typescript
// Using ui-avatars.com
const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(author)}&background=0D7377&color=fff&size=128`
```

### Accordion Animation
```typescript
// Using Framer Motion
<motion.div
  initial={false}
  animate={isOpen ? "open" : "collapsed"}
  variants={{
    open: { height: "auto", opacity: 1 },
    collapsed: { height: 0, opacity: 0 }
  }}
  transition={{
    height: { type: "spring", stiffness: 500, damping: 30 },
    opacity: { duration: 0.2 }
  }}
>
  {content}
</motion.div>
```

## Testing Checklist
- [ ] Layout displays correctly without left cutoff
- [ ] Theme toggle works in header
- [ ] Both themes look good on all sections
- [ ] Header appears after hero scroll
- [ ] Header hides on scroll down after appearing
- [ ] Sign In buttons show just "Sign In" with icons
- [ ] FAQ items have no categories displayed
- [ ] Testimonials show avatar images
- [ ] Accordion has smooth spring animation
- [ ] All animations respect prefers-reduced-motion
- [ ] Mobile responsive behavior maintained

## Estimated Time: 4-6 hours

## Success Criteria
1. No visual layout issues
2. Smooth theme switching experience
3. Professional header scroll behavior
4. Clean, polished component appearance
5. Snappy, responsive animations
6. Consistent experience across themes 