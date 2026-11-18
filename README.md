<div align="center">

<img width="350" height="250" alt="ochre on black" src="https://github.com/user-attachments/assets/8213820a-86e2-45c0-8138-0ee25aa5e963" />

# **ochre.**

*build software without friction*

<br/>

A collaborative software development workspace that unifies real-time coding, intelligent assistance, and continuous version history into a single platform.

<br/>

Built for the **ShePreneur Startup Bootcamp 2026**.

[Overview](#overview) · [Principles](#principles) · [Architecture](#architecture) · [Features](#features) · [Tech Stack](#tech-stack) · [Upcoming Features](#upcoming-features)

</div>

<br/>

Click [here](https://www.youtube.com/watch?v=QoFjLHuWyBI) to watch the demo video.

## Overview

Software development today is fragmented. Building a single feature often requires switching between a code editor, GitHub, an AI assistant, and messaging platforms — and none of them share context with each other.

This is why we built **Ochre**. Now, developers can:

-    write code in the same editor, at the same time
-    see teammates' cursors, selections and updates
-    restore any previous version instantly
-    search through their code quickly

> Instead of stitching tools together, Ochre treats the editor itself as the collaboration layer.

<br/>

## Principles

-  **O**rchestrate:  one workspace for every workflow
-  **C**ollaborate:  teams stay in sync every step of the way
-  **H**armonise:  every tool works as one
-  **R**eason:  intelligence that understands context
- **E**ngineer:  every build, engineered for production

<br/>

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

<br/>

Real-time sync is powered by **Yjs**, a CRDT (Conflict-free Replicated Data Type) engine, so concurrent edits merge automatically without manual conflict resolution.

<br/>

## Features

| Feature | Description |
|---|---|
| <img width="25" height="25" alt="collab" src="https://github.com/user-attachments/assets/b147fe71-9533-4b82-8971-12e02de2c036" /> Collaboration | Multiple developers edit the same project simultaneously and seamlessly. |
| <img width="25" height="25" alt="backup" src="https://github.com/user-attachments/assets/a0a0b6a5-47a6-4061-a2cc-6a1387a47196" /> Version History | Every change is preserved automatically — users can restore previous versions, compare edits, and track project evolution. |
| <img width="19" height="19" alt="live" src="https://github.com/user-attachments/assets/09462945-6f8b-49fd-ab72-9d52878f58db" /> Developer Presence | See who's online, where they're editing, and what files they're working on, without interrupting anyone's flow. |
| <img width="20" height="20" alt="code" src="https://github.com/user-attachments/assets/4f63f320-6af6-4041-87cb-2044eb1893c6" /> One Workspace | Code, AI, collaboration, history, and project management — all live in a single workspace. |

<br/>

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

<br/>

## Prototype: Noir (Legacy)

The initial prototype, **Noir**, is a lightweight browser-based code editor built on Monaco Editor. It lives at `index.html` / `script.js` / `styles.css` in the root and can be opened directly in a browser with no build step.

### Running Noir

Just open `index.html` in a browser. If your browser blocks local file access for scripts, serve it instead:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

### Noir Feature Map

| Area | Details |
|---|---|
| Editing | Syntax highlighting for 60+ languages, minimap, code folding, bracket matching & auto-closing, auto-indent, multi-cursor (`Alt`+click, `Ctrl/Cmd+D`), smooth scrolling & cursor animation |
| Find & commands | `Ctrl/Cmd+F` find, `Ctrl/Cmd+H` replace, `F1` or the palette icon opens the Command Palette |
| Zoom & type | `Ctrl/Cmd` + mouse wheel to zoom, toolbar font-size stepper, font family switcher (JetBrains Mono / Fira Code / Consolas) |
| Files | New, Open (file picker or drag-and-drop anywhere on the window), Save (downloads the buffer), autosave to `localStorage` every 400ms, session restored automatically on reload |
| Status bar | Language (also a `<select>` in the toolbar), line/column, indent size (click to cycle 2/4/8 and spaces/tabs), encoding, line-ending |

<br/>

## To be implemented
- AI Agent

<br/>

*Built with ❤️ by team PromptShop.*
