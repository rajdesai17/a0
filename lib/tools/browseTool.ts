import { z } from 'zod'
import { smartScrapeUrl, type ScrapeResult } from '@/lib/scrapeUtils'

function analyzeDocumentation(content: string, apiEndpoints: string[] = [], focus?: string): {
  summary: string;
  integrationNotes: string;
  keyEndpoints: string[];
  authMethods: string[];
  codeSnippets: string[];
  commonPatterns: string[];
} {
  const analysis = {
    summary: '',
    integrationNotes: '',
    keyEndpoints: apiEndpoints.slice(0, 5), // Top 5 endpoints
    authMethods: [] as string[],
    codeSnippets: [] as string[],
    commonPatterns: [] as string[],
  }

  // Extract authentication methods
  const authPatterns = [
    /api[_\s]key/i,
    /bearer[_\s]token/i,
    /oauth/i,
    /jwt/i,
    /basic[_\s]auth/i,
    /authentication/i,
  ]

  authPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      analysis.authMethods.push(pattern.source.replace(/[\\\/]/g, ''))
    }
  })

  // Look for common integration patterns
  const patterns = [
    'REST API',
    'GraphQL',
    'WebSocket',
    'Pagination',
    'Rate limiting',
    'Webhooks',
    'SDK',
    'Error handling',
  ]

  patterns.forEach(pattern => {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      analysis.commonPatterns.push(pattern)
    }
  })

  // Extract code snippets (basic detection)
  const codeBlocks = content.match(/```[\s\S]*?```/g) || []
  analysis.codeSnippets = codeBlocks.slice(0, 3).map(block => 
    block.replace(/```/g, '').trim().substring(0, 200)
  )

  // Generate summary based on focus and content
  if (focus) {
    const focusRegex = new RegExp(focus, 'i')
    const relevantSections = content.split('\n')
      .filter(line => focusRegex.test(line))
      .slice(0, 3)
    
    analysis.summary = relevantSections.length > 0
      ? `Found ${relevantSections.length} sections related to "${focus}": ${relevantSections.join('. ')}`
      : `No specific information found for "${focus}". General API documentation available.`
  } else {
    const wordCount = content.split(' ').length
    analysis.summary = `Documentation contains ${wordCount} words with ${apiEndpoints.length} API endpoints. ${analysis.authMethods.length > 0 ? 'Authentication required.' : 'No authentication details found.'}`
  }

  // Generate integration notes
  const hasEndpoints = apiEndpoints.length > 0
  const hasAuth = analysis.authMethods.length > 0
  const hasExamples = analysis.codeSnippets.length > 0

  analysis.integrationNotes = [
    hasEndpoints ? `${apiEndpoints.length} API endpoints available` : 'No clear API endpoints found',
    hasAuth ? `Authentication: ${analysis.authMethods.join(', ')}` : 'Authentication method unclear',
    hasExamples ? `${analysis.codeSnippets.length} code examples found` : 'No code examples available',
    analysis.commonPatterns.length > 0 ? `Supports: ${analysis.commonPatterns.join(', ')}` : 'Integration patterns unclear'
  ].join('. ')

  return analysis
}

// Extract relevant topics from user request
function extractRelevantTopics(userRequest: string): string[] {
  const request = userRequest.toLowerCase()
  const topics: string[] = []
  
  // Component type keywords
  const componentTypes = ['pricing', 'card', 'form', 'dashboard', 'modal', 'table', 'chart', 'login', 'signup', 'profile', 'navigation', 'sidebar', 'header', 'footer', 'button', 'input']
  componentTypes.forEach(type => {
    if (request.includes(type)) topics.push(type)
  })
  
  // Feature keywords
  const features = ['payment', 'billing', 'subscription', 'auth', 'authentication', 'api', 'webhook', 'integration', 'analytics', 'search', 'filter', 'sort', 'upload', 'download', 'email', 'notification']
  features.forEach(feature => {
    if (request.includes(feature)) topics.push(feature)
  })
  
  // Action keywords
  const actions = ['create', 'build', 'make', 'generate', 'design', 'implement']
  actions.forEach(action => {
    if (request.includes(action)) topics.push('implementation')
  })
  
  return [...new Set(topics)] // Remove duplicates
}

// Get smart crawl options based on user request and topics
function getSmartCrawlOptions(url: string, userRequest: string, topics: string[]): any {
  const urlObj = new URL(url)
  const options: any = {
    limit: 20, // Reduced limit for focused crawling
    maxDepth: 2, // Shallower crawling
    excludePaths: [
      'blog/*', 
      'news/*', 
      'changelog/*', 
      '*/legal/*', 
      '*/privacy/*', 
      '*/terms/*',
      '*/about/*',
      '*/contact/*',
      '*/careers/*'
    ]
  }
  
  // Add topic-specific include patterns
  const includePaths = []
  
  if (topics.includes('pricing') || topics.includes('billing') || topics.includes('payment')) {
    includePaths.push('*/pricing/*', '*/billing/*', '*/payment/*', '*/plans/*', '*/subscribe/*')
  }
  
  if (topics.includes('auth') || topics.includes('authentication')) {
    includePaths.push('*/auth/*', '*/login/*', '*/signup/*', '*/authentication/*')
  }
  
  if (topics.includes('api')) {
    includePaths.push('*/api/*', '*/docs/*', '*/reference/*', '*/integration/*')
  }
  
  if (topics.includes('webhook')) {
    includePaths.push('*/webhook/*', '*/events/*', '*/callbacks/*')
  }
  
  // Default to docs and API sections if no specific topics
  if (includePaths.length === 0) {
    includePaths.push('*/docs/*', '*/api/*', '*/reference/*')
  }
  
  options.includePaths = includePaths
  return options
}

// Filter content to focus on relevant sections
function filterRelevantContent(content: string, topics: string[], userRequest: string): string {
  if (!content || topics.length === 0) return content
  
  const lines = content.split('\n')
  const relevantLines: number[] = []
  const contextWindow = 3 // Lines before/after relevant content
  
  // Find sections that mention relevant topics
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    const isRelevant = topics.some(topic => 
      line.includes(topic) || 
      line.includes(topic.replace('authentication', 'auth')) ||
      line.includes(topic + 's') || // plural forms
      (topic === 'implementation' && (line.includes('example') || line.includes('code') || line.includes('sample')))
    )
    
    if (isRelevant) {
      // Add context around relevant content
      const start = Math.max(0, i - contextWindow)
      const end = Math.min(lines.length, i + contextWindow + 1)
      
      for (let j = start; j < end; j++) {
        if (!relevantLines.includes(j)) {
          relevantLines.push(j)
        }
      }
    }
  }
  
  // If no specific relevant content found, return first 2000 words
  if (relevantLines.length === 0) {
    return content.split(' ').slice(0, 2000).join(' ')
  }
  
  // Sort and get relevant lines
  relevantLines.sort((a, b) => a - b)
  const filteredLines = relevantLines.map(i => lines[i])
  
  return filteredLines.join('\n')
}

// Smart scraping with context (wrapper around existing function)
async function smartScrapeUrlWithContext(url: string, options: any): Promise<any> {
  // For now, use the existing smartScrapeUrl but could be enhanced to use crawl options
  return await smartScrapeUrl(url)
}

// For now, let's create a simple function-based tool that we can test
// This avoids the TypeScript compilation issues with AI SDK v5
export async function browseTool({ urls, focus, userRequest }: { urls: string[], focus?: string, userRequest?: string }) {
  console.log(`Browsing URLs: ${urls.join(', ')}${focus ? ` with focus: ${focus}` : ''}${userRequest ? ` for request: "${userRequest}"` : ''}`)

  // Analyze user request to identify relevant topics and keywords
  const relevantTopics = extractRelevantTopics(userRequest || '')
  console.log(`Identified relevant topics:`, relevantTopics)

  const results = []

    for (const url of urls.slice(0, 3)) { // Limit to 3 URLs to avoid timeouts
      try {
        console.log(`Smart scraping: ${url} focused on: ${relevantTopics.join(', ')}`)
        
        // Use targeted crawling options based on user request
        const crawlOptions = getSmartCrawlOptions(url, userRequest || '', relevantTopics)
        
        // Use the shared scraping utility with smart options
        const scrapedData = await smartScrapeUrlWithContext(url, crawlOptions)
        
        // Filter content to focus on relevant sections
        const filteredContent = filterRelevantContent(scrapedData.content, relevantTopics, userRequest || '')
        
        // Analyze the filtered content for API-specific information
        const analysis = analyzeDocumentation(filteredContent, scrapedData.apiEndpoints, focus || userRequest)
        
        results.push({
          url,
          title: scrapedData.title,
          content: filteredContent,
          originalWordCount: scrapedData.wordCount,
          filteredWordCount: filteredContent.split(' ').length,
          apiEndpoints: scrapedData.apiEndpoints,
          codeExamples: scrapedData.codeExamples,
          analysis,
          relevantTopics,
          success: true,
        })

        console.log(`Successfully scraped: ${url} (${scrapedData.wordCount} -> ${filteredContent.split(' ').length} words after filtering)`)
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
        results.push({
          url,
          error: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          success: false,
        })
      }
    }  const successful = results.filter(r => r.success)

  // Generate summary
  const summary = {
    totalUrls: urls.length,
    successful: successful.length,
    failed: results.length - successful.length,
    totalContent: successful.reduce((acc, r) => acc + (r.filteredWordCount || 0), 0),
    domains: successful.map(r => new URL(r.url).hostname),
    totalEndpoints: successful.reduce((acc, r) => acc + (r.apiEndpoints?.length || 0), 0),
  }

  // Create comprehensive documentation context for AI
  const documentationContext = successful.map(result => {
    const analysis = result.analysis || { summary: 'No analysis available', integrationNotes: 'No integration notes' }
    const topics = result.relevantTopics || []
    return `## ${result.title} (${new URL(result.url).hostname})

**URL:** ${result.url}
**Content filtered for topics:** ${topics.join(', ') || 'general'}
**Content size:** ${result.originalWordCount} words → ${result.filteredWordCount} words (filtered)

**API Analysis:**
${analysis.summary}

**Key Endpoints (for reference - use mock data in preview):**
${result.apiEndpoints?.slice(0, 10).map((ep: string) => `- ${ep}`).join('\n') || 'No specific endpoints detected'}

**Integration Notes:**
${analysis.integrationNotes}

**IMPORTANT FOR COMPONENT GENERATION:**
- This content is filtered to focus on: ${topics.join(', ') || 'general topics'}
- This is for a sandboxed preview, so use MOCK DATA instead of real API calls
- Create demo functionality with realistic mock responses
- Simulate the API behavior described in the documentation using local state and mock data
- Use setTimeout() to simulate loading states and API delays

**Relevant Content:**
${result.content ? result.content.substring(0, 1500) + (result.content.length > 1500 ? '...' : '') : 'No content available'}
`
  }).join('\n\n---\n\n')

  return {
    success: true,
    summary,
    results,
    documentationContext,
    message: `Successfully analyzed ${successful.length} of ${urls.length} URLs. Found ${summary.totalEndpoints} API endpoints across ${summary.domains.length} domains.`,
  }
}
