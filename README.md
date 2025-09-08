# a0 - AI Component Studio

## TL;DR

**a0** is an AI-powered React component generator that creates professional, production-ready components by analyzing multiple API documentations simultaneously. Simply describe what you want or provide documentation URLs, and get a complete component with code, preview, and integration instructions. Built using AI SDK and Gemini 2.5 Flash.

---

## What is a0?

**a0** (pronounced "a-zero") is an intelligent component generation platform that combines AI with real-time documentation analysis. It's like having a senior developer who can instantly read any API documentation and build you the perfect component.

> For detailed technical documentation, see [PROJECT_COMPLETION_REPORT.md](./PROJECT_COMPLETION_REPORT.md)

### Key Features

- **AI-Powered Generation**: Uses Google Gemini 2.5 Flash for intelligent component creation
- **Multi-API Integration**: Scrapes multiple documentation sources simultaneously
- **Live Preview**: Real-time component preview with split-screen interface
- **Smart Documentation**: Auto-generates installation guides and usage instructions
- **Origin UI Design**: Professional, accessible components with modern design
- **Production Ready**: TypeScript, error handling, and best practices built-in

**Tech Stack**: Next.js 14 + AI SDK v5.0.34 + Google Gemini 2.5 Flash + Origin UI + TypeScript

## Screenshots

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
## How It Works

1. **Describe Your Component**: Tell a0 what you want to build
2. **Add Documentation URLs** (optional): Include API docs for integration
3. **Get Your Component**: Receive code, preview, and instructions instantly

## Example Usage

```
"create a pricing card with Stripe integration"
"build a user dashboard with authentication"
"design a checkout flow with payment processing"
"create a data table with Supabase integration"
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm (recommended)
- Google AI Studio API key

### Installation

```bash
# Clone and install
git clone https://github.com/rajdesai17/v0-split-screen-chaty.git
cd v0-split-screen-chaty
pnpm install

# Set up environment
cp .env.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY to .env.local

# Run the app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating components!

## Environment Setup

Create `.env.local` in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here # Optional: For enhanced scraping
```

## Usage Examples

### Basic Components
```
"create a modern pricing card"
"build a contact form with validation" 
"design a hero section with call-to-action"
```

### API-Integrated Components  
```
"create a user profile with Supabase authentication"
"build a payment form integrated with Stripe"
"design a dashboard with real-time data from Firebase"
```

### Advanced Components
```
"create a multi-step form with progress tracking"
"build a data visualization dashboard with charts"
"design a e-commerce product catalog with filtering"
```

## Core Features

### Split-Screen Chat Interface
- **Real-time streaming** responses with live component preview
- **Responsive design** - chat on left, component preview on right
- **Message persistence** with conversation history
- **Professional UI** using Origin UI design system

### Multi-API Documentation Browser
- **Parallel scraping** of multiple documentation sources
- **Anti-bot measures** with realistic headers and timeouts
- **Intelligent analysis** - extracts API endpoints, auth methods, integration patterns
- **Context integration** - passes full documentation context to AI

### AI-Powered Component Generation
- **Context-aware generation** using scraped documentation
- **Origin UI components** with proper TypeScript interfaces
- **Multiple component types** - pricing cards, forms, dashboards, modals
- **Production-ready code** with error handling and loading states

### Live Component Preview
- **Sandboxed iframe** preview with real-time updates
- **Syntax highlighting** with CodeMirror integration
- **Tab system** - Preview | Code | Instructions
- **Auto-generated documentation** with installation guides

## Verified Multi-API Examples

```bash
# Example 1: Billing & Payments Integration
"create a pricing card integrated with http://billingsdk.com/ http://dodopayments.com/"
# Result: 2,823 characters of context, complete integration guide

# Example 2: Documentation-focused Integration  
"create a pricing card integrated with http://billingsdk.com/ https://docs.dodopayments.com/introduction"
# Result: 3,154 characters of context, 20+ API endpoints extracted
```

## Architecture Overview

```
User Input → URL Detection → Parallel Scraping → Content Analysis → AI Generation → Component Output
```

**Key Components:**

- `app/chat/page.tsx` - Main split-screen interface
- `app/api/chat/route.ts` - AI chat endpoint with multi-API integration
- `lib/scrapeUtils.ts` - Web scraping utilities with anti-bot measures
- `lib/tools/browseTool.ts` - Multi-API browser tool
- `components/navbar.tsx` - Reusable navigation component

## Features

- **AI-Powered**: Google Gemini 2.5 Flash generates intelligent, context-aware components
- **Multi-API**: Analyze multiple documentation sources simultaneously  
- **Live Preview**: Real-time component preview with split-screen interface
- **Smart Docs**: Auto-generated installation guides and usage instructions
- **Professional Design**: Origin UI components with modern styling
- **Production Ready**: TypeScript, error handling, and best practices
- **Responsive**: Works on desktop, tablet, and mobile
- **Customizable**: Easy to modify and extend components

## Project Structure

```
a0-component-studio/
├── app/                    # Next.js app directory
├── components/             # Reusable UI components  
├── lib/                    # Utilities and tools
└── public/                 # Static assets
```

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Google AI Studio for Gemini 2.5 Flash API
- Origin UI for beautiful component library
- Vercel AI SDK for seamless AI integration
- Next.js team for the amazing framework

---

**Built with ❤️**

> For detailed technical documentation, see [PROJECT_COMPLETION_REPORT.md](./PROJECT_COMPLETION_REPORT.md)
