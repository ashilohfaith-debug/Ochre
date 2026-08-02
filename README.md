<div align="center">

<img width="350" height="250" alt="ochre on black" src="https://github.com/user-attachments/assets/8213820a-86e2-45c0-8138-0ee25aa5e963" />

# **ochre.**

*build software without friction*

</br>

A collaborative software development workspace that unifies real-time coding, intelligent assistance, and continuous version history into a single platform.

</br>

Built for the **ShePreneur Startup Bootcamp 2026**.

[Overview](#overview) · [Principles](#principles) · [Architecture](#architecture) · [Features](#features) · [Tech Stack](#tech-stack) · [Upcoming Features](#upcoming-features)

</div>

</br>

## Overview

Software development today is fragmented. Building a single feature often requires switching between a code editor, GitHub, an AI assistant, and messaging platforms — and none of them share context with each other.

This is why we built **Ochre**. Now, developers can:

-    write code in the same editor at the same time
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

</br>

Real-time sync is powered by **Yjs**, a CRDT (Conflict-free Replicated Data Type) engine, so concurrent edits merge automatically without manual conflict resolution.

</br>

## Features

| Feature | Description |
|---|---|
| <img width="25" height="25" alt="collab" src="https://github.com/user-attachments/assets/b147fe71-9533-4b82-8971-12e02de2c036" /> Collaboration | Multiple developers edit the same project simultaneously and seamlessly. |
| <img width="25" height="25" alt="backup" src="https://github.com/user-attachments/assets/a0a0b6a5-47a6-4061-a2cc-6a1387a47196" /> Version History | Every change is preserved automatically — restore previous versions, compare edits, and track project evolution without relying solely on commits. |
| <img width="17" height="17" alt="live" src="https://github.com/user-attachments/assets/09462945-6f8b-49fd-ab72-9d52878f58db" /> Developer Presence | See who's online, where they're editing, and what files they're working on, without interrupting anyone's flow. |
| <img width="17" height="17" alt="one" src="https://github.com/user-attachments/assets/e0213e3c-86c0-4fcf-860e-ed645ae6b9b5" /> One Workspace | Code, AI, collaboration, history, and project management all live in a single place. |

</br>

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Editor | Monaco Editor |
| Real-time Collaboration | WebSockets + Yjs (CRDT) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Authentication | Custom — pbkdf2 password hashing + base64 JWT |

</br>

*Built with ❤️ by team PromptShop.*
