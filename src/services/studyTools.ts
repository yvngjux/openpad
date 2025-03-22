if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured. Study tools will not work.');
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

interface FlashcardData {
  front: string;
  back: string;
}

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export async function generateFlashcards(topic: string): Promise<FlashcardData[]> {
  const prompt = `Generate 5 flashcards about "${topic}". Format your response as a JSON object with a "flashcards" array. Each flashcard in the array should have "front" and "back" properties. The content should be educational and accurate.

Example format:
{
  "flashcards": [
    {
      "front": "What is DNA?",
      "back": "DNA (Deoxyribonucleic acid) is a molecule that carries genetic instructions for development and functioning of living organisms."
    }
  ]
}`;

  try {
    const completion = await createChatCompletion([
      {
        role: 'system',
        content: 'You are a helpful educational assistant that creates clear, accurate flashcards. Always respond with properly formatted JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 0.5, 1024);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI API');
      return [
        {
          front: "Error",
          back: "Failed to generate flashcards. Please try again."
        }
      ];
    }

    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate the response structure
      if (!parsedResponse.flashcards || !Array.isArray(parsedResponse.flashcards)) {
        console.error('Invalid response format from OpenAI API');
        return [
          {
            front: "Error",
            back: "Failed to generate flashcards. Please try again."
          }
        ];
      }

      // Validate each flashcard
      const validFlashcards = parsedResponse.flashcards.filter((card: any) => {
        return (
          card &&
          typeof card === 'object' &&
          typeof card.front === 'string' &&
          typeof card.back === 'string' &&
          card.front.trim() !== '' &&
          card.back.trim() !== ''
        );
      });

      if (validFlashcards.length === 0) {
        console.error('No valid flashcards in response');
        return [
          {
            front: "Error",
            back: "Failed to generate flashcards. Please try again."
          }
        ];
      }

      return validFlashcards;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return [
        {
          front: "Error",
          back: "Failed to generate flashcards. Please try again."
        }
      ];
    }
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return [
      {
        front: "Error",
        back: "Failed to generate flashcards. Please try again."
      }
    ];
  }
}

export async function generateMCQ(topic: string): Promise<MCQQuestion[]> {
  const prompt = `Generate 5 multiple choice questions about "${topic}". Format your response as a JSON object with a "questions" array. Each question should have:
  - "question": the question text
  - "options": array of 4 options (A, B, C, D)
  - "correctAnswer": number (0-3, where 0=A, 1=B, etc.)
  - "explanation": brief explanation of why the answer is correct

Example format:
{
  "questions": [
    {
      "question": "What is the primary function of DNA?",
      "options": [
        "Store genetic information",
        "Produce energy",
        "Break down food",
        "Transport oxygen"
      ],
      "correctAnswer": 0,
      "explanation": "DNA's primary function is to store genetic information that contains instructions for the development and functioning of living organisms."
    }
  ]
}`;

  try {
    const completion = await createChatCompletion([
      {
        role: 'system',
        content: 'You are a helpful educational assistant that creates clear, accurate multiple choice questions. Always respond with properly formatted JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ], 0.5, 1024);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.error('No response from OpenAI API');
      return [
        {
          question: "Error generating quiz",
          options: ["Try again", "Contact support", "Refresh page", "Wait a moment"],
          correctAnswer: 0,
          explanation: "There was an error generating the quiz. Please try again."
        }
      ];
    }

    try {
      const parsedResponse = JSON.parse(response);
      
      // Validate the response structure
      if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
        console.error('Invalid response format from OpenAI API');
        return [
          {
            question: "Error generating quiz",
            options: ["Try again", "Contact support", "Refresh page", "Wait a moment"],
            correctAnswer: 0,
            explanation: "There was an error generating the quiz. Please try again."
          }
        ];
      }

      // Validate each question
      const validQuestions = parsedResponse.questions.filter((q: any) => {
        return (
          q &&
          typeof q === 'object' &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.options.every((opt: any) => typeof opt === 'string') &&
          typeof q.correctAnswer === 'number' &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3 &&
          typeof q.explanation === 'string' &&
          q.question.trim() !== '' &&
          q.explanation.trim() !== ''
        );
      });

      if (validQuestions.length === 0) {
        console.error('No valid questions in response');
        return [
          {
            question: "Error generating quiz",
            options: ["Try again", "Contact support", "Refresh page", "Wait a moment"],
            correctAnswer: 0,
            explanation: "There was an error generating the quiz. Please try again."
          }
        ];
      }

      return validQuestions;
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      return [
        {
          question: "Error generating quiz",
          options: ["Try again", "Contact support", "Refresh page", "Wait a moment"],
          correctAnswer: 0,
          explanation: "There was an error generating the quiz. Please try again."
        }
      ];
    }
  } catch (error) {
    console.error('Error generating MCQ:', error);
    return [
      {
        question: "Error generating quiz",
        options: ["Try again", "Contact support", "Refresh page", "Wait a moment"],
        correctAnswer: 0,
        explanation: "There was an error generating the quiz. Please try again."
      }
    ];
  }
} 