# NoteChat - Where AI Meets Your Second Brain

<p align="center">
  <img src="https://img.shields.io/badge/AI-Native-blue" alt="AI Native" />
  <img src="https://img.shields.io/badge/Built%20with-Next.js%2015-black" alt="Next.js" />
  <img src="https://img.shields.io/badge/Powered%20by-GPT--4-green" alt="GPT-4" />
  <img src="https://img.shields.io/badge/Editor-TipTap-purple" alt="TipTap" />
</p>

> **The problem with ChatGPT and Claude:** Your brilliant insights get buried in an endless stream of conversations. Your notes live in a different world from your AI interactions. Critical knowledge slips through the cracks.

> **The problem with Notion and Obsidian:** They're great for organizing thoughts, but AI feels bolted on as an afterthought. There's no seamless connection between your knowledge base and intelligent assistance.

**NoteChat bridges this gap.** It's not just another note-taking app with AI features tacked on. It's a ground-up reimagining of how AI and personal knowledge management should work together.

## 🎯 Who Is This For?

Meet **Alex** - a software developer enrolled in an AI bootcamp while working full-time. They're drowning in:
- 📚 Course materials scattered across platforms
- 💬 ChatGPT conversations that solved problems but can't be found later
- 📝 Meeting notes that need to be actionable
- 🧠 Complex concepts that need breaking down
- ⏰ Limited time to organize everything

**If you're someone who:**
- Takes courses, attends bootcamps, or is constantly learning
- Uses ChatGPT/Claude daily but loses track of important conversations
- Loves tools like Notion but wishes AI was more integrated
- Needs to synthesize information from multiple sources
- Values both organization and intelligence in their tools

**Then NoteChat is built for you.**

## ✨ Core Features That Actually Matter

### 1. **Ghost Text Completions** - Write at the Speed of Thought
Type `++` anywhere and watch AI complete your thoughts inline. No popups, no interruptions - just seamless writing assistance that learns your style.

```
"Machine learning is a subset of AI that++"
→ "enables computers to learn from data without being explicitly programmed"
```

### 2. **AI Chat That Understands Your Notes**
Drag and drop any note into the chat. Ask questions. Get insights. Create new notes from conversations. Your AI assistant has full context of your knowledge base.

**Real scenarios:**
- "How do these physics concepts relate to my math notes?"
- "Create a study guide from my lecture notes"
- "What did I learn about React hooks last month?"

### 3. **Smart Text Transformations**
Select any text and instantly:
- ✨ Improve clarity
- 📏 Make it shorter/longer
- 🎯 Fix grammar
- 🎨 Change tone
- 🛠️ Custom transformations you define

### 4. **Slash Commands for Everything**
Type `/` to access formatting, AI assistance, and more. `/ai` opens an inline assistant that can write, explain, or create anything you need.

### 5. **Real-Time Grammar & Style Checking**
Powered by Retext, get intelligent suggestions as you write. Not just spell check - actual writing improvements that make sense in context.

### 6. **Block Editor That Just Works**
Drag and drop blocks like Notion. Every paragraph, heading, and list is movable. But unlike Notion, AI is woven into every interaction.

### 7. **Learning System That Adapts**
NoteChat remembers:
- Which AI suggestions you accept or reject
- Your writing style preferences
- Your custom commands and shortcuts
- What makes your workflow unique

The more you use it, the smarter it gets. **For you specifically.**

## 🚀 Real Problems, Real Solutions

### For Students & Learners
**Problem:** Lecture notes are messy, course materials are scattered, and you can't remember which ChatGPT conversation had that brilliant explanation.

**Solution:** 
- Ghost text helps capture thoughts quickly during lectures
- Drag all related notes into AI chat for instant study guides
- Transform rough notes into polished summaries with one click

### For Knowledge Workers
**Problem:** Meeting notes need action items, documentation needs to be clear, and you're switching between 5 different tools.

**Solution:**
- `/ai` command extracts action items automatically
- Grammar checker ensures professional communication
- Everything lives in one intelligent system

### For Researchers & Writers
**Problem:** Ideas are scattered across tools, writer's block strikes often, and maintaining consistent style is challenging.

**Solution:**
- Ghost completions overcome blank page paralysis
- Custom AI actions maintain your unique voice
- Chat with all your research notes simultaneously

## 🏗️ Built Different (Technical Highlights)

- **AI-First Architecture**: Streaming responses, edge runtime, 60fps token rendering
- **Smart Learning**: Every interaction improves future suggestions
- **Performance Obsessed**: Web workers for grammar checking, virtual scrolling for chats
- **Privacy Focused**: Your data, your preferences, your AI

## 🎬 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/notechat.git
cd notechat
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
DATABASE_URL=your_postgres_connection_string
OPENAI_API_KEY=your_openai_api_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see NoteChat in action.

## 🛠️ Tech Stack

Built with the best tools for the job:
- **Next.js 15** - For blazing-fast performance
- **Vercel AI SDK** - For sophisticated streaming AI
- **TipTap** - For an extensible editor experience
- **PostgreSQL + Drizzle** - For rock-solid data persistence
- **Retext** - For intelligent grammar checking

## 🤝 Why NoteChat?

**It's not about features.** It's about fundamentally changing how you interact with information. 

While others treat AI as an add-on, we built NoteChat from the ground up with AI at its core. While others separate your chats from your notes, we unite them. While others make you adapt to their workflow, we adapt to yours.

## 🚦 Current Status

NoteChat is in active development. Core features are stable and used daily by our team. We're focused on:
- Enhancing the learning system
- Adding collaboration features
- Building mobile apps
- Open-sourcing key components

## 📬 Get In Touch

- **Issues & Features**: [GitHub Issues](https://github.com/your-username/notechat/issues)
- **Documentation**: [User Guide](./docs/user-guide.md) | [Technical Docs](./docs/technical-documentation.md)

---

<p align="center">
  <strong>Stop choosing between organization and intelligence.</strong><br/>
  <em>Start building your AI-powered second brain.</em>
</p>

<p align="center">
  Made with ❤️ by people who got tired of losing great ideas in chat histories.
</p>