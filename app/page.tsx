"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Code, Eye, Sparkles } from "lucide-react"
import CodeMirror from "@uiw/react-codemirror"
import { javascript } from "@codemirror/lang-javascript"
import { oneDark } from "@codemirror/theme-one-dark"
import { EditorView } from "@codemirror/view"
import { useTheme } from "next-themes"
import { SandboxedPreview } from "@/components/sandboxed-preview"
import { useChat } from "@ai-sdk/react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function SplitScreenChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Extract code from the AI response - fix for AI SDK v5
      const textContent = (message as any).content || '';
      const codeMatch = textContent.match(/```(?:tsx?|javascript|jsx)?\n([\s\S]*?)\n```/)
      if (codeMatch) {
        setGeneratedCode(codeMatch[1])
      }
    },
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })

  // Debug logging
  console.log("Input value:", input)
  console.log("Input length:", input?.length)
  console.log("Button disabled:", isLoading || !input?.trim())

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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col border-r border-border">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-foreground">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Component Generator with Gemini 2.0</p>
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {/* AI SDK v5 compatible content extraction */}
                    {(message as any).content || 
                     (message as any).parts?.map((part: any) => 
                       part.type === 'text' ? part.text : ''
                     ).join('') || 
                     'Loading...'}
                  </p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date().toLocaleTimeString()}
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
            <p className="text-sm text-destructive">Error: {error.message}</p>
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
        <Tabs defaultValue="preview" className="flex-1 flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="preview" className="flex-1 p-4">
            <SandboxedPreview code={generatedCode} />
          </TabsContent>

          <TabsContent value="code" className="flex-1 p-4">
            <Card className="h-full overflow-hidden">
              {mounted && (
                <CodeMirror
                  value={generatedCode}
                  height="calc(100vh - 200px)"
                  extensions={[
                    javascript({ jsx: true, typescript: true }),
                    EditorView.theme({
                      "&": {
                        fontSize: "14px",
                        fontFamily:
                          "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
                      },
                      ".cm-content": {
                        padding: "16px",
                        minHeight: "100%",
                      },
                      ".cm-focused": {
                        outline: "none",
                      },
                      ".cm-editor": {
                        height: "100%",
                      },
                      ".cm-scroller": {
                        height: "100%",
                      },
                      ".cm-gutters": {
                        backgroundColor: theme === "dark" ? "hsl(var(--muted))" : "hsl(var(--muted))",
                        borderRight: "1px solid hsl(var(--border))",
                      },
                    }),
                  ]}
                  theme={theme === "dark" ? oneDark : "light"}
                  editable={false}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: false,
                    allowMultipleSelections: false,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightSelectionMatches: false,
                    searchKeymap: true,
                  }}
                />
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
