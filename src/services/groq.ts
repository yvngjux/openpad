export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content?: string;
  type?: 'flashcards' | 'mcq';
  topic?: string;
  data?: any[];
  message?: string;
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      if (error?.status === 503 && retries < maxRetries) {
        const delayTime = initialDelay * Math.pow(2, retries);
        console.log(`Retrying after ${delayTime}ms...`);
        await delay(delayTime);
        retries++;
        continue;
      }
      throw error;
    }
  }
}

export async function generateChatResponse(messages: ChatMessage[], withSearch: boolean = false): Promise<ChatResponse | string> {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, withSearch, isCursus: false }),
    });

    if (!response.ok) {
      const error = new Error('Failed to generate response') as any;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data;
  });
}

export async function generateCursusResponse(messages: ChatMessage[]): Promise<string> {
  return retryWithBackoff(async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, isCursus: true }),
    });

    if (!response.ok) {
      const error = new Error('Failed to generate response') as any;
      error.status = response.status;
      throw error;
    }

    const data = await response.json();
    return data.content;
  });
} 