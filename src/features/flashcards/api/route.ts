import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { FlashcardDeck, FlashcardAPIResponse } from '../types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { messages, topic } = await req.json();

    const prompt = `Generate a comprehensive set of flashcards about "${topic}". 
    Format the response as a JSON object with the following structure:
    {
      "title": "Topic Title",
      "description": "Brief description of the topic",
      "cards": [
        {
          "id": "unique-id",
          "question": "Question text",
          "answer": "Answer text",
          "category": "Optional category"
        }
      ]
    }
    Make the flashcards concise, clear, and educational. Include 5-10 cards covering key concepts.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI tutor that creates educational flashcards. Your responses should be in valid JSON format.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 2048,
    });

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