import { streamText } from "ai"
import { google } from "@ai-sdk/google"
import { browseTool } from "@/lib/tools/browseTool"

// Handle analysis requests for contextual documentation analysis
async function handleAnalysisRequest(messages: any[]) {
  try {
    const analysisPrompt = messages[0]?.content || ''
    
    const result = await streamText({
      model: google("gemini-2.5-flash"),
      messages: [
        {
          role: "system",
          content: `You are an expert API integration assistant. Analyze the provided API documentation and user request to generate focused, practical integration instructions.

Your response should be structured markdown that includes:

1. **RELEVANT ENDPOINTS** - Only list the 3-5 most relevant endpoints for the user's specific use case
2. **QUICK START** - Step-by-step instructions specific to their request  
3. **CODE EXAMPLES** - Working code examples for the most important endpoints
4. **AUTHENTICATION** - What auth is needed (if any) with examples
5. **KEY CONCEPTS** - Important concepts they need to understand
6. **IMPORTANT CONSIDERATIONS** - Things to watch out for

Focus on being concise and practical. Don't repeat endpoint information - only show what they actually need for their specific use case.`
        },
        {
          role: "user", 
          content: analysisPrompt
        }
      ]
    })

    let analysisResult = ''
    for await (const textPart of result.textStream) {
      analysisResult += textPart
    }

    return new Response(analysisResult, {
      headers: { 'Content-Type': 'text/plain' }
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return new Response('Analysis failed', { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { messages, analysis } = await req.json()
    console.log('Received messages:', messages) // Debug log

    // Handle analysis requests differently
    if (analysis) {
      console.log('Analysis request detected')
      return await handleAnalysisRequest(messages)
    }

    // Transform messages to the format expected by the AI SDK
    const aiMessages = messages
      .filter((message: any) => message.content && message.content.trim().length > 0)
      .map((message: any) => ({
        role: message.role,
        content: message.content,
      }))

    console.log('Transformed messages:', aiMessages) // Debug log

    if (aiMessages.length === 0) {
      return new Response('No valid messages provided', { status: 400 })
    }

    // Check for URLs in the latest user message
    const latestMessage = aiMessages[aiMessages.length - 1]
    const urlRegex = /(https?:\/\/[^\s]+)/gi
    const urls = latestMessage.content.match(urlRegex) || []
    
    let documentationContext = ''
    let browsingResults = null

    // If URLs are detected, use browse tool to analyze them
    if (urls.length > 0 && latestMessage.role === 'user') {
      console.log('URLs detected:', urls)
      try {
        const browsingResult = await browseTool({ urls })
        if (browsingResult.success) {
          documentationContext = browsingResult.documentationContext
          browsingResults = browsingResult // Store for instructions generation
          console.log('Successfully browsed URLs, context length:', documentationContext.length)
          
          // Store results for the instructions tab
          await fetch(`${process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''}/api/documentation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls, results: browsingResult })
          }).catch(err => console.log('Failed to store doc results:', err))
          
        } else {
          console.log('Browsing failed')
        }
      } catch (error) {
        console.error('Error browsing URLs:', error)
      }
    }

    // Enhanced system prompt with documentation awareness
    const systemPrompt = documentationContext 
      ? `You are a React component generator specialized in creating beautiful components using Origin UI design patterns and Tailwind CSS.

📚 **DOCUMENTATION CONTEXT:**
The user has provided URLs for API documentation. Use this context to create components that integrate with these APIs:

${documentationContext}

**Integration Requirements:**
- Create components that work with the analyzed APIs
- Include proper TypeScript interfaces based on API responses
- Add error handling for API calls
- Include loading states and proper UX
- Use the API endpoints and patterns identified in the documentation
- Follow the authentication methods described in the docs

CRITICAL REQUIREMENTS:
1. Respond with ONLY the React component code - no explanations, no markdown, no text before or after
2. Use function declarations: function ComponentName() { }
3. Use Origin UI design patterns and Tailwind CSS classes with the Origin UI color palette
4. Component must be complete and functional with proper interactivity (useState, onClick handlers, etc.)
5. No import statements needed (React is available globally)
6. Always end your response with: window.default = ComponentName;
7. **INCLUDE REALISTIC API INTEGRATION** - Use fetch() calls with proper error handling
8. Add proper error handling, loading states, and realistic data structures
9. **ADD COMMENTS** in your code indicating API integration points
10. **NO EXTERNAL ASSETS** - Do not reference external fonts, images, or stylesheets. Use only Tailwind classes and system fonts
11. Use realistic API endpoints and data structures
12. Include form validation and user feedback
13. Create working demo functionality even without real API connections
14. **NO TYPESCRIPT SYNTAX** - Use plain JavaScript, avoid type annotations like interface or type definitions
15. Use catch (error) not catch (e: any) for error handling

ORIGIN UI DESIGN PATTERNS TO USE:
- Colors: Use bg-background, text-foreground, bg-card, text-card-foreground, bg-primary, text-primary-foreground
- Borders: Use border-border, rounded-lg (0.625rem radius)
- Shadows: Use shadow-sm, shadow-md, shadow-lg
- Spacing: Use consistent padding (p-4, p-6, p-8) and gaps (gap-4, gap-6)
- Interactive states: Use hover:bg-accent, hover:text-accent-foreground, focus:ring-2 focus:ring-ring
- Typography: Use font-medium, font-semibold for headings, text-sm, text-base for body
- Buttons: Use bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2
- Cards: Use bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm

EXAMPLE PATTERNS:
- Primary Button: className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
- Card: className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm"
- Input: className="bg-background border border-input px-3 py-2 rounded-md focus:ring-2 focus:ring-ring"
- Badge: className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm font-medium"

COMPONENT EXAMPLES:
For pricing cards, buttons, modals, forms - create modern, clean designs with:
- Proper hover effects and transitions
- Interactive functionality (state management)
- Responsive design (use flex, grid, responsive prefixes)
- Accessibility features (proper ARIA labels, semantic HTML)
- Beautiful spacing and typography
- Origin UI color scheme and styling patterns
- **API Integration** - Real fetch() calls with proper error handling

Remember: Only return the component code with window.default export, nothing else!`
      : `You are a React component generator specialized in creating beautiful components using Origin UI design patterns and Tailwind CSS.

CRITICAL REQUIREMENTS:
1. Respond with ONLY the React component code - no explanations, no markdown, no text before or after
2. Use function declarations: function ComponentName() { }
3. Use Origin UI design patterns and Tailwind CSS classes with the Origin UI color palette
4. Component must be complete and functional with proper interactivity (useState, onClick handlers, etc.)
5. No import statements needed (React is available globally)
6. Always end your response with: window.default = ComponentName;

ORIGIN UI DESIGN PATTERNS TO USE:
- Colors: Use bg-background, text-foreground, bg-card, text-card-foreground, bg-primary, text-primary-foreground
- Borders: Use border-border, rounded-lg (0.625rem radius)
- Shadows: Use shadow-sm, shadow-md, shadow-lg
- Spacing: Use consistent padding (p-4, p-6, p-8) and gaps (gap-4, gap-6)
- Interactive states: Use hover:bg-accent, hover:text-accent-foreground, focus:ring-2 focus:ring-ring
- Typography: Use font-medium, font-semibold for headings, text-sm, text-base for body
- Buttons: Use bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2
- Cards: Use bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm

EXAMPLE PATTERNS:
- Primary Button: className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors"
- Card: className="bg-card text-card-foreground border border-border rounded-lg p-6 shadow-sm"
- Input: className="bg-background border border-input px-3 py-2 rounded-md focus:ring-2 focus:ring-ring"
- Badge: className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm font-medium"

COMPONENT EXAMPLES:
For pricing cards, buttons, modals, forms - create modern, clean designs with:
- Proper hover effects and transitions
- Interactive functionality (state management)
- Responsive design (use flex, grid, responsive prefixes)
- Accessibility features (proper ARIA labels, semantic HTML)
- Beautiful spacing and typography
- Origin UI color scheme and styling patterns

Remember: Only return the component code with window.default export, nothing else!`

    const result = await streamText({
      model: google("gemini-2.5-flash"),
      messages: aiMessages,
      system: systemPrompt,
    })

    console.log('Stream created successfully') // Debug log
    return result.toTextStreamResponse()
    
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Error: ${errorMessage}`, { status: 500 })
  }
}
