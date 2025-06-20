# Epic 6: Advanced AI Context 🧠

## Overview
**Goal**: Enable multi-note intelligence with cross-reference capabilities, pattern detection, and knowledge synthesis  
**Duration**: 2 sprints (1 week)  
**Prerequisites**: Epic 5 (AI Commands & Transformations) completed - we need the smart collections infrastructure  
**Outcome**: AI understands relationships between notes, detects patterns across knowledge base, and provides intelligent synthesis

## Success Criteria
- **Reference Performance**: <500ms to add note reference to chat
- **Context Quality**: 95% relevant context extraction accuracy
- **Pattern Detection**: Identifies meaningful connections in 80% of related notes
- **Synthesis Accuracy**: 90% accurate conflict/contradiction detection
- **Token Efficiency**: Optimal context window usage (never exceeds limits)
- **UI Responsiveness**: Reference panel updates in <100ms
- **Knowledge Graph**: Visualizes connections between 100+ notes smoothly

## Context & Motivation

Previous epics gave users powerful tools for creating and organizing knowledge. Epic 6 transforms AI Notes into a truly intelligent second brain by understanding connections between ideas:

- **Multi-Note Intelligence**: AI comprehends relationships across your entire knowledge base
- **Automatic Synthesis**: Discovers insights you didn't know existed in your notes
- **Conflict Resolution**: Identifies contradictions and helps reconcile different viewpoints
- **Knowledge Evolution**: Tracks how your understanding develops over time

This is where AI Notes transcends traditional note-taking to become a thinking partner that understands the full context of your knowledge.

## Features

### F12: Multi-Note Chat Context
**Epic**: 2 | **Sprint**: 2 | **Complexity**: Medium

#### User Story
As a researcher, I want to reference multiple notes in AI conversations so that I can synthesize information from different sources and get comprehensive answers.

#### Acceptance Criteria
- [ ] @mention system to reference notes in chat input
- [ ] Drag & drop notes into chat for instant reference
- [ ] Visual reference cards show note previews
- [ ] Maximum 5 notes can be referenced at once
- [ ] AI responses cite specific notes when using their content
- [ ] Token usage indicator shows context consumption
- [ ] Remove references individually or clear all
- [ ] Referenced notes persist in chat history
- [ ] Smart context extraction (relevant sections only)
- [ ] Automatic deduplication of similar content

#### Business Rules
1. Maximum 5 note references per chat message
2. Context extraction limited to 500 tokens per note
3. Total context cannot exceed 4000 tokens
4. References cleared after message sent (unless pinned)
5. Cited sources linked in AI responses

### Knowledge Synthesis Features (Advanced)
**Epic**: 3 | **Sprint**: 2 | **Complexity**: Large

#### User Story
As a knowledge worker, I want AI to identify patterns and connections across my notes so that I can discover insights and ensure consistency in my understanding.

#### Acceptance Criteria
- [ ] Automatic pattern detection across all notes
- [ ] Contradiction/conflict identification
- [ ] Timeline synthesis from temporal mentions
- [ ] Entity relationship mapping
- [ ] Topic evolution tracking
- [ ] Knowledge gap identification
- [ ] Visual knowledge graph
- [ ] Insight notifications for new connections
- [ ] Bulk pattern analysis tools
- [ ] Export relationship data

## Sprints

### Sprint 6.1: Multi-Note References (3 days)

#### Day 1: Reference Infrastructure

**Reference Management System**
- **Note Reference Manager**: Core system for managing references
  - Add/remove note references
  - Validate reference limits
  - Track reference usage
  - Manage reference lifecycle

- **Context Extraction Engine**: Smart content extraction
  - Relevance scoring for sections
  - Semantic chunking
  - Deduplication algorithms
  - Token optimization

- **Reference State Management**: Zustand store for references
  - Global reference state
  - Per-chat reference tracking
  - Persistence across sessions
  - Undo/redo support

#### Day 2: @Mention System & UI

**Mention Interface Implementation**
- **@Mention Autocomplete**: Natural note selection
  - Fuzzy search while typing
  - Recent notes prioritized
  - Visual previews in dropdown
  - Keyboard navigation

- **Drag & Drop Support**: Intuitive reference adding
  - Drag from sidebar
  - Drop zones in chat
  - Visual feedback
  - Multi-select support

- **Reference Cards UI**: Clear reference visualization
  - Expandable previews
  - Remove buttons
  - Relevance indicators
  - Source attribution

#### Day 3: Context Integration & Optimization

**AI Integration**
- **Context Window Management**: Optimal token usage
  - Dynamic context sizing
  - Priority-based inclusion
  - Chunking strategies
  - Fallback handling

- **Response Citation System**: Clear source attribution
  - Inline citations in responses
  - Source linking
  - Confidence indicators
  - Citation formatting

- **Performance Optimization**: Fast and smooth
  - Reference caching
  - Lazy loading
  - Incremental updates
  - Background processing

### Sprint 6.2: Knowledge Synthesis (4 days)

#### Day 1: Pattern Detection Engine

**Cross-Note Analysis**
- **Pattern Recognition System**: Identify connections
  - Topic clustering across notes
  - Entity extraction and linking
  - Temporal pattern detection
  - Semantic similarity mapping

- **Relationship Identification**: Understand connections
  - Direct references between notes
  - Implicit connections via topics
  - Chronological relationships
  - Hierarchical structures

- **Insight Generation**: Surface discoveries
  - Connection strength scoring
  - Novelty detection
  - Importance ranking
  - Insight explanations

#### Day 2: Contradiction Detection

**Conflict Analysis System**
- **Contradiction Detection**: Find inconsistencies
  - Logical conflict identification
  - Fact checking across notes
  - Opinion evolution tracking
  - Source reliability scoring

- **Resolution Interface**: Help reconcile differences
  - Side-by-side comparisons
  - Timeline visualization
  - Source evaluation tools
  - Resolution workflows

- **Learning Integration**: Improve over time
  - User feedback on detections
  - False positive reduction
  - Pattern refinement
  - Accuracy metrics

#### Day 3: Knowledge Visualization

**Knowledge Graph Implementation**
- **Graph Rendering**: Visual relationship display
  - Force-directed layout
  - Zoom and pan controls
  - Node clustering
  - Edge filtering

- **Interactive Features**: Explore connections
  - Click to expand nodes
  - Hover for previews
  - Filter by relationship type
  - Time-based animations

- **Graph Analytics**: Understand structure
  - Centrality measures
  - Cluster identification
  - Path finding
  - Density analysis

#### Day 4: Synthesis Tools & Integration

**Advanced Synthesis Features**
- **Knowledge Gap Analysis**: Find what's missing
  - Topic coverage maps
  - Question generation
  - Research suggestions
  - Completion tracking

- **Evolution Tracking**: See knowledge development
  - Topic timelines
  - Understanding progression
  - Milestone identification
  - Change visualization

- **Bulk Operations**: Analyze at scale
  - Collection-wide analysis
  - Batch relationship detection
  - Export capabilities
  - Report generation

## Technical Architecture

### Multi-Note Reference System

```typescript
// Reference management core
interface NoteReference {
  id: string
  noteId: string
  note: Note
  addedAt: Date
  addedBy: 'mention' | 'drag' | 'suggestion'
  relevantSections?: RelevantSection[]
  tokenCount: number
  priority: number
}

interface RelevantSection {
  content: string
  startIdx: number
  endIdx: number
  relevanceScore: number
  keywords: string[]
}

class ReferenceManager {
  private references = new Map<string, NoteReference>()
  private readonly maxReferences = 5
  private readonly maxTokensPerNote = 500
  private readonly maxTotalTokens = 4000
  
  async addReference(noteId: string, method: 'mention' | 'drag' | 'suggestion'): Promise<boolean> {
    if (this.references.size >= this.maxReferences) {
      throw new Error(`Maximum ${this.maxReferences} references allowed`)
    }
    
    const note = await this.noteService.getNote(noteId)
    if (!note) throw new Error('Note not found')
    
    // Check if already referenced
    if (this.hasReference(noteId)) {
      return false
    }
    
    // Extract relevant sections based on current context
    const relevantSections = await this.extractRelevantSections(note)
    
    // Calculate token usage
    const tokenCount = await this.calculateTokens(relevantSections)
    
    // Check total token limit
    const totalTokens = this.getTotalTokens() + tokenCount
    if (totalTokens > this.maxTotalTokens) {
      throw new Error('Adding this note would exceed token limit')
    }
    
    const reference: NoteReference = {
      id: generateId(),
      noteId,
      note,
      addedAt: new Date(),
      addedBy: method,
      relevantSections,
      tokenCount,
      priority: this.calculatePriority(note, method),
    }
    
    this.references.set(noteId, reference)
    this.emit('referenceAdded', reference)
    
    return true
  }
  
  async extractRelevantSections(note: Note): Promise<RelevantSection[]> {
    const currentContext = this.getCurrentChatContext()
    
    // Use embeddings to find relevant sections
    const sections = await this.splitIntoSections(note.content)
    const sectionEmbeddings = await this.generateEmbeddings(sections)
    const contextEmbedding = await this.generateEmbedding(currentContext)
    
    // Score each section
    const scoredSections = sections.map((section, idx) => ({
      content: section.content,
      startIdx: section.startIdx,
      endIdx: section.endIdx,
      relevanceScore: this.cosineSimilarity(
        sectionEmbeddings[idx],
        contextEmbedding
      ),
      keywords: this.extractKeywords(section.content),
    }))
    
    // Return top sections within token limit
    return this.selectTopSections(scoredSections, this.maxTokensPerNote)
  }
  
  optimizeContextWindow(): string {
    const references = Array.from(this.references.values())
      .sort((a, b) => b.priority - a.priority)
    
    let context = ''
    let tokenCount = 0
    
    for (const ref of references) {
      const sections = ref.relevantSections || []
      
      for (const section of sections) {
        const sectionTokens = this.estimateTokens(section.content)
        
        if (tokenCount + sectionTokens <= this.maxTotalTokens) {
          context += `\n\n[From "${ref.note.title}"]:\n${section.content}`
          tokenCount += sectionTokens
        }
      }
    }
    
    return context
  }
}
```

### Pattern Detection System

```typescript
// Knowledge synthesis engine
interface Pattern {
  id: string
  type: PatternType
  confidence: number
  notes: string[]
  description: string
  evidence: Evidence[]
  createdAt: Date
}

type PatternType = 
  | 'topic_cluster'
  | 'temporal_sequence'
  | 'contradiction'
  | 'knowledge_gap'
  | 'entity_relationship'
  | 'concept_evolution'

interface Evidence {
  noteId: string
  content: string
  position: { start: number; end: number }
  strength: number
}

class PatternDetectionEngine {
  private patterns = new Map<string, Pattern>()
  private readonly minConfidence = 0.7
  
  async analyzeNotes(notes: Note[]): Promise<Pattern[]> {
    const patterns = await Promise.all([
      this.detectTopicClusters(notes),
      this.detectTemporalSequences(notes),
      this.detectContradictions(notes),
      this.detectKnowledgeGaps(notes),
      this.detectEntityRelationships(notes),
      this.detectConceptEvolution(notes),
    ])
    
    return patterns
      .flat()
      .filter(p => p.confidence >= this.minConfidence)
      .sort((a, b) => b.confidence - a.confidence)
  }
  
  private async detectContradictions(notes: Note[]): Promise<Pattern[]> {
    const contradictions: Pattern[] = []
    
    // Extract claims from each note
    const noteClaims = await Promise.all(
      notes.map(async note => ({
        noteId: note.id,
        claims: await this.extractClaims(note.content),
      }))
    )
    
    // Compare claims pairwise
    for (let i = 0; i < noteClaims.length; i++) {
      for (let j = i + 1; j < noteClaims.length; j++) {
        const conflicts = await this.findConflictingClaims(
          noteClaims[i].claims,
          noteClaims[j].claims
        )
        
        for (const conflict of conflicts) {
          contradictions.push({
            id: generateId(),
            type: 'contradiction',
            confidence: conflict.confidence,
            notes: [noteClaims[i].noteId, noteClaims[j].noteId],
            description: conflict.description,
            evidence: [
              {
                noteId: noteClaims[i].noteId,
                content: conflict.claim1,
                position: conflict.position1,
                strength: conflict.strength1,
              },
              {
                noteId: noteClaims[j].noteId,
                content: conflict.claim2,
                position: conflict.position2,
                strength: conflict.strength2,
              },
            ],
            createdAt: new Date(),
          })
        }
      }
    }
    
    return contradictions
  }
  
  private async extractClaims(content: string): Promise<Claim[]> {
    const { object: analysis } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: z.object({
        claims: z.array(z.object({
          text: z.string(),
          type: z.enum(['fact', 'opinion', 'prediction', 'definition']),
          confidence: z.number(),
          subject: z.string(),
          predicate: z.string(),
        })),
      }),
      prompt: `Extract factual claims, opinions, and assertions from this text. 
      For each claim, identify the subject and what is being said about it:
      
      ${content}`,
    })
    
    return analysis.claims
  }
}
```

### Knowledge Graph System

```typescript
// Knowledge visualization
interface KnowledgeGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
  clusters: Cluster[]
  metadata: GraphMetadata
}

interface GraphNode {
  id: string
  type: 'note' | 'topic' | 'entity' | 'concept'
  label: string
  data: {
    noteId?: string
    content?: string
    importance: number
    createdAt: Date
    tags: string[]
  }
  position?: { x: number; y: number }
  cluster?: string
}

interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType
  weight: number
  label?: string
  data: {
    evidence?: string[]
    confidence: number
  }
}

type EdgeType = 
  | 'references'
  | 'similar_to'
  | 'contradicts'
  | 'follows_from'
  | 'related_to'
  | 'part_of'

class KnowledgeGraphBuilder {
  async buildGraph(notes: Note[], patterns: Pattern[]): Promise<KnowledgeGraph> {
    // Create nodes for notes
    const noteNodes = notes.map(note => this.createNoteNode(note))
    
    // Extract and create topic nodes
    const topics = await this.extractTopics(notes)
    const topicNodes = topics.map(topic => this.createTopicNode(topic))
    
    // Extract and create entity nodes
    const entities = await this.extractEntities(notes)
    const entityNodes = entities.map(entity => this.createEntityNode(entity))
    
    // Build edges from various sources
    const edges = [
      ...await this.createReferenceEdges(notes),
      ...await this.createSimilarityEdges(notes),
      ...await this.createPatternEdges(patterns),
      ...await this.createTopicEdges(notes, topics),
      ...await this.createEntityEdges(notes, entities),
    ]
    
    // Perform clustering
    const nodes = [...noteNodes, ...topicNodes, ...entityNodes]
    const clusters = await this.clusterNodes(nodes, edges)
    
    // Calculate layout
    const positionedNodes = this.calculateLayout(nodes, edges, clusters)
    
    return {
      nodes: positionedNodes,
      edges,
      clusters,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        clusterCount: clusters.length,
        density: edges.length / (nodes.length * (nodes.length - 1) / 2),
        createdAt: new Date(),
      },
    }
  }
  
  private calculateLayout(
    nodes: GraphNode[],
    edges: GraphEdge[],
    clusters: Cluster[]
  ): GraphNode[] {
    // Use force-directed layout with cluster constraints
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => 100 / d.weight)
      )
      .force('charge', d3.forceManyBody()
        .strength(-300)
      )
      .force('center', d3.forceCenter(0, 0))
      .force('cluster', this.clusterForce(clusters))
      .stop()
    
    // Run simulation
    for (let i = 0; i < 300; i++) {
      simulation.tick()
    }
    
    return nodes.map(node => ({
      ...node,
      position: { x: node.x || 0, y: node.y || 0 },
    }))
  }
}
```

### Context Optimization Algorithm

```typescript
class ContextOptimizer {
  private readonly maxContextTokens = 8000 // Reserve tokens for response
  private readonly minRelevanceScore = 0.5
  
  async optimizeContext(
    query: string,
    references: NoteReference[],
    chatHistory: Message[]
  ): Promise<OptimizedContext> {
    // Step 1: Analyze query intent
    const queryIntent = await this.analyzeQueryIntent(query)
    
    // Step 2: Score all available content
    const scoredContent = await this.scoreContent(
      references,
      queryIntent,
      chatHistory
    )
    
    // Step 3: Select optimal content within token limits
    const selectedContent = this.selectOptimalContent(
      scoredContent,
      this.maxContextTokens
    )
    
    // Step 4: Structure context for AI
    const structuredContext = this.structureContext(selectedContent)
    
    return {
      context: structuredContext,
      tokenCount: this.countTokens(structuredContext),
      sources: selectedContent.map(c => c.source),
      relevanceMap: this.createRelevanceMap(selectedContent),
    }
  }
  
  private async scoreContent(
    references: NoteReference[],
    queryIntent: QueryIntent,
    chatHistory: Message[]
  ): Promise<ScoredContent[]> {
    const scoredContent: ScoredContent[] = []
    
    for (const ref of references) {
      const sections = ref.relevantSections || []
      
      for (const section of sections) {
        const score = await this.calculateRelevanceScore(
          section,
          queryIntent,
          chatHistory
        )
        
        if (score >= this.minRelevanceScore) {
          scoredContent.push({
            content: section.content,
            source: ref.note,
            score,
            tokens: this.estimateTokens(section.content),
            type: 'note_section',
            metadata: {
              sectionIndex: sections.indexOf(section),
              keywords: section.keywords,
            },
          })
        }
      }
    }
    
    // Sort by relevance score
    return scoredContent.sort((a, b) => b.score - a.score)
  }
  
  private selectOptimalContent(
    scoredContent: ScoredContent[],
    tokenLimit: number
  ): ScoredContent[] {
    const selected: ScoredContent[] = []
    let totalTokens = 0
    
    // Greedy selection with diversity bonus
    for (const content of scoredContent) {
      if (totalTokens + content.tokens <= tokenLimit) {
        // Check for redundancy
        const redundancyScore = this.calculateRedundancy(content, selected)
        
        if (redundancyScore < 0.7) {
          selected.push(content)
          totalTokens += content.tokens
        }
      }
    }
    
    return selected
  }
}
```

## UI/UX Design Patterns

### Multi-Note Reference Panel
```
┌─────────────────────────────────────┐
│ 📚 Referenced Notes (3/5)           │
├─────────────────────────────────────┤
│ ┌─────────────────────────────┐     │
│ │ 📄 Project Architecture      │ [X] │
│ │ Last edited: 2 hours ago     │     │
│ │ "The system uses a modular..." │   │
│ │ [Expand] [View Note]         │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 📊 Performance Metrics       │ [X] │
│ │ Last edited: Yesterday       │     │
│ │ "Current benchmarks show..."  │     │
│ │ [Expand] [View Note]         │     │
│ └─────────────────────────────┘     │
│                                     │
│ ┌─────────────────────────────┐     │
│ │ 🔧 Implementation Details    │ [X] │
│ │ Last edited: 3 days ago      │     │
│ │ "Key components include..."   │     │
│ │ [Expand] [View Note]         │     │
│ └─────────────────────────────┘     │
│                                     │
│ 📊 Token Usage: 2,847 / 4,000       │
│ [Clear All] [Optimize Context]      │
└─────────────────────────────────────┘
```

### @Mention Autocomplete
```
Type: @proj|
┌─────────────────────────────────────┐
│ 🔍 Search notes...                  │
├─────────────────────────────────────┤
│ 📄 Project Architecture             │
│    Last edited 2 hours ago          │
├─────────────────────────────────────┤
│ 📋 Project Planning Q1              │
│    Contains: timeline, milestones   │
├─────────────────────────────────────┤
│ 📊 Project Performance Metrics      │
│    Related to: architecture, testing│
├─────────────────────────────────────┤
│ 🎯 Project Goals 2024               │
│    Tagged: #planning #strategy      │
└─────────────────────────────────────┘
  ↑/↓ Navigate  Enter Select  Esc Cancel
```

### Knowledge Graph Visualization
```
     [Note: Architecture]
            |
            | references
            ↓
    [Topic: Microservices] ←--similar--→ [Note: Best Practices]
            |                                      |
            | contains                             | contradicts
            ↓                                      ↓
    [Entity: API Gateway] ←---related---→ [Note: Performance]
            |
            | part_of
            ↓
    [Concept: System Design]
    
Legend:
● Note    ◆ Topic    ▲ Entity    ■ Concept
— Strong connection    -- Weak connection
Red: Contradiction    Green: Supports    Blue: Related
```

### Contradiction Detection UI
```
┌─────────────────────────────────────┐
│ ⚠️ Contradiction Detected           │
├─────────────────────────────────────┤
│ These notes contain conflicting     │
│ information:                        │
│                                     │
│ 📄 "API Design Principles"          │
│ States: "Always use REST APIs"      │
│ Written: Jan 15, 2024               │
│                                     │
│        🆚 CONFLICTS WITH 🆚         │
│                                     │
│ 📄 "Modern Architecture Patterns"   │
│ States: "GraphQL is preferred"      │
│ Written: Mar 20, 2024               │
│                                     │
│ Confidence: 87%                     │
│                                     │
│ [View Timeline] [Resolve] [Ignore]  │
└─────────────────────────────────────┘
```

## Implementation Details

### File Structure
```
features/multi-note-context/
├── components/
│   ├── reference-panel.tsx
│   ├── reference-card.tsx
│   ├── mention-autocomplete.tsx
│   ├── token-usage-indicator.tsx
│   └── context-optimizer-button.tsx
├── hooks/
│   ├── use-note-references.ts
│   ├── use-mention-input.ts
│   └── use-context-optimization.ts
├── services/
│   ├── reference-manager.ts
│   ├── context-extractor.ts
│   ├── relevance-scorer.ts
│   └── token-calculator.ts
└── stores/
    └── reference-store.ts

features/knowledge-synthesis/
├── components/
│   ├── knowledge-graph.tsx
│   ├── pattern-cards.tsx
│   ├── contradiction-dialog.tsx
│   ├── synthesis-dashboard.tsx
│   └── insight-notifications.tsx
├── engine/
│   ├── pattern-detector.ts
│   ├── contradiction-analyzer.ts
│   ├── knowledge-graph-builder.ts
│   └── synthesis-engine.ts
├── visualizations/
│   ├── force-graph.tsx
│   ├── timeline-view.tsx
│   ├── concept-map.tsx
│   └── relationship-matrix.tsx
└── services/
    ├── insight-generator.ts
    ├── conflict-resolver.ts
    └── evolution-tracker.ts
```

### Reference Management Implementation

```typescript
// features/multi-note-context/hooks/use-note-references.ts
export function useNoteReferences(chatId: string) {
  const [references, setReferences] = useState<NoteReference[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const referenceManager = useRef(new ReferenceManager())
  
  const addReference = useCallback(async (noteId: string, method: 'mention' | 'drag') => {
    try {
      const added = await referenceManager.current.addReference(noteId, method)
      if (added) {
        setReferences(referenceManager.current.getReferences())
        toast({
          title: "Note added",
          description: "Reference added to context",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to add reference",
        description: error.message,
        variant: "destructive",
      })
    }
  }, [])
  
  const removeReference = useCallback((noteId: string) => {
    referenceManager.current.removeReference(noteId)
    setReferences(referenceManager.current.getReferences())
  }, [])
  
  const optimizeContext = useCallback(async (query: string) => {
    setIsOptimizing(true)
    try {
      const optimized = await referenceManager.current.optimizeForQuery(query)
      setReferences(optimized)
      toast({
        title: "Context optimized",
        description: "Selected most relevant sections",
      })
    } finally {
      setIsOptimizing(false)
    }
  }, [])
  
  const getContextForAI = useCallback((): string => {
    return referenceManager.current.optimizeContextWindow()
  }, [])
  
  return {
    references,
    addReference,
    removeReference,
    optimizeContext,
    getContextForAI,
    isOptimizing,
    canAddMore: references.length < 5,
    tokenUsage: referenceManager.current.getTotalTokens(),
  }
}
```

### Pattern Detection Implementation

```typescript
// features/knowledge-synthesis/engine/pattern-detector.ts
export class PatternDetector {
  private readonly openai = new OpenAI()
  private readonly minPatternNotes = 2
  
  async detectPatterns(notes: Note[]): Promise<Pattern[]> {
    const patterns: Pattern[] = []
    
    // 1. Topic clustering using embeddings
    const embeddings = await this.generateEmbeddings(notes)
    const clusters = this.performClustering(embeddings)
    
    for (const cluster of clusters) {
      if (cluster.notes.length >= this.minPatternNotes) {
        const pattern = await this.analyzeCluster(cluster)
        if (pattern.confidence > 0.7) {
          patterns.push(pattern)
        }
      }
    }
    
    // 2. Temporal sequence detection
    const temporalPatterns = await this.detectTemporalPatterns(notes)
    patterns.push(...temporalPatterns)
    
    // 3. Entity relationship mapping
    const entityPatterns = await this.detectEntityRelationships(notes)
    patterns.push(...entityPatterns)
    
    // 4. Concept evolution tracking
    const evolutionPatterns = await this.detectConceptEvolution(notes)
    patterns.push(...evolutionPatterns)
    
    return this.rankPatterns(patterns)
  }
  
  private async detectTemporalPatterns(notes: Note[]): Promise<Pattern[]> {
    // Extract temporal references
    const temporalNotes = await Promise.all(
      notes.map(async note => ({
        note,
        dates: await this.extractDates(note.content),
        temporalPhrases: await this.extractTemporalPhrases(note.content),
      }))
    )
    
    // Find sequences
    const sequences = this.findTemporalSequences(temporalNotes)
    
    return sequences.map(seq => ({
      id: generateId(),
      type: 'temporal_sequence' as PatternType,
      confidence: seq.confidence,
      notes: seq.noteIds,
      description: `Timeline: ${seq.summary}`,
      evidence: seq.evidence,
      createdAt: new Date(),
    }))
  }
  
  private async extractDates(content: string): Promise<ExtractedDate[]> {
    const { object } = await generateObject({
      model: openai('gpt-4-turbo'),
      schema: z.object({
        dates: z.array(z.object({
          text: z.string(),
          date: z.string(),
          context: z.string(),
          type: z.enum(['exact', 'relative', 'range']),
        })),
      }),
      prompt: `Extract all temporal references from this text, including exact dates, relative times, and date ranges:\n\n${content}`,
    })
    
    return object.dates
  }
}
```

### Knowledge Graph Component

```typescript
// features/knowledge-synthesis/components/knowledge-graph.tsx
"use client"

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter,
  Download 
} from 'lucide-react'

interface KnowledgeGraphProps {
  graph: KnowledgeGraph
  onNodeClick?: (node: GraphNode) => void
  onEdgeClick?: (edge: GraphEdge) => void
}

export function KnowledgeGraphComponent({
  graph,
  onNodeClick,
  onEdgeClick,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [zoom, setZoom] = useState(1)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  
  useEffect(() => {
    if (!svgRef.current || !graph) return
    
    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    
    // Clear previous graph
    svg.selectAll('*').remove()
    
    // Create zoom behavior
    const zoomBehavior = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
        setZoom(event.transform.k)
      })
    
    svg.call(zoomBehavior as any)
    
    // Create container for zoom/pan
    const container = svg.append('g')
    
    // Create arrow markers for directed edges
    svg.append('defs').selectAll('marker')
      .data(['arrow'])
      .enter().append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 10)
      .attr('markerHeight', 10)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999')
    
    // Filter nodes and edges based on type
    const filteredNodes = filterType === 'all' 
      ? graph.nodes 
      : graph.nodes.filter(n => n.type === filterType)
    
    const filteredEdges = graph.edges.filter(e => 
      filteredNodes.some(n => n.id === e.source) &&
      filteredNodes.some(n => n.id === e.target)
    )
    
    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes as any)
      .force('link', d3.forceLink(filteredEdges)
        .id((d: any) => d.id)
        .distance(d => 150 / (d as any).weight)
      )
      .force('charge', d3.forceManyBody().strength(-500))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30))
    
    // Draw edges
    const links = container.append('g')
      .selectAll('line')
      .data(filteredEdges)
      .enter().append('line')
      .attr('stroke', d => getEdgeColor(d.type))
      .attr('stroke-width', d => Math.sqrt(d.weight) * 2)
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrow)')
      .on('click', (event, d) => onEdgeClick?.(d))
    
    // Draw nodes
    const nodes = container.append('g')
      .selectAll('g')
      .data(filteredNodes)
      .enter().append('g')
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded) as any
      )
    
    // Node circles
    nodes.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        setSelectedNode(d.id)
        onNodeClick?.(d)
      })
    
    // Node labels
    nodes.append('text')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('pointer-events', 'none')
    
    // Update positions on simulation tick
    simulation.on('tick', () => {
      links
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)
      
      nodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
    })
    
    // Drag functions
    function dragStarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }
    
    function dragEnded(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }
    
  }, [graph, filterType])
  
  return (
    <Card className="relative w-full h-[600px]">
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {/* zoom in */}}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {/* zoom out */}}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {/* fit to screen */}}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="topic">Topics</SelectItem>
            <SelectItem value="entity">Entities</SelectItem>
            <SelectItem value="concept">Concepts</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => {/* export graph */}}
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
      
      <svg ref={svgRef} className="w-full h-full" />
      
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <Card className="p-4 bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="font-medium">{graph.nodes.length}</span> nodes
              {' · '}
              <span className="font-medium">{graph.edges.length}</span> edges
              {' · '}
              Zoom: <span className="font-medium">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                Note
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                Topic
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Entity
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                Concept
              </span>
            </div>
          </div>
        </Card>
      </div>
    </Card>
  )
}

function getNodeColor(type: string): string {
  const colors = {
    note: '#3B82F6',
    topic: '#10B981',
    entity: '#8B5CF6',
    concept: '#F97316',
  }
  return colors[type] || '#6B7280'
}

function getNodeSize(node: GraphNode): number {
  return 10 + (node.data.importance * 20)
}

function getEdgeColor(type: EdgeType): string {
  const colors = {
    references: '#3B82F6',
    similar_to: '#10B981',
    contradicts: '#EF4444',
    follows_from: '#8B5CF6',
    related_to: '#6B7280',
    part_of: '#F97316',
  }
  return colors[type] || '#9CA3AF'
}
```

## Error Handling & Recovery

### Reference Error Handling

```typescript
class ReferenceErrorHandler {
  handleAddReferenceError(error: Error, noteId: string): void {
    if (error.message.includes('Maximum references')) {
      toast({
        title: "Reference limit reached",
        description: "Remove a reference to add another (max 5)",
        variant: "destructive",
        action: <ToastAction altText="Remove oldest">Remove oldest</ToastAction>,
      })
    } else if (error.message.includes('token limit')) {
      toast({
        title: "Token limit exceeded",
        description: "This note is too large. Try selecting specific sections.",
        variant: "destructive",
        action: <ToastAction altText="Optimize">Optimize context</ToastAction>,
      })
    } else if (error.message.includes('Note not found')) {
      toast({
        title: "Note not found",
        description: "This note may have been deleted",
        variant: "destructive",
      })
    } else {
      console.error('Failed to add reference:', error)
      toast({
        title: "Failed to add reference",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }
  
  async recoverFromTokenLimit(
    references: NoteReference[],
    newNoteId: string
  ): Promise<NoteReference[]> {
    // Try to optimize existing references
    const optimized = await this.optimizeReferences(references)
    
    // Check if we have room now
    const newNote = await this.noteService.getNote(newNoteId)
    const estimatedTokens = this.estimateTokens(newNote.content)
    
    if (this.getTotalTokens(optimized) + estimatedTokens <= MAX_TOKENS) {
      return [...optimized, await this.createReference(newNote)]
    }
    
    // Still too large - suggest removing least relevant
    const ranked = this.rankByRelevance(optimized)
    return this.suggestRemoval(ranked, estimatedTokens)
  }
}
```

### Pattern Detection Error Recovery

```typescript
class PatternDetectionErrorRecovery {
  async handleDetectionFailure(
    notes: Note[],
    error: Error
  ): Promise<Pattern[]> {
    console.error('Pattern detection failed:', error)
    
    // Fallback strategies in order of preference
    const strategies = [
      () => this.simplifiedPatternDetection(notes),
      () => this.keywordBasedPatterns(notes),
      () => this.temporalOnlyPatterns(notes),
      () => this.basicClustering(notes),
    ]
    
    for (const strategy of strategies) {
      try {
        const patterns = await strategy()
        if (patterns.length > 0) {
          toast({
            title: "Using simplified analysis",
            description: "Some advanced features may be limited",
          })
          return patterns
        }
      } catch (err) {
        continue
      }
    }
    
    // Last resort - return empty but notify user
    toast({
      title: "Pattern analysis unavailable",
      description: "Unable to analyze patterns at this time",
      variant: "destructive",
    })
    
    return []
  }
  
  private async simplifiedPatternDetection(notes: Note[]): Promise<Pattern[]> {
    // Use local processing instead of AI
    const patterns: Pattern[] = []
    
    // Simple keyword clustering
    const keywordMap = new Map<string, Note[]>()
    
    for (const note of notes) {
      const keywords = this.extractKeywordsLocally(note.content)
      for (const keyword of keywords) {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, [])
        }
        keywordMap.get(keyword)!.push(note)
      }
    }
    
    // Convert clusters to patterns
    for (const [keyword, clusterNotes] of keywordMap) {
      if (clusterNotes.length >= 3) {
        patterns.push({
          id: generateId(),
          type: 'topic_cluster',
          confidence: 0.6,
          notes: clusterNotes.map(n => n.id),
          description: `Notes about "${keyword}"`,
          evidence: clusterNotes.map(n => ({
            noteId: n.id,
            content: this.extractRelevantSnippet(n.content, keyword),
            position: { start: 0, end: 100 },
            strength: 0.7,
          })),
          createdAt: new Date(),
        })
      }
    }
    
    return patterns
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
describe('ReferenceManager', () => {
  let manager: ReferenceManager
  
  beforeEach(() => {
    manager = new ReferenceManager()
  })
  
  test('enforces maximum reference limit', async () => {
    // Add 5 references
    for (let i = 0; i < 5; i++) {
      await manager.addReference(`note-${i}`, 'mention')
    }
    
    // 6th should fail
    await expect(manager.addReference('note-6', 'mention'))
      .rejects.toThrow('Maximum 5 references allowed')
  })
  
  test('optimizes context within token limits', async () => {
    // Add references with known content
    await manager.addReference('long-note', 'mention')
    await manager.addReference('short-note', 'mention')
    
    const context = manager.optimizeContextWindow()
    const tokens = countTokens(context)
    
    expect(tokens).toBeLessThanOrEqual(4000)
    expect(context).toContain('[From "')
  })
  
  test('extracts relevant sections based on query', async () => {
    const note = createMockNote({
      content: 'Introduction. This is about AI. Machine learning is important. Conclusion.',
    })
    
    manager.setCurrentContext('Tell me about machine learning')
    const sections = await manager.extractRelevantSections(note)
    
    expect(sections[0].content).toContain('Machine learning')
    expect(sections[0].relevanceScore).toBeGreaterThan(0.7)
  })
})

describe('PatternDetectionEngine', () => {
  let engine: PatternDetectionEngine
  
  beforeEach(() => {
    engine = new PatternDetectionEngine()
  })
  
  test('detects contradictions between notes', async () => {
    const notes = [
      createMockNote({ 
        content: 'REST APIs are always the best choice for web services' 
      }),
      createMockNote({ 
        content: 'GraphQL is superior to REST for most applications' 
      }),
    ]
    
    const patterns = await engine.analyzeNotes(notes)
    const contradictions = patterns.filter(p => p.type === 'contradiction')
    
    expect(contradictions).toHaveLength(1)
    expect(contradictions[0].confidence).toBeGreaterThan(0.7)
    expect(contradictions[0].evidence).toHaveLength(2)
  })
  
  test('identifies topic clusters', async () => {
    const notes = [
      createMockNote({ content: 'React hooks and useState' }),
      createMockNote({ content: 'useEffect in React components' }),
      createMockNote({ content: 'React Context API patterns' }),
      createMockNote({ content: 'Python data analysis' }),
    ]
    
    const patterns = await engine.analyzeNotes(notes)
    const clusters = patterns.filter(p => p.type === 'topic_cluster')
    
    expect(clusters.length).toBeGreaterThan(0)
    expect(clusters[0].notes).toHaveLength(3) // React notes
  })
})
```

### Integration Tests

- @mention autocomplete shows relevant notes
- Drag and drop adds references correctly
- Token usage updates in real-time
- Context optimization preserves key information
- Pattern detection runs on note changes

### E2E Test Scenarios

1. **Multi-Note Reference Flow**
   - Open chat → Type @mention → Select note → See reference card
   - Drag multiple notes → Check token limit → Optimize context
   - Send message → AI cites sources correctly

2. **Pattern Detection Flow**
   - Create related notes → Trigger analysis → See patterns
   - Accept pattern → Smart collection created
   - Add conflicting note → Contradiction detected

3. **Knowledge Graph Interaction**
   - View graph → Click node → See details
   - Filter by type → Graph updates
   - Drag nodes → Layout persists

### Performance Benchmarks
- Add reference: <500ms ✓
- Extract relevant sections: <1s per note ✓
- Pattern detection for 100 notes: <10s ✓
- Knowledge graph renders 500 nodes: <2s ✓
- Context optimization: <500ms ✓

## Accessibility & Internationalization

### Accessibility Features
- Keyboard navigation for mention autocomplete
- Screen reader descriptions for graph nodes
- High contrast mode for visualizations
- Focus indicators for all interactive elements
- Alternative text for pattern cards

### Internationalization Prep
- Pattern descriptions localized
- Graph labels translated
- Date/time formats respect locale
- RTL support for reference cards
- Conflict resolution UI adapted

## Analytics & Monitoring

### Key Metrics to Track

```typescript
interface MultiNoteContextAnalytics {
  // Reference usage
  averageReferencesPerChat: number
  referenceMethodBreakdown: Record<'mention' | 'drag' | 'suggestion', number>
  tokenUtilization: number // avg % of limit used
  optimizationFrequency: number
  
  // Pattern detection
  patternsDetectedPerAnalysis: number
  patternTypeBreakdown: Record<PatternType, number>
  contradictionAccuracy: number // based on user feedback
  patternAcceptanceRate: number
  
  // Knowledge graph
  graphInteractionTime: number
  mostExploredNodeTypes: string[]
  filterUsage: Record<string, number>
  exportFrequency: number
  
  // Performance
  contextExtractionTime: Percentiles
  patternDetectionTime: Percentiles
  graphRenderTime: Percentiles
}
```

### Monitoring Dashboards
- Real-time reference usage
- Pattern detection success rates
- Graph complexity metrics
- Performance degradation alerts

## Security & Privacy Considerations

### Data Protection
- Reference content encrypted in transit
- Pattern analysis runs locally when possible
- No cross-user pattern detection
- Graph data anonymized for analytics

### Performance Limits
- Maximum graph size enforced
- Pattern detection throttled
- Reference extraction rate limited
- Background processing queued

## Migration & Upgrade Path

### Future Enhancements
- Unlimited reference support with pagination
- Real-time collaborative pattern detection
- 3D knowledge graph visualization
- AI-suggested reference combinations
- Cross-workspace pattern analysis

### Compatibility
- Graceful degradation for large note sets
- Progressive enhancement for visualizations
- Backward compatible reference format
- Migration tools for legacy data

## Success Metrics

### User Engagement
- 70% use multi-note references weekly
- 60% explore knowledge graph monthly
- 80% act on contradiction detections
- 50% create references via @mentions

### Technical Health
- <500ms reference addition (p95)
- <10s pattern analysis for 100 notes
- >90% relevant context extraction
- <2s knowledge graph initial render

### Business Impact
- 40% improvement in research efficiency
- 60% faster knowledge synthesis
- 30% reduction in contradictory decisions
- 85% user satisfaction with AI context

## Dependencies

### External Services
- OpenAI Embeddings API
- Graph visualization library (D3.js)
- Vector similarity service
- Analytics tracking service

### Internal Dependencies
- Epic 5: Smart collections for pattern storage
- Epic 3: Chat system for references
- Epic 1: Editor for content
- Epic 2: Organization structure

### NPM Dependencies
```json
{
  "dependencies": {
    "d3": "^7.x",
    "d3-force": "^3.x",
    "@tanstack/react-query": "^5.x",
    "ml-distance": "^4.x",
    "natural": "^6.x",
    "chrono-node": "^2.x"
  }
}
```

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Token limits hit frequently | High | High | Smart extraction, user education, optimization tools |
| Pattern detection too noisy | Medium | Medium | Confidence thresholds, user feedback, filtering |
| Graph becomes unreadable | Medium | High | Clustering, filtering, zoom controls, layouts |
| Performance with many notes | High | Medium | Pagination, lazy loading, background processing |
| Contradiction false positives | Medium | Medium | Adjustable sensitivity, user training, evidence |

## Conclusion

Epic 6 elevates AI Notes from a collection of independent notes to an interconnected knowledge system. By enabling multi-note context in chats and automatic pattern detection across the knowledge base, users gain insights that would be impossible to discover manually.

The combination of reference management, pattern detection, and knowledge visualization creates a system where the whole truly becomes greater than the sum of its parts. Users can trust AI Notes not just to store their knowledge, but to actively help them understand and evolve it.

## Next Steps

With Advanced AI Context complete, users can:
- Reference multiple notes for comprehensive AI responses  
- Discover patterns and connections across their knowledge base
- Identify and resolve contradictions in their understanding
- Visualize their knowledge structure through interactive graphs

The next epic (Platform Features) will build on this foundation to add:
- User authentication and data persistence
- Comprehensive keyboard shortcuts for power users
- Theme customization and preferences
- Performance optimizations for scale