// Enhanced scraping utilities that can be used by both API route and browse tool
import FirecrawlApp from '@mendable/firecrawl-js'

// Initialize Firecrawl client if API key is available
const firecrawlClient = process.env.FIRECRAWL_API_KEY 
  ? new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })
  : null

export interface ScrapeResult {
  url: string
  title: string
  content: string
  apiEndpoints: string[]
  codeExamples: string[]
  wordCount: number
  scrapedWith: 'firecrawl-crawl' | 'firecrawl' | 'fetch'
  pages?: number // Number of pages crawled (for crawl results)
}

// Enhanced crawl function that can crawl entire documentation sites
export async function crawlUrl(url: string, options: {
  limit?: number,
  includePaths?: string[],
  excludePaths?: string[],
  maxDepth?: number
} = {}): Promise<ScrapeResult> {
  console.log('Starting crawl for URL:', url)

  // Validate URL
  try {
    new URL(url)
  } catch (error) {
    throw new Error('Invalid URL format')
  }

  // Try Firecrawl crawl if available
  if (firecrawlClient) {
    try {
      console.log('Attempting Firecrawl crawl for:', url)
      
      // Start the crawl using the correct SDK method
      const crawlResponse = await firecrawlClient.crawl(url, {
        limit: options.limit || 50,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
        },
        includePaths: options.includePaths,
        excludePaths: options.excludePaths,
        maxDiscoveryDepth: options.maxDepth || 3,
      })

      if (crawlResponse && crawlResponse.data) {
        console.log(`Firecrawl crawl successful - found ${crawlResponse.data.length} pages`)
        
        // Combine all pages content
        const allContent = crawlResponse.data
          .map((page: any) => page.markdown || page.content || '')
          .join('\n\n---\n\n')
        
        const allTitles = crawlResponse.data
          .map((page: any) => page.metadata?.title)
          .filter(Boolean)
        
        const mainTitle = allTitles[0] || new URL(url).hostname
        
        // Extract API endpoints from all content
        const apiEndpoints = extractApiEndpoints(allContent)
        
        // Extract code examples from all content
        const codeExamples = extractCodeExamples(allContent)

        return {
          url,
          title: `${mainTitle} (${crawlResponse.data.length} pages)`,
          content: allContent.trim(),
          apiEndpoints,
          codeExamples,
          wordCount: allContent.split(' ').length,
          scrapedWith: 'firecrawl-crawl',
          pages: crawlResponse.data.length
        }
      }
    } catch (error) {
      console.warn('Firecrawl crawl failed, falling back to single page scrape:', error)
      // Continue to fallback method
    }
  }

  // Fallback to single page scrape
  console.log('Using single page scrape as fallback for:', url)
  return await scrapeUrl(url)
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  console.log('Scraping URL:', url)

  // Validate URL
  try {
    new URL(url)
  } catch (error) {
    throw new Error('Invalid URL format')
  }

  // Try Firecrawl first if available
  if (firecrawlClient) {
    try {
      console.log('Attempting Firecrawl scraping for:', url)
      const result = await firecrawlClient.scrape(url, {
        formats: ['markdown'],
        onlyMainContent: true,
      })

      if (result) {
        console.log('Firecrawl scraping successful')
        
        // Extract content and metadata - Firecrawl returns direct properties
        const content = (result as any).markdown || (result as any).content || ''
        const title = (result as any).metadata?.title || new URL(url).hostname
        
        // Extract API endpoints from the scraped content
        const apiEndpoints = extractApiEndpoints(content)
        
        // Extract code examples
        const codeExamples = extractCodeExamples(content)

        return {
          url,
          title: title.trim(),
          content: content.trim(),
          apiEndpoints,
          codeExamples,
          wordCount: content.split(' ').length,
          scrapedWith: 'firecrawl'
        }
      }
    } catch (error) {
      console.warn('Firecrawl scraping failed, falling back to fetch:', error)
      // Continue to fallback method
    }
  }

  // Fallback to original fetch-based scraping
  console.log('Using fallback fetch scraping for:', url)
  return await fallbackScrapeUrl(url)
}

// Extract API endpoints from content
function extractApiEndpoints(content: string): string[] {
  const apiEndpoints: string[] = []
  const endpointPatterns = [
    /\/api\/[^\s\)">]+/gi,
    /(GET|POST|PUT|DELETE|PATCH)\s+\/[^\s\)">]+/gi,
    /https?:\/\/[^\s\/]+\/api\/[^\s\)">]+/gi,
    /\/webhooks?\/[^\s\)">]+/gi,
    /\/graphql[^\s\)">]*/gi,
  ]

  endpointPatterns.forEach(pattern => {
    const matches = content.match(pattern) || []
    apiEndpoints.push(...matches)
  })

  // Remove duplicates and filter
  return [...new Set(apiEndpoints)]
    .filter(endpoint => endpoint.length < 100)
    .filter(endpoint => !endpoint.match(/\.(woff2?|ttf|eot|css|js|png|jpg|jpeg|gif|svg|ico)(\?|$)/i))
    .filter(endpoint => !endpoint.includes('font'))
    .slice(0, 20)
}

// Extract code examples from content
function extractCodeExamples(content: string): string[] {
  const codeExamples: string[] = []
  const codePatterns = [
    /```[\s\S]*?```/gi,
    /`[^`]+`/gi,
  ]

  codePatterns.forEach(pattern => {
    const matches = content.match(pattern) || []
    codeExamples.push(...matches.slice(0, 5))
  })

  return codeExamples
}

// Original fetch-based scraping as fallback
async function fallbackScrapeUrl(url: string): Promise<ScrapeResult> {

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
      scrapedWith: 'fetch'
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

// Smart scraping function that chooses between crawl and scrape based on URL
export async function smartScrapeUrl(url: string): Promise<ScrapeResult> {
  console.log('Smart scraping URL:', url)

  // Check if this looks like a documentation site that would benefit from crawling
  const shouldCrawl = isDocumentationSite(url)
  
  if (shouldCrawl && firecrawlClient) {
    console.log('URL appears to be documentation - attempting crawl')
    try {
      // Use targeted crawl options for documentation
      const crawlOptions = getDocumentationCrawlOptions(url)
      return await crawlUrl(url, crawlOptions)
    } catch (error) {
      console.warn('Crawl failed, falling back to single page scrape:', error)
    }
  }

  // Use regular scrape for single pages or when crawl is not available
  return await scrapeUrl(url)
}

// Detect if URL is likely a documentation site
function isDocumentationSite(url: string): boolean {
  const urlLower = url.toLowerCase()
  
  const docIndicators = [
    'docs.',
    '/docs/',
    '/documentation/',
    '/api/',
    '/reference/',
    '/guide/',
    '/tutorial/',
    'developer.',
    '/dev/',
    '/sdk/',
    'readme',
    '/help/',
    '/support/',
    'gitbook.io',
    'notion.so',
    'readme.io'
  ]
  
  return docIndicators.some(indicator => urlLower.includes(indicator))
}

// Get optimized crawl options for documentation sites
function getDocumentationCrawlOptions(url: string): {
  limit?: number,
  includePaths?: string[],
  excludePaths?: string[],
  maxDepth?: number
} {
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  
  // Common documentation exclude patterns
  const commonExcludes = [
    'blog/*',
    'changelog/*',
    'news/*',
    '*/download/*',
    '*/downloads/*',
    '*/.git/*',
    '*/node_modules/*'
  ]
  
  // If we're already in a docs section, stay there
  let includePaths: string[] | undefined
  if (pathname.includes('/docs/')) {
    includePaths = ['/docs/*']
  } else if (pathname.includes('/api/')) {
    includePaths = ['/api/*', '/docs/*']
  } else if (pathname.includes('/reference/')) {
    includePaths = ['/reference/*', '/docs/*']
  }
  
  return {
    limit: 30, // Reasonable limit for documentation
    includePaths,
    excludePaths: commonExcludes,
    maxDepth: 3
  }
}
