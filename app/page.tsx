"use client"
import { useState } from "react"
import { Button } from "@/components/origin-ui/button"
import { Input } from "@/components/origin-ui/input"
import { Card } from "@/components/origin-ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/origin-ui/tabs"
import { ScrollArea } from "@/components/origin-ui/scroll-area"
import { Send, Code, Eye, Sparkles, Download, FileText } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "next-themes"
import { SandboxedPreview } from "@/components/sandboxed-preview"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark as syntaxOneDark, oneLight as syntaxOneLight } from "react-syntax-highlighter/dist/esm/styles/prism"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function SplitScreenChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  
  const [generatedCode, setGeneratedCode] = useState(`function WelcomeComponent() {
  return (
    <div className="p-6 max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Welcome Component
      </h2>
      <p className="text-gray-600 dark:text-gray-300">
        This is an example component that will be replaced with AI-generated code.
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
    return functionMatch?.[1] || constMatch?.[1] || 'Component'
  }

  // Generate component instructions
  const generateInstructions = (code: string): string => {
    const componentName = extractComponentName(code)
    const hasState = code.includes('useState')
    const hasProps = code.includes('props') || code.includes(': {') || code.includes('interface')
    const hasInteractivity = code.includes('onClick') || code.includes('onSubmit') || code.includes('onChange')
    
    // Extract potential props from the code
    const propsMatches = code.match(/interface\s+\w+Props[^}]*\}|type\s+\w+Props\s*=[^;]*;/)
    const stateMatches = code.match(/useState\s*\([^)]*\)/g)
    const eventMatches = code.match(/on\w+\s*=\s*{[^}]*}/g)

    let instructions = `# ${componentName} Component\n\n`
    instructions += `## Overview\nA React functional component built with Origin UI design patterns and Tailwind CSS.\n\n`
    instructions += `## Usage\n\`\`\`jsx\nimport ${componentName} from './${componentName}'\n\nfunction App() {\n  return <${componentName} />\n}\n\`\`\`\n\n`
    
    instructions += `## Features\n`
    instructions += hasState ? `- ✅ **Interactive State Management**: Uses React useState hooks\n` : `- 📋 **Static Component**: No internal state management\n`
    instructions += hasInteractivity ? `- ✅ **User Interactions**: Includes click handlers and form interactions\n` : `- 📋 **Display Only**: No user interactions\n`
    instructions += hasProps ? `- ✅ **Configurable Props**: Accepts customizable properties\n` : `- 📋 **Self Contained**: No external props required\n`
    instructions += `- 🎨 **Origin UI Styled**: Uses beautiful Origin UI design tokens\n`
    instructions += `- 📱 **Responsive Design**: Mobile-friendly responsive layout\n`
    instructions += `- 🌙 **Theme Support**: Compatible with dark/light modes\n\n`

    if (propsMatches) {
      instructions += `## Props Interface\n\`\`\`typescript\n${propsMatches[0]}\n\`\`\`\n\n`
    } else {
      instructions += `## Props\nThis component does not require any props and can be used directly.\n\n`
    }

    if (stateMatches) {
      instructions += `## State Management\nThis component manages the following state:\n`
      stateMatches.forEach((match, i) => {
        instructions += `- **State ${i + 1}**: \`${match}\`\n`
      })
      instructions += `\n`
    }

    if (eventMatches) {
      instructions += `## Event Handlers\nThe component includes these interactive features:\n`
      eventMatches.forEach((match, i) => {
        instructions += `- **Handler ${i + 1}**: \`${match.split('=')[0].trim()}\`\n`
      })
      instructions += `\n`
    }

    instructions += `## Styling\n`
    instructions += `- Uses **Origin UI** color palette (\`bg-primary\`, \`text-foreground\`, etc.)\n`
    instructions += `- Implements **Tailwind CSS** utility classes\n`
    instructions += `- Follows **responsive design** principles\n`
    instructions += `- Supports **dark/light theme** switching\n\n`

    instructions += `## Dependencies\n`
    instructions += `- React 18+\n`
    instructions += `- Tailwind CSS\n`
    instructions += `- Origin UI design tokens\n\n`

    instructions += `## Customization\n`
    instructions += `You can customize this component by:\n`
    instructions += `1. **Modifying colors**: Update Tailwind color classes\n`
    instructions += `2. **Adjusting spacing**: Change padding/margin classes\n`
    instructions += `3. **Adding props**: Extend component to accept custom properties\n`
    instructions += `4. **State enhancement**: Add more useState hooks for additional functionality\n\n`

    instructions += `## Installation\n`
    instructions += `1. Copy the component code to your project\n`
    instructions += `2. Ensure Tailwind CSS is configured with Origin UI colors\n`
    instructions += `3. Import and use in your React application\n\n`

    instructions += `---\n*Generated by AI Component Generator with Origin UI*`

    return instructions
  }

  // Download component as file
  const downloadComponent = () => {
    const componentName = extractComponentName(generatedCode)
    const filename = `${componentName.replace(/[^a-zA-Z0-9]/g, '')}.tsx`
    
    const fileContent = `// ${componentName} Component
// Generated by AI Component Generator
// Built with Origin UI and Tailwind CSS

import React from 'react'

${generatedCode.replace(/window\.default\s*=\s*\w+;?\s*$/g, '').trim()}

export default ${componentName}
`

    const blob = new Blob([fileContent], { type: 'text/typescript' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
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

    setMessages(prev => [...prev, newMessage])
    setInput("")

    // Add a generating status message
    const statusMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "🎨 Generating your component...",
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, statusMessage])

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
      let fullCode = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        fullCode += chunk
      }

      console.log('Received full code:', fullCode)

      // Clean up the code and set it directly
      let cleanCode = fullCode.trim()
      
      // Remove any markdown code blocks if present
      cleanCode = cleanCode.replace(/```(?:jsx?|tsx?|javascript|typescript)?\n?/g, '')
      cleanCode = cleanCode.replace(/```/g, '')
      
      // Add window.default export if not present
      if (!cleanCode.includes('window.default')) {
        // Try to detect component name
        const functionMatch = cleanCode.match(/function\s+(\w+)/)
        const componentName = functionMatch ? functionMatch[1] : 'Component'
        cleanCode += `\n\n// Export as default for the preview\nwindow.default = ${componentName};`
      }

      console.log('Final processed code:', cleanCode)
      
      // Set the generated code directly to preview
      setGeneratedCode(cleanCode)
      
      // Update status message to success
      const successMessage: Message = {
        id: statusMessage.id,
        role: "assistant",
        content: "✅ Component generated successfully! Check the preview →",
        timestamp: new Date(),
      }
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === statusMessage.id ? successMessage : msg
        )
      )
      
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
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === statusMessage.id ? errorMessage : msg
        )
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col border-r border-border">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="font-semibold text-foreground">AI Assistant</h1>
          </div>
          <p className="text-sm text-muted-foreground">Component Generator with Gemini 2.0</p>
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
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
              onChange={handleInputChange}
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
          <h2 className="font-semibold text-foreground">Component Preview</h2>
          <p className="text-sm text-muted-foreground">Live preview and code editor</p>
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
                {downloadSuccess && (
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Downloaded successfully!
                  </span>
                )}
                <Button
                  onClick={downloadComponent}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
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
                        <h2 className="text-xl font-semibold text-foreground mb-3 mt-6 first:mt-0">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-foreground mb-2 mt-4">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-foreground mb-4 leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-none space-y-2 mb-4 pl-0">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal space-y-2 mb-4 pl-6 marker:text-primary">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2 text-foreground">
                          <span className="text-primary mt-1 text-sm">•</span>
                          <span className="flex-1">{children}</span>
                        </li>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">
                          {children}
                        </strong>
                      ),
                      code: ({ children, className }) => {
                        const isInline = !className;
                        return isInline ? (
                          <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono border">
                            {children}
                          </code>
                        ) : (
                          <code className={className}>{children}</code>
                        );
                      },
                      pre: ({ children, ...props }) => {
                        const child = children as any;
                        const className = child?.props?.className || '';
                        const match = /language-(\w+)/.exec(className);
                        const language = match ? match[1] : 'javascript';
                        
                        return (
                          <div className="mb-4 mt-2">
                            <SyntaxHighlighter
                              style={theme === 'dark' ? syntaxOneDark : syntaxOneLight}
                              language={language}
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                backgroundColor: theme === 'dark' ? 'hsl(var(--muted))' : 'hsl(var(--muted))',
                                border: '1px solid hsl(var(--border))',
                                fontSize: '0.875rem',
                                lineHeight: '1.5',
                              }}
                              {...props}
                            >
                              {String(child?.props?.children || '').replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        );
                      },
                      a: ({ children, href }) => (
                        <a 
                          href={href} 
                          className="text-primary hover:text-primary/80 underline underline-offset-2"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
                      hr: () => (
                        <hr className="my-6 border-border" />
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {generateInstructions(generatedCode)}
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
