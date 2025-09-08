import { NextRequest, NextResponse } from 'next/server'
import { browseTool } from '@/lib/tools/browseTool'

// Store the latest documentation analysis results
let latestDocumentationResults: any = null

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json()
    
    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 })
    }

    // Use the browse tool to get documentation analysis
    const results = await browseTool({ urls })
    latestDocumentationResults = results

    return NextResponse.json(results)
  } catch (error) {
    console.error('Documentation analysis error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    hasDocumentation: !!latestDocumentationResults,
    results: latestDocumentationResults,
  })
}
