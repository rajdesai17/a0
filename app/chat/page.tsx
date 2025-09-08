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

  // Extract component name from code
  const extractComponentName = (code: string): string => {
    const functionMatch = code.match(/function\s+(\w+)/)
    const constMatch = code.match(/const\s+(\w+)\s*=/)
    return functionMatch?.[1] || constMatch?.[1] || "Component"
  }

  // State for documentation results
  const [documentationResults, setDocumentationResults] = useState<any>(null)
  const [instructions, setInstructions] = useState<string>("")

  // Enhanced component instructions with AI-powered contextual analysis
  const generateInstructions = async (code: string): Promise<void> => {
    const componentName = extractComponentName(code)
    const hasState = code.includes("useState")
    const hasProps = code.includes("props") || code.includes(": {") || code.includes("interface")
    const hasInteractivity = code.includes("onClick") || code.includes("onSubmit") || code.includes("onChange")
    const hasFetch = code.includes("fetch(") || code.includes("fetch ")
    const hasAPI = code.includes("/api/") || code.includes("http")

    // Extract component props and their types for detailed documentation
    const extractComponentProps = (code: string) => {
      const props: Array<{name: string, type: string, optional: boolean, description: string}> = []
      
      // Look for interface definitions
      const interfaceMatch = code.match(/interface\s+\w+Props\s*\{([^}]+)\}/)
      if (interfaceMatch) {
        const interfaceContent = interfaceMatch[1]
        const propMatches = interfaceContent.match(/(\w+)(\?)?\s*:\s*([^;\n]+)/g)
        if (propMatches) {
          propMatches.forEach(match => {
            const matchResult = match.match(/(\w+)(\?)?\s*:\s*(.+)/)
            if (matchResult) {
              const [, propName, optional, propType] = matchResult
              if (propName && propType) {
                props.push({
                  name: propName,
                  type: propType.trim(),
                  optional: !!optional,
                  description: `${propName} property of type ${propType.trim()}`
                })
              }
            }
          })
        }
      }
      
      // Look for destructured props in function parameters
      const destructuredMatch = code.match(/\(\s*\{\s*([^}]+)\s*\}[^)]*\)/)
      if (destructuredMatch && !interfaceMatch) {
        const destructuredProps = destructuredMatch[1].split(',').map(p => p.trim())
        destructuredProps.forEach(prop => {
          const [name, defaultValue] = prop.split('=').map(p => p.trim())
          if (name && !props.some(p => p.name === name)) {
            props.push({
              name: name,
              type: defaultValue ? 'string | undefined' : 'any',
              optional: !!defaultValue,
              description: `${name} property${defaultValue ? ` (default: ${defaultValue})` : ''}`
            })
          }
        })
      }
      
      return props
    }

    // AI-powered contextual analysis of documentation
    const analyzeDocumentationContext = async (documentationResults: any, userRequest: string) => {
      if (!documentationResults?.results?.length) return null

      try {
        const docContent = documentationResults.results.map((result: any) => ({
          url: result.url,
          title: result.title,
          content: result.content?.substring(0, 2000), // Limit content for analysis
          endpoints: result.apiEndpoints || [],
          analysis: result.analysis
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

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: analysisPrompt }],
            analysis: true // Flag to indicate this is for analysis
          })
        })

        if (response.ok) {
          const analysisData = await response.text()
          return analysisData
        }
      } catch (error) {
        console.error('Failed to analyze documentation:', error)
      }
      return null
    }

    let instructions = `# ${componentName} Component\n\n`
    
    // Check for documentation results and perform AI-powered contextual analysis
    let docInfo = ""
    let contextualAnalysis = null
    let apiEndpointsDetails: Array<{domain: string, endpoints: string[], analysis: any}> = []
    
    try {
      const docResponse = await fetch('/api/documentation')
      const docData = await docResponse.json()
      if (docData.hasDocumentation && docData.results) {
        setDocumentationResults(docData.results)
        
        // Get the user's original request to provide contextual analysis
        const userRequest = currentUserRequest || (messages.length > 0 ? messages[messages.length - 1]?.content || '' : '')
        
        // Use AI to analyze documentation in context of user's request
        if (userRequest && hasFetch) {
          contextualAnalysis = await analyzeDocumentationContext(docData.results, userRequest)
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
                if (endpoint.includes('font') || endpoint.includes('static')) return false
                
                // Accept endpoints that look like API routes
                const lowerEndpoint = endpoint.toLowerCase()
                return (
                  // Common API patterns
                  lowerEndpoint.includes('/api/') ||
                  lowerEndpoint.includes('/webhook') ||
                  lowerEndpoint.includes('endpoint') ||
                  lowerEndpoint.startsWith('http') ||
                  // HTTP method patterns (like "post /checkouts", "get /payments")
                  lowerEndpoint.match(/^(get|post|put|delete|patch)\s+\//) ||
                  // Path patterns that look like API endpoints
                  lowerEndpoint.match(/^\/[a-z-_]+/) ||
                  // Any path with parameters
                  lowerEndpoint.includes('{') || lowerEndpoint.includes(':id') || lowerEndpoint.includes('/:')
                )
              })
              
              if (realEndpoints.length > 0) {
                docInfo += `**API Endpoints Found:** ${realEndpoints.length} real endpoints\n`
                docInfo += `\`\`\`\n${realEndpoints.slice(0, 8).join('\n')}\n\`\`\`\n`
                apiEndpointsDetails.push({
                  domain: domain,
                  endpoints: realEndpoints,
                  analysis: result.analysis
                })
              } else {
                docInfo += `**Documentation Type:** General API documentation without specific endpoint URLs\n`
              }
            } else {
              docInfo += `**Documentation Type:** Conceptual API documentation\n`
            }
            
            if (result.analysis) {
              if (result.analysis.authMethods && result.analysis.authMethods.length > 0) {
                docInfo += `**🔐 Authentication:** ${result.analysis.authMethods.join(', ')}\n`
              }
              if (result.analysis.commonPatterns && result.analysis.commonPatterns.length > 0) {
                docInfo += `**📋 Integration Patterns:** ${result.analysis.commonPatterns.join(', ')}\n`
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
      console.log('No documentation data available')
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
      componentProps.forEach(prop => {
        instructions += `| \`${prop.name}\` | \`${prop.type}\` | ${prop.optional ? 'No' : 'Yes'} | ${prop.description} |\n`
      })
      instructions += `\n### Props Usage Examples\n\n`
      instructions += `\`\`\`jsx\n// Basic usage without props\n<${componentName} />\n\n`
      if (componentProps.length > 0) {
        instructions += `// Advanced usage with props\n<${componentName}\n`
        componentProps.slice(0, 3).forEach(prop => {
          const sampleValue = prop.type.includes('string') ? `"sample value"` : 
                             prop.type.includes('number') ? `{123}` :
                             prop.type.includes('boolean') ? `{true}` : `{{}}`
          instructions += `  ${prop.name}=${sampleValue}  // ${prop.description}\n`
        })
        instructions += `/>\n`
      }
      instructions += `\`\`\`\n\n`
    }

    instructions += `## Basic Usage\n\`\`\`jsx\nimport ${componentName} from './${componentName}'\n\nfunction App() {\n  return (\n    <div className="p-4">\n      <${componentName}${componentProps.length > 0 ? ' />' : ' />'}\n    </div>\n  )\n}\n\`\`\`\n\n`

    instructions += `\n## 🛠️ Installation & Setup\n`
    instructions += `### Step 1: Component Installation\n`
    instructions += `1. Copy the component code to your project (recommended: \`components/${componentName}.tsx\`)\n`
    instructions += `2. Ensure you have the required dependencies installed\n\n`
    
    instructions += `### Step 2: Dependencies\n`
    instructions += `Make sure these packages are installed:\n`
    instructions += `\`\`\`bash\nnpm install react react-dom\nnpm install -D tailwindcss @types/react @types/react-dom\n\`\`\`\n\n`
    
    instructions += `### Step 3: Tailwind CSS Configuration\n`
    instructions += `Ensure Tailwind CSS is configured with Origin UI colors in your \`tailwind.config.js\`:\n`
    instructions += `\`\`\`javascript\nmodule.exports = {\n  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}"],\n  theme: {\n    extend: {\n      colors: {\n        // Origin UI color tokens (required for proper styling)\n        border: "hsl(var(--border))",\n        background: "hsl(var(--background))",\n        foreground: "hsl(var(--foreground))",\n        primary: {\n          DEFAULT: "hsl(var(--primary))",\n          foreground: "hsl(var(--primary-foreground))",\n        },\n        // ... other Origin UI colors\n      }\n    }\n  },\n  plugins: [],\n}\n\`\`\`\n\n`
    if (hasFetch) {
      instructions += `### Step 4: API Integration Setup\n`
      instructions += `For components with API integration, additional setup is required:\n\n`
      instructions += `**Environment Variables (\`.env.local\`):**\n`
      instructions += `\`\`\`bash\n# Add your API credentials\nNEXT_PUBLIC_API_KEY=your_api_key_here\nAPI_SECRET=your_secret_key\nAPI_BASE_URL=https://api.example.com\n\`\`\`\n\n`
      instructions += `**CORS Configuration:**\n`
      instructions += `If calling external APIs from the browser, ensure CORS is properly configured on the API server.\n\n`
    } else {
      instructions += `### Step 4: Import and Use\n`
      instructions += `Import and use the component in your React application.\n\n`
    }

    // Enhanced API Integration Guide - only show detailed version if no AI analysis
    if (apiEndpointsDetails.length > 0 && !contextualAnalysis) {
      instructions += `## 🌐 Comprehensive API Integration Guide\n\n`
      instructions += `This component integrates with **${apiEndpointsDetails.length} API source(s)**. Here's your complete, beginner-friendly guide:\n\n`
      
      apiEndpointsDetails.forEach((apiDetail, index) => {
        instructions += `### ${index + 1}. ${apiDetail.domain} API Integration\n\n`
        
        if (apiDetail.analysis?.authMethods && apiDetail.analysis.authMethods.length > 0) {
          instructions += `**🔐 Authentication Required:** ${apiDetail.analysis.authMethods.join(', ')}\n\n`
          
          // Provide specific auth examples
          if (apiDetail.analysis.authMethods.includes('Bearer Token') || apiDetail.analysis.authMethods.includes('API Key')) {
            instructions += `**Authentication Setup Examples:**\n`
            instructions += `\`\`\`javascript\n// Method 1: Using Authorization header\nconst headers = {\n  'Authorization': 'Bearer YOUR_TOKEN_HERE',\n  'Content-Type': 'application/json'\n}\n\n// Method 2: Using API key in header\nconst headers = {\n  'X-API-Key': 'YOUR_API_KEY_HERE',\n  'Content-Type': 'application/json'\n}\n\n// Usage in fetch\nconst response = await fetch('https://${apiDetail.domain}/api/endpoint', {\n  method: 'GET',\n  headers: headers\n})\n\`\`\`\n\n`
          }
        }
        
        if (apiDetail.endpoints.length > 0) {
          instructions += `**🔗 Available API Endpoints (${apiDetail.endpoints.length} found):**\n\n`
          
          apiDetail.endpoints.slice(0, 5).forEach((endpoint: string, idx: number) => {
            // Determine HTTP method from endpoint string
            const method = endpoint.includes('GET') ? 'GET' : 
                          endpoint.includes('POST') ? 'POST' : 
                          endpoint.includes('PUT') ? 'PUT' : 
                          endpoint.includes('DELETE') ? 'DELETE' : 'GET'
            
            const cleanEndpoint = endpoint.replace(/(GET|POST|PUT|DELETE)\s+/i, '').trim()
            const fullUrl = cleanEndpoint.startsWith('http') ? cleanEndpoint : `https://${apiDetail.domain}${cleanEndpoint}`
            
            instructions += `#### Endpoint ${idx + 1}: ${method} ${cleanEndpoint}\n\n`
            instructions += `**Quick Copy-Paste Example:**\n`
            instructions += `\`\`\`javascript\n// ${method} ${cleanEndpoint}\nconst ${method.toLowerCase()}Data = async () => {\n  try {\n    const response = await fetch('${fullUrl}', {\n      method: '${method}',\n      headers: {\n        'Content-Type': 'application/json',\n        'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY,\n        // Add other required headers here\n      }${method === 'POST' || method === 'PUT' ? ',\n      body: JSON.stringify({\n        // Add your request payload here\n        // Example: { name: "value", id: 123 }\n      })' : ''}\n    })\n    \n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`)\n    }\n    \n    const data = await response.json()\n    return data\n  } catch (error) {\n    console.error('API Error:', error)\n    throw error\n  }\n}\n\`\`\`\n\n`
            
            // Add React hook usage example
            instructions += `**React Hook Integration:**\n`
            instructions += `\`\`\`jsx\nimport { useState, useEffect } from 'react'\n\nconst MyComponent = () => {\n  const [data, setData] = useState(null)\n  const [loading, setLoading] = useState(false)\n  const [error, setError] = useState(null)\n\n  const fetchData = async () => {\n    setLoading(true)\n    setError(null)\n    try {\n      const result = await ${method.toLowerCase()}Data()\n      setData(result)\n    } catch (err) {\n      setError(err.message)\n    } finally {\n      setLoading(false)\n    }\n  }\n\n  useEffect(() => {\n    fetchData() // Fetch on component mount\n  }, [])\n\n  if (loading) return <div>Loading...</div>\n  if (error) return <div>Error: {error}</div>\n  if (!data) return <div>No data</div>\n\n  return (\n    <div>\n      {/* Render your data here */}\n      <pre>{JSON.stringify(data, null, 2)}</pre>\n    </div>\n  )\n}\n\`\`\`\n\n`
          })
        }
        
        if (apiDetail.analysis?.commonPatterns && apiDetail.analysis.commonPatterns.length > 0) {
          instructions += `**📋 Integration Patterns Found:** ${apiDetail.analysis.commonPatterns.join(', ')}\n\n`
        }
        
        if (apiDetail.analysis?.rateLimit) {
          instructions += `**⚡ Rate Limits:** ${apiDetail.analysis.rateLimit}\n\n`
          instructions += `**Rate Limiting Best Practice:**\n`
          instructions += `\`\`\`javascript\n// Simple rate limiting with delays\nconst delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))\n\nconst rateLimitedFetch = async (url, options) => {\n  await delay(100) // 100ms delay between requests\n  return fetch(url, options)\n}\n\`\`\`\n\n`
        }
        
        if (apiDetail.analysis?.integrationNotes) {
          instructions += `**💡 Integration Notes:** ${apiDetail.analysis.integrationNotes}\n\n`
        }
        
        instructions += `---\n\n`
      })
      
      instructions += `### 🚀 Quick Start Checklist for API Integration\n\n`
      instructions += `Follow this step-by-step checklist to get your API integration working:\n\n`
      instructions += `- [ ] **Step 1:** Sign up for API access at the provider's website\n`
      instructions += `- [ ] **Step 2:** Generate API keys/tokens from your dashboard\n`
      instructions += `- [ ] **Step 3:** Add API credentials to your \`.env.local\` file\n`
      instructions += `- [ ] **Step 4:** Install any required packages (\`npm install\`)\n`
      instructions += `- [ ] **Step 5:** Test endpoints in development environment\n`
      instructions += `- [ ] **Step 6:** Configure CORS settings (if calling from browser)\n`
      instructions += `- [ ] **Step 7:** Implement proper error handling\n`
      instructions += `- [ ] **Step 8:** Add loading states for better UX\n`
      instructions += `- [ ] **Step 9:** Test in production environment\n\n`
      
      instructions += `### 🔧 Development vs Production Configuration\n\n`
      instructions += `**Development Environment:**\n`
      instructions += `\`\`\`javascript\n// .env.local (for development)\nNEXT_PUBLIC_API_BASE_URL=https://dev-api.${apiEndpointsDetails[0]?.domain || 'example.com'}\nNEXT_PUBLIC_API_KEY=dev_key_here\n\n// In your component\nconst API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL\nconst API_KEY = process.env.NEXT_PUBLIC_API_KEY\n\`\`\`\n\n`
      instructions += `**Production Environment:**\n`
      instructions += `\`\`\`javascript\n// .env.production (for production)\nNEXT_PUBLIC_API_BASE_URL=https://api.${apiEndpointsDetails[0]?.domain || 'example.com'}\nNEXT_PUBLIC_API_KEY=prod_key_here\n\n// Same component code works in both environments!\n\`\`\`\n\n`
      
    } else if (hasFetch && !contextualAnalysis) {
      instructions += `## 🔗 API Integration Guide\n\n`
      instructions += `This component includes API integration capabilities. Here's what you need to know:\n\n`
      instructions += `### Basic Setup Requirements\n`
      instructions += `1. **Endpoint Access:** Ensure API endpoints are accessible from your domain\n`
      instructions += `2. **CORS Configuration:** Configure proper CORS settings for external APIs\n`
      instructions += `3. **Authentication:** Add authentication headers if required\n`
      instructions += `4. **Error Handling:** Implement retry strategies and proper error handling\n\n`
      
      instructions += `### Basic API Integration Example\n`
      instructions += `\`\`\`javascript\n// Complete API integration example\nconst [data, setData] = useState(null)\nconst [loading, setLoading] = useState(false)\nconst [error, setError] = useState(null)\n\nconst fetchData = async () => {\n  setLoading(true)\n  setError(null)\n  \n  try {\n    const response = await fetch('/api/your-endpoint', {\n      method: 'GET',\n      headers: {\n        'Content-Type': 'application/json',\n        'Authorization': 'Bearer ' + process.env.NEXT_PUBLIC_API_KEY\n      }\n    })\n    \n    if (!response.ok) {\n      throw new Error(\`HTTP error! status: \${response.status}\`)\n    }\n    \n    const result = await response.json()\n    setData(result)\n  } catch (error) {\n    console.error('Fetch error:', error)\n    setError(error.message)\n  } finally {\n    setLoading(false)\n  }\n}\n\n// Use in component\nuseEffect(() => {\n  fetchData()\n}, [])\n\`\`\`\n\n`
      
      instructions += `### Environment Variables Setup\n`
      instructions += `\`\`\`bash\n# .env.local\nNEXT_PUBLIC_API_URL=https://api.example.com\nNEXT_PUBLIC_API_KEY=your_api_key_here\n\`\`\`\n\n`
    }

    instructions += `## 🎯 Customization Guide\n\n`
    instructions += `### Styling Customization\n`
    instructions += `The component uses Tailwind CSS classes. Here's how to customize:\n\n`
    instructions += `\`\`\`jsx\n// Change colors (example modifications)\n<div className="bg-blue-500 text-white"> // Instead of default bg-background\n<div className="border-red-500"> // Instead of default border\n<div className="text-green-600"> // Instead of default text color\n\n// Modify spacing\n<div className="p-8 m-4"> // Instead of default padding/margin\n<div className="space-y-6"> // Increase/decrease spacing between elements\n\n// Adjust borders and shadows\n<div className="border-2 shadow-lg rounded-xl"> // Custom borders and shadows\n<div className="ring-2 ring-blue-500"> // Add focus rings\n\`\`\`\n\n`
    
    if (componentProps.length > 0) {
      instructions += `### Props Customization\n`
      instructions += `Use component props to customize behavior and appearance:\n\n`
      instructions += `\`\`\`jsx\n<${componentName}\n`
      componentProps.forEach((prop: {name: string, type: string, optional: boolean, description: string}) => {
        const sampleValue = prop.type.includes('string') ? `"your custom value"` : 
                           prop.type.includes('number') ? `{42}` :
                           prop.type.includes('boolean') ? `{true}` : `{{}}`
        instructions += `  ${prop.name}=${sampleValue}  // ${prop.description}\n`
      })
      instructions += `/>\n\`\`\`\n\n`
    }

    instructions += `### Advanced Customization\n`
    instructions += `\`\`\`jsx\n// Override component styles with custom CSS classes\n<${componentName} className="your-custom-class" />\n\n// Add custom CSS variables for dynamic theming\n<div style={{\n  '--custom-primary': '#your-color',\n  '--custom-radius': '8px'\n}}>\n  <${componentName} />\n</div>\n\`\`\`\n\n`

    instructions += `## 🐛 Troubleshooting Guide\n\n`
    instructions += `### Common Issues & Solutions\n\n`
    instructions += `**1. 🎨 Styling not appearing correctly:**\n`
    instructions += `- ✅ Ensure Tailwind CSS is properly installed and configured\n`
    instructions += `- ✅ Check that your build process includes the component files\n`
    instructions += `- ✅ Verify Origin UI colors are defined in your \`tailwind.config.js\`\n`
    instructions += `- ✅ Make sure CSS is being loaded in your app\n\n`
    
    if (hasFetch) {
      instructions += `**2. 🌐 API calls failing:**\n`
      instructions += `- ✅ Verify API endpoint URLs are correct and accessible\n`
      instructions += `- ✅ Check authentication tokens/headers are properly set\n`
      instructions += `- ✅ Ensure CORS is properly configured on the API server\n`
      instructions += `- ✅ Check network requests in browser DevTools (Network tab)\n`
      instructions += `- ✅ Verify environment variables are loaded correctly\n\n`
      
      instructions += `**3. 🚫 CORS errors in browser:**\n`
      instructions += `- ✅ Add proper CORS headers on your API server\n`
      instructions += `- ✅ Use a proxy during development (e.g., Next.js API routes)\n`
      instructions += `- ✅ Consider using server-side rendering for API calls\n`
      instructions += `- ✅ Check if API supports JSONP as an alternative\n\n`
      
      instructions += `**4. 🔑 Authentication issues:**\n`
      instructions += `- ✅ Verify API keys are correctly added to environment variables\n`
      instructions += `- ✅ Check token expiration and refresh mechanisms\n`
      instructions += `- ✅ Ensure proper header format (Bearer, API-Key, etc.)\n`
      instructions += `- ✅ Test authentication with API documentation examples\n\n`
    }
    
    if (hasProps) {
      instructions += `**${hasFetch ? '5' : '2'}. ⚙️ Props not working:**\n`
      instructions += `- ✅ Check prop names match exactly (JavaScript is case-sensitive)\n`
      instructions += `- ✅ Verify prop types match component expectations\n`
      instructions += `- ✅ Ensure required props are provided\n`
      instructions += `- ✅ Check for typos in prop names\n\n`
    }

    instructions += `**${hasFetch ? (hasProps ? '6' : '5') : (hasProps ? '3' : '2')}. 📱 Component not rendering:**\n`
    instructions += `- ✅ Check browser console for JavaScript errors\n`
    instructions += `- ✅ Verify all required imports are present\n`
    instructions += `- ✅ Ensure React and ReactDOM are properly installed\n`
    instructions += `- ✅ Check if component is properly exported/imported\n\n`

    instructions += `### Debug Tools & Tips\n\n`
    instructions += `**Console Debugging:**\n`
    instructions += `\`\`\`javascript\n// Add these debug lines to your component\nconsole.log('Component props:', props)\nconsole.log('Component state:', { loading, error, data })\n\n// For API debugging\nfetch('/api/endpoint')\n  .then(res => {\n    console.log('Response status:', res.status)\n    console.log('Response headers:', res.headers)\n    return res.json()\n  })\n  .then(data => console.log('Response data:', data))\n  .catch(err => console.error('API Error:', err))\n\`\`\`\n\n`

    instructions += `**Browser DevTools Tips:**\n`
    instructions += `1. 🔍 **Network Tab**: Check API requests and responses\n`
    instructions += `2. 🎯 **Console Tab**: Look for JavaScript errors and debug logs\n`
    instructions += `3. 🎨 **Elements Tab**: Inspect CSS styles and HTML structure\n`
    instructions += `4. ⚛️ **React DevTools**: Inspect component props and state (if installed)\n\n`

    instructions += `**Environment Variable Debugging:**\n`
    instructions += `\`\`\`javascript\n// Check if environment variables are loaded\nconsole.log('API Key:', process.env.NEXT_PUBLIC_API_KEY ? 'Loaded' : 'Missing')\nconsole.log('API URL:', process.env.NEXT_PUBLIC_API_URL)\n\n// In Next.js, only NEXT_PUBLIC_ variables work in browser\n// Server-side variables work in API routes and server components\n\`\`\`\n\n`

    instructions += `## 📚 Additional Resources\n\n`
    instructions += `### Documentation & Learning\n`
    instructions += `- 🎨 [Origin UI Documentation](https://originui.com/docs) - Component library docs\n`
    instructions += `- 🎯 [Tailwind CSS Documentation](https://tailwindcss.com/docs) - CSS framework reference\n`
    instructions += `- ⚛️ [React Documentation](https://react.dev) - React framework guide\n`
    if (hasFetch) {
      instructions += `- 🌐 [Fetch API Reference](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) - Web API docs\n`
      instructions += `- 🔧 [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) - Server-side API handling\n`
    }
    if (hasState) {
      instructions += `- 🪝 [React Hooks](https://react.dev/reference/react) - useState, useEffect, and more\n`
    }
    instructions += `\n### Community & Support\n`
    instructions += `- 💬 [Origin UI Discord](https://discord.gg/originui) - Community support\n`
    instructions += `- 🐛 [Report Issues](https://github.com/originui/ui/issues) - Bug reports and feature requests\n`
    instructions += `- 📖 [Tailwind CSS Community](https://github.com/tailwindcss/tailwindcss/discussions) - CSS questions\n`

    instructions += `\n---\n\n`
    instructions += `## 🎉 Success! You're All Set\n\n`
    instructions += `You now have everything needed to use this component:\n`
    instructions += `- ✅ Complete component code\n`
    instructions += `- ✅ Detailed installation instructions\n`
    if (componentProps.length > 0) {
      instructions += `- ✅ Props documentation with examples\n`
    }
    if (apiEndpointsDetails.length > 0) {
      instructions += `- ✅ API integration guide with working examples\n`
    }
    instructions += `- ✅ Customization options and styling guide\n`
    instructions += `- ✅ Troubleshooting guide and debug tools\n`
    instructions += `- ✅ Additional resources for continued learning\n\n`

    instructions += `*🤖 Generated by AI Component Generator with ${apiEndpointsDetails.length > 0 ? 'API Documentation Intelligence' : 'Origin UI'} • ${new Date().toLocaleDateString()} • Ready for production use*`

    setInstructions(instructions)
  }

  // Regenerate instructions when code or user request changes
  useEffect(() => {
    if (generatedCode) {
      generateInstructions(generatedCode)
    }
  }, [generatedCode, currentUserRequest])

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
