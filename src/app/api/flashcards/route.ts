import { NextResponse } from 'next/server';
import { FlashcardDeck, FlashcardAPIResponse } from '@/features/flashcards/types';

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured. Flashcard generation will not work.');
}

async function createChatCompletion(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      messages,
      model: 'gpt-4-turbo-preview',
      temperature,
      max_tokens: maxTokens,
      stream: false,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export async function POST(req: Request) {
  try {
    const { topic, numCards = 8 } = await req.json();

    const prompt = `Generate a set of flashcards about "${topic}". 
    The response must be a valid JSON object with this exact structure:
    {
      "title": "${topic}",
      "description": "A brief description of ${topic}",
      "cards": [
        {
          "id": "1",
          "question": "Question text here",
          "answer": "Answer text here",
          "category": "Main Concept"
        }
      ]
    }
    
    Important rules:
    1. Generate exactly ${numCards} cards
    2. Keep questions concise (max 20 words)
    3. Keep answers clear and focused (max 50 words)
    4. Ensure the JSON is valid
    5. Do not include any markdown formatting
    6. Do not include any additional text outside the JSON structure
    7. Make sure to cover the most important aspects of the topic
    8. Progress from basic to more advanced concepts`;

    const completion = await createChatCompletion([
      {
        role: 'system',
        content: 'You are a flashcard generation AI. You only respond with valid JSON that matches the specified structure exactly.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 0.7, 2048);

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    try {
      const flashcardDeck = JSON.parse(response) as FlashcardDeck;
      
      // Add timestamps
      flashcardDeck.createdAt = new Date();
      flashcardDeck.updatedAt = new Date();

      // Add IDs if not present
      flashcardDeck.id = flashcardDeck.id || `deck-${Date.now()}`;
      flashcardDeck.cards = flashcardDeck.cards.map((card, index) => ({
        ...card,
        id: card.id || `card-${Date.now()}-${index}`,
      }));

      // Verify we have the correct number of cards
      if (flashcardDeck.cards.length !== numCards) {
        console.warn(`Expected ${numCards} cards but got ${flashcardDeck.cards.length}`);
      }

      const apiResponse: FlashcardAPIResponse = {
        success: true,
        deck: flashcardDeck,
      };

      return NextResponse.json(apiResponse);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to parse AI response',
      } as FlashcardAPIResponse, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error generating flashcards:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate flashcards',
    } as FlashcardAPIResponse, { status: 500 });
  }
} 