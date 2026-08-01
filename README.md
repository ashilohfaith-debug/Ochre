<div align="center">

<img width="350" height="250" alt="ochre on black" src="https://github.com/user-attachments/assets/8213820a-86e2-45c0-8138-0ee25aa5e963" />

# **ochre.**

*build software without friction*

</br>

A collaborative software development workspace that unifies real-time coding, intelligent assistance, and continuous version history into a single platform.

</br>

Built for the **ShePreneur Startup Bootcamp 2026**.

[Overview](#overview) · [Principles](#principles)  · [Features](#features) · [Architecture](#architecture) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started)  · [Prerequisites](#prerequisites) · [Installation](#installation) · [Environment Variables](#environment-variables) · [Project Structure](#project-structure) · [Roadmap](#roadmap) · [Upcoming Features](#upcoming-features)

</div>

</br>

## Overview

Software development today is fragmented. Building a single feature often requires switching between a code editor, GitHub, an AI assistant, a messaging app, and other tools — and none of them share context with each other.

This is why we built **Ochre**. Now, developers can:

-    write code at the same time
-    see teammates' cursors, selections and updates
-    restore any previous version instantly
-    search through their code quickly

> Instead of stitching tools together, Ochre treats the editor itself as the collaboration layer.

</br>

## Principles

-  **O**rchestrate:  one workspace for every workflow
-  **C**ollaborate:  teams stay in sync every step of the way
-  **H**armonise:  every tool works as one
-  **R**eason:  intelligence that understands context
- **E**ngineer:  every build, engineered for production

</br>

## Architecture

```mermaid
flowchart TD
    A[Browser] --> B[Monaco Editor]
    B --> C[WebSocket Server]
    C --> D[Yjs CRDT Engine]
    D --> E[Node.js Backend]
    E --> F[AI Models]
    E --> G[(PostgreSQL)]
    E --> H[Version History]
```

Real-time sync is powered by **Yjs**, a CRDT (Conflict-free Replicated Data Type) engine, so concurrent edits merge automatically without manual conflict resolution. The Node.js backend coordinates AI requests, persistence, and version history alongside the live collaboration layer.

</br>

## Features

| Feature | Description |
|---|---|
| 👥 **Real-Time Collaboration** | Multiple developers edit the same project simultaneously, with live cursors, live selections, and instant sync. |
| 🤖 **AI Pair Programmer** | Built-in AI assists with code generation, debugging, refactoring, code explanations, documentation, and architecture guidance. |
| 📝 **Continuous Version History** | Every change is preserved automatically — restore previous versions, compare edits, and track project evolution without relying solely on commits. |
| ⚡ **Live Developer Presence** | See who's online, where they're editing, and what files they're working on, without interrupting anyone's flow. |
| 📁 **Unified Workspace** | Code, AI, collaboration, history, and project management all live in a single place. |

</br>

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Editor | Monaco Editor |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Real-time Collaboration | WebSockets + Yjs (CRDT) |
| Database | PostgreSQL |
| Authentication | Custom — pbkdf2 password hashing + base64 JWT |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [npm](https://www.npmjs.com/)
- A [PostgreSQL](https://www.postgresql.org/) instance (local or hosted)

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/ochre.git
cd ochre
```

**2. Install and run the frontend**

```bash
cd client
npm install
npm run dev
```

**3. Install and run the backend**

```bash
cd server
npm install
npm run dev
```

The client will be available at `http://localhost:5173` (or whichever port Vite assigns) and the server at the port configured in your backend `.env`.


## Project Structure

```
ochre/
├── client/          # React + TypeScript frontend, Monaco Editor integration
├── server/          # Node.js + Express backend, WebSocket + Yjs sync server
├── prisma/          # Database schema and migrations
└── README.md
```

---

## Roadmap

### ✅ MVP
- [x] Monaco Editor integration
- [x] Multi-user real-time editing
- [x] Live cursors
- [x] Authentication
- [x] Version history
- [x] AI chat assistant

### 🚀 Phase 2
- [ ] AI-powered code review
- [ ] Voice collaboration
- [ ] Inline file comments
- [ ] Git integration
- [ ] Shared terminal sessions

### 🌍 Phase 3
- [ ] Enterprise workspaces
- [ ] AI project memory
- [ ] Team analytics dashboard
- [ ] Plugin marketplace
- [ ] Mobile companion app

</br>

*Built with by ❤️ team PromptShop.*
