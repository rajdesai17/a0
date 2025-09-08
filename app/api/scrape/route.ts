import { NextRequest, NextResponse } from 'next/server'
import { scrapeUrl } from '@/lib/scrapeUtils'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const result = await scrapeUrl(url)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Scrape API Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
