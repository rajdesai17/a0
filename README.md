# a0 - AI Component Studio

> **📋 For detailed technical implementation and completion analysis, see [PROJECT_COMPLETION_REPORT.md](./PROJECT_COMPLETION_REPORT.md)**

## 🚀 Project Status: 95% Complete ✅

**Advanced AI-powered component generation platform with multi-API documentation integration**

**Tech Stack**: Next.js 14 + AI SDK v5.0.34 + Google Gemini 2.5 Flash + Origin UI + TypeScript

<table>
  <tr>
    <td><img width="100%" alt="image" src="https://github.com/user-attachments/assets/6c2d2c96-03a8-4960-acfe-347ca53fc274" /></td>
    <td><img width="100%" alt="image" src="https://github.com/user-attachments/assets/a176259f-aa0c-4bbf-bab0-dde792081f2b" /></td>
  </tr>
</table>

## ✨ What Makes This Special

**🔗 Multi-API Integration**: First-of-its-kind ability to scrape and integrate multiple documentation sources simultaneously for context-aware component generation.

**🤖 Advanced AI**: Powered by Google Gemini 2.5 Flash with intelligent documentation analysis and endpoint extraction.

**🎨 Professional Design**: Complete Origin UI integration with "a0" branding system and responsive design.

## 🎯 Core Features

### 💬 Split-Screen Chat Interface
- **Real-time streaming** responses with live component preview
- **Responsive design** - chat on left, component preview on right
- **Message persistence** with conversation history
- **Professional UI** using Origin UI design system

### 🌐 Multi-API Documentation Browser
- **Parallel scraping** of multiple documentation sources
- **Anti-bot measures** with realistic headers and timeouts
- **Intelligent analysis** - extracts API endpoints, auth methods, integration patterns
- **Context integration** - passes full documentation context to AI

### 🧩 AI-Powered Component Generation
- **Context-aware generation** using scraped documentation
- **Origin UI components** with proper TypeScript interfaces
- **Multiple component types** - pricing cards, forms, dashboards, modals
- **Production-ready code** with error handling and loading states

### 🔍 Live Component Preview
- **Sandboxed iframe** preview with real-time updates
- **Syntax highlighting** with CodeMirror integration
- **Tab system** - Preview | Code | Instructions
- **Auto-generated documentation** with installation guides

## 🧪 Verified Multi-API Examples

```bash
# Example 1: Billing & Payments Integration
"create a pricing card integrated with http://billingsdk.com/ http://dodopayments.com/"
✅ Result: 2,823 characters of context, complete integration guide

# Example 2: Documentation-focused Integration  
"create a pricing card integrated with http://billingsdk.com/ https://docs.dodopayments.com/introduction"
✅ Result: 3,154 characters of context, 20+ API endpoints extracted
```

## 🛠️ Architecture Overview

```
User Input → URL Detection → Parallel Scraping → Content Analysis → AI Generation → Component Output
```

**Key Components:**

- `app/chat/page.tsx` - Main split-screen interface
- `app/api/chat/route.ts` - AI chat endpoint with multi-API integration
- `lib/scrapeUtils.ts` - Web scraping utilities with anti-bot measures
- `lib/tools/browseTool.ts` - Multi-API browser tool
- `components/navbar.tsx` - Reusable navigation component

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm (recommended)
- Google AI Studio API key

### Installation

```bash
# Clone the repository
git clone https://github.com/rajdesai17/v0-split-screen-chaty.git
cd v0-split-screen-chaty

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your GOOGLE_GENERATIVE_AI_API_KEY to .env.local

# Start development server
pnpm dev
```

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
FIRECRAWL_API_KEY=your_firecrawl_key_here # Optional: For enhanced scraping
```

## 🎮 Usage Examples

### Basic Component Generation
```
"create a modern pricing card component"
```

### Multi-API Integration
```
"create a dashboard integrated with https://api.stripe.com/docs https://docs.supabase.com/"
```

### Specific Component Types
```
"build a user profile form with validation using React Hook Form"
"create a data table with sorting and filtering"
"design a checkout flow with payment integration"
```

## 📁 Project Structure

```
a0-component-studio/
├── app/
│   ├── chat/page.tsx           # Main chat interface
│   ├── landing/page.tsx        # Professional landing page
│   ├── layout.tsx              # Root layout with branding
│   └── api/
│       ├── chat/route.ts       # AI chat endpoint
│       ├── documentation/route.ts # Documentation analysis
│       └── scrape/route.ts     # Web scraping API
├── components/
│   ├── navbar.tsx              # Navigation component
│   ├── sandboxed-preview.tsx   # Component preview
│   └── origin-ui/              # Origin UI components
├── lib/
│   ├── scrapeUtils.ts          # Web scraping utilities
│   └── tools/browseTool.ts     # Multi-API browser
└── README.md                   # This file
```

## 🔧 Technical Features

- **Multi-API Integration**: Parallel documentation scraping and analysis
- **AI-Powered Generation**: Google Gemini 2.5 Flash with context awareness
- **Real-time Preview**: Sandboxed component rendering with live updates
- **Professional UI**: Origin UI design system with consistent branding
- **TypeScript**: Full type safety throughout the application
- **Performance Optimized**: Efficient caching and parallel processing

## 📈 Performance Metrics

- **Component Generation**: 15-30 seconds (depending on complexity)
- **Multi-API Scraping**: 2-5 seconds parallel processing
- **Real-time Updates**: Sub-second preview refresh
- **Memory Efficiency**: Optimized context handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI Studio** for Gemini 2.5 Flash API
- **Origin UI** for the beautiful component library
- **Vercel AI SDK** for seamless AI integration
- **Next.js Team** for the amazing framework

---

**🎯 Built with ❤️ by a0 - AI Component Studio**

> 📋 **For comprehensive technical documentation and implementation details, see [PROJECT_COMPLETION_REPORT.md](./PROJECT_COMPLETION_REPORT.md)**