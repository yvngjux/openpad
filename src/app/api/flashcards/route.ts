import { NextResponse } from 'next/server';
import { FlashcardDeck, FlashcardAPIResponse } from '@/features/flashcards/types';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured. Flashcard generation will not work.');
}

async function createChatCompletion(messages: any[], temperature: number = 0.7, maxTokens: number = 1000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout for Vercel

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        messages,
        model: 'gpt-3.5-turbo', // Using faster model
        temperature,
        max_tokens: maxTokens,
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status}${errorData.error ? ' - ' + errorData.error.message : ''}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content } = body;

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 second timeout for overall request

    try {
      const completion = await createChatCompletion([
        {
          role: 'system',
          content: 'You are a flashcard generator. Create concise, educational flashcards. Each flashcard should have a clear question and answer. Focus on key concepts and keep answers brief. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: `Create 5 flashcards about "${content}". Format as a JSON object with this exact structure:
{
  "title": "${content}",
  "description": "Brief description of ${content}",
  "cards": [
    {
      "question": "What is X?",
      "answer": "X is Y"
    }
  ]
}`
        }
      ], 0.7, 800); // Reduced token limit for faster responses

      clearTimeout(timeoutId);

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated');
      }

      try {
        const parsedResponse = JSON.parse(response);
        
        // Validate the response structure
        if (!parsedResponse.cards || !Array.isArray(parsedResponse.cards)) {
          throw new Error('Invalid response format: missing cards array');
        }

        // Validate each card has question and answer
        const validCards = parsedResponse.cards.filter((card: any) => 
          card && typeof card.question === 'string' && typeof card.answer === 'string'
        );

        if (validCards.length === 0) {
          throw new Error('No valid flashcards in response');
        }

        const deck: FlashcardDeck = {
          id: Math.random().toString(36).substring(7),
          title: parsedResponse.title || content,
          description: parsedResponse.description || `Flashcards about ${content}`,
          cards: validCards.map((card: any) => ({
            id: Math.random().toString(36).substring(7),
            question: card.question,
            answer: card.answer
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const apiResponse: FlashcardAPIResponse = {
          success: true,
          deck
        };

        return NextResponse.json(apiResponse);
      } catch (parseError) {
        console.error('Error parsing flashcards:', parseError);
        throw new Error('Failed to parse flashcards response');
      }
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      console.error('API Error:', apiError);
      
      let errorMessage = 'Failed to generate flashcards';
      if (apiError?.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again with a simpler topic.';
      } else if (apiError instanceof Error) {
        errorMessage = apiError.message;
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: apiError?.name === 'AbortError' ? 504 : 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in flashcards API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request. Please try again with a simpler topic.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 