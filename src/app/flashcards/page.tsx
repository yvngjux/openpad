'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot, Copy, Check } from 'lucide-react';
import { AIInputWithSearch } from '@/components/AIInputWithSearch';
import Image from 'next/image';
import { useSpaces } from '@/contexts/SpaceContext';
import { Message, AttachedFile } from '@/types/chat';
import { FileUploadModal } from '@/components/FileUploadModal';
import { FileAttachment } from '@/components/FileAttachment';
import { cn } from '@/lib/utils';
import { extractFileContent } from '@/lib/fileUtils';
import { FlashcardCarousel } from '@/features/flashcards/components/FlashcardCarousel';
import { FlashcardDeck, FlashcardAPIResponse } from '@/features/flashcards/types';
import { FlashcardLoading } from '@/components/FlashcardLoading';

// Generate a unique ID for messages
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default function FlashcardsPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [currentDeck, setCurrentDeck] = useState<FlashcardDeck | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    logo: true,
    avatar: true
  });
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const {
    currentSession,
    createNewSession,
    setCurrentSession,
    addMessageToCurrentSession,
    spaces,
  } = useSpaces();

  const messages = currentSession?.messages || [];

  // Add useEffect for auto-scrolling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Initialize or restore session when component mounts
  useEffect(() => {
    if (!currentSession || currentSession.type !== 'flashcards') {
      const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
      if (!defaultSpace) return;
      
      // Find most recent flashcards session with a deck
      const existingFlashcardsSession = defaultSpace.files
        .filter(f => f.type === 'flashcards')
        .sort((a, b) => {
          const aTime = new Date(a.lastAccessedAt || a.updatedAt).getTime();
          const bTime = new Date(b.lastAccessedAt || b.updatedAt).getTime();
          return bTime - aTime;
        })[0];

      if (existingFlashcardsSession) {
        setCurrentSession(existingFlashcardsSession);
        // Find and set the current deck
        const lastDeckMessage = [...existingFlashcardsSession.messages]
          .reverse()
          .find(msg => msg.type === 'flashcards' && msg.deck);
        
        if (lastDeckMessage?.deck) {
          setCurrentDeck(lastDeckMessage.deck);
        }
      } else {
        // Create a new flashcards session
        const newSession = createNewSession('flashcards');
        setCurrentSession(newSession);
      }
    }
  }, []);  // Remove dependencies to only run on mount

  const handleFilesSelected = async (files: File[]) => {
    const processedFiles: AttachedFile[] = [];
    
    for (const file of files) {
      try {
        const content = await extractFileContent(file);
        if (content.startsWith('❌')) {
          console.error(`Error processing file ${file.name}:`, content);
          continue;
        }
        
        processedFiles.push({ 
          file, 
          content,
          type: file.type === 'application/pdf' ? 'pdf' : 'text'
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }
    
    setAttachedFiles(prev => [...prev, ...processedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (inputValue: string, withSearch: boolean) => {
    if ((!inputValue.trim() && attachedFiles.length === 0) || isProcessing) return;

    try {
      setIsProcessing(true);
      
      // Ensure we have a flashcards session
      let session = currentSession;
      if (!session || session.type !== 'flashcards') {
        session = createNewSession('flashcards');
      }

      // Create user's message
      const userMessage: Message = {
        id: generateUniqueId(),
        content: inputValue,
        role: 'user',
        type: 'flashcards',
        timestamp: new Date().toISOString()
      };

      // Add user's message to the session
      const updatedMessages = [...(session.messages || []), userMessage];
      const updatedSession = {
        ...session,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
        lastAccessedAt: new Date().toISOString()
      };
      setCurrentSession(updatedSession);

      // Check if this is a request for detailed explanation
      if (inputValue.trim().toLowerCase() === 'yes') {
        const lastExplainedFlashcard = sessionStorage.getItem('lastExplainedFlashcard');
        if (lastExplainedFlashcard) {
          const { question, answer } = JSON.parse(lastExplainedFlashcard);
          const detailPrompt = `Provide a detailed explanation of this concept, including examples and deeper insights:\n\nQuestion: "${question}"\nAnswer: "${answer}"\n\nPlease structure your response with sections like Introduction, Main Concepts, Examples, and Additional Details. Use markdown formatting for better readability.`;
          
          // Create user's message
          const userMessage: Message = {
            id: generateUniqueId(),
            content: 'Yes, please provide a detailed explanation.',
            role: 'user',
            type: 'flashcards'
          };

          // Add user's message to the session
          const updatedMessages = [...session.messages, userMessage];
          setCurrentSession({
            ...session,
            messages: updatedMessages
          });

          setIsProcessing(true);

          try {
            const response = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: detailPrompt,
                isBriefExplanation: false,
                sessionType: 'flashcards'
              }),
            });

            const data = await response.json();
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            // Create assistant's response message with proper formatting
            const assistantMessage: Message = {
              id: generateUniqueId(),
              content: `Here's a detailed explanation:\n\n${data.response.replace(/\*\*(.*?)\*\*/g, '**$1**').replace(/\n/g, '\n\n')}`,
              role: 'assistant',
              type: 'flashcards'
            };

            // Update session with both messages
            const finalMessages = [...updatedMessages, assistantMessage];
            setCurrentSession({
              ...session,
              messages: finalMessages
            });
          } catch (error) {
            console.error('Error getting detailed explanation:', error);
            const errorMessage: Message = {
              id: generateUniqueId(),
              content: "I apologize, but I'm having trouble providing a detailed explanation right now. Please try again.",
              role: 'assistant',
              type: 'flashcards'
            };
            
            const finalMessages = [...updatedMessages, errorMessage];
            setCurrentSession({
              ...session,
              messages: finalMessages
            });
          } finally {
            setIsProcessing(false);
          }

          return;
        }
      }

      // Parse input for number of cards
      let topic = inputValue;
      let numCards = 8; // default
      
      // Check for patterns like "5 cards about X" or "X with 5 cards"
      const cardCountRegex = /(\d+)\s*cards?\s*(about|on|for|of)?\s*(.+)|(.+)\s*(with|using)\s*(\d+)\s*cards?/i;
      const match = inputValue.match(cardCountRegex);
      
      if (match) {
        if (match[1]) { // "5 cards about X" pattern
          numCards = parseInt(match[1]);
          topic = match[3];
        } else if (match[6]) { // "X with 5 cards" pattern
          numCards = parseInt(match[6]);
          topic = match[4];
        }
        
        // Ensure reasonable limits
        numCards = Math.min(Math.max(numCards, 1), 20);
      }

      try {
        const response = await fetch('/api/flashcards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            topic,
            numCards,
          }),
        });

        const data: FlashcardAPIResponse = await response.json();

        if (data.success && data.deck) {
          // Create assistant's response message with the flashcards
          const assistantMessage: Message = {
            id: generateUniqueId(),
            content: "Here are your flashcards:",
            role: 'assistant',
            type: 'flashcards',
            deck: data.deck // Store the deck with the message
          };

          // Update session with both user and assistant messages
          const finalMessages = [...updatedMessages, assistantMessage];
          setCurrentSession({
            ...session,
            messages: finalMessages
          });
          setCurrentDeck(data.deck);
        } else {
          const errorMessage: Message = {
            id: generateUniqueId(),
            content: data.error || 'Failed to generate flashcards.',
            role: 'assistant',
            type: 'flashcards',
          };
          
          // Update session with both user and error messages
          const finalMessages = [...updatedMessages, errorMessage];
          setCurrentSession({
            ...session,
            messages: finalMessages
          });
        }
      } catch (error: any) {
        let errorMessage = "I apologize, but I'm having trouble processing your request. ";
        
        if (error.status === 503) {
          errorMessage += "The AI service is temporarily unavailable. Please try again in a few moments.";
        } else {
          errorMessage += "There was an error generating flashcards. Please try again.";
        }

        const errorAiMessage: Message = {
          id: generateUniqueId(),
          content: errorMessage,
          role: 'assistant',
          type: 'flashcards'
        };

        // Update session with both user and error messages
        const finalMessages = [...updatedMessages, errorAiMessage];
        setCurrentSession({
          ...session,
          messages: finalMessages
        });
      }

      setIsProcessing(false);
      setAttachedFiles([]);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsProcessing(false);
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {!currentSession ? (
          <>
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-5xl mx-auto p-8">
                {/* Welcome Section */}
                <div className="text-center mb-12">
                  <div className="mb-4">
                    <div className="inline-block mb-4 relative w-24 h-24 rounded-xl">
                      {imagesLoaded.logo ? (
                        <Image
                          src="/images/noetica.png"
                          alt="Noetica Logo"
                          fill
                          className="object-contain p-2"
                          onError={() => setImagesLoaded(prev => ({ ...prev, logo: false }))}
                          onLoad={() => setImagesLoaded(prev => ({ ...prev, logo: true }))}
                          priority
                        />
                      ) : (
                        <Bot className="w-12 h-12 text-gray-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </div>
                    <h1 className="text-3xl font-mono mb-2">What would you like to create flashcards about?</h1>
                    <p className="text-gray-600 text-sm bg-gray-50/80 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                      Tip: You can specify the number of cards by saying "5 cards about [topic]" or "[topic] with 5 cards"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto p-4 space-y-6">
                {messages && messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    } w-full`}
                  >
                    <div className={`flex flex-col ${
                      message.role === 'assistant' ? 'pr-4 items-start' : 'pl-4 items-end'
                    } max-w-[70%] w-full`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="w-8 h-8 relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                            {imagesLoaded.avatar ? (
                              <Image
                                src="/images/noetica_black.png"
                                alt="Carole"
                                fill
                                className="object-cover p-1"
                                onError={() => setImagesLoaded(prev => ({ ...prev, avatar: false }))}
                                onLoad={() => setImagesLoaded(prev => ({ ...prev, avatar: true }))}
                                priority
                              />
                            ) : (
                              <Bot className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <span className="text-sm text-gray-600">Carole</span>
                        </div>
                      )}
                      <div
                        className={`${
                          message.role === 'user'
                            ? 'bg-gray-100 border border-gray-200 text-gray-800 p-4 rounded-2xl'
                            : 'bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl text-gray-800'
                        }`}
                      >
                        <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                          {message.content.split('\n').map((line, i) => {
                            // Handle bold text
                            const parts = line.split(/(\*\*.*?\*\*)/g);
                            return (
                              <div key={i} className={i > 0 ? 'mt-4' : ''}>
                                {parts.map((part, j) => {
                                  if (part.startsWith('**') && part.endsWith('**')) {
                                    return (
                                      <span key={j} className="font-semibold">
                                        {part.slice(2, -2)}
                                      </span>
                                    );
                                  }
                                  return <span key={j}>{part}</span>;
                                })}
                              </div>
                            );
                          })}
                        </div>
                        {message.deck && (
                          <div className="mt-6">
                            <FlashcardCarousel
                              cards={message.deck.cards}
                              onExplainRequest={async (question, answer) => {
                                // Store for potential detailed explanation later
                                sessionStorage.setItem('lastExplainedFlashcard', JSON.stringify({ question, answer }));
                                
                                // Create brief explanation request
                                const briefPrompt = `Explain this concept briefly:\n\nQuestion: "${question}"\nAnswer: "${answer}"`;
                                
                                // Create user's message for brief explanation
                                const userMessage: Message = {
                                  id: generateUniqueId(),
                                  content: `Can you explain this flashcard?\n\nQuestion: "${question}"\nAnswer: "${answer}"`,
                                  role: 'user',
                                  type: 'flashcards'
                                };

                                // Add user's message to the session
                                const updatedMessages = [...messages, userMessage];
                                setCurrentSession({
                                  ...currentSession!,
                                  messages: updatedMessages
                                });

                                setIsProcessing(true);

                                try {
                                  const response = await fetch('/api/chat', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      message: briefPrompt,
                                      isBriefExplanation: true,
                                      sessionType: 'flashcards'
                                    }),
                                  });

                                  const data = await response.json();
                                  
                                  if (data.error) {
                                    throw new Error(data.error);
                                  }
                                  
                                  // Create assistant's response message with proper formatting
                                  const assistantMessage: Message = {
                                    id: generateUniqueId(),
                                    content: `Here's a brief explanation:\n\n${data.response.replace(/\*\*(.*?)\*\*/g, '**$1**').replace(/\n/g, '\n\n')}\n\nWould you like a more detailed STEM-style explanation? Type 'yes' to learn more.`,
                                    role: 'assistant',
                                    type: 'flashcards'
                                  };

                                  // Update session with both messages
                                  const finalMessages = [...updatedMessages, assistantMessage];
                                  setCurrentSession({
                                    ...currentSession!,
                                    messages: finalMessages
                                  });
                                } catch (error) {
                                  console.error('Error getting brief explanation:', error);
                                  const errorMessage: Message = {
                                    id: generateUniqueId(),
                                    content: "I apologize, but I'm having trouble providing an explanation right now. Please try again.",
                                    role: 'assistant',
                                    type: 'flashcards'
                                  };
                                  
                                  const finalMessages = [...updatedMessages, errorMessage];
                                  setCurrentSession({
                                    ...currentSession!,
                                    messages: finalMessages
                                  });
                                } finally {
                                  setIsProcessing(false);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <button
                          onClick={() => handleCopyMessage(message.content, message.id)}
                          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                          aria-label="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && <FlashcardLoading />}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </>
        )}

        {/* Input Area */}
        <div className="flex-shrink-0 bg-white">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-start py-4">
              {attachedFiles.length > 0 && (
                <div className="absolute top-4 left-4 right-32 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                  <div className="flex items-center gap-2 pr-4 min-w-min" style={{ maxWidth: '75vw' }}>
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex-shrink-0">
                        <FileAttachment
                          fileName={file.file.name}
                          fileType={file.file.type}
                          onRemove={() => handleRemoveFile(index)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className={cn("w-full", attachedFiles.length > 0 && "pt-12")}>
                <AIInputWithSearch
                  onSubmit={handleSubmit}
                  onFileSelect={() => setIsUploadModalOpen(true)}
                  submitted={isProcessing}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFilesSelected={handleFilesSelected}
      />
    </div>
  );
} 