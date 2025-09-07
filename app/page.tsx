"use client"
import { useState } from "react"
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

  // Function to extract and update code from AI response
  const tryExtractCode = (content: string) => {
    // Try multiple regex patterns to catch different code block formats
    const patterns = [
      /```(?:tsx?|typescript|javascript|jsx)?\n([\s\S]*?)\n```/,
      /```\n([\s\S]*?)\n```/,
      /```([\s\S]*?)```/
    ]
    
    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        let extractedCode = match[1].trim()
        console.log('Raw extracted code:', extractedCode) // Debug log
        
        // Only update if we have meaningful code (not just comments or imports)
        if (extractedCode.includes('function') || extractedCode.includes('const') || extractedCode.includes('return')) {
          
          // Ensure the code has proper React imports and export
          let finalCode = extractedCode
          
          // Add React imports if not present
          if (!finalCode.includes('import React') && !finalCode.includes('from "react"')) {
            // For UMD React (browser), we don't need imports
            finalCode = finalCode
          }
          
          // Extract component name from the code
          let componentName = 'GeneratedComponent'
          const functionMatch = finalCode.match(/function\s+(\w+)/)
          const constMatch = finalCode.match(/const\s+(\w+)\s*=/)
          
          if (functionMatch) {
            componentName = functionMatch[1]
          } else if (constMatch) {
            componentName = constMatch[1]
          }
          
          // Ensure proper export
          if (!finalCode.includes('window.default')) {
            finalCode += `\n\n// Export as default for the preview\nwindow.default = ${componentName};`
          }
          
          console.log('Final processed code:', finalCode) // Debug log
          console.log('Component name:', componentName) // Debug log
          
          setGeneratedCode(finalCode)
          break
        }
      }
    }
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

      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMessage])

      // Read the stream
      const decoder = new TextDecoder()
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            console.log('Received line:', line) // Debug log
            
            // Handle different streaming formats
            if (line.startsWith('0:')) {
              // AI SDK v5 text stream format
              const data = line.slice(2)
              if (data) {
                assistantMessage.content += data
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id ? { ...assistantMessage } : msg
                  )
                )
                
                // Try to extract code in real-time
                tryExtractCode(assistantMessage.content)
              }
            } else if (line.startsWith('data: ')) {
              // SSE format
              const data = line.slice(6)
              if (data !== '[DONE]') {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.content) {
                    assistantMessage.content += parsed.content
                    setMessages(prev => 
                      prev.map(msg => 
                        msg.id === assistantMessage.id ? { ...assistantMessage } : msg
                      )
                    )
                    
                    // Try to extract code in real-time
                    tryExtractCode(assistantMessage.content)
                  }
                } catch (e) {
                  console.error("Error parsing SSE data:", e)
                }
              }
            } else {
              // Try as plain text
              assistantMessage.content += line
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessage.id ? { ...assistantMessage } : msg
                )
              )
              
              // Try to extract code in real-time
              tryExtractCode(assistantMessage.content)
            }
          }
        }
      }

      // Final code extraction attempt
      console.log('Final content:', assistantMessage.content) // Debug log
      tryExtractCode(assistantMessage.content)

    } catch (err) {
      console.error("Chat error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
  }

  return (
    <div className="h-screen flex bg-background">
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-4 pb-0">
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

          <TabsContent value="preview" className="flex-1 p-4 pt-2">
            <SandboxedPreview code={generatedCode} />
          </TabsContent>

          <TabsContent value="code" className="flex-1 p-4 pt-2">
            <Card className="h-full overflow-hidden">
              <CodeMirror
                value={generatedCode}
                onChange={(value) => setGeneratedCode(value)}
                extensions={[javascript({ jsx: true }), EditorView.lineWrapping]}
                theme={theme === "dark" ? oneDark : undefined}
                className="h-full"
              />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
