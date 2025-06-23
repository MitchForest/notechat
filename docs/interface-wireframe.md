# NoteChat Interface Wireframe

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ NoteChat                                                               🔍 Search (Cmd+P)  👤 Profile │
├────────────────────┬───────────────────────────────────────────┬───────────────────────────────────┤
│                    │                                           │                                     │
│   SIDEBAR (250px)  │          NOTE EDITOR (flex)               │      AI CHAT PANEL (400px)          │
│                    │                                           │                                     │
│ ┌────────────────┐ │ ┌───────────────────────────────────────┐ │ ┌─────────────────────────────────┐ │
│ │ 🏠 All Notes   │ │ │ My Learning Notes          ⋮ ★ 🗑️ │ │ │ 💬 AI Assistant         ⋮ ✕ │ │
│ └────────────────┘ │ └───────────────────────────────────────┘ │ └─────────────────────────────────┘ │
│                    │                                           │                                     │
│ SPACES             │ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ ┌─────────────────────────────────┐ │
│ ─────────────────  │ │ ⋮⋮ │ Machine Learning Fundamentals  │ │ │ How can I help you today?       │ │
│                    │ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │ │                                 │ │
│ 📁 Work           │                                           │ │ Try dragging a note here or     │ │
│   └ 📂 Projects   │ Machine learning is a subset of AI that  │ │ asking me anything!             │ │
│       └ 📄 Q4     │ enables computers to learn from data++    │ └─────────────────────────────────┘ │
│   └ 📂 Meetings   │ ┌─────────────────────────────────────┐   │                                     │
│                    │ │ 👻 without being explicitly         │   │ ┌─────────────────────────────────┐ │
│ 📚 Learning    ▼  │ │    programmed to do so              │   │ │ 🎯 Drag notes here for context  │ │
│   └ 📂 AI/ML   ▼  │ └─────────────────────────────────────┘   │ │                                 │ │
│     └ 📄 Notes ← │                                           │ │ ┌─────────────────────────────┐ │ │
│     └ 💬 Chat     │ Key concepts include:                     │ │ │ 📄 Machine Learning Notes   │ │ │
│   └ 📂 Python     │                                           │ │ │ Added for context           │ │ │
│     └ 📄 Basics   │ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ │ └─────────────────────────────┘ │ │
│                    │ │ ⋮⋮ │ • Supervised Learning            │ │ └─────────────────────────────────┘ │
│ 🎨 Personal       │ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │                                     │
│   └ 📂 Journal    │ • Supervised Learning                     │ ┌─────────────────────────────────┐ │
│   └ 📂 Ideas      │ • Unsupervised Learning                   │ │ Explain the difference between  │ │
│                    │ • Reinforcement Learning                  │ │ supervised and unsupervised     │ │
│ SMART COLLECTIONS │                                           │ │ learning in simple terms        │ │
│ ─────────────────  │ /ai                                       │ └─────────────────────────────────┘ │
│ 🔍 Recent (15)    │ ┌─────────────────────────────────────┐   │                                     │
│ ⭐ Starred (8)     │ │ 🪄 Ask AI to write anything...      │   │ ┌─────────────────────────────────┐ │
│ 📝 Drafts (3)     │ │                                     │   │ │ Great question! Let me explain: │ │
│                    │ │ Try these:                          │   │ │                                 │ │
│ ┌────────────────┐ │ │ • Write a Python function           │   │ │ **Supervised Learning:**        │ │
│ │ + New Space    │ │ │ • Create a summary                  │   │ │ • Uses labeled training data    │ │
│ └────────────────┘ │ │ • Make a todo list                  │   │ │ • Learns from examples          │ │
│                    │ │                                     │   │ │ • Like teaching with answers    │ │
│                    │ │ [                          Generate]│   │ │                                 │ │
│                    │ └─────────────────────────────────────┘   │ │ **Unsupervised Learning:**      │ │
│                    │                                           │ │ • No labels in training data    │ │
│                    │ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ │ • Finds patterns on its own     │ │
│                    │ │ ⋮⋮ │ ## Types of Machine Learning    │ │ │ • Like exploring without map    │ │
│                    │ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │ │                                 │ │
│                    │                                           │ │ Would you like me to create a   │ │
│                    │ There are three main approaches to        │ │ note with more examples?        │ │
│                    │ machine learning, each suited for        │ │                                 │ │
│                    │ different types of problems.             │ │ [✓ Create Note] [→ Continue]    │ │
│                    │                                           │ └─────────────────────────────────┘ │
│                    │ ┌────────────────────────────────┐        │                                     │
│                    │ │ When you select this text, an  │        │ ┌─────────────────────────────────┐ │
│                    │ │ AI bubble menu appears with:   │        │ │ Type a message...               │ │
│                    │ │ • Improve writing              │        │ │                                 │ │
│                    │ │ • Make shorter/longer          │        │ │ [Attach Note] [Send]            │ │
│                    │ │ • Fix grammar                  │        │ └─────────────────────────────────┘ │
│                    │ │ • Custom edit...               │        │                                     │
│                    │ └────────────────────────────────┘        │ ← Resize Handle →                   │
│                    │                                           │                                     │
└────────────────────┴───────────────────────────────────────────┴─────────────────────────────────────┘
                      ↑                                                                                 
                   Resize                                                                              
```

## Key Interface Elements

### 1. Sidebar (Left Panel)
- **Hierarchical Organization**: Spaces → Collections → Notes/Chats
- **Visual Indicators**: 
  - 📁 for Spaces
  - 📂 for Collections  
  - 📄 for Notes
  - 💬 for Chats
  - ▼ Expanded/collapsed state
- **Smart Collections**: Dynamic filters with item counts
- **Drag & Drop**: Items can be reorganized

### 2. Note Editor (Center Panel)
- **Block Editor**: Drag handles (⋮⋮) appear on hover for each block
- **Ghost Text**: Shows AI suggestions in gray/italic when typing "++"
- **Slash Commands**: `/ai` opens inline AI assistant
- **Selection Menu**: AI bubble menu appears when text is selected
- **Rich Formatting**: Headers, lists, code blocks, etc.

### 3. AI Chat Panel (Right Panel)
- **Collapsible**: Can be hidden/shown with toggle
- **Resizable**: Drag handle between panels
- **Note Context**: Drag notes into chat for AI analysis
- **Streaming Responses**: Real-time AI responses
- **Action Buttons**: Create notes, continue conversation

### 4. Visual Features Demonstrated

**Ghost Text Example**:
```
"enables computers to learn from data++"
[Ghost suggestion: "without being explicitly programmed to do so"]
```

**Slash Command Example**:
```
/ai
[AI Assistant panel opens with suggestions]
```

**Drag & Drop Indicators**:
- Drag handles (⋮⋮) on blocks
- Drop zones highlighted when dragging
- Visual feedback during drag operations

**Grammar/Spell Check**:
- Underlined errors (not shown in ASCII but would appear as wavy underlines)
- Right-click for suggestions

### 5. Interactive Elements
- **Resize Handles**: Between panels for custom layouts
- **Collapse/Expand**: All panels can be toggled
- **Search**: Global search with Cmd+P
- **Star/Delete**: Quick actions on notes
- **Profile Menu**: User settings and preferences

This wireframe showcases the three-panel layout with all major features visible and demonstrates how users interact with AI throughout their workflow.