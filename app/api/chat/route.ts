import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    console.log('Received messages:', messages) // Debug log

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

    const result = await streamText({
      model: google("gemini-2.0-flash-exp"),
      messages: aiMessages,
      system: `You are an expert React component generator. When users describe a component they want, you should:

1. Generate clean, modern React components using TypeScript
2. Use Tailwind CSS for styling with a focus on clean, minimal design
3. Include interactive functionality when appropriate (useState, event handlers)
4. Use semantic HTML and proper accessibility attributes
5. Follow React best practices and hooks patterns
6. Make components responsive and theme-aware (support dark/light mode)
7. Include proper TypeScript types

IMPORTANT CODE FORMAT REQUIREMENTS:
- Always wrap your code in triple backticks with jsx/tsx language identifier
- Create a single functional component
- Use only function declarations (not const/arrow functions)
- The component name should be descriptive (e.g., PricingCard, LoginForm, etc.)
- Do NOT include import statements (React is available globally)
- Do NOT include export statements (this will be added automatically)

Example format:
\`\`\`jsx
function PricingCard() {
  return (
    <div className="...">
      {/* Your component JSX */}
    </div>
  )
}
\`\`\`

Always respond with:
1. A brief explanation of what you're creating
2. The complete React component code in the format above`,
    })

    console.log('Stream created successfully') // Debug log
    return result.toTextStreamResponse()
    
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Error: ${errorMessage}`, { status: 500 })
  }
}
