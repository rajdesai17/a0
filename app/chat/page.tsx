"use client"
import { useState, useEffect } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Code, Eye, Sparkles, Download, FileText, ArrowLeft } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "next-themes"
import { SandboxedPreview } from "@/components/sandboxed-preview"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark as syntaxOneDark, oneLight as syntaxOneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import Link from "next/link"

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

  // Extract component name from code
  const extractComponentName = (code: string): string => {
    const functionMatch = code.match(/function\s+(\w+)/)
    const constMatch = code.match(/const\s+(\w+)\s*=/)
    return functionMatch?.[1] || constMatch?.[1] || "Component"
  }

  // State for documentation results
  const [documentationResults, setDocumentationResults] = useState<any>(null)
  const [instructions, setInstructions] = useState<string>("")

  // Generate component instructions with API documentation details
  const generateInstructions = async (code: string): Promise<void> => {
    const componentName = extractComponentName(code)
    const hasState = code.includes("useState")
    const hasProps = code.includes("props") || code.includes(": {") || code.includes("interface")
    const hasInteractivity = code.includes("onClick") || code.includes("onSubmit") || code.includes("onChange")
    const hasFetch = code.includes("fetch(") || code.includes("fetch ")
    const hasAPI = code.includes("/api/") || code.includes("http")

    let instructions = `# ${componentName} Component\n\n`
    
    // Check for documentation results
    let docInfo = ""
    try {
      const docResponse = await fetch('/api/documentation')
      const docData = await docResponse.json()
      if (docData.hasDocumentation && docData.results) {
        setDocumentationResults(docData.results)
        const results = docData.results.results?.filter((r: any) => r.success) || []
        
        if (results.length > 0) {
          docInfo = `\n## 📚 API Documentation Analysis\n\n`
          docInfo += `**URLs Analyzed:** ${results.length}\n\n`
          
          results.forEach((result: any, index: number) => {
            const domain = new URL(result.url).hostname
            docInfo += `### ${index + 1}. ${result.title || domain}\n`
            docInfo += `**URL:** [${result.url}](${result.url})\n`
            docInfo += `**Content:** ${result.wordCount || 0} words analyzed\n`
            
            if (result.apiEndpoints && result.apiEndpoints.length > 0) {
              // Filter out font files and static assets from endpoints
              const realEndpoints = result.apiEndpoints.filter((endpoint: string) => 
                !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i) &&
                !endpoint.includes('font') &&
                (endpoint.includes('/api/') || endpoint.includes('GET') || endpoint.includes('POST') || 
                 endpoint.includes('PUT') || endpoint.includes('DELETE') || endpoint.includes('/webhook'))
              )
              
              if (realEndpoints.length > 0) {
                docInfo += `**Real API Endpoints Found:** ${realEndpoints.length}\n`
                docInfo += `\`\`\`\n${realEndpoints.slice(0, 5).join('\n')}\n\`\`\`\n`
              } else {
                docInfo += `**API Documentation Found:** General API documentation without specific endpoints listed\n`
              }
            } else {
              docInfo += `**Documentation Type:** General API documentation\n`
            }
            
            if (result.analysis) {
              if (result.analysis.authMethods && result.analysis.authMethods.length > 0) {
                docInfo += `**Authentication:** ${result.analysis.authMethods.join(', ')}\n`
              }
              if (result.analysis.commonPatterns && result.analysis.commonPatterns.length > 0) {
                docInfo += `**Integration Patterns:** ${result.analysis.commonPatterns.join(', ')}\n`
              }
              if (result.analysis.integrationNotes) {
                docInfo += `**Notes:** ${result.analysis.integrationNotes}\n`
              }
            }
            docInfo += `\n`
          })
        }
      }
    } catch (error) {
      console.log('No documentation data available')
    }

    instructions += `## Overview\n`
    if (hasFetch && hasAPI) {
      instructions += `A React functional component with **API integration** built using Origin UI design patterns and Tailwind CSS. This component includes real API calls and data handling.\n\n`
    } else {
      instructions += `A React functional component built with Origin UI design patterns and Tailwind CSS.\n\n`
    }

    instructions += docInfo

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

    instructions += `\n## Installation\n`
    instructions += `1. Copy the component code to your project\n`
    instructions += `2. Ensure Tailwind CSS is configured with Origin UI colors\n`
    if (hasFetch) {
      instructions += `3. Configure any required API keys or endpoints\n`
      instructions += `4. Handle CORS settings if needed for API calls\n`
      instructions += `5. Import and use in your React application\n\n`
    } else {
      instructions += `3. Import and use in your React application\n\n`
    }

    if (hasFetch && documentationResults) {
      instructions += `## API Integration Guide\n`
      instructions += `This component integrates with the APIs you provided. Here's what you need to know:\n\n`
      
      const results = documentationResults.results?.filter((r: any) => r.success) || []
      results.forEach((result: any, index: number) => {
        const domain = new URL(result.url).hostname
        instructions += `### ${domain} Integration\n`
        
        if (result.analysis?.authMethods && result.analysis.authMethods.length > 0) {
          instructions += `**Authentication Required:** ${result.analysis.authMethods.join(', ')}\n`
        }
        
        if (result.analysis?.baseUrl) {
          instructions += `**Base URL:** \`${result.analysis.baseUrl}\`\n`
        }
        
        // Filter real endpoints
        const realEndpoints = result.apiEndpoints?.filter((endpoint: string) => 
          !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i) &&
          !endpoint.includes('font') &&
          (endpoint.includes('/api/') || endpoint.includes('GET') || endpoint.includes('POST'))
        ) || []
        
        if (realEndpoints.length > 0) {
          instructions += `**Key Endpoints:**\n`
          realEndpoints.slice(0, 3).forEach((endpoint: string) => {
            instructions += `- \`${endpoint}\`\n`
          })
        }
        
        if (result.analysis?.rateLimit) {
          instructions += `**Rate Limits:** ${result.analysis.rateLimit}\n`
        }
        
        instructions += `\n`
      })
      
      instructions += `**Setup Steps:**\n`
      instructions += `1. Sign up for API access at the provider's website\n`
      instructions += `2. Get your API keys/tokens\n`
      instructions += `3. Configure environment variables for API credentials\n`
      instructions += `4. Test the endpoints in your development environment\n`
      instructions += `5. Handle CORS if calling from browser\n\n`
    } else if (hasFetch) {
      instructions += `## API Integration Notes\n`
      instructions += `This component includes API integration. Please note:\n`
      instructions += `- Ensure API endpoints are accessible from your domain\n`
      instructions += `- Configure proper CORS settings if calling external APIs\n`
      instructions += `- Add authentication headers if required by the API\n`
      instructions += `- Consider rate limiting and error retry strategies\n\n`
    }

    instructions += `---\n*Generated by AI Component Generator with ${docInfo ? 'API Documentation Intelligence' : 'Origin UI'}*`

    setInstructions(instructions)
  }

  // Regenerate instructions when code changes
  useEffect(() => {
    generateInstructions(generatedCode)
  }, [generatedCode])

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
    
    // Add a generating status message with URL detection info
    const statusMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: urls.length > 0 
        ? `🌐 Detected ${urls.length} URL(s) - Analyzing API documentation...\n📚 Scraping: ${urls.join(', ')}\n🎨 Generating your component with API integration...`
        : "🎨 Generating your component...",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, statusMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, newMessage],
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

      // Check if documentation was analyzed and add results to success message
      let successContent = "✅ Component generated successfully! Check the preview →"
      
      if (documentationResults) {
        // Filter out font files from the count
        const realEndpoints = documentationResults.apiEndpoints?.filter((endpoint: string) => 
          !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i) &&
          !endpoint.includes('font') &&
          (endpoint.includes('/api/') || endpoint.includes('GET') || endpoint.includes('POST') || 
           endpoint.includes('PUT') || endpoint.includes('DELETE') || endpoint.includes('/webhook'))
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
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col border-r border-border">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/landing">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <div>
                <h1 className="font-semibold text-foreground">AI Assistant</h1>
                <p className="text-sm text-muted-foreground">Component Generator with Gemini 2.0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {message.role === "assistant" && message.content.includes("📚 **API Documentation Analyzed:**") ? (
                    <div className="text-sm leading-relaxed">
                      <ReactMarkdown 
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
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
        <div className="p-4 border-t border-border">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe the component you want to create..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={isLoading || !input?.trim()}
              title={!input?.trim() ? "Type a message first" : "Send message"}
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-1/2 flex flex-col">
        {/* Preview Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-foreground">Component Preview</h2>
              <p className="text-sm text-muted-foreground">Live preview and code editor</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-4 pb-0 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Instructions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 p-4 pt-2 overflow-hidden">
            <SandboxedPreview code={generatedCode} />
          </TabsContent>

          <TabsContent value="code" className="flex-1 p-4 pt-2 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-muted-foreground">Component Code</h3>
              <div className="flex items-center gap-2">
                {downloadSuccess && <span className="text-sm text-green-600 dark:text-green-400">Downloaded!</span>}
                <Button
                  onClick={downloadComponent}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
              </div>
            </div>
            <Card className="flex-1 overflow-hidden">
              <CodeMirror
                value={generatedCode}
                onChange={(value) => setGeneratedCode(value)}
                extensions={[javascript({ jsx: true }), EditorView.lineWrapping]}
                theme={theme === "dark" ? oneDark : undefined}
                className="h-full"
              />
            </Card>
          </TabsContent>

          <TabsContent value="instructions" className="flex-1 p-4 pt-2 overflow-hidden">
            <Card className="h-full overflow-hidden">
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
                        const className = child?.props?.className || ""
                        const match = /language-(\w+)/.exec(className)
                        const language = match ? match[1] : "javascript"

                        return (
                          <div className="mb-4 mt-2">
                            <SyntaxHighlighter
                              style={theme === "dark" ? syntaxOneDark : syntaxOneLight}
                              language={language}
                              customStyle={{
                                margin: 0,
                                borderRadius: "0.5rem",
                                backgroundColor: theme === "dark" ? "hsl(var(--muted))" : "hsl(var(--muted))",
                                border: "1px solid hsl(var(--border))",
                                fontSize: "0.875rem",
                                lineHeight: "1.5",
                              }}
                              {...props}
                            >
                              {String(child?.props?.children || "").replace(/\n$/, "")}
                            </SyntaxHighlighter>
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
  )
}
