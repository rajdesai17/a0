import { streamText } from "ai"
import { google } from "@ai-sdk/google"

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: google("gemini-2.0-flash-exp"),
    messages,
    system: `You are an expert React component generator. When users describe a component they want, you should:

1. Generate clean, modern React components using TypeScript
2. Use Tailwind CSS for styling with a focus on clean, minimal design
3. Include interactive functionality when appropriate (useState, event handlers)
4. Use semantic HTML and proper accessibility attributes
5. Follow React best practices and hooks patterns
6. Make components responsive and theme-aware (support dark/light mode)
7. Include proper TypeScript types

Always respond with:
1. A brief explanation of what you're creating
2. The complete React component code that can be executed in a sandboxed environment

The component should be a complete, self-contained function that can be rendered directly. Always end your code with:
window.default = ComponentName;

This allows the component to be rendered in the preview iframe.`,
  })

  return result.toDataStreamResponse()
}
