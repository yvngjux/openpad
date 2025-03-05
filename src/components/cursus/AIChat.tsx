'use client';

import { useState } from 'react';
import { Bot, User, ArrowUp } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface AIChatProps {
  code: string;
  language: string;
  onUpdateCode: (code: string) => void;
}

export function AIChat({ code, language, onUpdateCode }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // TODO: Implement AI service integration
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          code,
          language,
        }),
      });

      const data = await response.json();
      
      if (data.updatedCode) {
        onUpdateCode(data.updatedCode);
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        content: data.response || 'I understand. How can I help you with your code?',
        role: 'assistant',
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error:', error);
    }

    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800">AI Assistant</h2>
        <p className="text-sm text-gray-500">Ask questions about your code or get help with debugging.</p>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 ${
              message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              {message.role === 'user' ? (
                <User className="w-5 h-5" />
              ) : (
                <Bot className="w-5 h-5" />
              )}
            </div>
            <div
              className={`rounded-lg p-3 max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-sm text-gray-500">Thinking...</div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-4">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask a question about your code..."
            className="w-full pr-10 py-2 pl-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3}
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isProcessing}
            className="absolute right-2 bottom-2 p-1.5 bg-black text-white rounded-lg hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 