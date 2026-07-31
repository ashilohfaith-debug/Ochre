<div align="center">
    
# **ochre.**

**build software without friction**

</div>

# 🎨 OCHRE

> **Build software without collaboration friction.**

An AI-native collaborative software development workspace that brings real-time coding, intelligent assistance, and continuous version history into one unified platform.

Built for the **ShePreneur Startup Bootcamp 2026**.

---

## 🌐 Live Demo

Demo Video: <demo-link>

Website: <website-link>

---

## What • Architecture • Features • Run it • Tech Stack • Roadmap

---

Software development today is fragmented.

Developers constantly switch between code editors, GitHub, AI assistants, communication tools, and documentation just to build a single feature.

Ochre brings everything into one intelligent workspace.

```
┌──────────────────────────────────────────────┐
│     AI-native Collaborative Workspace        │
├──────────────────────────────────────────────┤
│                                              │
│   Real-Time Coding                           │
│          ↓                                   │
│   AI Assistance                              │
│          ↓                                   │
│   Continuous Version History                 │
│          ↓                                   │
│   Team Collaboration                         │
│          ↓                                   │
│   Ship Better Software                       │
│                                              │
└──────────────────────────────────────────────┘
```

---

# What is Ochre?

Ochre is an AI-powered collaborative software development platform built for modern engineering teams.

Instead of switching between multiple tools during development, Ochre combines everything into one workspace.

Developers can:

- Collaborate in real time
- Receive intelligent AI assistance
- View teammate cursors
- Restore previous versions instantly
- Stay synchronized throughout the development lifecycle

---

# Architecture

```
Browser
    │
    ▼
React + Monaco Editor
    │
WebSocket Server
    │
    ▼
Yjs CRDT Engine
    │
    ▼
Node.js Backend
    │
 ┌──────────────┬──────────────┐
 │              │              │
 ▼              ▼              ▼
AI Models   PostgreSQL     Version History
(HuggingFace /
Claude)
```

---

# Features

## 👥 Real-Time Collaboration

Multiple developers can edit the same project simultaneously.

Live cursors.

Live selections.

Instant synchronization.

---

## 🤖 AI Pair Programmer

Integrated AI assists developers with:

- Code generation
- Debugging
- Refactoring
- Code explanations
- Documentation
- Architecture guidance

Future support includes Hugging Face models, Claude, and other frontier AI systems.

---

## 📝 Continuous Version History

Every change is automatically preserved.

Restore previous versions.

Compare edits.

Track project evolution.

---

## ⚡ Live Developer Presence

See:

- who's online
- where they're editing
- what files they're working on

without interrupting their workflow.

---

## 📁 Unified Workspace

Everything developers need lives in one place.

Code.

AI.

Collaboration.

History.

Projects.

---

# Why Ochre?

Today's software workflow looks like this:

VS Code

↓

GitHub

↓

Slack

↓

AI Chat

↓

Documentation

↓

Terminal

↓

Back to VS Code

Ochre turns that into:

```
Code

↓

Collaborate

↓

Reason

↓

Build

↓

Ship
```

All inside one workspace.

---

# Running Locally

## Clone Repository

```bash
git clone https://github.com/yourusername/ochre.git
```

---

## Install Frontend

```bash
cd client
npm install
npm run dev
```

---

## Install Backend

```bash
cd server
npm install
npm run dev
```

---

## Environment Variables

```env
DATABASE_URL=

JWT_SECRET=

OPENAI_API_KEY=

HUGGINGFACE_API_KEY=

ANTHROPIC_API_KEY=

POSTGRES_URL=
```

---

# Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | React + TypeScript |
| Editor | Monaco Editor |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Collaboration | WebSockets + Yjs (CRDT) |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Clerk / Auth.js |
| AI | Hugging Face + Claude |
| Deployment | Vercel + Railway |

---

# Roadmap

### ✅ MVP

- Monaco Editor
- Multi-user editing
- Live cursors
- Authentication
- Version history
- AI Chat

---

### 🚀 Phase 2

- AI code review
- Voice collaboration
- File comments
- Git integration
- Terminal sharing

---

### 🌍 Phase 3

- Enterprise workspaces
- AI project memory
- Team analytics
- Plugin marketplace
- Mobile companion

---

# Vision

We believe the future of software development isn't about adding more tools.

It's about bringing everything developers need into one intelligent workspace.

---

# Built With ❤️

Ochre was built as part of the **ShePreneur Startup Bootcamp 2026**, with the vision of reducing collaboration friction and redefining how modern software teams build together.

---

## Team

**Shiloh Faith**

Frontend • AI Integration • Product Design

**Swetha Rajesh**

Backend • Collaboration • Infrastructure

---

# License

MIT License

---

> **Build software without collaboration friction.**
