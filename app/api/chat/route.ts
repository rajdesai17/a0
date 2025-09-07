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
      system: `You are a React component generator. When a user requests a component, respond ONLY with clean, executable React component code.

CRITICAL REQUIREMENTS:
1. Respond with ONLY the React component code - no explanations, no markdown, no text before or after
2. Use function declarations: function ComponentName() { }
3. Use Tailwind CSS for all styling
4. Component must be complete and functional
5. No import statements needed (React is available globally)
6. Always end your response with: window.default = ComponentName;

EXAMPLE OUTPUT (this is exactly how you should respond):
function PricingCard() {
  const tiers = [
    { name: "Basic", price: "$9", features: ["Feature 1", "Feature 2"] },
    { name: "Pro", price: "$19", features: ["Feature 1", "Feature 2", "Feature 3"] }
  ];

  return (
    <div className="flex gap-4 p-8">
      {tiers.map((tier, index) => (
        <div key={index} className="border rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
          <p className="text-2xl text-blue-600 mb-4">{tier.price}</p>
          <ul>
            {tier.features.map((feature, i) => (
              <li key={i} className="mb-1">{feature}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

window.default = PricingCard;

Remember: Only return the component code exactly like above, nothing else!`,
    })

    console.log('Stream created successfully') // Debug log
    return result.toTextStreamResponse()
    
  } catch (error) {
    console.error('API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(`Error: ${errorMessage}`, { status: 500 })
  }
}
