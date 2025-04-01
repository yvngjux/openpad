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

    const data = await response.json();
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
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
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 second timeout for overall request

    try {
      // Handle single message explanation requests
      if (message) {
        const { isBriefExplanation, sessionType } = body;
        
        // Optimize token limits for faster responses
        const maxTokens = isBriefExplanation ? 500 : 1500;
        
        const systemMessage = sessionType === 'graph' ? {
          role: 'system',
          content: `You are a precise mathematical graphing assistant. Follow these rules exactly:

1. ONLY graph what is explicitly requested. Do not add any additional functions or elements that weren't asked for.

2. Structure your responses in this format:
   First: Explain what you're going to plot in plain text
   Then: Add the LaTeX expression for Desmos (hidden from user)

3. When asked about what's currently plotted, refer to your previous responses and the actual expressions you've plotted.

4. Maintain context of the conversation and previously plotted functions.

Example responses:

For simple functions:
"I'll plot the linear function y = 2x - 4 in blue.
\`$2x-4$\` \`@{"color":"blue"}@\`"

For quadratic functions:
"I'll plot the quadratic function y = x² + 3x - 2.
\`$x^2+3x-2$\` \`@{"color":"black"}@\`"

For circles:
"I'll draw a circle with radius 5 centered at the origin.
\`$x^2+y^2=25$\` \`@{"color":"blue"}@\`"

For derivatives:
"I'll plot the derivative of f(x) = x², which is f'(x) = 2x.
\`$2x$\` \`@{"color":"red"}@\`"

When asked about current plots:
"I've plotted the linear function y = 2x - 4 in blue. This line has a slope of 2 and crosses the y-axis at -4."

3. Use these plain text conventions:
   - Write x² instead of x^2
   - Write √x instead of sqrt(x)
   - Write π instead of pi
   - Write ∙ for multiplication
   - Write ≤ or ≥ for inequalities

4. For viewport adjustments (hidden from user):
\`#[{"left":-10,"right":10,"bottom":-10,"top":10}]#\`

5. For calculator settings (hidden from user):
\`%{"polarMode":true}%\`

Remember:
- Keep explanations clear and simple
- Use everyday mathematical notation in explanations
- Hide all LaTeX and technical commands from the user's view
- Only include the LaTeX expressions for Desmos to process
- Maintain conversation context and refer to previous plots accurately`
        } : {
          role: 'system',
          content: isBriefExplanation ? 
            'You are a STEM tutor providing clear explanations. Your task is to: 1) Give a clear, concise explanation (2-3 sentences) of the concept. 2) Focus on key points and practical understanding. 3) After the explanation, ask if they would like a more detailed explanation. Keep responses engaging and direct.' :
            'You are a STEM tutor providing detailed explanations. Your task is to: 1) Break down the concept into clear sections. 2) Include relevant examples and applications. 3) Use clear formatting for readability. 4) Make complex ideas accessible while maintaining accuracy.'
        };

        // For graph sessions, include conversation history
        const apiMessages = sessionType === 'graph' && messages ? 
          [systemMessage, ...messages] :
          [systemMessage, { role: 'user', content: message }];

        const completion = await createOpenAIChatCompletion(
          apiMessages,
          0.7,
          maxTokens
        );

        clearTimeout(timeoutId);
        return NextResponse.json({
          response: completion.choices[0]?.message?.content || 'No response generated'
        });
      }

      // Handle regular chat with optimized settings
      const completion = await createOpenAIChatCompletion([
        {
          role: 'system',
          content: 'You are Carole, a helpful STEM tutor. Provide clear, concise explanations.'
        },
        ...messages.slice(-3) // Only use last 3 messages for context to reduce processing time
      ], 0.7, 1000); // Reduced token limit

      clearTimeout(timeoutId);
      return NextResponse.json({
        content: completion.choices[0]?.message?.content || 'No response generated'
      });
    } catch (error) {
      console.error('Error:', error);
      clearTimeout(timeoutId);
      return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
} 