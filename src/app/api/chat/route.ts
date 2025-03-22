import { NextResponse } from 'next/server';
import { generateFlashcards, generateMCQ } from '@/services/studyTools';

// Add these interfaces at the top of the file
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface NewsAPIResponse {
  articles: NewsArticle[];
  status: string;
  totalResults: number;
}

if (!process.env.BING_API_KEY) {
  console.warn('BING_API_KEY is not configured. Web search will not work.');
}

if (!process.env.OPENAI_API_KEY) {
  console.warn('OPENAI_API_KEY is not configured. OpenAI features will not work.');
}

if (!process.env.XAI_API_KEY) {
  console.warn('XAI_API_KEY is not configured. XAI features will not work.');
}

if (!process.env.NEWS_API_KEY) {
  console.warn('NEWS_API_KEY is not configured. News features will not work.');
}

async function fetchNewsArticles(query: string): Promise<Array<{
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}>> {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${process.env.NEWS_API_KEY}&sortBy=publishedAt&language=en`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const data = await response.json() as NewsAPIResponse;
    const articles = data.articles?.slice(0, 5) || [];

    return articles.map((article: NewsArticle) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name
    }));
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}

async function createOpenAIChatCompletion(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 second timeout

  try {
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
        stream: false
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status}${errorData.error ? ' - ' + errorData.error.message : ''}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out after 50 seconds');
    }
    throw error;
  }
}

async function createGrokChatCompletion(messages: any[], temperature: number = 0.7, maxTokens: number = 2000) {
  const response = await fetch('https://api.xai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`
    },
    body: JSON.stringify({
      messages: [
        {
          role: 'system',
          content: `You are a real-time web search assistant with direct access to current information. Your responses must:
1. Only include information from verified sources within the last 24 hours
2. Include exact timestamps and dates for all information
3. Provide direct source links where available
4. Structure information by recency, with newest first
5. If information is older than 24 hours, explicitly state when it was published
6. Include context about ongoing developments`
        },
        ...messages
      ],
      model: 'grok-2-latest',
      temperature,
      max_tokens: maxTokens,
      stream: false,
      functions: [
        {
          name: "web_search",
          description: "Search the web for real-time information",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "fetch_news",
          description: "Fetch real-time news articles about a topic",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query for news articles"
              }
            },
            required: ["query"]
          }
        }
      ],
      function_call: "auto"
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`X.AI API error: ${response.status}${errorData.error ? ' - ' + errorData.error.message : ''}`);
  }

  const data = await response.json();
  return data;
}

const SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are Carole, an expert STEM tutor and general knowledge assistant. You specialize in making complex topics understandable through clear, structured explanations. When responding:

1. For STEM topics:
   - Start with a brief, engaging introduction
   - Structure responses with clear headings using markdown
   - Break down complex topics into digestible sections
   - Use real-world examples and analogies
   - Include practical applications
   - Format mathematical equations using markdown

2. For general knowledge:
   - Provide accurate, well-structured information
   - Use clear examples and explanations
   - Cite sources when relevant
   - Be transparent about any limitations in knowledge

3. General guidelines:
   - Respond in the same language as the user's question
   - Keep responses concise for simple questions
   - Maintain a helpful and informative tone
   - Never include "Confidence level" in responses
   - If you cannot provide accurate information, explain why`
};

const WEB_SEARCH_SYSTEM_MESSAGE = {
  role: 'system',
  content: `You are Carole, a real-time news and information assistant with access to the latest web information. Your task is to:
1. Use your web search capability to find and provide ONLY the most recent news and information (from the last 24-48 hours) about the user's query
2. Focus exclusively on real-time, current information - do not reference historical data unless specifically asked
3. Structure your response with:
   - Latest headlines and developments (with exact dates)
   - Brief summary of each major point
   - Direct links to sources where possible
   - Exact publication dates and times
4. Always specify the exact date and time for each piece of information
5. If you cannot find very recent information (within the last 48 hours), explicitly state this
6. Do not use placeholder text like [Current Date and Time] - instead use actual dates and times from your sources`
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, messages, withSearch, isCursus } = body;

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000); // 55 second timeout

    try {
      // Handle single message explanation requests
      if (message) {
        const { isBriefExplanation } = body;
        const systemMessage = isBriefExplanation ? {
          role: 'system' as const,
          content: `You are a helpful tutor explaining flashcard concepts. When explaining:
- Provide a direct, clear explanation of the concept in 2-3 sentences
- Use simple, straightforward language
- Focus only on the core concept
- End your response with:
  "\n\nWould you like a more detailed STEM-style explanation of this concept? Reply with 'Yes' if you'd like to learn more, or continue with your flashcards if this explanation was sufficient."`
        } : {
          role: 'system' as const,
          content: `You are a STEM tutor providing detailed, comprehensive explanations. Format your response as follows:

1. Text formatting:
   - For bold text and headings, use **text** (markdown bold)
   - Each main section should start with a bold heading
   - Use two newlines after each section
   - No HTML tags or special characters

2. Mathematical equations:
   - Write equations using plain text with × for multiplication
   - Example: "F = m × a"
   - Define all variables immediately after each equation
   - For fractions use "/" instead of complex notation

3. Structure your response with these sections:
   - **Introduction**
   - **Main Concepts and Examples**
   - **Real-World Applications**
   - **Key Terms and Definitions**
   - **Brief Conclusion**

4. Lists and points:
   - Use numbers (1, 2, 3) for main points
   - Use dashes (-) for sub-points
   - Indent sub-points with spaces

Remember: Use markdown bold (**text**) for all bold text and headings to ensure proper rendering in the chat interface.`
        };

        let prompt = systemMessage.content;
        // If it's a brief explanation, append a note about not including a follow-up question
        if (isBriefExplanation) {
          prompt = `${prompt}\n\nProvide a clear and concise explanation. Do not ask if they want more details - the system will handle that prompt.`;
        }

        const completion = await createOpenAIChatCompletion([
          systemMessage,
          {
            role: 'user' as const,
            content: message.startsWith('Yes') && messages?.length > 1 ? 
              `Provide a detailed STEM explanation for the previous flashcard concept: ${messages[messages.length - 2].content}` :
              message
          }
        ], 0.7, isBriefExplanation ? 200 : 2000);

        clearTimeout(timeoutId);
        return NextResponse.json({
          response: completion.choices[0]?.message?.content || 'No response generated'
        });
      }

      // Handle study tool commands
      const lastMessage = messages[messages.length - 1];
      const messageContent = lastMessage.content;

      if (messageContent.startsWith('@flashcards')) {
        const topic = messageContent.replace('@flashcards', '').trim();
        try {
          const flashcards = await generateFlashcards(topic);
          return NextResponse.json({
            type: 'flashcards',
            topic,
            data: flashcards,
            content: `I've generated some flashcards about ${topic}. Click the button below to study them.`,
            message: `I've generated some flashcards about ${topic}. Click the button below to study them.`
          });
        } catch (error) {
          console.error('Error generating flashcards:', error);
          return NextResponse.json({
            content: 'Sorry, I encountered an error while generating flashcards. Please try again.'
          });
        }
      } 
      
      if (messageContent.startsWith('@mcq')) {
        const topic = messageContent.replace('@mcq', '').trim();
        try {
          const questions = await generateMCQ(topic);
          return NextResponse.json({
            type: 'mcq',
            topic,
            data: questions,
            content: `I've created a multiple choice quiz about ${topic}. Click the button below to test your knowledge.`,
            message: `I've created a multiple choice quiz about ${topic}. Click the button below to test your knowledge.`
          });
        } catch (error) {
          console.error('Error generating MCQ:', error);
          return NextResponse.json({
            content: 'Sorry, I encountered an error while generating the quiz. Please try again.'
          });
        }
      }

      // Handle web search requests
      if (withSearch) {
        try {
          // Directly fetch news without the initial Grok call
          const articles = await fetchNewsArticles(messageContent);
          
          // Format articles for analysis
          const newsData = articles.map(article => 
            `Title: ${article.title}\nSource: ${article.source}\nPublished: ${article.publishedAt}\nURL: ${article.url}\nDescription: ${article.description}\n`
          ).join('\n');

          // Have Grok analyze the news data
          const completion = await createGrokChatCompletion([
            {
              role: 'system',
              content: `You are a real-time news assistant. Analyze and summarize the following news articles:
1. Focus on the most recent and relevant information
2. Structure the response with clear sections
3. Include publication dates and sources
4. Add insights about trends or implications
5. Be clear about the timeframe of the information`
            },
            {
              role: 'user',
              content: `Here are the latest news articles about "${messageContent}":\n\n${newsData}\n\nPlease analyze and summarize this information, focusing on the most recent developments and their implications.`
            }
          ], 0.7, 4096);

          return NextResponse.json({
            content: completion.choices[0]?.message?.content || 'No response generated'
          });
        } catch (error) {
          console.error('Web search error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          return NextResponse.json({
            content: `I apologize, but I encountered an error while searching for real-time information. ${errorMessage}`
          });
        }
      }

      // Handle regular chat
      const completion = await createOpenAIChatCompletion([
        SYSTEM_MESSAGE,
        ...messages
      ], isCursus ? 0.5 : 0.7, isCursus ? 4096 : 2048);

      clearTimeout(timeoutId);
      return NextResponse.json({
        content: completion.choices[0]?.message?.content || 'No response generated'
      });
    } catch (apiError: any) {
      clearTimeout(timeoutId);
      console.error('API Error:', apiError);
      
      let errorMessage = 'Failed to generate response';
      if (apiError?.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again.';
      } else if (apiError instanceof Error) {
        errorMessage = apiError.message;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: apiError?.name === 'AbortError' ? 504 : 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 