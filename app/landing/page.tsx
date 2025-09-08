"use client"
import { Button } from "@/components/origin-ui/button"
import { Card } from "@/components/origin-ui/card"
import { Badge } from "@/components/origin-ui/badge"
import { ArrowRight, Sparkles, Eye, Github, Download, Terminal } from "lucide-react"
import Link from "next/link"
import ThemeToggle from "@/components/theme-toggle"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">a0</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="https://github.com/rajdesai17/a0" target="_blank">
                <Github className="w-4 h-4 mr-2" />
                View Repo
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 pt-32 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            Powered by Google Gemini 2.5 Flash and ai-sdk
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            AI-powered React components in <span className="text-primary">seconds</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-3xl mx-auto">
            Chat, browse docs, and generate production-ready components — fast, clean, and previewed live.
          </p>

          {/* Tech Stack */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Badge variant="outline">Next.js 15</Badge>
            <Badge variant="outline">AI SDK v5</Badge>
            <Badge variant="outline">Google Gemini 2.5 Flash</Badge>
            <Badge variant="outline">Origin UI</Badge>
            <Badge variant="outline">CodeMirror 6</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/chat">
                Try Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/rajdesai17/v0-split-screen-chaty" target="_blank">
                <Github className="w-4 h-4 mr-2" />
                View Repo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Features</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to build modern React components with AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Real-time Component Generation</h3>
            <p className="text-muted-foreground text-sm">
              Interactive chat with Gemini for instant component generation and refinement
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">React + TypeScript + Origin UI</h3>
            <p className="text-muted-foreground text-sm">
              Clean, typed code with Origin UI design tokens and TypeScript interfaces
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Live Preview with Code | Preview Tabs</h3>
            <p className="text-muted-foreground text-sm">
              Sandboxed iframe preview with Code | Preview tabs for instant feedback
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Download with Usage Docs</h3>
            <p className="text-muted-foreground text-sm">
              Download with usage docs and crawler-based integration guide
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="p-8 md:p-12 text-center bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to build amazing components?</h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
            Start generating production-ready React components with AI in seconds
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/chat">
                Try Demo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="https://github.com/rajdesai17/v0-split-screen-chaty" target="_blank">
                <Github className="w-4 h-4 mr-2" />
                View Repo
              </Link>
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">AI Component Generator</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Built with Next.js 15 & Origin UI</span>
              <span>•</span>
              <span>Powered by Google Gemini 2.5 Flash</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
