"use client"
import { Button } from "@/components/origin-ui/button"
import { Sparkles, Github } from "lucide-react"
import Link from "next/link"
import ThemeToggle from "@/components/theme-toggle"

export default function Navbar() {
  return (
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
  )
}
