import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: 'No search query provided' }, { status: 400 });
    }

    const endpoint = process.env.AZURE_SEARCH_ENDPOINT;
    const apiKey = process.env.AZURE_SEARCH_API_KEY;

    if (!endpoint || !apiKey) {
      throw new Error('Azure Search credentials not configured');
    }

    // Use the search API
    const searchUrl = `${endpoint}/indexes/web-content/docs?api-version=2023-11-01&search=${encodeURIComponent(query)}&$count=true&$top=5`;
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Search API error:', errorData);
      throw new Error(`Search API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Format and return the results
    const results = {
      query,
      timestamp: new Date().toISOString(),
      results: data.value?.map((item: any) => ({
        content: item.content,
        title: item.title,
        url: item.url,
        lastUpdated: item.lastUpdated
      })) || []
    };

    return NextResponse.json(results);
  } catch (error) {
    console.error('Web search error:', error);
    return NextResponse.json({ 
      error: 'Failed to perform web search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 