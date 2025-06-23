# Technical Documentation Diagrams

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React UI Components]
        TE[TipTap Editor]
        AI[AI Components]
        
        UI --> Store[Zustand Stores]
        TE --> Store
        AI --> Store
    end
    
    subgraph "Edge Runtime"
        API[Next.js API Routes]
        Stream[Streaming Handlers]
        Auth[Auth Middleware]
    end
    
    subgraph "Service Layer"
        AISDK[Vercel AI SDK]
        Worker[Web Workers]
        Parser[Content Parser]
    end
    
    subgraph "External Services"
        GPT[OpenAI GPT-4]
        DB[(PostgreSQL)]
        OAuth[OAuth Providers]
    end
    
    Store --> API
    API --> Auth
    Auth --> Stream
    Stream --> AISDK
    AISDK --> GPT
    API --> DB
    Auth --> OAuth
    TE --> Worker
    Worker --> Parser
    
    style UI fill:#e1f5fe
    style TE fill:#e1f5fe
    style AI fill:#e1f5fe
    style API fill:#fff3e0
    style AISDK fill:#f3e5f5
    style DB fill:#e8f5e9
```

## 2. AI Implementation Flow

```mermaid
sequenceDiagram
    participant User
    participant Editor
    participant Hook as AI Hook
    participant API as Edge API
    participant SDK as Vercel AI SDK
    participant GPT as OpenAI
    participant DB as Database
    
    User->>Editor: Types "++" or selects text
    Editor->>Hook: Emit AI trigger event
    Hook->>API: POST /api/ai/completion
    API->>SDK: streamText()
    SDK->>GPT: Stream request
    GPT-->>SDK: Token stream
    SDK-->>API: Stream response
    API-->>Hook: SSE stream
    Hook-->>Editor: Update ghost text/bubble
    User->>Editor: Accept/Reject
    Editor->>DB: Log interaction
    DB->>DB: Update learning model
```

## 3. Ghost Text Implementation

```mermaid
graph LR
    subgraph "TipTap Extension"
        Input[Text Input Handler]
        Trigger[++ Detection]
        Plugin[ProseMirror Plugin]
    end
    
    subgraph "React Hook"
        Hook[useGhostText]
        Completion[useCompletion]
        State[Position State]
    end
    
    subgraph "Rendering"
        Decoration[Widget Decoration]
        DOM[DOM Element]
        Style[Ghost Styling]
    end
    
    Input --> Trigger
    Trigger --> Plugin
    Plugin --> Hook
    Hook --> Completion
    Completion --> State
    State --> Decoration
    Decoration --> DOM
    DOM --> Style
    
    style Input fill:#ffebee
    style Hook fill:#e3f2fd
    style Decoration fill:#f3e5f5
```

## 4. Tool Calling Architecture

```mermaid
graph TB
    subgraph "Chat Interface"
        Msg[User Message]
        Context[Note Context]
        Tools[Available Tools]
    end
    
    subgraph "AI Processing"
        Stream[streamText with tools]
        Decision{Tool needed?}
        Execute[Execute Tool]
    end
    
    subgraph "Tool Implementations"
        Create[create_note]
        Update[update_note]
        Search[search_notes]
    end
    
    subgraph "Results"
        Success[Tool Success]
        Confirm[User Confirmation]
        Apply[Apply Changes]
    end
    
    Msg --> Stream
    Context --> Stream
    Tools --> Stream
    Stream --> Decision
    Decision -->|Yes| Execute
    Decision -->|No| Success
    Execute --> Create
    Execute --> Update
    Execute --> Search
    Create --> Confirm
    Update --> Confirm
    Search --> Success
    Confirm --> Apply
    
    style Msg fill:#e1f5fe
    style Stream fill:#fff3e0
    style Create fill:#e8f5e9
```

## 5. Grammar Checking Pipeline

```mermaid
graph LR
    subgraph "Main Thread"
        Editor[Editor Content]
        Extension[SpellCheck Extension]
        Debounce[Debounced Trigger]
    end
    
    subgraph "Web Worker"
        Worker[spell-check.worker.ts]
        Retext[Retext Processor]
        Plugins[Grammar Plugins]
    end
    
    subgraph "Results"
        Errors[Error List]
        Decorations[ProseMirror Decorations]
        UI[Underline UI]
    end
    
    Editor --> Extension
    Extension --> Debounce
    Debounce --> Worker
    Worker --> Retext
    Retext --> Plugins
    Plugins --> Errors
    Errors --> Decorations
    Decorations --> UI
    
    style Editor fill:#e1f5fe
    style Worker fill:#fff3e0
    style UI fill:#e8f5e9
```

## 6. Learning System Flow

```mermaid
graph TB
    subgraph "User Interactions"
        Accept[Ghost Text Accepted]
        Reject[Ghost Text Rejected]
        Quick[Quick Action Used]
        Tool[Tool Call Result]
    end
    
    subgraph "Tracking Layer"
        Log[Event Logger]
        Store[(Learning Events DB)]
        Queue[Processing Queue]
    end
    
    subgraph "Analysis"
        RT[Real-time Processing]
        Batch[Batch Analysis]
        Pattern[Pattern Recognition]
    end
    
    subgraph "Personalization"
        Profile[User Profile]
        Prompts[Custom Prompts]
        Temp[Temperature Adjust]
    end
    
    Accept --> Log
    Reject --> Log
    Quick --> Log
    Tool --> Log
    
    Log --> Store
    Log --> RT
    Store --> Queue
    Queue --> Batch
    
    RT --> Pattern
    Batch --> Pattern
    Pattern --> Profile
    
    Profile --> Prompts
    Profile --> Temp
    
    style Accept fill:#c8e6c9
    style Reject fill:#ffcdd2
    style Profile fill:#f3e5f5
```

## 7. Streaming Architecture

```mermaid
graph LR
    subgraph "Request"
        Client[Client Request]
        Edge[Edge Runtime]
        Handler[API Handler]
    end
    
    subgraph "Streaming"
        SDK[Vercel AI SDK]
        Buffer[Adaptive Buffer]
        Smooth[60fps Renderer]
    end
    
    subgraph "Response"
        SSE[Server-Sent Events]
        Tokens[Token Stream]
        Display[UI Display]
    end
    
    Client --> Edge
    Edge --> Handler
    Handler --> SDK
    SDK --> Buffer
    Buffer --> Smooth
    Smooth --> SSE
    SSE --> Tokens
    Tokens --> Display
    
    style Client fill:#e1f5fe
    style SDK fill:#fff3e0
    style Display fill:#e8f5e9
```

## 8. Block Editor Architecture

```mermaid
graph TB
    subgraph "TipTap Core"
        Doc[Document Model]
        Schema[Node Schema]
        Commands[Editor Commands]
    end
    
    subgraph "Custom Extensions"
        Drag[Drag Handle]
        Ghost[Ghost Text]
        Slash[Slash Commands]
        Spell[Spell Check]
    end
    
    subgraph "Node Types"
        Para[Paragraph]
        Head[Heading]
        Code[Code Block]
        List[Lists]
        Task[Task Items]
    end
    
    subgraph "AI Integration"
        Bubble[Bubble Menu]
        Inline[Inline AI]
        Transform[Transformations]
    end
    
    Doc --> Schema
    Schema --> Commands
    Commands --> Drag
    Commands --> Ghost
    Commands --> Slash
    Commands --> Spell
    
    Schema --> Para
    Schema --> Head
    Schema --> Code
    Schema --> List
    Schema --> Task
    
    Para --> Bubble
    Head --> Bubble
    Commands --> Inline
    Bubble --> Transform
    
    style Doc fill:#e1f5fe
    style Ghost fill:#f3e5f5
    style Transform fill:#e8f5e9
```

## 9. API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Middleware
    participant Handler
    participant Auth
    participant DB
    participant AI
    participant Learning
    
    Client->>Middleware: Request
    Middleware->>Auth: Verify Session
    Auth-->>Middleware: User Context
    Middleware->>Handler: Authenticated Request
    
    alt AI Request
        Handler->>AI: Process with Context
        AI-->>Handler: Streaming Response
        Handler->>Learning: Log Interaction
    else CRUD Operation
        Handler->>DB: Query/Mutation
        DB-->>Handler: Result
    end
    
    Handler-->>Client: Response
    Learning->>DB: Store Feedback
```

## 10. Data Flow Architecture

```mermaid
graph TB
    subgraph "User Actions"
        Create[Create Note]
        Edit[Edit Content]
        Chat[Chat Message]
        Drag[Drag & Drop]
    end
    
    subgraph "State Management"
        Store[Zustand Store]
        Optimistic[Optimistic Update]
        Sync[Server Sync]
    end
    
    subgraph "Persistence"
        API[API Layer]
        DB[(PostgreSQL)]
        Cache[LRU Cache]
    end
    
    subgraph "Real-time"
        Stream[AI Stream]
        Update[Live Updates]
        Reconcile[Reconciliation]
    end
    
    Create --> Store
    Edit --> Store
    Chat --> Store
    Drag --> Store
    
    Store --> Optimistic
    Optimistic --> API
    API --> DB
    DB --> Cache
    
    API --> Stream
    Stream --> Update
    Update --> Reconcile
    Reconcile --> Store
    
    style Create fill:#e1f5fe
    style Store fill:#fff3e0
    style DB fill:#e8f5e9
```

## Implementation Notes

### Color Legend
- 🟦 Blue (#e1f5fe): Client/UI Components
- 🟨 Orange (#fff3e0): Processing/Middleware
- 🟪 Purple (#f3e5f5): AI/ML Components
- 🟩 Green (#e8f5e9): Data/Storage
- 🟥 Red (#ffcdd2): Errors/Rejections

### Key Patterns
1. **Streaming-First**: All AI interactions use SSE for real-time feedback
2. **Edge Runtime**: API routes run at edge for minimal latency
3. **Optimistic Updates**: UI updates immediately, syncs in background
4. **Web Workers**: Heavy processing offloaded from main thread
5. **Learning Loop**: Every interaction feeds back into personalization

These diagrams illustrate the sophisticated architecture that powers NoteChat's AI-first approach to note-taking and knowledge management.