"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Code, Eye, Sparkles, Download, FileText, ArrowLeft, Github } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "next-themes"
import { SandboxedPreview } from "@/components/sandboxed-preview"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import ThemeToggle from "@/components/theme-toggle"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [currentUserRequest, setCurrentUserRequest] = useState("")

  const [generatedCode, setGeneratedCode] = useState(`function WelcomeComponent() {
  return (
    <div className="p-6 max-w-md mx-auto bg-card text-card-foreground rounded-lg shadow-lg border border-border">
      <h2 className="text-xl font-semibold mb-4">
        Welcome to AI Component Generator
      </h2>
      <p className="text-muted-foreground">
        Describe the component you want to create and watch AI generate it instantly.
      </p>
    </div>
  )
}

// Export as default for the preview
window.default = WelcomeComponent;`)

  const { theme } = useTheme()
  const [selectedTab, setSelectedTab] = useState("preview")

  // State for documentation results
  const [documentationResults, setDocumentationResults] = useState<any>(null)
  const [instructions, setInstructions] = useState<string>("")

  // Extract component name from code
  const extractComponentName = (code: string): string => {
    const functionMatch = code.match(/function\s+(\w+)/)
    const constMatch = code.match(/const\s+(\w+)\s*=/)
    return functionMatch?.[1] || constMatch?.[1] || "Component"
  }

  // Regenerate instructions when code or user request changes
  useEffect(() => {
    if (generatedCode) {
      generateInstructions(generatedCode)
    }
  }, [generatedCode, currentUserRequest])

  // AI-powered contextual analysis of documentation - moved to component level
  const analyzeDocumentationContext = async (documentationResults: any, userRequest: string) => {
    if (!documentationResults?.results?.length) return null

    try {
      const docContent = documentationResults.results.map((result: any) => ({
        url: result.url,
        title: result.title,
        content: result.content?.substring(0, 2000), // Limit content for analysis
        endpoints: result.apiEndpoints || [],
        analysis: result.analysis,
      }))

      const analysisPrompt = `You are an API integration specialist. Create a concise, focused integration guide.

USER REQUEST: "${userRequest}"

DOCUMENTATION: ${JSON.stringify(docContent, null, 2)}

Generate a practical guide with these sections (keep under 400 words total):

**RELEVANT ENDPOINTS** (2-3 most important)
• List only endpoints directly needed for "${userRequest}"

**INTEGRATION STEPS** (3-4 steps)
1. Specific step for this use case
2. Next practical step
3. Final implementation step

**CODE EXAMPLE**
One focused code snippet for the main functionality

**AUTHENTICATION**
Required headers/auth method

**GOTCHAS** (2 key points)
• Most important issue to avoid
• Critical implementation detail

Focus only on what's needed for this specific use case. Be concise and practical.`

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: analysisPrompt }],
          analysis: true, // Flag to indicate this is for analysis
        }),
      })

      if (response.ok) {
        const analysisData = await response.text()
        return analysisData
      }
    } catch (error) {
      console.error("Failed to analyze documentation:", error)
    }
    return null
  }

  // Enhanced component instructions with AI-powered contextual analysis
  const generateInstructions = async (code: string, userRequest?: string, docContext?: any): Promise<void> => {
    const componentName = extractComponentName(code)
    const hasState = code.includes("useState")
    const hasProps = code.includes("props") || code.includes(": {") || code.includes("interface")
    const hasInteractivity = code.includes("onClick") || code.includes("onSubmit") || code.includes("onChange")
    const hasFetch = code.includes("fetch(") || code.includes("fetch ")
    const hasAPI = code.includes("/api/") || code.includes("http")

    // Extract component props and their types for detailed documentation
    const extractComponentProps = (code: string) => {
      const props: Array<{ name: string; type: string; optional: boolean; description: string }> = []

      // Look for interface definitions
      const interfaceMatch = code.match(/interface\s+\w+Props\s*\{([^}]+)\}/)
      if (interfaceMatch) {
        const interfaceContent = interfaceMatch[1]
        const propMatches = interfaceContent.match(/(\w+)(\?)?\s*:\s*([^;\n]+)/g)
        if (propMatches) {
          propMatches.forEach((match) => {
            const matchResult = match.match(/(\w+)(\?)?\s*:\s*(.+)/)
            if (matchResult) {
              const [, propName, optional, propType] = matchResult
              if (propName && propType) {
                props.push({
                  name: propName,
                  type: propType.trim(),
                  optional: !!optional,
                  description: `${propName} property of type ${propType.trim()}`,
                })
              }
            }
          })
        }
      }

      return props
    }

    let instructions = `# ${componentName} Component\n\n`

    // Check for documentation results and perform AI-powered contextual analysis
    let docInfo = ""
    let contextualAnalysis = null
    const apiEndpointsDetails: Array<{ domain: string; endpoints: string[]; analysis: any }> = []

    // Use provided documentation context if available, otherwise fetch fresh
    if (docContext && docContext.scrapedData) {
      // Use provided documentation context
      contextualAnalysis = docContext.analysis
      console.log("📚 Using provided documentation context for instructions")

      const results = docContext.scrapedData.results?.filter((r: any) => r.success) || []

      if (results.length > 0) {
        docInfo = `\n## 📚 API Documentation Analysis\n\n`
        docInfo += `**URLs Analyzed:** ${results.length} documentation sources\n\n`

        results.forEach((result: any, index: number) => {
          const domain = new URL(result.url).hostname
          docInfo += `### ${index + 1}. ${result.title || domain}\n`
          docInfo += `**URL:** [${result.url}](${result.url})\n`
          docInfo += `**Content:** ${result.wordCount || 0} words of documentation analyzed\n`

          if (result.apiEndpoints && result.apiEndpoints.length > 0) {
            // Enhanced endpoint filtering for API documentation
            const realEndpoints = result.apiEndpoints.filter((endpoint: string) => {
              // Skip obvious static assets
              if (endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i)) return false
              if (endpoint.includes("font") || endpoint.includes("static")) return false

              // Accept endpoints that look like API routes
              const lowerEndpoint = endpoint.toLowerCase()
              return (
                // Common API patterns
                lowerEndpoint.includes("/api/") ||
                lowerEndpoint.includes("/webhook") ||
                lowerEndpoint.includes("endpoint") ||
                lowerEndpoint.startsWith("http") ||
                // HTTP method patterns (like "post /checkouts", "get /payments")
                lowerEndpoint.match(/^(get|post|put|delete|patch)\s+\//) ||
                // Path patterns that look like API endpoints
                lowerEndpoint.match(/^\/[a-z-_]+/) ||
                // Any path with parameters
                lowerEndpoint.includes("{") ||
                lowerEndpoint.includes(":id") ||
                lowerEndpoint.includes("/:")
              )
            })

            if (realEndpoints.length > 0) {
              docInfo += `**API Endpoints Found:** ${realEndpoints.length} real endpoints\n`
              docInfo += `\`\`\`\n${realEndpoints.slice(0, 8).join("\n")}\n\`\`\`\n`
              apiEndpointsDetails.push({
                domain: domain,
                endpoints: realEndpoints,
                analysis: result.analysis,
              })
            } else {
              docInfo += `**Documentation Type:** General API documentation without specific endpoint URLs\n`
            }
          } else {
            docInfo += `**Documentation Type:** General documentation without API endpoints\n`
          }
          docInfo += `\n`
        })
      }
    } else {
      // Fallback to existing documentation fetch logic (for backward compatibility)
      try {
        const docResponse = await fetch("/api/documentation")
        const docData = await docResponse.json()
        if (docData.hasDocumentation && docData.results) {
          setDocumentationResults(docData.results)

          // Get the user's original request to provide contextual analysis
          const requestToAnalyze =
            userRequest ||
            currentUserRequest ||
            (messages.length > 0 ? messages[messages.length - 1]?.content || "" : "")

          // Use AI to analyze documentation in context of user's request
          if (requestToAnalyze && hasFetch) {
            contextualAnalysis = await analyzeDocumentationContext(docData.results, requestToAnalyze)
          }

          const results = docData.results.results?.filter((r: any) => r.success) || []

          if (results.length > 0) {
            docInfo = `\n## 📚 API Documentation Analysis\n\n`
            docInfo += `**URLs Analyzed:** ${results.length} documentation sources\n\n`

            results.forEach((result: any, index: number) => {
              const domain = new URL(result.url).hostname
              docInfo += `### ${index + 1}. ${result.title || domain}\n`
              docInfo += `**URL:** [${result.url}](${result.url})\n`
              docInfo += `**Content:** ${result.wordCount || 0} words of documentation analyzed\n`

              if (result.apiEndpoints && result.apiEndpoints.length > 0) {
                // Enhanced endpoint filtering for API documentation
                const realEndpoints = result.apiEndpoints.filter((endpoint: string) => {
                  // Skip obvious static assets
                  if (endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i)) return false
                  if (endpoint.includes("font") || endpoint.includes("static")) return false

                  // Accept endpoints that look like API routes
                  const lowerEndpoint = endpoint.toLowerCase()
                  return (
                    // Common API patterns
                    lowerEndpoint.includes("/api/") ||
                    lowerEndpoint.includes("/webhook") ||
                    lowerEndpoint.includes("endpoint") ||
                    lowerEndpoint.startsWith("http") ||
                    // HTTP method patterns (like "post /checkouts", "get /payments")
                    lowerEndpoint.match(/^(get|post|put|delete|patch)\s+\//) ||
                    // Path patterns that look like API endpoints
                    lowerEndpoint.match(/^\/[a-z-_]+/) ||
                    // Any path with parameters
                    lowerEndpoint.includes("{") ||
                    lowerEndpoint.includes(":id") ||
                    lowerEndpoint.includes("/:")
                  )
                })

                if (realEndpoints.length > 0) {
                  docInfo += `**API Endpoints Found:** ${realEndpoints.length} real endpoints\n`
                  docInfo += `\`\`\`\n${realEndpoints.slice(0, 8).join("\n")}\n\`\`\`\n`
                  apiEndpointsDetails.push({
                    domain: domain,
                    endpoints: realEndpoints,
                    analysis: result.analysis,
                  })
                } else {
                  docInfo += `**Documentation Type:** General API documentation without specific endpoint URLs\n`
                }
              } else {
                docInfo += `**Documentation Type:** Conceptual API documentation\n`
              }

              if (result.analysis) {
                if (result.analysis.authMethods && result.analysis.authMethods.length > 0) {
                  docInfo += `**🔐 Authentication:** ${result.analysis.authMethods.join(", ")}\n`
                }
                if (result.analysis.commonPatterns && result.analysis.commonPatterns.length > 0) {
                  docInfo += `**📋 Integration Patterns:** ${result.analysis.commonPatterns.join(", ")}\n`
                }
                if (result.analysis.integrationNotes) {
                  docInfo += `**💡 Integration Notes:** ${result.analysis.integrationNotes}\n`
                }
              }
              docInfo += `\n`
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch documentation:", error)
      }
    }

    instructions += `## Overview\n`
    if (hasFetch && hasAPI) {
      instructions += `A React functional component with **API integration** built using Origin UI design patterns and Tailwind CSS. This component includes real API calls and data handling with comprehensive error management.\n\n`
    } else {
      instructions += `A React functional component built with Origin UI design patterns and Tailwind CSS.\n\n`
    }

    // Use AI-generated contextual analysis if available, otherwise show basic docs
    if (contextualAnalysis && hasFetch) {
      instructions += `## 🤖 AI-Powered Integration Guide\n\n`
      instructions += `Based on your request and the scraped API documentation, here's a focused integration guide:\n\n`
      instructions += contextualAnalysis
      instructions += `\n\n`
    } else if (docInfo) {
      instructions += docInfo
    }

    instructions += `## Usage\n\`\`\`jsx\nimport ${componentName} from './${componentName}'\n\nfunction App() {\n  return <${componentName} />\n}\n\`\`\`\n\n`

    instructions += `## Features\n`

    if (hasFetch) {
      instructions += `- 🌐 **API Integration**: Makes HTTP requests to external APIs\n`
    }
    if (hasAPI) {
      instructions += `- 🔗 **Live Data**: Connects to real API endpoints for dynamic content\n`
    }
    instructions += hasState
      ? `- ✅ **Interactive State Management**: Uses React useState hooks\n`
      : `- 📋 **Static Component**: No internal state management\n`
    instructions += hasInteractivity
      ? `- ✅ **User Interactions**: Includes click handlers and form interactions\n`
      : `- 📋 **Display Only**: No user interactions\n`
    instructions += hasProps
      ? `- ✅ **Configurable Props**: Accepts customizable properties\n`
      : `- 📋 **Self Contained**: No external props required\n`
    instructions += `- 🎨 **Origin UI Styled**: Uses beautiful Origin UI design tokens\n`
    instructions += `- 📱 **Responsive Design**: Mobile-friendly responsive layout\n`
    instructions += `- 🌙 **Theme Support**: Compatible with dark/light modes\n`

    if (code.includes("loading") || code.includes("isLoading")) {
      instructions += `- ⏳ **Loading States**: Proper loading indicators during API calls\n`
    }
    if (code.includes("error") || code.includes("Error")) {
      instructions += `- ❌ **Error Handling**: Graceful error handling and user feedback\n`
    }
    if (code.includes("interface") || code.includes("type ")) {
      instructions += `- 📝 **TypeScript Support**: Includes proper type definitions\n`
    }

    // Extract and document component props for user guidance
    const componentProps = extractComponentProps(code)
    if (componentProps.length > 0) {
      instructions += `## 📝 Component Props Documentation\n\n`
      instructions += `This component accepts the following props for customization:\n\n`
      instructions += `| Prop Name | Type | Required | Description |\n`
      instructions += `|-----------|------|----------|-------------|\n`
      componentProps.forEach((prop) => {
        instructions += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? "No" : "Yes"} | ${prop.description} |\n`
      })
      instructions += `\n### Props Usage Examples\n\n`
      instructions += `\`\`\`jsx\n// Basic usage without props\n<${componentName} />\n\n`
      if (componentProps.length > 0) {
        instructions += `// Advanced usage with props\n<${componentName}\n`
        componentProps.slice(0, 3).forEach((prop) => {
          const sampleValue = prop.type.includes("string")
            ? `"sample value"`
            : prop.type.includes("number")
              ? `{123}`
              : prop.type.includes("boolean")
                ? `{true}`
                : `{{}}`
          instructions += `  ${prop.name}=${sampleValue}\n`
        })
        instructions += `/>\n`
      }
      instructions += `\`\`\`\n\n`
    }

    instructions += `## Basic Usage\n\`\`\`jsx\nimport ${componentName} from './${componentName}'\n\nfunction App() {\n  return (\n    <div className="p-4">\n      <${componentName}${componentProps.length > 0 ? " />" : " />"}\n    </div>\n  )\n}\n\`\`\`\n\n`

    instructions += `\n## 🛠️ Installation & Setup\n`
    instructions += `### Step 1: Component Installation\n`
    instructions += `1. Copy the component code to your project (recommended: \`components/${componentName}.tsx\`)\n`
    instructions += `2. Ensure you have the required dependencies installed\n\n`

    instructions += `### Step 2: Dependencies\n`
    instructions += `Make sure these packages are installed:\n`
    instructions += `\`\`\`bash\nnpm install react react-dom\nnpm install -D tailwindcss @types/react @types/react-dom\n\`\`\`\n\n`

    if (hasFetch) {
      instructions += `### Step 3: API Integration Setup\n`
      instructions += `For components with API integration, you'll need to configure environment variables in your Vercel Project Settings:\n\n`
      instructions += `**Required Environment Variables:**\n`
      instructions += `- Your API key environment variable\n`
      instructions += `- Your secret key (server-side only)\n`
      instructions += `- Base URL for your API\n\n`
      instructions += `**CORS Configuration:**\n`
      instructions += `If calling external APIs from the browser, ensure CORS is properly configured on the API server.\n\n`
    }

    instructions += `*🤖 Generated by AI Component Generator with Origin UI • ${new Date().toLocaleDateString()} • Ready for production use*`

    setInstructions(instructions)
  }

  // Download component as file
  const downloadComponent = () => {
    const componentName = extractComponentName(generatedCode)
    const filename = `${componentName.replace(/[^a-zA-Z0-9]/g, "")}.tsx`

    const fileContent = `// ${componentName} Component
// Generated by AI Component Generator
// Built with Origin UI and Tailwind CSS

import React from 'react'

${generatedCode.replace(/window\.default\s*=\s*\w+;?\s*$/g, "").trim()}

export default ${componentName}
`

    const blob = new Blob([fileContent], { type: "text/typescript" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Show success feedback
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    setIsLoading(true)
    setError(null)

    // Store the current user request for contextual analysis
    setCurrentUserRequest(input.trim())

    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newMessage])
    setInput("")

    // Check for URLs in the message
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const urls = input.match(urlRegex) || []

    let documentationContext = null

    // Step 1: If URLs detected, scrape and analyze documentation first
    if (urls.length > 0) {
      try {
        console.log("📚 Analyzing documentation from URLs:", urls)

        // Scrape documentation
        const scrapeResponse = await fetch("/api/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls }),
        })

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json()
          console.log("📄 Documentation scraped successfully")

          // AI analysis of scraped documentation for context understanding
          const analysisResult = await analyzeDocumentationContext(scrapeData.results || scrapeData, input.trim())
          documentationContext = {
            scrapedData: scrapeData,
            analysis: analysisResult,
            urls: urls,
            summary: analysisResult, // This will be used for component generation
          }
          console.log("🤖 Documentation analyzed for context")
        } else {
          console.warn("⚠️ Documentation scraping failed, proceeding without context")
        }
      } catch (docError) {
        console.warn("⚠️ Documentation analysis failed:", docError)
      }
    }

    // Add a generating status message with URL detection info
    const statusMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content:
        urls.length > 0
          ? `🌐 Detected ${urls.length} URL(s) - Analyzing API documentation...\n📚 Scraping: ${urls.join(", ")}\n${documentationContext ? "✅ Documentation analyzed successfully" : "⚠️ Using basic analysis"}\n🎨 Generating your component with ${documentationContext ? "API integration context" : "standard features"}...`
          : "🎨 Generating your component...",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, statusMessage])

    try {
      // Step 2: Generate component with documentation context
      const componentPrompt = documentationContext
        ? `${input}\n\nDOCUMENTATION CONTEXT FOR INTEGRATION:\n${JSON.stringify(documentationContext.summary, null, 2)}\n\nUse this context to create relevant API integrations, proper authentication, and realistic data handling in the component.`
        : input

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { ...newMessage, content: componentPrompt }],
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      // Read the entire stream as component code
      const decoder = new TextDecoder()
      let fullCode = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullCode += chunk
      }

      // Clean up the code and set it directly
      let cleanCode = fullCode.trim()

      // Remove any markdown code blocks if present
      cleanCode = cleanCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, "")
      cleanCode = cleanCode.replace(/```/g, "")

      // Add window.default export if not present
      if (!cleanCode.includes("window.default")) {
        // Try to detect component name
        const functionMatch = cleanCode.match(/function\s+(\w+)/)
        const componentName = functionMatch ? functionMatch[1] : "Component"
        cleanCode += `\n\n// Export as default for the preview\nwindow.default = ${componentName};`
      }

      // Set the generated code directly to preview
      setGeneratedCode(cleanCode)

      // Step 3: Generate contextual instructions based on documentation context
      await generateInstructions(cleanCode, input.trim(), documentationContext)

      // Check if documentation was analyzed and add results to success message
      let successContent = "✅ Component generated successfully! Check the preview →"

      if (documentationResults) {
        // Filter out font files from the count
        const realEndpoints =
          documentationResults.apiEndpoints?.filter(
            (endpoint: string) =>
              !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i) &&
              !endpoint.includes("font") &&
              (endpoint.includes("/api/") ||
                endpoint.includes("GET") ||
                endpoint.includes("POST") ||
                endpoint.includes("PUT") ||
                endpoint.includes("DELETE") ||
                endpoint.includes("/webhook")),
          ) || []

        successContent += `\n\n📚 **API Documentation Analyzed:**\n`
        if (realEndpoints.length > 0) {
          successContent += `• Found ${realEndpoints.length} real API endpoints\n`
        } else {
          successContent += `• Documentation analyzed (general API info)\n`
        }

        if (documentationResults.authMethod) {
          successContent += `• Authentication: ${documentationResults.authMethod}\n`
        }
        if (documentationResults.rateLimit) {
          successContent += `• Rate Limits: ${documentationResults.rateLimit}\n`
        }
        if (documentationResults.baseUrl) {
          successContent += `• Base URL: ${documentationResults.baseUrl}\n`
        }
      }

      // Update status message to success
      const successMessage: Message = {
        id: statusMessage.id,
        role: "assistant",
        content: successContent,
        timestamp: new Date(),
      }

      setMessages((prev) => prev.map((msg) => (msg.id === statusMessage.id ? successMessage : msg)))

      // Auto-switch to preview tab
      setSelectedTab("preview")
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")

      // Update status message to error
      const errorMessage: Message = {
        id: statusMessage.id,
        role: "assistant",
        content: "❌ Error generating component. Please try again.",
        timestamp: new Date(),
      }

      setMessages((prev) => prev.map((msg) => (msg.id === statusMessage.id ? errorMessage : msg)))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header/Navbar */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">AI Component Generator</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landing">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
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

      {/* Main Content - Split Screen with rounded corners */}
      <div className="flex-1 flex bg-background p-4 gap-4 overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-1/2 flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Chat Header */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-lg text-foreground">AI Assistant</h1>
                <p className="text-sm text-muted-foreground">Component Generator with Gemini 2.0</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted/50 text-muted-foreground rounded-bl-md"
                    }`}
                  >
                    {message.role === "assistant" && message.content.includes("📚 **API Documentation Analyzed:**") ? (
                      <div className="text-sm leading-relaxed">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">{children}</strong>
                            ),
                            ul: ({ children }) => <ul className="ml-4 space-y-1">{children}</ul>,
                            li: ({ children }) => <li className="text-sm">{children}</li>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border-t border-destructive/20">
              <p className="text-sm text-destructive">Error: {error}</p>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the component you want to create..."
                className="flex-1 rounded-xl border-border/50 bg-background/50 px-4 py-3 focus:ring-2 focus:ring-primary/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !input?.trim()}
                title={!input?.trim() ? "Type a message first" : "Send message"}
                className="rounded-xl px-6 py-3 shadow-sm"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Preview Header */}
          <div className="p-6 border-b border-border bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg text-foreground">Component Preview</h2>
                <p className="text-sm text-muted-foreground">Live preview and code editor</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4 pb-0 flex-shrink-0">
              <TabsList className="grid w-full grid-cols-3 rounded-xl">
                <TabsTrigger value="preview" className="flex items-center gap-2 rounded-lg">
                  <Eye className="w-4 h-4" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code" className="flex items-center gap-2 rounded-lg">
                  <Code className="w-4 h-4" />
                  Code
                </TabsTrigger>
                <TabsTrigger value="instructions" className="flex items-center gap-2 rounded-lg">
                  <FileText className="w-4 h-4" />
                  Instructions
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="preview" className="flex-1 p-6 pt-4 overflow-hidden">
              <Card className="h-full rounded-xl border-border/50 overflow-hidden shadow-sm">
                <SandboxedPreview code={generatedCode} />
              </Card>
            </TabsContent>

          <TabsContent value="code" className="flex-1 p-6 pt-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Component Code</h3>
              <div className="flex items-center gap-2">
                {downloadSuccess && <span className="text-sm text-green-600 dark:text-green-400">Downloaded!</span>}
                <Button
                  onClick={downloadComponent}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent rounded-lg"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden rounded-xl border-border/50 shadow-sm">
              <div className="h-full overflow-y-auto scrollbar-hide">
                <CodeMirror
                  value={generatedCode}
                  onChange={(value) => setGeneratedCode(value)}
                  extensions={[javascript({ jsx: true }), EditorView.lineWrapping]}
                  theme={theme === "dark" ? oneDark : undefined}
                  className="h-full"
                />
              </div>
            </Card>
          </TabsContent>

            <TabsContent value="instructions" className="flex-1 p-6 pt-4 overflow-hidden">
              <Card className="h-full overflow-hidden rounded-xl border-border/50 shadow-sm">
                <div className="h-full overflow-y-auto scrollbar-hide p-6">
                  <div className="prose prose-sm max-w-none text-foreground leading-relaxed">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-foreground mb-4 mt-0 border-b border-border pb-2">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 first:mt-0">{children}</h2>
                        ),
                        p: ({ children }) => <p className="text-foreground mb-4 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="list-none space-y-2 mb-4 pl-0">{children}</ul>,
                        li: ({ children }) => (
                          <li className="flex items-start gap-2 text-foreground">
                            <span className="text-primary mt-1 text-sm">•</span>
                            <span className="flex-1">{children}</span>
                          </li>
                        ),
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        code: ({ children, className }) => {
                          const isInline = !className
                          return isInline ? (
                            <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border">
                              {children}
                            </code>
                          ) : (
                            <code className={className}>{children}</code>
                          )
                        },
                        pre: ({ children, ...props }) => {
                          const child = children as any
                          const codeContent = String(child?.props?.children || "").replace(/\n$/, "")

                          return (
                            <div className="mb-4 mt-2">
                              <pre
                                className={`overflow-x-auto p-4 rounded-lg text-sm font-mono leading-relaxed ${
                                  theme === "dark"
                                    ? "bg-muted text-muted-foreground border border-border"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                                {...props}
                              >
                                <code>{codeContent}</code>
                              </pre>
                            </div>
                          )
                        },
                      }}
                    >
                      {instructions}
                    </ReactMarkdown>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
