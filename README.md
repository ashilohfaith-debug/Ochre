<div align="center">

<img width="350" height="250" alt="ochre" src="https://github.com/user-attachments/assets/8213820a-86e2-45c0-8138-0ee25aa5e963" />

# **ochre.**

*build software without friction*

<br/>

A collaborative software development workspace that unifies real-time coding, intelligent assistance, and continuous version history into a single platform.

<br/>

Built for the **ShePreneur Startup Bootcamp 2026**.

<br/>

[Overview](#overview) · [Principles](#principles) · [Architecture](#architecture) · [Features](#features) · [Tech Stack](#tech-stack) · [Roadmap](#roadmap)

</div>

---

> 📺 Watch the [demo video](https://www.youtube.com/watch?v=QoFjLHuWyBI)

---

## Overview

Software development today is fragmented. Building a single feature often requires switching between a code editor, GitHub, an AI assistant, and messaging platforms — and none of them share context with each other.

**Ochre** changes that. With Ochre, developers can:

- write code in the same editor, at the same time
- see teammates' cursors, selections, and updates in real time
- restore any previous version instantly
- search across the entire workspace without leaving the editor

> Instead of stitching tools together, Ochre treats the editor itself as the collaboration layer.

---

## Principles

| | |
|---|---|
| **O**rchestrate | One workspace for every workflow |
| **C**ollaborate | Teams stay in sync every step of the way |
| **H**armonise | Every tool works as one |
| **R**eason | Intelligence that understands context |
| **E**ngineer | Every build, engineered for production |

---

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

Real-time sync is powered by **Yjs** — a CRDT (Conflict-free Replicated Data Type) engine — so concurrent edits from multiple users merge automatically, with no manual conflict resolution required.

---

## Features

| Feature | Description |
|---|---|
| <img width="22" height="22" alt="collab" src="https://github.com/user-attachments/assets/b147fe71-9533-4b82-8971-12e02de2c036" /> &nbsp;Real-time Collaboration | Multiple developers edit the same project simultaneously and seamlessly. |
| <img width="22" height="22" alt="backup" src="https://github.com/user-attachments/assets/a0a0b6a5-47a6-4061-a2cc-6a1387a47196" /> &nbsp;Version History | Every change is preserved automatically. Restore previous versions, compare edits, and track project evolution. |
| <img width="18" height="18" alt="live" src="https://github.com/user-attachments/assets/09462945-6f8b-49fd-ab72-9d52878f58db" /> &nbsp;Developer Presence | See who's online, where they're editing, and what files they're working on — without interrupting anyone's flow. |
| <img width="18" height="18" alt="code" src="https://github.com/user-attachments/assets/4f63f320-6af6-4041-87cb-2044eb1893c6" /> &nbsp;Unified Workspace | Code, collaboration, version history, and project management — all in one place. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Editor | Monaco Editor |
| Real-time Collaboration | WebSockets + Yjs (CRDT) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | Custom — PBKDF2 password hashing + Base64 JWT |

---

## Roadmap

- [ ] AI Agent integration

---

<div align="center">

*Built with ❤️ by team PromptShop.*

</div>
