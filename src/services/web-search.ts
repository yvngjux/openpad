export async function performWebSearch(query: string): Promise<string> {
  try {
    const response = await fetch('/api/web-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error('Failed to perform web search');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error performing web search:', error);
    throw error;
  }
} 