import { z } from 'zod'
import { scrapeUrl } from '@/lib/scrapeUtils'

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

// For now, let's create a simple function-based tool that we can test
// This avoids the TypeScript compilation issues with AI SDK v5
export async function browseTool({ urls, focus }: { urls: string[], focus?: string }) {
  console.log(`Browsing URLs: ${urls.join(', ')}${focus ? ` with focus: ${focus}` : ''}`)

  const results = []

    for (const url of urls.slice(0, 3)) { // Limit to 3 URLs to avoid timeouts
      try {
        console.log(`Scraping: ${url}`)
        
        // Use the shared scraping utility directly
        const scrapedData = await scrapeUrl(url)
        
        // Analyze the content for API-specific information
        const analysis = analyzeDocumentation(scrapedData.content, scrapedData.apiEndpoints, focus)
        
        results.push({
          url,
          title: scrapedData.title,
          content: scrapedData.content,
          apiEndpoints: scrapedData.apiEndpoints,
          codeExamples: scrapedData.codeExamples,
          analysis,
          wordCount: scrapedData.wordCount,
          success: true,
        })

        console.log(`Successfully scraped: ${url} (${scrapedData.wordCount} words)`)
        
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
    totalContent: successful.reduce((acc, r) => acc + (r.wordCount || 0), 0),
    domains: successful.map(r => new URL(r.url).hostname),
    totalEndpoints: successful.reduce((acc, r) => acc + (r.apiEndpoints?.length || 0), 0),
  }

  // Create comprehensive documentation context for AI
  const documentationContext = successful.map(result => {
    const analysis = result.analysis || { summary: 'No analysis available', integrationNotes: 'No integration notes' }
    return `## ${result.title} (${new URL(result.url).hostname})

**URL:** ${result.url}

**API Analysis:**
${analysis.summary}

**Key Endpoints:**
${result.apiEndpoints?.slice(0, 10).map((ep: string) => `- ${ep}`).join('\n') || 'No specific endpoints detected'}

**Integration Notes:**
${analysis.integrationNotes}

**Content Preview:**
${result.content ? result.content.substring(0, 1000) + (result.content.length > 1000 ? '...' : '') : 'No content available'}
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
