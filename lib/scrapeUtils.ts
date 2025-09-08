// Shared scraping utilities that can be used by both API route and browse tool
export async function scrapeUrl(url: string) {
  console.log('Scraping URL:', url)

  // Validate URL
  try {
    new URL(url)
  } catch (error) {
    throw new Error('Invalid URL format')
  }

  // Create AbortController for timeout
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      signal: controller.signal,
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : new URL(url).hostname

    // Remove HTML tags and extract clean text content
    const cleanContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
      .replace(/<[^>]+>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Extract API endpoints (common patterns)
    const apiEndpoints: string[] = []
    const endpointPatterns = [
      /\/api\/[^\s\)">]+/gi,
      /(GET|POST|PUT|DELETE|PATCH)\s+\/[^\s\)">]+/gi,
      /https?:\/\/[^\s\/]+\/api\/[^\s\)">]+/gi,
      // More specific patterns for actual API endpoints
      /\/webhooks?\/[^\s\)">]+/gi,
      /\/graphql[^\s\)">]*/gi,
    ]

    endpointPatterns.forEach(pattern => {
      const matches = html.match(pattern) || []
      apiEndpoints.push(...matches)
    })

    // Remove duplicates and filter out non-API resources
    const uniqueEndpoints = [...new Set(apiEndpoints)]
      .filter(endpoint => endpoint.length < 100) // Filter out overly long matches
      .filter(endpoint => !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i)) // Exclude static assets
      .filter(endpoint => !endpoint.includes('font')) // Exclude font-related paths
      .slice(0, 20) // Limit to 20 endpoints

    // Extract code examples (basic detection)
    const codeExamples: string[] = []
    const codePatterns = [
      /<code[^>]*>([^<]+)<\/code>/gi,
      /<pre[^>]*>([^<]+)<\/pre>/gi,
      /```[^`]*```/gi,
    ]

    codePatterns.forEach(pattern => {
      const matches = html.match(pattern) || []
      codeExamples.push(...matches.slice(0, 5))
    })

    return {
      url,
      title,
      content: cleanContent,
      apiEndpoints: uniqueEndpoints,
      codeExamples,
      wordCount: cleanContent.split(' ').length,
    }

  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - URL took too long to respond')
      }
      throw new Error(`Scraping failed: ${error.message}`)
    }
    
    throw new Error('Unknown scraping error occurred')
  }
}
