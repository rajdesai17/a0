# a0 - AI Component Studio

## Overview

**a0** is an AI-powered React component generator that creates production-ready components by analyzing API documentation in real-time. Built with **Next.js 15**, **AI SDK v5**, **Google Gemini 2.5 Flash**, and **Origin UI**.

## Snapshots

<p align="center">
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/1b6577a3-5c3e-4a0e-81f3-701159f23a6c" />
</p>

<p align="center">
  <img width="260" alt="image" src="https://github.com/user-attachments/assets/da2eb925-9e31-4b6e-9d6c-041508e015a1" />
  <img width="260" alt="image" src="https://github.com/user-attachments/assets/2d16659c-7dc0-47a1-a5bb-143ca51cae43" />
  <img width="260" alt="image" src="https://github.com/user-attachments/assets/87cef22c-7125-42fc-a260-9e7084929c32" />
</p>

<p align="center">
  <img width="800" alt="image" src="https://github.com/user-attachments/assets/a581eb4d-1000-4f21-8fd3-d09cc599f90a" />
</p>

<p align="center">
  <img width="400" alt="image" src="https://github.com/user-attachments/assets/792b2c84-f396-4dfa-9cfc-2e0e4177d361" />
  <img width="400" alt="image" src="https://github.com/user-attachments/assets/e519f227-6953-41c9-be9e-f2e1e2fde57f" />
</p>

## 1. Setup & Installation

### Prerequisites
- Node.js 18+
- pnpm (recommended)
- Google AI Studio API key

### Steps

```bash
# Clone and install
git clone https://github.com/rajdesai17/v0-split-screen-chaty.git
cd v0-split-screen-chaty
pnpm install

# Setup environment
cp .env.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY to .env.local

# Run locally
pnpm dev
```

Open http://localhost:3000

## 2. Example Usage

You can describe components directly or provide API docs for integration.

**Basic Components:**

```
"create a modern pricing card"
```

**Based on API Docs:**

```
"create a pricing card integrated with http://billingsdk.com/ http://dodopayments.com/"
```


## 3. Why Origin UI?

We chose **Origin UI** over shadcn (as required) because it:
- Provides modern, accessible design tokens and prebuilt patterns
- Is less overused, making component outputs more unique
- Integrates smoothly with TailwindCSS and TypeScript

All generated components follow Origin UI conventions with full type safety.

## 4. Tools, Workflows & Trade-offs

**Tools & Stack:**
- **Next.js 15 (App Router)** → scalable architecture
- **AI SDK v5** → orchestration + tool integration
- **Gemini 2.5 Flash** → fast, reliable LLM generation
- **Origin UI + TailwindCSS** → design system & styling
- **CodeMirror 6** → syntax highlighting

**Workflows:**
- Real-time streaming chat (split-screen: chat + preview)
- Multi-API Fetch URLs with parallel scraping
- Context passed into AI for accurate code generation
- Auto-generated usage docs for each component

**Trade-offs:**
- Focused on Origin UI → limits flexibility for teams preferring other UI libraries
- Crawling can be rate-limited depending on the docs' protection
- Preview runs in iframe sandbox → safer, but slightly slower rendering

## Features

- **AI-Powered Generation**: Context-aware components using scraped documentation
- **Live Preview**: Real-time split-screen interface with instant updates
- **Multi-API Integration**: Parallel documentation scraping and analysis
- **Production Ready**: TypeScript, error handling, and Origin UI design system
- **Smart Documentation**: Auto-generated installation and usage guides

## Architecture

```
User Input → URL Detection → Parallel Scraping → Content Analysis → AI Generation → Component Output
```

**Key Components:**
- `app/chat/page.tsx` - Main split-screen interface
- `app/api/chat/route.ts` - AI chat endpoint with multi-API integration
- `lib/scrapeUtils.ts` - Web scraping utilities with anti-bot measures
- `lib/tools/browseTool.ts` - Multi-API browser tool

## License

This project is licensed under the MIT License.


---

> For detailed technical documentation, see [PROJECT_COMPLETION_REPORT.md](./PROJECT_COMPLETION_REPORT.md)
