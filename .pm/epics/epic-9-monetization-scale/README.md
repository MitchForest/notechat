# Epic 9: Monetization & Growth 💰

## Overview
**Goal**: Implement monetization through subscriptions, advanced AI features, and team collaboration to create a sustainable business  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 8 (Data Management) completed - need reliable infrastructure for paid features  
**Outcome**: A revenue-generating platform with clear value tiers and growth mechanisms

## Success Criteria
- **Payment Success**: 99.9% transaction reliability
- **Conversion Rate**: 20% free-to-paid conversion
- **Churn Rate**: <5% monthly churn
- **Team Adoption**: 30% of paid users invite teammates
- **AI Usage**: 80% engagement with premium AI features
- **Support Response**: <24hr for paid users
- **Revenue Growth**: 20% MoM growth in MRR

## Context & Motivation

Previous epics built a powerful knowledge management platform. Epic 9 ensures AI Notes can sustain and grow as a business:

- **Fair Monetization**: Users pay for value they receive
- **Premium AI Features**: Advanced capabilities worth paying for
- **Team Collaboration**: Multiply value through shared knowledge
- **Sustainable Growth**: Building a platform that can scale

This epic transforms AI Notes from a project into a thriving business that can continue innovating and serving users long-term.

## Features

### F17: Stripe Integration
**Epic**: 3 | **Sprint**: 1 | **Complexity**: Medium

#### User Story
As a user, I want to upgrade to a paid plan so that I can access more storage, advanced AI features, and premium support.

#### Acceptance Criteria
- [ ] Stripe checkout integration with SCA compliance
- [ ] Subscription tiers: Free, Pro ($12/mo), Team ($25/user/mo)
- [ ] Usage-based AI token billing for high usage
- [ ] Payment method management portal
- [ ] Automatic invoice generation
- [ ] Dunning for failed payments
- [ ] Proration for plan changes
- [ ] Annual billing with 20% discount
- [ ] Student/educator discounts
- [ ] Referral program tracking

#### Business Rules
1. Free tier: 100 notes, 10k AI tokens/month
2. Pro tier: Unlimited notes, 100k AI tokens/month
3. Team tier: Everything in Pro + collaboration
4. Additional AI tokens: $10 per 100k tokens
5. 14-day money-back guarantee

### F18: Advanced AI Tools
**Epic**: 3 | **Sprint**: 1 | **Complexity**: Large

#### User Story
As a student, I want AI to help me study by creating summaries, flashcards, and practice questions from my notes.

#### Acceptance Criteria
- [ ] Study mode with AI-generated materials
- [ ] Flashcard generation with spaced repetition
- [ ] Practice quiz creation from notes
- [ ] Mind map generation from content
- [ ] Research assistant for finding sources
- [ ] Writing coach with style analysis
- [ ] Citation generator and formatter
- [ ] Presentation builder from notes
- [ ] Audio transcription with AI cleanup
- [ ] Custom AI model fine-tuning

#### Business Rules
1. Advanced AI features require Pro subscription
2. Custom models require Team subscription
3. API rate limits based on tier
4. Quality scoring for generated content
5. User feedback improves generation

### F19: Collaborative Features
**Epic**: 3 | **Sprint**: 2 | **Complexity**: Large

#### User Story
As a team lead, I want to share notes and collaborate with my team so we can build knowledge together.

#### Acceptance Criteria
- [ ] Team workspace creation and management
- [ ] Real-time collaborative editing
- [ ] Commenting and discussions on notes
- [ ] Team-wide AI chat with shared context
- [ ] Permission levels (viewer, editor, admin)
- [ ] Activity feed and notifications
- [ ] Team knowledge graph
- [ ] Shared collections and tags
- [ ] Guest access with limitations
- [ ] Audit logs for compliance

#### Business Rules
1. Team features require Team subscription
2. Minimum 2 seats per team
3. Admins control member access
4. 30-day data retention after removal
5. GDPR compliance for team data

## Sprints

### Sprint 9.1: Payments & Plans (3 days)

#### Day 1: Stripe Integration & Billing

**Payment Infrastructure**
- **Stripe Setup**: Complete payment system
  ```typescript
  // Payment service architecture
  class PaymentService {
    private stripe: Stripe
    private webhookSecret: string
    
    constructor() {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2023-10-16',
      })
      this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
    }
    
    async createCheckoutSession(
      userId: string,
      priceId: string,
      options?: CheckoutOptions
    ): Promise<CheckoutSession> {
      const user = await this.userService.get(userId)
      
      // Check for existing customer
      let customerId = user.stripeCustomerId
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: user.email,
          metadata: { userId },
        })
        customerId = customer.id
        await this.userService.updateStripeCustomer(userId, customerId)
      }
      
      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: options?.quantity || 1,
        }],
        mode: 'subscription',
        success_url: `${process.env.APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_URL}/billing/cancelled`,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: { enabled: true },
        customer_update: {
          address: 'auto',
          tax_ids: 'auto',
        },
        subscription_data: {
          trial_period_days: options?.trialDays || 14,
          metadata: {
            userId,
            plan: this.getPlanFromPrice(priceId),
          },
        },
        metadata: {
          userId,
        },
      })
      
      // Track checkout created
      await this.analytics.track('checkout_created', {
        userId,
        priceId,
        plan: this.getPlanFromPrice(priceId),
      })
      
      return session
    }
    
    async handleWebhook(
      payload: string,
      signature: string
    ): Promise<void> {
      let event: Stripe.Event
      
      try {
        event = this.stripe.webhooks.constructEvent(
          payload,
          signature,
          this.webhookSecret
        )
      } catch (err) {
        throw new Error(`Webhook signature verification failed: ${err.message}`)
      }
      
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object)
          break
          
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object)
          break
          
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object)
          break
          
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object)
          break
          
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object)
          break
          
        case 'customer.updated':
          await this.handleCustomerUpdated(event.data.object)
          break
      }
    }
  }
  ```

- **Subscription Management**: User subscription state
  ```typescript
  interface Subscription {
    id: string
    userId: string
    stripeSubscriptionId: string
    plan: PlanType
    status: SubscriptionStatus
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
    
    // Usage tracking
    aiTokensUsed: number
    aiTokensLimit: number
    storageUsed: number
    storageLimit: number
    teamSeatsUsed: number
    teamSeatsLimit: number
    
    // Billing
    paymentMethodId?: string
    lastPaymentStatus?: string
    nextInvoiceAmount?: number
  }
  
  class SubscriptionService {
    async checkUsage(userId: string, resource: ResourceType): Promise<UsageCheck> {
      const subscription = await this.getSubscription(userId)
      
      switch (resource) {
        case 'ai_tokens':
          return {
            used: subscription.aiTokensUsed,
            limit: subscription.aiTokensLimit,
            remaining: subscription.aiTokensLimit - subscription.aiTokensUsed,
            percentUsed: (subscription.aiTokensUsed / subscription.aiTokensLimit) * 100,
            willExceed: subscription.aiTokensUsed >= subscription.aiTokensLimit * 0.9,
          }
          
        case 'storage':
          return this.checkStorageUsage(subscription)
          
        case 'team_seats':
          return this.checkTeamSeats(subscription)
      }
    }
    
    async trackUsage(
      userId: string,
      resource: ResourceType,
      amount: number
    ): Promise<void> {
      const subscription = await this.getSubscription(userId)
      
      // Update usage
      switch (resource) {
        case 'ai_tokens':
          subscription.aiTokensUsed += amount
          
          // Check if over limit
          if (subscription.aiTokensUsed > subscription.aiTokensLimit) {
            await this.handleOverage(subscription, resource)
          }
          break
      }
      
      await this.updateSubscription(subscription)
      
      // Send alerts at thresholds
      await this.checkUsageAlerts(subscription, resource)
    }
  }
  ```

- **Billing Portal**: Customer self-service
  - Update payment methods
  - View invoices and receipts
  - Change subscription plans
  - Cancel subscription
  - Update billing details

#### Day 2: Pricing Tiers & Usage Tracking

**Pricing Configuration**
- **Plan Definitions**: Clear value proposition
  ```typescript
  const PRICING_PLANS = {
    free: {
      name: 'Free',
      price: 0,
      features: {
        notes: 100,
        aiTokens: 10_000,
        storage: 1_000_000_000, // 1GB
        versionHistory: 7, // days
        exportFormats: ['markdown', 'json'],
        support: 'community',
      },
      limits: {
        notesPerDay: 10,
        aiRequestsPerHour: 20,
        exportSizeLimit: 10_000_000, // 10MB
      },
    },
    pro: {
      name: 'Pro',
      price: 12,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      features: {
        notes: Infinity,
        aiTokens: 100_000,
        storage: 10_000_000_000, // 10GB
        versionHistory: 90, // days
        exportFormats: ['markdown', 'json', 'pdf', 'html', 'docx'],
        support: 'email',
        advancedAI: true,
        customCommands: true,
        apiAccess: true,
      },
      limits: {
        notesPerDay: Infinity,
        aiRequestsPerHour: 100,
        exportSizeLimit: 100_000_000, // 100MB
      },
    },
    team: {
      name: 'Team',
      price: 25, // per user
      stripePriceId: process.env.STRIPE_TEAM_PRICE_ID,
      features: {
        ...PRICING_PLANS.pro.features,
        aiTokens: 250_000, // per user
        storage: 50_000_000_000, // 50GB total
        versionHistory: 365, // days
        support: 'priority',
        collaboration: true,
        teamAnalytics: true,
        sso: true,
        auditLogs: true,
        customAI: true,
      },
      limits: {
        ...PRICING_PLANS.pro.limits,
        teamMembers: 100,
        guestAccess: true,
      },
    },
  }
  ```

- **Usage Tracking System**: Accurate measurement
  ```typescript
  class UsageTracker {
    private redis: Redis
    
    async trackAIUsage(userId: string, tokens: number, model: string) {
      const key = `usage:${userId}:${this.getCurrentPeriod()}`
      
      await this.redis.hincrby(key, 'ai_tokens', tokens)
      await this.redis.hincrby(key, `ai_tokens:${model}`, tokens)
      
      // Check limits
      const total = await this.redis.hget(key, 'ai_tokens')
      const subscription = await this.getSubscription(userId)
      
      if (total > subscription.aiTokensLimit) {
        await this.handleTokenOverage(userId, total)
      }
      
      // Real-time update
      await this.publishUsageUpdate(userId, {
        aiTokens: total,
        limit: subscription.aiTokensLimit,
      })
    }
    
    async getUsageReport(userId: string): Promise<UsageReport> {
      const periods = await this.getRecentPeriods(6)
      const usage = {}
      
      for (const period of periods) {
        const key = `usage:${userId}:${period}`
        usage[period] = await this.redis.hgetall(key)
      }
      
      return {
        current: usage[periods[0]],
        history: usage,
        trends: this.calculateTrends(usage),
        projections: this.projectUsage(usage),
      }
    }
  }
  ```

- **Upgrade Prompts**: Smart upselling
  - Usage-based triggers
  - Feature discovery prompts
  - Limited-time offers
  - Peer comparison

#### Day 3: Payment UI & Analytics

**Billing Interface**
- **Pricing Page**: Compelling presentation
  ```typescript
  // components/billing/pricing-page.tsx
  export function PricingPage() {
    const { user, subscription } = useAuth()
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
    const [selectedPlan, setSelectedPlan] = useState<PlanType>('pro')
    
    const handleUpgrade = async (plan: PlanType) => {
      try {
        const priceId = getPriceId(plan, billingPeriod)
        const session = await createCheckoutSession({
          priceId,
          successUrl: '/billing/success',
          cancelUrl: '/pricing',
        })
        
        await redirectToCheckout(session.id)
      } catch (error) {
        toast.error('Failed to start checkout')
      }
    }
    
    return (
      <div className="pricing-container">
        <div className="pricing-header">
          <h1>Choose Your Plan</h1>
          <p>Start free, upgrade when you need more</p>
          
          <BillingToggle
            value={billingPeriod}
            onChange={setBillingPeriod}
          />
        </div>
        
        <div className="pricing-grid">
          {Object.entries(PRICING_PLANS).map(([key, plan]) => (
            <PricingCard
              key={key}
              plan={plan}
              billingPeriod={billingPeriod}
              isCurrentPlan={subscription?.plan === key}
              onSelect={() => handleUpgrade(key)}
              popular={key === 'pro'}
            />
          ))}
        </div>
        
        <PricingFAQ />
        <MoneyBackGuarantee />
      </div>
    )
  }
  ```

- **Usage Dashboard**: Transparency builds trust
  - Current usage visualizations
  - Historical trends
  - Projection warnings
  - Upgrade suggestions

- **Payment Analytics**: Track conversion
  ```typescript
  class BillingAnalytics {
    async trackPricingView(userId: string, context: PricingContext) {
      await this.track('pricing_viewed', {
        userId,
        currentPlan: context.currentPlan,
        triggeredBy: context.trigger, // 'limit_reached', 'manual', 'prompt'
        features_used: context.featuresUsed,
      })
    }
    
    async trackCheckoutStarted(userId: string, plan: string) {
      await this.track('checkout_started', {
        userId,
        plan,
        currentPlan: await this.getCurrentPlan(userId),
        mrr_change: this.calculateMRRChange(userId, plan),
      })
    }
    
    async calculateConversionFunnel(): Promise<ConversionFunnel> {
      const events = await this.getEvents(['pricing_viewed', 'checkout_started', 'checkout_completed'])
      
      return {
        views: events.pricing_viewed.length,
        starts: events.checkout_started.length,
        completions: events.checkout_completed.length,
        viewToStart: events.checkout_started.length / events.pricing_viewed.length,
        startToComplete: events.checkout_completed.length / events.checkout_started.length,
        overall: events.checkout_completed.length / events.pricing_viewed.length,
      }
    }
  }
  ```

### Sprint 9.2: Advanced AI & Teams (4 days)

#### Day 1: Advanced AI Features

**Study Tools Suite**
- **AI Study Mode**: Learning assistant
  ```typescript
  class StudyModeService {
    async generateStudyMaterials(noteIds: string[]): Promise<StudyMaterials> {
      const notes = await this.loadNotes(noteIds)
      
      // Analyze content for key concepts
      const concepts = await this.extractKeyConcepts(notes)
      
      // Generate different study materials
      const [summaries, flashcards, quizzes, mindmap] = await Promise.all([
        this.generateSummaries(concepts),
        this.generateFlashcards(concepts),
        this.generateQuizzes(concepts),
        this.generateMindMap(concepts),
      ])
      
      return {
        summaries,
        flashcards,
        quizzes,
        mindmap,
        concepts,
        metadata: {
          difficulty: this.assessDifficulty(concepts),
          estimatedStudyTime: this.estimateStudyTime(concepts),
          topics: this.categorizeTopics(concepts),
        },
      }
    }
    
    async generateFlashcards(concepts: Concept[]): Promise<Flashcard[]> {
      const flashcards: Flashcard[] = []
      
      for (const concept of concepts) {
        const { object: cards } = await generateObject({
          model: openai('gpt-4-turbo'),
          schema: z.object({
            cards: z.array(z.object({
              front: z.string().describe('Question or prompt'),
              back: z.string().describe('Answer or explanation'),
              hint: z.string().optional().describe('Optional hint'),
              difficulty: z.enum(['easy', 'medium', 'hard']),
              tags: z.array(z.string()),
            })),
          }),
          prompt: `Create flashcards for this concept:
          
          ${concept.title}: ${concept.content}
          
          Create 3-5 flashcards that test understanding from different angles.
          Include both factual recall and application questions.`,
        })
        
        flashcards.push(...cards.cards.map(card => ({
          ...card,
          conceptId: concept.id,
          id: generateId(),
          created: new Date(),
          reviews: [],
          nextReview: new Date(),
        })))
      }
      
      return flashcards
    }
    
    async trackStudySession(
      userId: string,
      session: StudySession
    ): Promise<void> {
      // Track for spaced repetition
      for (const review of session.reviews) {
        await this.updateFlashcardSchedule(review.flashcardId, review.quality)
      }
      
      // Track overall progress
      await this.updateStudyProgress(userId, session)
      
      // Generate insights
      const insights = await this.analyzeStudyPatterns(userId)
      if (insights.recommendations.length > 0) {
        await this.notifyStudyRecommendations(userId, insights)
      }
    }
  }
  ```

- **Research Assistant**: Academic helper
  ```typescript
  class ResearchAssistant {
    async findSources(topic: string, requirements: SourceRequirements): Promise<Source[]> {
      // Search academic databases
      const sources = await Promise.all([
        this.searchGoogleScholar(topic),
        this.searchPubMed(topic),
        this.searchArxiv(topic),
        this.searchJSTOR(topic),
      ])
      
      // Filter and rank
      const filtered = this.filterByRequirements(sources.flat(), requirements)
      const ranked = this.rankByRelevance(filtered, topic)
      
      // Enhance with AI analysis
      return this.enhanceWithAnalysis(ranked)
    }
    
    async generateCitations(
      sources: Source[],
      style: CitationStyle
    ): Promise<Citation[]> {
      return sources.map(source => {
        switch (style) {
          case 'apa':
            return this.formatAPA(source)
          case 'mla':
            return this.formatMLA(source)
          case 'chicago':
            return this.formatChicago(source)
          case 'harvard':
            return this.formatHarvard(source)
        }
      })
    }
  }
  ```

- **Writing Coach**: Style improvement
  ```typescript
  class WritingCoach {
    async analyzeWriting(content: string): Promise<WritingAnalysis> {
      const [style, clarity, tone, grammar] = await Promise.all([
        this.analyzeStyle(content),
        this.analyzeClarity(content),
        this.analyzeTone(content),
        this.analyzeGrammar(content),
      ])
      
      return {
        style,
        clarity,
        tone,
        grammar,
        overall: this.calculateOverallScore({ style, clarity, tone, grammar }),
        suggestions: this.generateSuggestions({ style, clarity, tone, grammar }),
      }
    }
    
    async improveWriting(
      content: string,
      goals: WritingGoals
    ): Promise<ImprovedContent> {
      const analysis = await this.analyzeWriting(content)
      
      const improvements = await generateText({
        model: openai('gpt-4-turbo'),
        messages: [
          {
            role: 'system',
            content: `You are a professional writing coach. Improve the text according to these goals: ${JSON.stringify(goals)}`,
          },
          {
            role: 'user',
            content: `Original text: ${content}\n\nAnalysis: ${JSON.stringify(analysis)}\n\nProvide improved version.`,
          },
        ],
      })
      
      return {
        original: content,
        improved: improvements.text,
        changes: this.highlightChanges(content, improvements.text),
        explanation: improvements.explanation,
      }
    }
  }
  ```

#### Day 2: Team Collaboration Infrastructure

**Team Management System**
- **Team Creation & Administration**
  ```typescript
  class TeamService {
    async createTeam(
      ownerId: string,
      teamData: CreateTeamData
    ): Promise<Team> {
      // Verify subscription
      const subscription = await this.verifyTeamSubscription(ownerId)
      
      // Create team
      const team: Team = {
        id: generateId(),
        name: teamData.name,
        ownerId,
        createdAt: new Date(),
        settings: {
          defaultPermissions: 'viewer',
          allowGuestAccess: false,
          requireTwoFactor: false,
          dataRetentionDays: 30,
        },
        subscription: {
          seats: subscription.teamSeats,
          usedSeats: 1,
        },
      }
      
      await this.db.teams.create(team)
      
      // Add owner as admin
      await this.addMember(team.id, ownerId, 'admin')
      
      // Set up team resources
      await this.setupTeamResources(team)
      
      return team
    }
    
    async addMember(
      teamId: string,
      email: string,
      role: TeamRole
    ): Promise<TeamMember> {
      const team = await this.getTeam(teamId)
      
      // Check seat availability
      if (team.subscription.usedSeats >= team.subscription.seats) {
        throw new Error('Team has reached seat limit')
      }
      
      // Create or get user
      let user = await this.userService.findByEmail(email)
      if (!user) {
        // Send invitation
        const invitation = await this.createInvitation(teamId, email, role)
        await this.emailService.sendTeamInvitation(invitation)
        return { status: 'invited', invitation }
      }
      
      // Add to team
      const member: TeamMember = {
        userId: user.id,
        teamId,
        role,
        joinedAt: new Date(),
        permissions: this.getPermissionsForRole(role),
      }
      
      await this.db.teamMembers.create(member)
      await this.updateSeatUsage(teamId, 1)
      
      // Grant access to team resources
      await this.grantResourceAccess(member)
      
      return member
    }
    
    async shareNote(
      noteId: string,
      teamId: string,
      options: ShareOptions
    ): Promise<SharedNote> {
      const note = await this.noteService.get(noteId)
      const team = await this.getTeam(teamId)
      
      // Verify permissions
      await this.verifySharePermissions(note.userId, teamId)
      
      // Create shared note
      const sharedNote: SharedNote = {
        id: generateId(),
        noteId,
        teamId,
        sharedBy: note.userId,
        sharedAt: new Date(),
        permissions: options.permissions || 'view',
        allowComments: options.allowComments ?? true,
        allowEditing: options.allowEditing ?? false,
      }
      
      await this.db.sharedNotes.create(sharedNote)
      
      // Notify team members
      await this.notifyTeamMembers(teamId, {
        type: 'note_shared',
        noteTitle: note.title,
        sharedBy: note.userId,
      })
      
      return sharedNote
    }
  }
  ```

- **Real-time Collaboration Engine**
  ```typescript
  class CollaborationEngine {
    private yjs: Y.Doc
    private provider: WebsocketProvider
    private awareness: awarenessProtocol.Awareness
    
    async initializeCollaboration(noteId: string, teamId: string) {
      // Initialize Yjs document
      this.yjs = new Y.Doc()
      
      // Set up WebSocket provider
      this.provider = new WebsocketProvider(
        process.env.COLLAB_SERVER_URL,
        `${teamId}:${noteId}`,
        this.yjs,
        {
          auth: { token: await this.getCollabToken() },
        }
      )
      
      // Set up awareness for presence
      this.awareness = this.provider.awareness
      this.setupAwareness()
      
      // Handle updates
      this.yjs.on('update', this.handleUpdate.bind(this))
      
      // Track active collaborators
      this.awareness.on('change', this.handleAwarenessChange.bind(this))
    }
    
    private setupAwareness() {
      const user = getCurrentUser()
      
      this.awareness.setLocalState({
        user: {
          id: user.id,
          name: user.name,
          color: this.getUserColor(user.id),
          avatar: user.avatarUrl,
        },
        cursor: null,
        selection: null,
      })
    }
    
    private handleUpdate(update: Uint8Array, origin: any) {
      // Save to database periodically
      this.debouncedSave(update)
      
      // Track edit activity
      this.trackActivity({
        type: 'edit',
        userId: origin?.userId || 'system',
        timestamp: new Date(),
      })
    }
    
    async addComment(
      noteId: string,
      selection: Selection,
      content: string
    ): Promise<Comment> {
      const comment: Comment = {
        id: generateId(),
        noteId,
        userId: getCurrentUser().id,
        content,
        selection,
        createdAt: new Date(),
        resolved: false,
        replies: [],
      }
      
      // Add to Yjs document
      const comments = this.yjs.getMap('comments')
      comments.set(comment.id, comment)
      
      // Notify mentioned users
      const mentions = this.extractMentions(content)
      await this.notifyMentions(mentions, comment)
      
      return comment
    }
  }
  ```

#### Day 3: Team Features UI

**Collaboration Interface**
- **Team Dashboard**: Central hub
  ```typescript
  // components/team/team-dashboard.tsx
  export function TeamDashboard({ teamId }: { teamId: string }) {
    const { team, members, activity } = useTeam(teamId)
    const [view, setView] = useState<'overview' | 'members' | 'shared' | 'analytics'>('overview')
    
    return (
      <div className="team-dashboard">
        <TeamHeader team={team} />
        
        <Tabs value={view} onValueChange={setView}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="shared">Shared Notes</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-6">
              <TeamActivity activity={activity} />
              <RecentSharedNotes teamId={teamId} />
              <TeamKnowledgeGraph teamId={teamId} />
            </div>
          </TabsContent>
          
          <TabsContent value="members">
            <TeamMembers
              members={members}
              onInvite={handleInviteMember}
              onRemove={handleRemoveMember}
              onRoleChange={handleRoleChange}
            />
          </TabsContent>
          
          <TabsContent value="shared">
            <SharedNotesManager teamId={teamId} />
          </TabsContent>
          
          <TabsContent value="analytics">
            <TeamAnalytics teamId={teamId} />
          </TabsContent>
        </Tabs>
      </div>
    )
  }
  ```

- **Collaborative Editor**: Real-time editing
  ```typescript
  // components/editor/collaborative-editor.tsx
  export function CollaborativeEditor({
    noteId,
    teamId,
  }: {
    noteId: string
    teamId: string
  }) {
    const { provider, awareness } = useCollaboration(noteId, teamId)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    
    useEffect(() => {
      if (!awareness) return
      
      const updateCollaborators = () => {
        const states = awareness.getStates()
        const collabs = Array.from(states.entries())
          .filter(([clientId]) => clientId !== awareness.clientID)
          .map(([_, state]) => state.user)
          .filter(Boolean)
        
        setCollaborators(collabs)
      }
      
      awareness.on('change', updateCollaborators)
      updateCollaborators()
      
      return () => awareness.off('change', updateCollaborators)
    }, [awareness])
    
    return (
      <div className="collaborative-editor">
        <EditorHeader>
          <ActiveCollaborators collaborators={collaborators} />
        </EditorHeader>
        
        <div className="editor-container">
          <TiptapEditor
            extensions={[
              ...defaultExtensions,
              Collaboration.configure({ document: provider.doc }),
              CollaborationCursor.configure({
                provider,
                user: getCurrentUser(),
              }),
            ]}
          />
          
          <CommentsSidebar noteId={noteId} />
        </div>
      </div>
    )
  }
  ```

- **Activity Feed**: Team awareness
  ```typescript
  interface TeamActivity {
    id: string
    type: ActivityType
    actor: User
    target?: {
      type: 'note' | 'comment' | 'member'
      id: string
      title?: string
    }
    timestamp: Date
    metadata?: any
  }
  
  export function TeamActivityFeed({ teamId }: { teamId: string }) {
    const { activities, loadMore, hasMore } = useTeamActivity(teamId)
    
    return (
      <div className="activity-feed">
        <h3>Team Activity</h3>
        
        <div className="space-y-4">
          {activities.map(activity => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
        
        {hasMore && (
          <Button variant="outline" onClick={loadMore}>
            Load more
          </Button>
        )}
      </div>
    )
  }
  ```

#### Day 4: Growth Features & Analytics

**Growth Mechanisms**
- **Referral Program**: Viral growth
  ```typescript
  class ReferralProgram {
    async createReferralCode(userId: string): Promise<ReferralCode> {
      const code: ReferralCode = {
        id: generateId(),
        code: this.generateUniqueCode(),
        userId,
        created: new Date(),
        uses: 0,
        rewards: {
          referrer: { months: 1, aiTokens: 50000 },
          referee: { months: 1, aiTokens: 25000 },
        },
      }
      
      await this.db.referralCodes.create(code)
      return code
    }
    
    async applyReferralCode(
      code: string,
      newUserId: string
    ): Promise<void> {
      const referral = await this.db.referralCodes.findByCode(code)
      if (!referral) throw new Error('Invalid referral code')
      
      // Create referral record
      await this.db.referrals.create({
        referralCodeId: referral.id,
        referrerId: referral.userId,
        refereeId: newUserId,
        appliedAt: new Date(),
      })
      
      // Apply rewards
      await Promise.all([
        this.applyReferrerReward(referral.userId, referral.rewards.referrer),
        this.applyRefereeReward(newUserId, referral.rewards.referee),
      ])
      
      // Track for analytics
      await this.analytics.track('referral_completed', {
        referrerId: referral.userId,
        refereeId: newUserId,
        code: code,
      })
    }
  }
  ```

- **Usage Analytics Dashboard**: Data-driven decisions
  ```typescript
  // components/analytics/usage-dashboard.tsx
  export function UsageDashboard() {
    const { metrics, dateRange, setDateRange } = useAnalytics()
    
    return (
      <div className="analytics-dashboard">
        <AnalyticsHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
        
        <div className="grid gap-6">
          <MetricCard
            title="Monthly Recurring Revenue"
            value={formatCurrency(metrics.mrr)}
            change={metrics.mrrGrowth}
            chart={<MRRChart data={metrics.mrrHistory} />}
          />
          
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers}
            change={metrics.userGrowth}
            chart={<UsersChart data={metrics.userHistory} />}
          />
          
          <MetricCard
            title="AI Usage"
            value={formatNumber(metrics.aiTokensUsed)}
            subtitle="tokens this month"
            chart={<AIUsageChart data={metrics.aiUsageHistory} />}
          />
          
          <MetricCard
            title="Conversion Rate"
            value={formatPercent(metrics.conversionRate)}
            change={metrics.conversionChange}
            chart={<ConversionFunnel data={metrics.funnel} />}
          />
        </div>
        
        <UserSegments segments={metrics.segments} />
        <ChurnAnalysis data={metrics.churn} />
        <FeatureAdoption features={metrics.features} />
      </div>
    )
  }
  ```

- **A/B Testing Framework**: Optimize conversion
  ```typescript
  class ABTestingService {
    async getVariant(
      userId: string,
      experiment: string
    ): Promise<Variant> {
      // Check if user already assigned
      const assignment = await this.getAssignment(userId, experiment)
      if (assignment) return assignment.variant
      
      // Get experiment config
      const exp = await this.getExperiment(experiment)
      if (!exp.active) return exp.control
      
      // Assign variant
      const variant = this.assignVariant(userId, exp)
      await this.saveAssignment(userId, experiment, variant)
      
      // Track exposure
      await this.analytics.track('experiment_exposure', {
        userId,
        experiment,
        variant,
      })
      
      return variant
    }
    
    async trackConversion(
      userId: string,
      experiment: string,
      value?: number
    ): Promise<void> {
      const assignment = await this.getAssignment(userId, experiment)
      if (!assignment) return
      
      await this.analytics.track('experiment_conversion', {
        userId,
        experiment,
        variant: assignment.variant,
        value,
      })
      
      // Update results cache
      await this.updateResults(experiment)
    }
  }
  ```

## Technical Architecture

### Subscription Architecture

```typescript
// Subscription management system
interface SubscriptionSystem {
  stripe: StripeService
  usage: UsageService
  limits: LimitService
  billing: BillingService
}

interface StripeService {
  // Customer management
  createCustomer(user: User): Promise<Stripe.Customer>
  updateCustomer(customerId: string, data: any): Promise<Stripe.Customer>
  
  // Subscription management
  createSubscription(customerId: string, priceId: string): Promise<Stripe.Subscription>
  updateSubscription(subId: string, data: any): Promise<Stripe.Subscription>
  cancelSubscription(subId: string): Promise<Stripe.Subscription>
  
  // Payment methods
  attachPaymentMethod(customerId: string, pmId: string): Promise<Stripe.PaymentMethod>
  setDefaultPaymentMethod(customerId: string, pmId: string): Promise<void>
  
  // Billing portal
  createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session>
}

class UsageService {
  private trackers: Map<ResourceType, UsageTracker> = new Map()
  
  async track(
    userId: string,
    resource: ResourceType,
    amount: number,
    metadata?: any
  ): Promise<void> {
    const tracker = this.trackers.get(resource)
    if (!tracker) throw new Error(`No tracker for ${resource}`)
    
    // Track usage
    await tracker.track(userId, amount, metadata)
    
    // Check limits
    const limit = await this.limits.getLimit(userId, resource)
    const usage = await tracker.getUsage(userId)
    
    if (usage >= limit) {
      await this.handleLimitExceeded(userId, resource, usage, limit)
    } else if (usage >= limit * 0.8) {
      await this.sendUsageWarning(userId, resource, usage, limit)
    }
  }
  
  async getUsageReport(userId: string): Promise<UsageReport> {
    const subscription = await this.getSubscription(userId)
    const resources = this.getResourcesForPlan(subscription.plan)
    
    const usage: UsageReport = {
      period: this.getCurrentBillingPeriod(subscription),
      resources: {},
    }
    
    for (const resource of resources) {
      const tracker = this.trackers.get(resource)
      usage.resources[resource] = {
        used: await tracker.getUsage(userId),
        limit: await this.limits.getLimit(userId, resource),
        history: await tracker.getHistory(userId, 30),
        projection: await tracker.projectUsage(userId),
      }
    }
    
    return usage
  }
}
```

### Team Collaboration Architecture

```typescript
// Team collaboration system
interface CollaborationSystem {
  teams: TeamService
  sharing: SharingService
  realtime: RealtimeService
  permissions: PermissionService
}

interface TeamService {
  // Team management
  create(data: CreateTeamData): Promise<Team>
  update(teamId: string, data: UpdateTeamData): Promise<Team>
  delete(teamId: string): Promise<void>
  
  // Member management
  addMember(teamId: string, email: string, role: TeamRole): Promise<TeamMember>
  updateMemberRole(teamId: string, userId: string, role: TeamRole): Promise<void>
  removeMember(teamId: string, userId: string): Promise<void>
  
  // Invitations
  createInvitation(teamId: string, email: string, role: TeamRole): Promise<Invitation>
  acceptInvitation(invitationId: string, userId: string): Promise<void>
  revokeInvitation(invitationId: string): Promise<void>
}

class PermissionService {
  private policies: Map<string, PermissionPolicy> = new Map()
  
  constructor() {
    this.registerPolicies()
  }
  
  private registerPolicies() {
    // Note permissions
    this.policies.set('note:read', {
      check: async (user, note) => {
        // Owner can always read
        if (note.userId === user.id) return true
        
        // Check team sharing
        const shares = await this.getShares(note.id)
        for (const share of shares) {
          if (await this.isTeamMember(user.id, share.teamId)) {
            return true
          }
        }
        
        return false
      },
    })
    
    this.policies.set('note:write', {
      check: async (user, note) => {
        // Owner can always write
        if (note.userId === user.id) return true
        
        // Check team sharing with edit permission
        const shares = await this.getShares(note.id)
        for (const share of shares) {
          if (share.allowEditing && await this.isTeamMember(user.id, share.teamId)) {
            const member = await this.getTeamMember(user.id, share.teamId)
            return member.role !== 'viewer'
          }
        }
        
        return false
      },
    })
  }
  
  async can(
    user: User,
    action: string,
    resource: any
  ): Promise<boolean> {
    const policy = this.policies.get(action)
    if (!policy) throw new Error(`No policy for ${action}`)
    
    const result = await policy.check(user, resource)
    
    // Audit log
    await this.audit.log({
      userId: user.id,
      action,
      resourceType: resource.constructor.name,
      resourceId: resource.id,
      allowed: result,
      timestamp: new Date(),
    })
    
    return result
  }
}
```

### Advanced AI Architecture

```typescript
// Advanced AI features system
interface AdvancedAISystem {
  study: StudyModeService
  research: ResearchService
  writing: WritingService
  custom: CustomModelService
}

class CustomModelService {
  private openai: OpenAI
  
  async createFineTune(
    teamId: string,
    trainingData: TrainingData
  ): Promise<FineTuneJob> {
    // Validate team subscription
    const team = await this.teamService.get(teamId)
    if (team.subscription.plan !== 'team') {
      throw new Error('Custom models require Team plan')
    }
    
    // Prepare training data
    const preparedData = await this.prepareTrainingData(trainingData)
    
    // Upload to OpenAI
    const file = await this.openai.files.create({
      file: preparedData,
      purpose: 'fine-tune',
    })
    
    // Create fine-tune job
    const job = await this.openai.fineTuning.jobs.create({
      training_file: file.id,
      model: 'gpt-3.5-turbo',
      hyperparameters: {
        n_epochs: 3,
      },
      suffix: `team-${teamId}`,
    })
    
    // Track in our system
    await this.db.fineTuneJobs.create({
      teamId,
      openaiJobId: job.id,
      status: job.status,
      createdAt: new Date(),
    })
    
    return job
  }
  
  async useCustomModel(
    teamId: string,
    prompt: string,
    options?: CustomModelOptions
  ): Promise<string> {
    const model = await this.getTeamModel(teamId)
    if (!model) throw new Error('No custom model for team')
    
    const completion = await this.openai.chat.completions.create({
      model: model.openaiModelId,
      messages: [
        { role: 'system', content: options?.systemPrompt || '' },
        { role: 'user', content: prompt },
      ],
      temperature: options?.temperature || 0.7,
      max_tokens: options?.maxTokens || 1000,
    })
    
    // Track usage
    await this.usage.track(teamId, 'custom_model_tokens', completion.usage.total_tokens)
    
    return completion.choices[0].message.content
  }
}
```

## UI/UX Design Patterns

### Pricing Page
```
┌─────────────────────────────────────┐
│       Choose the Perfect Plan       │
│   Start free, upgrade as you grow   │
│                                     │
│ [Monthly] [Annual - Save 20%]       │
└─────────────────────────────────────┘

┌─────────────────┬─────────────────┬─────────────────┐
│      Free       │   Pro ⭐ Popular │      Team       │
├─────────────────┼─────────────────┼─────────────────┤
│    $0/month    │    $12/month    │  $25/user/month │
│                 │   $120/year     │   $250/year     │
├─────────────────┼─────────────────┼─────────────────┤
│ ✓ 100 notes     │ ✓ Unlimited     │ ✓ Everything    │
│ ✓ 10k AI tokens │ ✓ 100k tokens   │   in Pro        │
│ ✓ Basic export  │ ✓ All formats   │ ✓ 250k tokens   │
│ ✓ 7 day history │ ✓ 90 day hist   │ ✓ 365 day hist  │
│ ✗ Advanced AI   │ ✓ Advanced AI   │ ✓ Custom AI     │
│ ✗ API access    │ ✓ API access    │ ✓ Team collab   │
│                 │ ✓ Priority sup  │ ✓ SSO & audit   │
├─────────────────┼─────────────────┼─────────────────┤
│ [Current Plan]  │ [Upgrade Now]   │ [Start Trial]   │
└─────────────────┴─────────────────┴─────────────────┘

🛡️ 14-day money back guarantee
```

### Usage Dashboard
```
┌─────────────────────────────────────┐
│ 📊 Usage Overview - Pro Plan        │
├─────────────────────────────────────┤
│ AI Tokens                           │
│ ████████░░ 78,234 / 100,000        │
│ 78% used · 22k remaining            │
│                                     │
│ Storage                             │
│ ███░░░░░░░ 3.2 GB / 10 GB         │
│ 32% used · 6.8 GB remaining         │
│                                     │
│ Notes Created                       │
│ ████████████ 523 / Unlimited       │
│                                     │
│ [View Detailed Report]              │
├─────────────────────────────────────┤
│ 💡 Running low on AI tokens?        │
│ Upgrade to Team for 250k tokens     │
│ [Compare Plans]                     │
└─────────────────────────────────────┘
```

### Team Dashboard
```
┌─────────────────────────────────────┐
│ 👥 Design Team Workspace            │
├─────────────────────────────────────┤
│ [Overview] [Members] [Shared] [Analytics]
├─────────────────────────────────────┤
│ Recent Activity                     │
│                                     │
│ 🟢 Sarah is editing "Q1 Roadmap"   │
│ 💬 Mike commented on "Design Specs" │
│ 📄 Lisa shared "Research Notes"     │
│ ✏️  Tom updated "Sprint Planning"   │
│                                     │
│ Active Now: 4 members               │
├─────────────────────────────────────┤
│ Shared Knowledge                    │
│                                     │
│ 📊 Analytics Dashboard              │
│ 🎨 Design System                    │
│ 📋 Project Templates                │
│ 🔬 Research Repository              │
│                                     │
│ [Browse All] [Create Shared Note]   │
└─────────────────────────────────────┘
```

### Collaborative Editor
```
┌─────────────────────────────────────┐
│ 📝 Q1 Product Roadmap               │
│ Shared with Design Team             │
├─────────────────────────────────────┤
│ [Sarah 🟢] [Mike 🔵] [You]         │
├─────────────────────────────────────┤
│                                     │
│ ## Overview                         │
│ This quarter we're focusing on...   │
│ |← Mike's cursor                    │
│                                     │
│ ## Key Features                     │
│ 1. Authentication system ← Sarah    │
│    - OAuth integration   editing    │
│    - Session management  here       │
│                                     │
├─────────────────────────────────────┤
│ 💬 Comments (3)                     │
│                                     │
│ Mike: "Should we include 2FA?"      │
│ Sarah: "Yes, enterprise requires it"│
│ [Add comment...]                    │
└─────────────────────────────────────┘
```

## Implementation Details

### File Structure
```
features/monetization/
├── billing/
│   ├── stripe-service.ts
│   ├── subscription-manager.ts
│   ├── usage-tracker.ts
│   ├── billing-portal.ts
│   └── components/
│       ├── pricing-page.tsx
│       ├── checkout-form.tsx
│       ├── usage-dashboard.tsx
│       └── billing-settings.tsx
├── advanced-ai/
│   ├── study-mode/
│   │   ├── flashcard-generator.ts
│   │   ├── quiz-creator.ts
│   │   ├── summary-engine.ts
│   │   └── spaced-repetition.ts
│   ├── research/
│   │   ├── source-finder.ts
│   │   ├── citation-formatter.ts
│   │   └── literature-review.ts
│   ├── writing/
│   │   ├── style-analyzer.ts
│   │   ├── writing-coach.ts
│   │   └── grammar-enhancer.ts
│   └── components/
│       ├── study-mode-ui.tsx
│       ├── research-panel.tsx
│       └── writing-feedback.tsx
├── teams/
│   ├── team-service.ts
│   ├── collaboration-engine.ts
│   ├── permission-system.ts
│   ├── invitation-manager.ts
│   └── components/
│       ├── team-dashboard.tsx
│       ├── member-management.tsx
│       ├── shared-notes.tsx
│       └── collaborative-editor.tsx
└── growth/
    ├── referral-program.ts
    ├── analytics-service.ts
    ├── ab-testing.ts
    └── components/
        ├── referral-widget.tsx
        └── growth-dashboard.tsx
```

### Stripe Webhook Handler

```typescript
// app/api/stripe/webhook/route.ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(session)
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCancelled(subscription)
        break
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId
  if (!userId) throw new Error('No userId in session metadata')
  
  // Create subscription record
  await db.subscriptions.create({
    userId,
    stripeCustomerId: session.customer as string,
    stripeSubscriptionId: session.subscription as string,
    plan: session.metadata.plan as PlanType,
    status: 'active',
  })
  
  // Update user
  await db.users.update(userId, {
    stripeCustomerId: session.customer as string,
    subscriptionStatus: 'active',
  })
  
  // Send welcome email
  await emailService.sendWelcomeEmail(userId, session.metadata.plan)
  
  // Track conversion
  await analytics.track('subscription_created', {
    userId,
    plan: session.metadata.plan,
    amount: session.amount_total,
  })
}
```

### Team Collaboration Implementation

```typescript
// features/teams/components/collaborative-editor.tsx
"use client"

import { useEffect, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { useEditor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { useTeam } from '../hooks/use-team'

export function CollaborativeEditor({
  noteId,
  teamId,
}: {
  noteId: string
  teamId: string
}) {
  const { currentUser } = useAuth()
  const { members } = useTeam(teamId)
  const [provider, setProvider] = useState<WebsocketProvider>()
  
  const ydoc = new Y.Doc()
  
  useEffect(() => {
    // Connect to collaboration server
    const provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_COLLAB_URL!,
      `${teamId}:${noteId}`,
      ydoc,
      {
        connect: true,
        params: {
          auth: getAuthToken(),
        },
      }
    )
    
    setProvider(provider)
    
    // Set user awareness
    provider.awareness.setLocalStateField('user', {
      id: currentUser.id,
      name: currentUser.name,
      color: getUserColor(currentUser.id),
      avatar: currentUser.avatarUrl,
    })
    
    return () => {
      provider.destroy()
    }
  }, [teamId, noteId])
  
  const editor = useEditor({
    extensions: [
      ...baseExtensions,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: currentUser,
        render: user => {
          const cursor = document.createElement('span')
          cursor.classList.add('collaboration-cursor')
          cursor.style.borderColor = user.color
          
          const label = document.createElement('div')
          label.classList.add('collaboration-cursor-label')
          label.style.backgroundColor = user.color
          label.textContent = user.name
          cursor.appendChild(label)
          
          return cursor
        },
      }),
    ],
    onUpdate: ({ editor }) => {
      // Auto-save handled by Yjs
    },
  })
  
  return (
    <div className="collaborative-editor-container">
      <CollaboratorPresence provider={provider} />
      <EditorContent editor={editor} />
      <CommentThread noteId={noteId} editor={editor} />
    </div>
  )
}
```

## Error Handling & Recovery

### Payment Error Handling

```typescript
class PaymentErrorHandler {
  async handlePaymentError(error: StripeError, context: PaymentContext): Promise<void> {
    switch (error.type) {
      case 'card_error':
        await this.handleCardError(error, context)
        break
        
      case 'invalid_request_error':
        await this.handleInvalidRequest(error, context)
        break
        
      case 'authentication_error':
        await this.handleAuthError(error, context)
        break
        
      default:
        await this.handleGenericError(error, context)
    }
  }
  
  private async handleCardError(error: StripeError, context: PaymentContext) {
    const { code } = error
    
    switch (code) {
      case 'insufficient_funds':
        toast.error('Payment failed: Insufficient funds')
        await this.suggestAlternativePayment(context)
        break
        
      case 'card_declined':
        toast.error('Card declined. Please try another payment method.')
        await this.showPaymentMethodSelector(context)
        break
        
      case 'expired_card':
        toast.error('Card expired. Please update your payment method.')
        await this.redirectToBillingPortal(context)
        break
        
      default:
        toast.error(`Payment failed: ${error.message}`)
    }
    
    // Track failure
    await analytics.track('payment_failed', {
      error: code,
      context,
    })
  }
  
  async handleSubscriptionFailure(
    userId: string,
    reason: string
  ): Promise<void> {
    // Grace period logic
    const user = await userService.get(userId)
    const gracePeriodEnds = addDays(new Date(), 7)
    
    // Update subscription status
    await subscriptionService.update(userId, {
      status: 'past_due',
      gracePeriodEnds,
    })
    
    // Notify user
    await emailService.sendPaymentFailedEmail(user, {
      reason,
      gracePeriodEnds,
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
    })
    
    // In-app notification
    await notificationService.create({
      userId,
      type: 'payment_failed',
      title: 'Payment failed',
      message: `Please update your payment method by ${format(gracePeriodEnds, 'MMM d')}`,
      priority: 'high',
    })
  }
}
```

### Team Error Recovery

```typescript
class TeamErrorRecovery {
  async handleTeamOperationError(
    error: TeamError,
    operation: TeamOperation
  ): Promise<void> {
    switch (error.code) {
      case 'SEAT_LIMIT_EXCEEDED':
        const upgrade = await this.showSeatLimitDialog({
          currentSeats: error.currentSeats,
          requestedSeats: error.requestedSeats,
          additionalCost: error.additionalCost,
        })
        
        if (upgrade) {
          await this.upgradeTeamSeats(operation.teamId, error.requestedSeats)
          await this.retryOperation(operation)
        }
        break
        
      case 'PERMISSION_DENIED':
        toast.error('You do not have permission to perform this action')
        await this.showPermissionInfo(operation)
        break
        
      case 'SYNC_CONFLICT':
        const resolution = await this.showSyncConflictDialog(error.conflicts)
        if (resolution) {
          await this.applySyncResolution(resolution)
        }
        break
    }
  }
  
  async recoverFromDataLoss(
    teamId: string,
    affectedData: AffectedData
  ): Promise<RecoveryResult> {
    // Check backups
    const backups = await this.findBackups(teamId, affectedData.timeRange)
    
    if (backups.length > 0) {
      const selected = await this.showBackupSelector(backups)
      if (selected) {
        return await this.restoreFromBackup(teamId, selected)
      }
    }
    
    // Try to recover from team members' local storage
    const members = await this.getTeamMembers(teamId)
    const recoveryData = await this.requestRecoveryFromMembers(members, affectedData)
    
    if (recoveryData.length > 0) {
      return await this.mergeRecoveryData(recoveryData)
    }
    
    // Last resort - audit logs
    return await this.reconstructFromAuditLogs(teamId, affectedData)
  }
}