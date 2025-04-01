'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from '@/types/chat';
import { generateUniqueId } from '@/lib/utils';
import { EmptyGraphState } from '@/features/graph/components/EmptyGraphState';
import { GraphMessage } from '@/features/graph/components/GraphMessage';
import { AIInputWithSearch } from '@/components/AIInputWithSearch';
import { LoadingMessage } from '@/components/LoadingMessage';
import { 
  DesmosCalculator, 
  DesmosCalculatorRef,
  ViewportBounds,
  CalculatorSettings 
} from '@/features/graph/components/DesmosCalculator';
import { useSpaces } from '@/contexts/SpaceContext';

interface GraphSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions to extract different types of commands
function extractLatexExpressions(text: string): Array<{ latex: string; options?: any }> {
  const expressionRegex = /`\$(.*?)\$`(?:\s*`@(.*?)@`)?/g;
  const matches = [...text.matchAll(expressionRegex)];
  return matches.map(match => ({
    latex: match[1].trim(),
    options: match[2] ? JSON.parse(match[2]) : undefined
  }));
}

function extractViewportCommands(text: string): ViewportBounds | null {
  const viewportRegex = /`#\[(.*?)\]#`/;
  const match = text.match(viewportRegex);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Error parsing viewport bounds:', e);
      return null;
    }
  }
  return null;
}

function extractCalculatorSettings(text: string): CalculatorSettings | null {
  const settingsRegex = /`%\{(.*?)\}%`/;
  const match = text.match(settingsRegex);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Error parsing calculator settings:', e);
      return null;
    }
  }
  return null;
}

export default function GraphPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculatorRef>(null);
  const {
    currentSession,
    createNewSession,
    setCurrentSession,
  } = useSpaces();

  // Initialize session when component mounts
  useEffect(() => {
    if (!currentSession || currentSession.type !== 'graph') {
      createNewSession('graph');
    }
  }, []);

  // Handle calculator initialization
  const handleCalculatorReady = useCallback(() => {
    if (!calculatorRef.current || !currentSession?.messages) return;

    // Restore calculator state from session
    const allExpressions = currentSession.messages
      .filter(msg => msg.role === 'assistant')
      .flatMap(msg => extractLatexExpressions(msg.content));

    const lastAssistantMessage = currentSession.messages
      .filter(msg => msg.role === 'assistant')
      .pop();

    if (lastAssistantMessage) {
      const settings = extractCalculatorSettings(lastAssistantMessage.content);
      if (settings) {
        calculatorRef.current.updateSettings(settings);
      }

      const viewport = extractViewportCommands(lastAssistantMessage.content);
      if (viewport) {
        calculatorRef.current.setViewport(viewport);
      }
    }

    allExpressions.forEach(({ latex, options }) => {
      calculatorRef.current?.addExpression(latex, options);
    });
  }, [currentSession?.messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages, scrollToBottom]);

  const handleSubmit = async (message: string) => {
    if (!message.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Create user's message
      const userMessage: Message = {
        id: generateUniqueId(),
        content: message,
        role: 'user',
        type: 'graph'
      };

      // Add user's message to the session
      const updatedMessages = [...(currentSession?.messages || []), userMessage];
      const updatedSession = {
        ...currentSession!,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };
      setCurrentSession(updatedSession);

      // Prepare message history for API
      const messageHistory = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send message to API with conversation history
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          messages: messageHistory,
          sessionType: 'graph'
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Only clear expressions if explicitly requested
      const shouldClear = message.toLowerCase().match(/clear|reset|erase|empty/);
      if (shouldClear) {
        calculatorRef.current?.clearExpressions();
      }

      // Apply calculator settings if present
      const settings = extractCalculatorSettings(data.response);
      if (settings) {
        calculatorRef.current?.updateSettings(settings);
      }

      // Apply viewport changes if present
      const viewport = extractViewportCommands(data.response);
      if (viewport) {
        calculatorRef.current?.setViewport(viewport);
      }

      // Add expressions with their styling options
      const expressions = extractLatexExpressions(data.response);
      expressions.forEach(({ latex, options }) => {
        calculatorRef.current?.addExpression(latex, options);
      });

      // Create assistant's response message
      const assistantMessage: Message = {
        id: generateUniqueId(),
        content: data.response,
        role: 'assistant',
        type: 'graph'
      };

      // Update session with both messages
      const finalMessages = [...updatedMessages, assistantMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        updatedAt: new Date().toISOString()
      };

      setCurrentSession(finalSession);

    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen max-h-screen overflow-hidden">
      {/* Left side - Chat Interface */}
      <div className="w-1/2 flex flex-col overflow-hidden border-r border-gray-200/50">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="max-w-5xl mx-auto p-4 space-y-6">
              <EmptyGraphState 
                show={!isProcessing && (!currentSession?.messages || currentSession.messages.length === 0)}
                onSubmit={handleSubmit}
              />
              {currentSession?.messages?.map((message) => (
                <GraphMessage key={message.id} message={message} />
              ))}
              {isProcessing && <LoadingMessage />}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-white">
            <div className="max-w-5xl mx-auto w-full px-4 py-4">
              <AIInputWithSearch
                onSubmit={handleSubmit}
                submitted={isProcessing}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 text-red-500 text-center">
            {error}
          </div>
        )}
      </div>

      {/* Right side - Desmos Calculator */}
      <div className="w-1/2 bg-white">
        <DesmosCalculator 
          ref={calculatorRef} 
          className="w-full h-full" 
          onReady={handleCalculatorReady}
          key={currentSession?.id} // Force remount when session changes
        />
      </div>
    </div>
  );
} 
