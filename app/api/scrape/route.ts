import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    console.log(`Scraping URL: ${url}`)

    // Simple fetch-based scraping (works for most documentation sites)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
      }, { status: 400 })
    }

    const html = await response.text()
    
    // Extract main content using simple text parsing
    // Remove script and style tags, extract meaningful content
    const cleanContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)</i)
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname

    // Limit content length to avoid token limits
    const maxLength = 8000 // Reasonable limit for API documentation
    const content = cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + '...'
      : cleanContent

    // Try to extract API-related information
    const apiEndpoints = extractAPIEndpoints(html)
    const codeExamples = extractCodeExamples(html)

    return NextResponse.json({
      url,
      title,
      content,
      apiEndpoints,
      codeExamples,
      wordCount: content.split(' ').length,
      scrapedAt: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Scraping error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ 
      error: `Scraping failed: ${errorMessage}` 
    }, { status: 500 })
  }
}

function extractAPIEndpoints(html: string): string[] {
  const endpoints: string[] = []
  
  // Look for common API endpoint patterns
  const patterns = [
    /(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w\-\{\}]+)/gi,
    /(?:api|endpoint).*?(\/[\w\-\/\{\}]+)/gi,
    /https?:\/\/[^\s"']+\/api[^\s"']*/gi,
  ]

  patterns.forEach(pattern => {
    const matches = html.match(pattern)
    if (matches) {
      endpoints.push(...matches.slice(0, 10)) // Limit to 10 matches per pattern
    }
  })

  return [...new Set(endpoints)].slice(0, 20) // Remove duplicates and limit to 20
}

function extractCodeExamples(html: string): string[] {
  const examples: string[] = []
  
  // Look for code blocks
  const codePatterns = [
    /<code[^>]*>(.*?)<\/code>/gi,
    /<pre[^>]*>(.*?)<\/pre>/gi,
    /```[\s\S]*?```/g,
  ]

  codePatterns.forEach(pattern => {
    const matches = html.match(pattern)
    if (matches) {
      examples.push(...matches.slice(0, 5)) // Limit to 5 matches per pattern
    }
  })

  return examples.slice(0, 10) // Limit to 10 total examples
}
