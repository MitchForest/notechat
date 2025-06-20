# Epic 7: Platform Features 🛠️

## Overview
**Goal**: Build essential platform capabilities including authentication, keyboard shortcuts, themes, and user preferences  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 6 (Advanced AI Context) completed - core features need user persistence  
**Outcome**: A complete, personalized platform experience with secure authentication and power user features

## Success Criteria
- **Auth Performance**: <2s complete OAuth flow
- **Session Reliability**: 99.9% session persistence
- **Shortcut Discovery**: 70% of users use shortcuts within first week
- **Theme Switching**: <50ms theme change with no flash
- **Preference Sync**: <500ms settings synchronization
- **Onboarding Completion**: 80% complete guided setup
- **Security**: Zero auth vulnerabilities in penetration testing

## Context & Motivation

Previous epics built powerful features for creating and managing knowledge. Epic 7 transforms AI Notes from a tool into a personalized platform:

- **Secure Authentication**: Users can trust their knowledge is safe and accessible anywhere
- **Power User Workflows**: Keyboard shortcuts enable lightning-fast navigation and actions
- **Personalization**: Themes and preferences make AI Notes feel like home
- **Professional Polish**: Platform features that users expect from world-class software

This epic ensures AI Notes is not just powerful, but delightful to use every day.

## Features

### F09: User Authentication
**Epic**: 1 | **Sprint**: 4 | **Complexity**: Medium

#### User Story
As a user, I want secure access to my notes from any device so that my knowledge is always available and protected.

#### Acceptance Criteria
- [ ] OAuth with GitHub and Google via Arctic.js
- [ ] Magic link email authentication option
- [ ] Session management with secure cookies
- [ ] All API routes protected with middleware
- [ ] Profile page shows email, provider, usage stats
- [ ] Logout clears all local data and invalidates session
- [ ] Remember me for 30 days option
- [ ] Loading states during auth flow
- [ ] Account deletion with data export
- [ ] Multi-device session management

#### Business Rules
1. Email required from OAuth provider
2. One account per email address
3. Sessions expire after 30 days of inactivity
4. All data encrypted at rest
5. GDPR compliant data handling

### F13: Keyboard Shortcuts
**Epic**: 2 | **Sprint**: 2 | **Complexity**: Small

#### User Story
As a power user, I want comprehensive keyboard shortcuts so that I can navigate and use AI Notes efficiently without touching the mouse.

#### Acceptance Criteria
- [ ] Global shortcuts work from anywhere
- [ ] Context-aware shortcuts in editor
- [ ] Customizable shortcut bindings
- [ ] Visual shortcut helper (? or Cmd+/)
- [ ] Shortcut conflict detection
- [ ] Category organization (navigation, editing, AI)
- [ ] Platform-specific shortcuts (Mac/Windows)
- [ ] Shortcut cheat sheet printable
- [ ] Interactive tutorial for learning
- [ ] Usage analytics for optimization

#### Business Rules
1. Core shortcuts cannot be customized
2. Custom shortcuts cannot conflict with browser
3. Maximum 50 custom shortcuts per user
4. Shortcuts persist across devices
5. Accessibility shortcuts always available

### F14: Dark/Light Mode
**Epic**: 2 | **Sprint**: 3 | **Complexity**: Small

#### User Story
As a user, I want to choose between dark and light themes so that I can work comfortably in any environment.

#### Acceptance Criteria
- [ ] System preference detection
- [ ] Manual theme toggle
- [ ] No flash on page load
- [ ] Theme persists across sessions
- [ ] Smooth transition animations
- [ ] All components properly themed
- [ ] Code syntax highlighting adapts
- [ ] Images/media adapt to theme
- [ ] Custom accent colors
- [ ] High contrast options

#### Business Rules
1. Default to system preference
2. User choice overrides system
3. Theme stored locally and synced
4. Transition duration: 200ms
5. Accessibility compliance maintained

### Advanced Platform Features
**Epic**: 2 | **Sprint**: 3 | **Complexity**: Medium

#### User Preferences & Settings
- [ ] Editor preferences (font, size, line height)
- [ ] AI behavior settings
- [ ] Notification preferences
- [ ] Privacy controls
- [ ] Data export settings
- [ ] Language preferences
- [ ] Performance modes

#### Performance Optimizations
- [ ] Lazy loading for large note lists
- [ ] Virtual scrolling in sidebar
- [ ] Image optimization and lazy loading
- [ ] Code splitting by route
- [ ] Service worker for offline support
- [ ] Background sync for changes

## Sprints

### Sprint 7.1: Authentication & User Management (3 days)

#### Day 1: Auth Infrastructure

**Authentication System Setup**
- **Arctic.js Integration**: Modern OAuth implementation
  - GitHub OAuth provider setup
  - Google OAuth provider setup
  - OAuth callback handling
  - State parameter security

- **Session Management**: Secure user sessions
  - Cookie-based sessions with httpOnly
  - Session encryption with iron-session
  - CSRF protection
  - Session invalidation on logout

- **Database Schema**: User data structure
  - User table with profiles
  - Session management table
  - OAuth account linking
  - Usage statistics tracking

#### Day 2: Auth Flow Implementation

**User Authentication Flow**
- **Login/Signup Pages**: Beautiful auth UI
  - OAuth provider buttons
  - Magic link email option
  - Loading states
  - Error handling

- **Protected Routes**: Secure application
  - Middleware for route protection
  - Redirect to login when needed
  - Remember intended destination
  - API route protection

- **Profile Management**: User control
  - Profile view/edit page
  - Account settings
  - Connected accounts
  - Data export options

#### Day 3: Onboarding & Polish

**First-Time User Experience**
- **Onboarding Flow**: Guided setup
  - Welcome screen
  - Feature highlights
  - Initial preferences
  - Sample notes creation

- **Multi-Device Support**: Seamless experience
  - Device management UI
  - Active sessions list
  - Remote logout capability
  - Sync conflict resolution

- **Security Enhancements**: Extra protection
  - Rate limiting on auth endpoints
  - Suspicious activity detection
  - Email notifications for new devices
  - Two-factor auth preparation

### Sprint 7.2: Keyboard Shortcuts & Preferences (4 days)

#### Day 1: Keyboard Shortcuts System

**Shortcuts Infrastructure**
- **Shortcuts Manager**: Central command system
  - Global shortcut registry
  - Context-aware activation
  - Conflict detection
  - Platform detection

- **Default Shortcuts**: Comprehensive set
  - Navigation (spaces, notes, search)
  - Editing (save, undo, formatting)
  - AI features (chat, commands)
  - Window management

- **Customization System**: User control
  - Shortcut editor UI
  - Binding validator
  - Reset to defaults
  - Import/export

#### Day 2: Shortcuts UI & Discovery

**Shortcut Helper Interface**
- **Command Palette Enhancement**: Quick access
  - Shortcut display in palette
  - Searchable shortcuts
  - Category filtering
  - Recent shortcuts

- **Interactive Cheat Sheet**: Learning tool
  - Floating help panel
  - Categorized display
  - Search functionality
  - Print-friendly version

- **Tutorial System**: Guided learning
  - Interactive shortcut training
  - Progress tracking
  - Achievement system
  - Daily tips

#### Day 3: Theme System & Preferences

**Theme Implementation**
- **Theme Architecture**: Flexible system
  - CSS custom properties
  - Theme provider context
  - Smooth transitions
  - No-flash technique

- **Theme Variations**: Beyond dark/light
  - Default light/dark themes
  - High contrast options
  - Custom accent colors
  - Seasonal themes

- **Component Theming**: Complete coverage
  - All UI components
  - Editor themes
  - Syntax highlighting
  - Graph visualizations

#### Day 4: Advanced Preferences & Performance

**User Preferences System**
- **Preferences Store**: Comprehensive settings
  - Editor preferences
  - AI settings
  - Privacy controls
  - Performance modes

- **Sync System**: Cross-device consistency
  - Real-time preference sync
  - Conflict resolution
  - Offline capability
  - Selective sync

- **Performance Features**: Speed optimizations
  - Lazy loading implementation
  - Virtual scrolling
  - Code splitting
  - Resource prioritization

## Technical Architecture

### Authentication Architecture

```typescript
// Authentication system core
interface AuthSystem {
  providers: OAuthProvider[]
  sessionManager: SessionManager
  userService: UserService
  securityService: SecurityService
}

interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: Date
  updatedAt: Date
  preferences: UserPreferences
  subscription?: Subscription
  usage: UsageStats
}

interface Session {
  id: string
  userId: string
  deviceId: string
  deviceName: string
  ipAddress: string
  userAgent: string
  createdAt: Date
  lastActiveAt: Date
  expiresAt: Date
}

class AuthService {
  private arctic: Arctic
  private sessionStore: SessionStore
  
  constructor() {
    this.arctic = new Arctic({
      providers: [
        new GitHubProvider({
          clientId: process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          redirectUri: `${process.env.APP_URL}/api/auth/github/callback`,
        }),
        new GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          redirectUri: `${process.env.APP_URL}/api/auth/google/callback`,
        }),
      ],
    })
  }
  
  async handleOAuthCallback(
    provider: string,
    code: string,
    state: string
  ): Promise<AuthResult> {
    // Verify state parameter
    const storedState = await this.sessionStore.getState(state)
    if (!storedState) {
      throw new Error('Invalid state parameter')
    }
    
    // Exchange code for tokens
    const tokens = await this.arctic.exchangeCode(provider, code)
    
    // Get user info from provider
    const providerUser = await this.getProviderUser(provider, tokens.accessToken)
    
    // Find or create user
    const user = await this.findOrCreateUser(provider, providerUser)
    
    // Create session
    const session = await this.createSession(user, {
      deviceId: storedState.deviceId,
      ipAddress: storedState.ipAddress,
      userAgent: storedState.userAgent,
    })
    
    // Clean up state
    await this.sessionStore.deleteState(state)
    
    return {
      user,
      session,
      isNewUser: user.createdAt.getTime() === user.updatedAt.getTime(),
    }
  }
  
  async createSession(user: User, deviceInfo: DeviceInfo): Promise<Session> {
    const session: Session = {
      id: generateSecureId(),
      userId: user.id,
      deviceId: deviceInfo.deviceId || generateDeviceId(),
      deviceName: this.parseDeviceName(deviceInfo.userAgent),
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }
    
    await this.sessionStore.create(session)
    
    // Notify user of new device login
    if (await this.isNewDevice(user.id, deviceInfo)) {
      await this.notifyNewDeviceLogin(user, deviceInfo)
    }
    
    return session
  }
  
  async validateSession(sessionId: string): Promise<User | null> {
    const session = await this.sessionStore.get(sessionId)
    
    if (!session) return null
    
    // Check expiration
    if (session.expiresAt < new Date()) {
      await this.sessionStore.delete(sessionId)
      return null
    }
    
    // Update last active
    await this.sessionStore.updateLastActive(sessionId)
    
    // Get user
    return await this.userService.getById(session.userId)
  }
}
```

### Keyboard Shortcuts System

```typescript
// Keyboard shortcuts architecture
interface ShortcutSystem {
  registry: ShortcutRegistry
  handler: ShortcutHandler
  customizer: ShortcutCustomizer
  analytics: ShortcutAnalytics
}

interface Shortcut {
  id: string
  name: string
  description: string
  category: ShortcutCategory
  keys: string[]
  action: (context: ShortcutContext) => void | Promise<void>
  enabled: boolean
  customizable: boolean
  contexts: ShortcutContext[]
}

type ShortcutCategory = 
  | 'navigation'
  | 'editing'
  | 'ai_features'
  | 'organization'
  | 'window'
  | 'help'

type ShortcutContext = 
  | 'global'
  | 'editor'
  | 'chat'
  | 'sidebar'
  | 'search'
  | 'graph'

class ShortcutRegistry {
  private shortcuts = new Map<string, Shortcut>()
  private customBindings = new Map<string, string[]>()
  private activeContexts = new Set<ShortcutContext>(['global'])
  
  registerDefaults() {
    // Navigation shortcuts
    this.register({
      id: 'nav.search',
      name: 'Universal Search',
      description: 'Open search palette',
      category: 'navigation',
      keys: ['cmd', 'k'],
      contexts: ['global'],
      customizable: true,
      enabled: true,
      action: () => commandPalette.open(),
    })
    
    this.register({
      id: 'nav.new_note',
      name: 'New Note',
      description: 'Create a new note',
      category: 'navigation',
      keys: ['cmd', 'n'],
      contexts: ['global'],
      customizable: true,
      enabled: true,
      action: () => noteService.createNote(),
    })
    
    this.register({
      id: 'nav.new_chat',
      name: 'New Chat',
      description: 'Start a new AI chat',
      category: 'navigation',
      keys: ['cmd', 'shift', 'n'],
      contexts: ['global'],
      customizable: true,
      enabled: true,
      action: () => chatService.createChat(),
    })
    
    // Editor shortcuts
    this.register({
      id: 'editor.save',
      name: 'Save',
      description: 'Save current note',
      category: 'editing',
      keys: ['cmd', 's'],
      contexts: ['editor'],
      customizable: false,
      enabled: true,
      action: (ctx) => ctx.editor?.save(),
    })
    
    this.register({
      id: 'editor.send_to_chat',
      name: 'Send to Chat',
      description: 'Send selection to AI chat',
      category: 'ai_features',
      keys: ['cmd', 'enter'],
      contexts: ['editor'],
      customizable: true,
      enabled: true,
      action: (ctx) => {
        const selection = ctx.editor?.getSelection()
        if (selection) {
          chatService.sendToChat(selection)
        }
      },
    })
    
    // AI shortcuts
    this.register({
      id: 'ai.continue_writing',
      name: 'Continue Writing',
      description: 'AI continues from cursor',
      category: 'ai_features',
      keys: ['cmd', 'j'],
      contexts: ['editor'],
      customizable: true,
      enabled: true,
      action: (ctx) => ctx.editor?.continueWithAI(),
    })
    
    this.register({
      id: 'ai.accept_suggestion',
      name: 'Accept Ghost Text',
      description: 'Accept AI suggestion',
      category: 'ai_features',
      keys: ['tab'],
      contexts: ['editor'],
      customizable: false,
      enabled: true,
      action: (ctx) => ctx.editor?.acceptGhostText(),
    })
    
    // Window shortcuts
    this.register({
      id: 'window.toggle_sidebar',
      name: 'Toggle Sidebar',
      description: 'Show/hide sidebar',
      category: 'window',
      keys: ['cmd', '\\'],
      contexts: ['global'],
      customizable: true,
      enabled: true,
      action: () => uiStore.toggleSidebar(),
    })
    
    this.register({
      id: 'window.toggle_theme',
      name: 'Toggle Theme',
      description: 'Switch between light/dark',
      category: 'window',
      keys: ['cmd', 'shift', 't'],
      contexts: ['global'],
      customizable: true,
      enabled: true,
      action: () => themeStore.toggleTheme(),
    })
    
    // Quick switching
    for (let i = 1; i <= 9; i++) {
      this.register({
        id: `nav.quick_switch_${i}`,
        name: `Quick Switch ${i}`,
        description: `Switch to space ${i}`,
        category: 'navigation',
        keys: ['cmd', String(i)],
        contexts: ['global'],
        customizable: false,
        enabled: true,
        action: () => spaceStore.switchToSpace(i - 1),
      })
    }
  }
  
  handleKeyPress(event: KeyboardEvent): boolean {
    const pressedKeys = this.getPressedKeys(event)
    
    // Find matching shortcut
    for (const shortcut of this.shortcuts.values()) {
      if (!shortcut.enabled) continue
      
      // Check if shortcut applies to current context
      const validContext = shortcut.contexts.some(ctx => 
        this.activeContexts.has(ctx)
      )
      if (!validContext) continue
      
      // Check if keys match
      const keys = this.customBindings.get(shortcut.id) || shortcut.keys
      if (this.keysMatch(pressedKeys, keys)) {
        event.preventDefault()
        event.stopPropagation()
        
        // Track usage
        this.analytics.track(shortcut.id)
        
        // Execute action
        try {
          const context = this.buildContext()
          Promise.resolve(shortcut.action(context)).catch(error => {
            console.error(`Shortcut ${shortcut.id} failed:`, error)
            toast.error('Shortcut action failed')
          })
        } catch (error) {
          console.error(`Shortcut ${shortcut.id} error:`, error)
        }
        
        return true
      }
    }
    
    return false
  }
  
  customizeShortcut(shortcutId: string, newKeys: string[]): boolean {
    const shortcut = this.shortcuts.get(shortcutId)
    if (!shortcut || !shortcut.customizable) return false
    
    // Check for conflicts
    const conflict = this.findConflict(newKeys, shortcutId)
    if (conflict) {
      toast.error(`Conflicts with "${conflict.name}"`)
      return false
    }
    
    // Save custom binding
    this.customBindings.set(shortcutId, newKeys)
    this.saveCustomBindings()
    
    return true
  }
}
```

### Theme System Architecture

```typescript
// Theme system
interface ThemeSystem {
  provider: ThemeProvider
  themes: Map<string, Theme>
  customizer: ThemeCustomizer
  persistence: ThemePersistence
}

interface Theme {
  id: string
  name: string
  type: 'light' | 'dark'
  colors: ColorPalette
  typography: Typography
  spacing: Spacing
  shadows: Shadows
  custom: boolean
}

interface ColorPalette {
  // Background colors
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  
  // Primary colors
  primary: string
  primaryForeground: string
  
  // Secondary colors
  secondary: string
  secondaryForeground: string
  
  // Utility colors
  muted: string
  mutedForeground: string
  accent: string
  accentForeground: string
  destructive: string
  destructiveForeground: string
  
  // Border and input
  border: string
  input: string
  ring: string
  
  // AI-specific colors
  aiPrimary: string
  aiSecondary: string
  aiGradientStart: string
  aiGradientEnd: string
}

class ThemeProvider {
  private currentTheme: Theme
  private prefersDark: MediaQueryList
  private styleSheet: CSSStyleSheet
  
  constructor() {
    // Detect system preference
    this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    
    // Load saved preference or use system
    const savedTheme = this.loadSavedTheme()
    this.currentTheme = savedTheme || this.getSystemTheme()
    
    // Create dynamic stylesheet
    this.styleSheet = new CSSStyleSheet()
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, this.styleSheet]
    
    // Apply initial theme
    this.applyTheme(this.currentTheme)
    
    // Listen for system changes
    this.prefersDark.addEventListener('change', this.handleSystemChange)
  }
  
  applyTheme(theme: Theme) {
    // Generate CSS custom properties
    const cssVars = this.generateCSSVariables(theme)
    
    // Apply with smooth transition
    this.styleSheet.replaceSync(`
      :root {
        ${cssVars}
        
        /* Smooth theme transitions */
        transition: background-color 200ms ease,
                    color 200ms ease,
                    border-color 200ms ease;
      }
      
      /* Prevent flash of unstyled content */
      body {
        background-color: hsl(var(--background));
        color: hsl(var(--foreground));
      }
      
      /* Theme-specific styles */
      ${this.generateThemeStyles(theme)}
    `)
    
    // Update meta theme color
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) {
      metaTheme.setAttribute('content', theme.colors.background)
    }
    
    // Notify components
    this.emitThemeChange(theme)
  }
  
  private generateCSSVariables(theme: Theme): string {
    const vars: string[] = []
    
    // Convert color palette to CSS variables
    for (const [key, value] of Object.entries(theme.colors)) {
      const hslValue = this.hexToHSL(value)
      vars.push(`--${this.camelToKebab(key)}: ${hslValue};`)
    }
    
    // Add typography variables
    vars.push(`--font-sans: ${theme.typography.fontFamily.sans};`)
    vars.push(`--font-mono: ${theme.typography.fontFamily.mono};`)
    
    // Add spacing variables
    for (const [key, value] of Object.entries(theme.spacing)) {
      vars.push(`--spacing-${key}: ${value};`)
    }
    
    return vars.join('\n')
  }
  
  toggleTheme() {
    const newTheme = this.currentTheme.type === 'light' 
      ? this.getTheme('dark')
      : this.getTheme('light')
    
    this.setTheme(newTheme)
  }
  
  setTheme(theme: Theme) {
    this.currentTheme = theme
    this.applyTheme(theme)
    this.saveTheme(theme)
    
    // Track theme change
    analytics.track('theme_changed', {
      theme: theme.id,
      method: 'manual',
    })
  }
}
```

### User Preferences System

```typescript
// Preferences architecture
interface PreferencesSystem {
  store: PreferencesStore
  sync: PreferencesSync
  validator: PreferencesValidator
  migrator: PreferencesMigrator
}

interface UserPreferences {
  version: number
  editor: EditorPreferences
  ai: AIPreferences
  privacy: PrivacyPreferences
  notifications: NotificationPreferences
  performance: PerformancePreferences
  accessibility: AccessibilityPreferences
}

interface EditorPreferences {
  fontFamily: string
  fontSize: number
  lineHeight: number
  tabSize: number
  wordWrap: boolean
  showLineNumbers: boolean
  autoSave: boolean
  autoSaveDelay: number
  spellCheck: boolean
  grammarCheck: boolean
  ghostText: boolean
  ghostTextDelay: number
}

class PreferencesStore {
  private preferences: UserPreferences
  private subscribers = new Set<(prefs: UserPreferences) => void>()
  
  async load(userId: string): Promise<UserPreferences> {
    // Try to load from server
    try {
      const serverPrefs = await api.getUserPreferences(userId)
      const localPrefs = this.loadLocalPreferences()
      
      // Merge with conflict resolution
      this.preferences = this.mergePreferences(serverPrefs, localPrefs)
      
      // Migrate if needed
      if (this.preferences.version < CURRENT_PREFS_VERSION) {
        this.preferences = await this.migrator.migrate(this.preferences)
      }
      
      return this.preferences
    } catch (error) {
      // Fallback to local
      return this.loadLocalPreferences()
    }
  }
  
  async save(updates: Partial<UserPreferences>) {
    // Update local state
    this.preferences = {
      ...this.preferences,
      ...updates,
      version: CURRENT_PREFS_VERSION,
    }
    
    // Validate
    const validation = this.validator.validate(this.preferences)
    if (!validation.valid) {
      throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`)
    }
    
    // Save locally
    this.saveLocalPreferences(this.preferences)
    
    // Sync to server
    this.syncQueue.add(() => this.syncToServer(this.preferences))
    
    // Notify subscribers
    this.notifySubscribers()
  }
  
  subscribe(callback: (prefs: UserPreferences) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }
  
  private mergePreferences(
    server: UserPreferences,
    local: UserPreferences
  ): UserPreferences {
    // Use server as base, but preserve local changes that are newer
    const merged = { ...server }
    
    // Check timestamps for each section
    if (local.editor._lastModified > server.editor._lastModified) {
      merged.editor = local.editor
    }
    
    if (local.ai._lastModified > server.ai._lastModified) {
      merged.ai = local.ai
    }
    
    // ... continue for other sections
    
    return merged
  }
}

// React hook for preferences
export function usePreferences<T extends keyof UserPreferences>(
  section: T
): [UserPreferences[T], (updates: Partial<UserPreferences[T]>) => void] {
  const store = usePreferencesStore()
  const [prefs, setPrefs] = useState(store.get(section))
  
  useEffect(() => {
    return store.subscribe((newPrefs) => {
      setPrefs(newPrefs[section])
    })
  }, [section])
  
  const updateSection = useCallback((updates: Partial<UserPreferences[T]>) => {
    store.save({
      [section]: {
        ...prefs,
        ...updates,
      },
    })
  }, [section, prefs])
  
  return [prefs, updateSection]
}
```

## UI/UX Design Patterns

### Authentication Flow
```
Landing Page
     ↓
┌─────────────────────────────────────┐
│          Welcome to AI Notes        │
│                                     │
│   Your intelligent second brain     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   🔵 Continue with Google       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ⚫ Continue with GitHub       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │   ✉️  Sign in with Email        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ By continuing, you agree to our     │
│ Terms of Service and Privacy Policy │
└─────────────────────────────────────┘
     ↓
OAuth Provider / Email Magic Link
     ↓
┌─────────────────────────────────────┐
│        Welcome, Sarah! 👋           │
│                                     │
│ Let's set up your workspace:        │
│                                     │
│ ◉ Dark theme  ○ Light theme        │
│                                     │
│ Preferred AI model:                 │
│ [GPT-4 Turbo      ▼]               │
│                                     │
│ Enable ghost text?                  │
│ [✓] Yes, help me write faster      │
│                                     │
│ [Skip] [Next: Create First Note →]  │
└─────────────────────────────────────┘
```

### Keyboard Shortcuts Helper
```
Press ? or Cmd+/
┌─────────────────────────────────────┐
│ ⌨️  Keyboard Shortcuts              │ [X]
├─────────────────────────────────────┤
│ 🔍 Search shortcuts...              │
├─────────────────────────────────────┤
│ NAVIGATION                          │
│ ⌘ K         Universal search       │
│ ⌘ N         New note               │
│ ⌘ ⇧ N       New chat               │
│ ⌘ 1-9       Switch spaces          │
│ ⌘ \         Toggle sidebar         │
├─────────────────────────────────────┤
│ EDITING                             │
│ ⌘ S         Save                   │
│ ⌘ Z         Undo                   │
│ ⌘ ⇧ Z       Redo                   │
│ ⌘ B         Bold                   │
│ ⌘ I         Italic                 │
├─────────────────────────────────────┤
│ AI FEATURES ✨                      │
│ ⌘ Enter     Send to chat           │
│ ⌘ J         Continue writing       │
│ Tab         Accept ghost text      │
│ //          Inline AI              │
│ /           Commands menu          │
├─────────────────────────────────────┤
│ [Customize] [Print Cheat Sheet]     │
└─────────────────────────────────────┘
```

### Theme Switcher
```
┌─────────────────────────────────────┐
│ 🎨 Appearance                       │
├─────────────────────────────────────┤
│ Theme                               │
│ ◉ System  ○ Light  ○ Dark         │
│                                     │
│ Accent Color                        │
│ [🟦][🟩][🟨][🟧][🟥][🟪][⚫]     │
│                                     │
│ Font Size                           │
│ [-----|●|-----] 16px               │
│                                     │
│ Editor Font                         │
│ [JetBrains Mono        ▼]          │
│                                     │
│ ☑ High contrast mode               │
│ ☑ Reduce animations                │
│                                     │
│ [Reset to Defaults]                 │
└─────────────────────────────────────┘
```

### Settings Dashboard
```
┌─────────────────────────────────────┐
│ ⚙️  Settings                        │
├─────────────────────────────────────┤
│ 👤 Profile          │ Editor       │
│ 🎨 Appearance       │ 🤖 AI        │
│ ⌨️  Shortcuts       │ 🔒 Privacy   │
│ 🔔 Notifications    │ ⚡ Advanced  │
├─────────────────────────────────────┤
│ Profile                             │
│                                     │
│ [Avatar] Sarah Chen                 │
│          sarah@example.com          │
│          GitHub connected           │
│                                     │
│ Usage This Month                    │
│ ████████░░ 8,234 / 10,000 tokens  │
│                                     │
│ Member since Jan 15, 2024           │
│                                     │
│ [Manage Subscription]               │
│ [Download My Data]                  │
│ [Delete Account]                    │
└─────────────────────────────────────┘
```

## Implementation Details

### File Structure
```
features/auth/
├── components/
│   ├── auth-form.tsx
│   ├── oauth-buttons.tsx
│   ├── magic-link-form.tsx
│   ├── onboarding-flow.tsx
│   └── profile-settings.tsx
├── providers/
│   ├── auth-provider.tsx
│   └── session-provider.tsx
├── services/
│   ├── auth-service.ts
│   ├── session-manager.ts
│   └── oauth-providers.ts
├── hooks/
│   ├── use-auth.ts
│   ├── use-session.ts
│   └── use-require-auth.ts
└── middleware/
    └── auth-middleware.ts

features/platform/
├── shortcuts/
│   ├── shortcut-manager.ts
│   ├── shortcut-registry.ts
│   ├── shortcut-handler.ts
│   └── components/
│       ├── shortcut-helper.tsx
│       ├── shortcut-customizer.tsx
│       └── shortcut-tutorial.tsx
├── theme/
│   ├── theme-provider.tsx
│   ├── theme-store.ts
│   ├── themes/
│   │   ├── default-light.ts
│   │   ├── default-dark.ts
│   │   └── high-contrast.ts
│   └── components/
│       └── theme-switcher.tsx
├── preferences/
│   ├── preferences-store.ts
│   ├── preferences-sync.ts
│   └── components/
│       ├── settings-page.tsx
│       ├── editor-settings.tsx
│       └── ai-settings.tsx
└── performance/
    ├── lazy-loading.ts
    ├── virtual-scroll.tsx
    └── service-worker.ts
```

### Authentication Implementation

```typescript
// app/api/auth/[provider]/route.ts
import { arctic } from '@/lib/auth/arctic'
import { generateState } from '@/lib/auth/utils'

export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const provider = params.provider
  
  if (!['github', 'google'].includes(provider)) {
    return new Response('Invalid provider', { status: 400 })
  }
  
  // Generate state for CSRF protection
  const state = generateState()
  
  // Store state with device info
  const deviceInfo = {
    userAgent: request.headers.get('user-agent') || '',
    ipAddress: request.headers.get('x-forwarded-for') || '',
  }
  
  await stateStore.set(state, {
    provider,
    deviceInfo,
    timestamp: Date.now(),
  })
  
  // Get authorization URL
  const url = await arctic.getAuthorizationUrl(provider, state)
  
  return Response.redirect(url)
}

// app/api/auth/[provider]/callback/route.ts
export async function GET(
  request: Request,
  { params }: { params: { provider: string } }
) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  
  if (!code || !state) {
    return Response.redirect('/auth/error?error=missing_params')
  }
  
  try {
    // Handle OAuth callback
    const result = await authService.handleOAuthCallback(
      params.provider,
      code,
      state
    )
    
    // Create session cookie
    const sessionCookie = await createSessionCookie(result.session)
    
    // Redirect based on user status
    const redirectUrl = result.isNewUser 
      ? '/onboarding'
      : '/app'
    
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        'Set-Cookie': sessionCookie,
      },
    })
  } catch (error) {
    console.error('OAuth callback error:', error)
    return Response.redirect('/auth/error?error=callback_failed')
  }
}
```

### Shortcut System Implementation

```typescript
// features/platform/shortcuts/components/shortcut-helper.tsx
"use client"

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useShortcuts } from '../hooks/use-shortcuts'
import { Keyboard } from 'lucide-react'

export function ShortcutHelper() {
  const [open, setOpen] = useState(false)
  const { shortcuts, executeShortcut } = useShortcuts()
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show helper with ? or Cmd+/
      if (
        e.key === '?' ||
        (e.metaKey && e.key === '/')
      ) {
        e.preventDefault()
        setOpen(true)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
  
  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="shortcut-helper"
    >
      <Command.Input
        placeholder="Search shortcuts..."
        className="shortcut-search"
      />
      
      <Command.List className="shortcut-list">
        <Command.Empty>No shortcuts found</Command.Empty>
        
        {Object.entries(groupShortcutsByCategory(shortcuts)).map(
          ([category, categoryShortcuts]) => (
            <Command.Group key={category} heading={category}>
              {categoryShortcuts.map((shortcut) => (
                <Command.Item
                  key={shortcut.id}
                  value={shortcut.name}
                  onSelect={() => {
                    executeShortcut(shortcut.id)
                    setOpen(false)
                  }}
                  className="shortcut-item"
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="font-medium">{shortcut.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {shortcut.description}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {formatKeys(shortcut.keys).map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 text-xs bg-muted rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )
        )}
      </Command.List>
      
      <div className="shortcut-footer">
        <button onClick={() => setOpen(false)}>Close</button>
        <button onClick={() => openShortcutCustomizer()}>
          Customize Shortcuts
        </button>
      </div>
    </Command.Dialog>
  )
}
```

### Theme Implementation

```typescript
// features/platform/theme/theme-provider.tsx
"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { Theme, ThemeType } from './types'
import { defaultThemes } from './themes'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  isSystemTheme: boolean
  setIsSystemTheme: (value: boolean) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ 
  children,
  defaultTheme = 'system',
}: {
  children: React.ReactNode
  defaultTheme?: ThemeType | 'system'
}) {
  const [theme, setTheme] = useState<Theme>(defaultThemes.light)
  const [isSystemTheme, setIsSystemTheme] = useState(defaultTheme === 'system')
  
  useEffect(() => {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme')
    const savedIsSystem = localStorage.getItem('theme-system') === 'true'
    
    setIsSystemTheme(savedIsSystem)
    
    if (savedIsSystem || !savedTheme) {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const systemTheme = mediaQuery.matches ? 'dark' : 'light'
      setTheme(defaultThemes[systemTheme])
      
      // Listen for system changes
      const handleChange = (e: MediaQueryListEvent) => {
        if (isSystemTheme) {
          setTheme(defaultThemes[e.matches ? 'dark' : 'light'])
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Use saved theme
      setTheme(defaultThemes[savedTheme as ThemeType] || defaultThemes.light)
    }
  }, [isSystemTheme])
  
  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark')
    
    // Add new theme class
    root.classList.add(theme.type)
    
    // Apply CSS variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value)
    })
    
    // Save preference
    if (!isSystemTheme) {
      localStorage.setItem('theme', theme.type)
    }
    localStorage.setItem('theme-system', String(isSystemTheme))
  }, [theme, isSystemTheme])
  
  const toggleTheme = () => {
    const newTheme = theme.type === 'light' 
      ? defaultThemes.dark 
      : defaultThemes.light
    setTheme(newTheme)
    setIsSystemTheme(false)
  }
  
  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isSystemTheme,
        setIsSystemTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

## Error Handling & Recovery

### Authentication Error Handling

```typescript
class AuthErrorHandler {
  handleAuthError(error: AuthError): void {
    switch (error.code) {
      case 'OAUTH_CALLBACK_ERROR':
        toast.error('Failed to sign in. Please try again.')
        this.logAuthError(error)
        break
        
      case 'SESSION_EXPIRED':
        toast.error('Your session has expired. Please sign in again.')
        this.redirectToLogin()
        break
        
      case 'INVALID_CREDENTIALS':
        toast.error('Invalid email or password')
        break
        
      case 'ACCOUNT_LOCKED':
        toast.error('Account locked due to suspicious activity')
        this.showAccountRecovery()
        break
        
      case 'RATE_LIMITED':
        toast.error('Too many attempts. Please try again later.')
        break
        
      default:
        toast.error('An unexpected error occurred')
        this.reportError(error)
    }
  }
  
  async handleSessionRecovery(): Promise<boolean> {
    try {
      // Try to refresh session
      const newSession = await authService.refreshSession()
      if (newSession) {
        toast.success('Session restored')
        return true
      }
    } catch (error) {
      // Session truly expired
    }
    
    // Show re-authentication prompt
    const result = await showReauthPrompt()
    if (result.reauth) {
      return true
    }
    
    // User declined - redirect to login
    this.redirectToLogin()
    return false
  }
}
```

### Platform Feature Error Recovery

```typescript
class PlatformErrorRecovery {
  async handleShortcutConflict(
    shortcut: Shortcut,
    existingShortcut: Shortcut
  ): Promise<void> {
    const result = await showConflictDialog({
      title: 'Keyboard Shortcut Conflict',
      message: `"${shortcut.keys.join(' + ')}" is already assigned to "${existingShortcut.name}"`,
      options: [
        { label: 'Replace', value: 'replace' },
        { label: 'Keep Both', value: 'both' },
        { label: 'Cancel', value: 'cancel' },
      ],
    })
    
    switch (result) {
      case 'replace':
        await shortcutManager.reassign(existingShortcut.id, null)
        await shortcutManager.assign(shortcut.id, shortcut.keys)
        break
        
      case 'both':
        // Find alternative keys
        const alternative = await this.suggestAlternativeKeys(shortcut)
        await shortcutManager.assign(shortcut.id, alternative)
        break
        
      case 'cancel':
        // Do nothing
        break
    }
  }
  
  async handleThemeLoadFailure(): Promise<void> {
    console.error('Failed to load theme')
    
    // Fall back to system default
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
    
    // Apply minimal theme
    document.documentElement.classList.add(systemTheme)
    
    toast.warning('Theme loading failed. Using system default.')
  }
  
  async handlePreferenceSyncFailure(
    error: Error,
    preferences: UserPreferences
  ): Promise<void> {
    console.error('Preference sync failed:', error)
    
    // Save locally
    localStorage.setItem('preferences_backup', JSON.stringify(preferences))
    
    // Queue for retry
    syncQueue.add({
      type: 'preferences',
      data: preferences,
      retryCount: 0,
      maxRetries: 3,
    })
    
    // Notify user
    toast.info('Preferences saved locally. Will sync when connected.')
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('AuthService', () => {
  let authService: AuthService
  
  beforeEach(() => {
    authService = new AuthService()
  })
  
  test('handles OAuth callback successfully', async () => {
    const mockCode = 'mock_auth_code'
    const mockState = 'mock_state'
    
    // Mock OAuth provider response
    mockOAuthProvider.exchangeCode.mockResolvedValue({
      accessToken: 'mock_token',
      user: { email: 'test@example.com' },
    })
    
    const result = await authService.handleOAuthCallback(
      'github',
      mockCode,
      mockState
    )
    
    expect(result.user).toBeDefined()
    expect(result.session).toBeDefined()
    expect(result.user.email).toBe('test@example.com')
  })
  
  test('validates session correctly', async () => {
    const validSession = createMockSession({ expiresAt: future })
    await sessionStore.create(validSession)
    
    const user = await authService.validateSession(validSession.id)
    expect(user).toBeDefined()
    
    const expiredSession = createMockSession({ expiresAt: past })
    const invalidUser = await authService.validateSession(expiredSession.id)
    expect(invalidUser).toBeNull()
  })
})

describe('ShortcutRegistry', () => {
  let registry: ShortcutRegistry
  
  beforeEach(() => {
    registry = new ShortcutRegistry()
    registry.registerDefaults()
  })
  
  test('detects conflicts correctly', () => {
    const conflict = registry.findConflict(['cmd', 'k'])
    expect(conflict).toBeDefined()
    expect(conflict?.id).toBe('nav.search')
  })
  
  test('handles custom bindings', () => {
    const success = registry.customizeShortcut('nav.search', ['cmd', 'shift', 'f'])
    expect(success).toBe(true)
    
    const shortcut = registry.getShortcut('nav.search')
    expect(registry.getKeys(shortcut)).toEqual(['cmd', 'shift', 'f'])
  })
  
  test('prevents invalid customizations', () => {
    // Try to customize non-customizable shortcut
    const success = registry.customizeShortcut('editor.save', ['cmd', 'x'])
    expect(success).toBe(false)
  })
})

describe('ThemeProvider', () => {
  test('detects system preference', () => {
    // Mock system dark mode
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    })
    
    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    })
    
    expect(result.current.theme.type).toBe('dark')
  })
  
  test('persists theme choice', () => {
    const { result } = renderHook(() => useTheme())
    
    act(() => {
      result.current.setTheme(defaultThemes.dark)
    })
    
    expect(localStorage.getItem('theme')).toBe('dark')
    expect(localStorage.getItem('theme-system')).toBe('false')
  })
})
```

### Integration Tests

- OAuth flow completes successfully
- Session persists across page refreshes
- Shortcuts work in different contexts
- Theme applies without flash
- Preferences sync across devices

### E2E Test Scenarios

1. **Authentication Flow**
   - Click login → Choose provider → Authorize → Redirect to app
   - New user → Onboarding → Workspace ready
   - Returning user → Direct to workspace

2. **Shortcut Customization**
   - Open helper → Search shortcut → Click customize → Set new keys
   - Conflict detected → Resolution dialog → Success
   - Use custom shortcut → Action executes

3. **Theme & Preferences**
   - Toggle theme → Instant change → No flash on reload
   - Change editor settings → See immediate effect
   - Switch devices → Settings synchronized

### Performance Benchmarks
- OAuth redirect: <2s total ✓
- Session validation: <50ms ✓
- Shortcut execution: <10ms ✓
- Theme switch: <50ms ✓
- Preference sync: <500ms ✓

## Accessibility & Internationalization

### Accessibility Features
- Full keyboard navigation for all features
- Screen reader announcements for auth status
- High contrast theme option
- Reduced motion preference support
- Focus indicators on all interactive elements

### Internationalization Prep
- Auth UI strings extracted
- Shortcut names localized
- Theme names translated
- Settings labels internationalized
- Error messages localized

## Analytics & Monitoring

### Key Metrics to Track

```typescript
interface PlatformAnalytics {
  // Authentication
  authMethod: Record<'google' | 'github' | 'email', number>
  authSuccessRate: number
  sessionDuration: number[]
  deviceCount: number
  
  // Shortcuts
  shortcutUsage: Record<string, number>
  customShortcuts: number
  shortcutDiscoveryMethod: Record<string, number>
  
  // Theme & Preferences  
  themeDistribution: Record<string, number>
  customThemes: number
  preferenceChanges: Record<string, number>
  syncFailures: number
  
  // Onboarding
  onboardingCompletion: number
  onboardingDropoff: Record<string, number>
  timeToFirstNote: number
}
```

### Security Monitoring
- Failed login attempts
- Suspicious login patterns  
- Session anomalies
- OAuth state mismatches

## Security & Privacy Considerations

### Authentication Security
- OAuth state parameter validation
- PKCE for OAuth flows
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection on all mutations
- Rate limiting on auth endpoints

### Data Protection
- Preferences encrypted at rest
- No shortcut telemetry without consent
- Theme choices private
- Session data minimized
- GDPR compliant data handling

## Migration & Upgrade Path

### Future Enhancements
- Biometric authentication
- SSO for enterprise
- Advanced shortcut macros
- Theme marketplace
- Preference templates
- Team preference sharing

### Compatibility
- Graceful degradation for older browsers
- Progressive auth enhancement
- Backward compatible preferences
- Legacy shortcut support

## Success Metrics

### User Engagement
- 95% successful auth on first attempt
- 70% enable keyboard shortcuts
- 60% customize at least one setting
- 80% complete onboarding flow

### Technical Health
- <2s OAuth flow completion
- 99.9% session reliability
- <50ms theme switching
- Zero auth security incidents

### Business Impact
- 30% faster task completion with shortcuts
- 25% increase in daily active users
- 40% reduction in support tickets
- 90% user satisfaction score

## Dependencies

### External Services
- OAuth providers (GitHub, Google)
- Email service for magic links
- Analytics service
- Error tracking service

### Internal Dependencies
- All previous epics for feature access
- Database for user data
- Storage for preferences
- Cache for sessions

### NPM Dependencies
```json
{
  "dependencies": {
    "arctic": "^1.x",
    "iron-session": "^8.x",
    "@radix-ui/themes": "^3.x",
    "cmdk": "^1.x",
    "sonner": "^1.x",
    "jotai": "^2.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| OAuth provider downtime | High | Low | Multiple providers, magic link fallback |
| Session hijacking | High | Low | Secure cookies, device fingerprinting |
| Shortcut conflicts | Medium | High | Conflict detection, smart defaults |
| Theme flash on load | Low | Medium | CSS-in-JS, cookie detection |
| Preference sync conflicts | Medium | Medium | Conflict resolution, version control |

## Conclusion

Epic 7 transforms AI Notes from a powerful tool into a personalized platform. By implementing robust authentication, comprehensive keyboard shortcuts, beautiful themes, and flexible preferences, we create an environment where users feel at home and can work at maximum efficiency.

The combination of security, customization, and performance optimizations ensures that AI Notes is not just feature-rich but also a joy to use daily. Every interaction is fast, every preference is remembered, and every user feels in control of their experience.

## Next Steps

With Platform Features complete, users can:
- Securely access their notes from any device
- Navigate with lightning-fast keyboard shortcuts
- Personalize their workspace with themes and preferences
- Trust that their data is safe and their experience is optimized

The next epic (Data Management) will build on this foundation to add:
- Real-time synchronization across devices
- Offline support with conflict resolution
- Import/export capabilities
- Version history and recovery