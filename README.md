# AI Chat Interface - Component Generator

## Status: Version 1 Complete ✅

**Tech Stack**: Next.js 15 + AI SDK v5 + Google Gemini 2.5 Pro + Origin UI + CodeMirror 6

## Completed Features (v1)

### Core Chat Interface
- split-screen design with chat + preview  
- real-time streaming responses from gemini 2.5 pro  
- message history with persistent conversations  
- professional ui using origin ui  

### Component Generation
- ai generates react + typescript components  
- origin ui design patterns (not shadcn)  
- multiple component types: pricing cards, forms, buttons, modals  
- clean typed code with proper interfaces  

### Preview System
- live component preview in sandboxed iframe  
- codemirror syntax highlighting  
- preview | code tab system  
- auto-switch to preview when ready  

### Performance
- response time around 3–11 seconds  
- smooth streaming and real-time updates  
- tested with cards, forms, buttons, modals  

## In Progress (v2)

- export components as .tsx  
- usage docs tab with instructions  
- enhanced export options  
- browsing tool for api docs  
- multi-api integration (billingSDK + dodoPayments example)  
- step-by-step integration instructions  

## Setup

```bash
npm install
# add GOOGLE_GENERATIVE_AI_API_KEY to .env.local
npm run dev
