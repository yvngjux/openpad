'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Square,
  LineChart,
  Leaf,
  Bot,
  X,
  Paperclip,
  Copy,
  Check
} from 'lucide-react';
import { AIInputWithSearch } from './AIInputWithSearch';
import Image from 'next/image';
import { useSpaces } from '@/contexts/SpaceContext';
import { useRouter } from 'next/navigation';
import { DesmosCalculator } from './DesmosCalculator';
import { FileAttachment } from './FileAttachment';
import { cn } from '@/lib/utils';
import { extractFileContent } from '@/lib/fileUtils';
import { FileUploadModal } from './FileUploadModal';
import { generateChatResponse, generateCursusResponse } from '@/services/groq';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Flashcards } from './Flashcards';
import { MCQ } from './MCQ';
import { StudyToolButton } from './StudyToolButton';
import { Message, ChatResponse, StudyTool, AttachedFile } from '@/types/chat';
import { LoadingMessage } from './LoadingMessage';
import { EmptyChatState } from './EmptyChatState';

interface FileAttachmentProps {
  fileName: string;
  fileType: string;
  showRemoveButton?: boolean;
  onRemove?: () => void;
}

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ChatFile {
  id: string;
  name: string;
  type: 'regular';
  spaceId: string;
}

interface MessageContentProps {
  message: Message;
  onTopicClick: (topic: string) => void;
  onStudyToolClick: () => void;
  showStudyTool: boolean;
  onCloseStudyTool: () => void;
  isProcessing: boolean;
}

const MessageContent = ({ 
  message, 
  onTopicClick, 
  onStudyToolClick, 
  showStudyTool, 
  onCloseStudyTool,
  isProcessing 
}: MessageContentProps) => {
  // Remove local state and handlers since they're now passed from parent
  
  // Function to highlight @ commands in messages
  const formatMessageContent = (content: string) => {
    // Match @command patterns
    const parts = content.split(/(@(?:flashcards|mcq)[^\n]*)/);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span
            key={index}
            className="bg-blue-100 text-blue-700 rounded px-1"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h2:text-xl prose-h3:text-lg prose-p:text-[15px] prose-p:leading-relaxed prose-strong:font-semibold prose-pre:bg-gray-100 prose-pre:p-2 prose-pre:rounded">
        {message.role === 'user' ? (
          <div>{formatMessageContent(message.content)}</div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {/* Always render study tool button if studyTool exists */}
      {message.studyTool && (
        <div className="flex justify-center">
          <StudyToolButton
            type={message.studyTool.type}
            onClick={onStudyToolClick}
          />
        </div>
      )}
    </div>
  );
};

export default function ChatInterface() {
  const router = useRouter();
  const mounted = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [imagesLoaded, setImagesLoaded] = useState({
    logo: true,
    avatar: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [graphExpression, setGraphExpression] = useState<string>('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [showStudyTool, setShowStudyTool] = useState(false);
  const [currentStudyTool, setCurrentStudyTool] = useState<StudyTool | undefined>();

  const {
    spaces,
    selectedSpace,
    getCurrentFileMessages,
    addMessageToFile,
    currentSession,
    createNewSession,
    addMessageToCurrentSession,
    setCurrentSession
  } = useSpaces();

  const messages = currentSession?.messages || [];

  // Create a new session immediately if there isn't one
  useEffect(() => {
    if (!currentSession) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  // Add useEffect for auto-scrolling
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  const handleFilesSelected = async (files: File[]) => {
    const processedFiles: AttachedFile[] = [];
    
    for (const file of files) {
      try {
        const content = await extractFileContent(file);
        
        // If content starts with ❌, it's an error message
        if (content.startsWith('❌')) {
          console.error(`Error processing file ${file.name}:`, content);
          continue;
        }

        // Determine file type
        let fileType: 'pdf' | 'text' = 'text';
        if (file.type === 'application/pdf') {
          fileType = 'pdf';
        }
        
        processedFiles.push({ 
          file, 
          content,
          type: fileType
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

  const detectStudyTool = (message: string): { type: 'flashcards' | 'mcq' | null; query: string } => {
    const flashcardsMatch = message.match(/@flashcards\s+(.*)/i);
    const mcqMatch = message.match(/@mcq\s+(.*)/i);

    if (flashcardsMatch) {
      return { type: 'flashcards', query: flashcardsMatch[1] };
    } else if (mcqMatch) {
      return { type: 'mcq', query: mcqMatch[1] };
    }

    return { type: null, query: message };
  };

  const handleSubmit = async (inputValue: string, withSearch: boolean) => {
    if (!inputValue.trim() && attachedFiles.length === 0 || isProcessing) return;

    // Set loading state immediately
    setIsProcessing(true);

    try {
      // Detect if this is a study tool request first
      const { type: studyToolType, query } = detectStudyTool(inputValue);
      
      // If it's a flashcard request, show the modal immediately with loading state
      if (studyToolType === 'flashcards') {
        setShowStudyTool(true);
      }

      // Ensure we have a current session
      let session = currentSession;
      if (!session) {
        session = createNewSession();
      }
      
      // Create user message
      const userMessage: Message = {
        id: generateUniqueId(),
        content: inputValue,
        role: 'user',
        type: 'chat',
        attachedFiles: attachedFiles
      };

      // Add the user message to the current session first
      const updatedMessages = [...(session.messages || []), userMessage];
      const updatedSession = {
        ...session,
        messages: updatedMessages
      };
      setCurrentSession(updatedSession);

      // Clear attached files
      setAttachedFiles([]);

      // Scroll to bottom to show loading state
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // Prepare messages for API with file content
      const messageHistory = updatedMessages.map(msg => {
        const baseMessage = {
          role: msg.role,
          content: msg.content
        };

        if (msg.id === userMessage.id && msg.attachedFiles?.length) {
          const fileContents = msg.attachedFiles.map(file => 
            `[File: ${file.file.name}]\n${file.content}\n\n`
          ).join('');
          
          return {
            ...baseMessage,
            content: `${msg.content}\n\nAttached Files:\n${fileContents}`
          };
        }

        return baseMessage;
      });

      try {
        // Generate AI response using API with web search flag
        const response = await generateChatResponse(messageHistory, withSearch) as ChatResponse;
        
        // Create the AI message based on whether it's a study tool response
        let aiMessage: Message;
        if (response.type === 'flashcards' || response.type === 'mcq') {
          const studyTool: StudyTool = {
            type: response.type,
            topic: response.topic || query,
            data: response.data || [],
            message: response.content || response.message || `I've generated ${response.type} about ${query}. Click the button below to study them.`
          };
          
          aiMessage = {
            id: generateUniqueId(),
            content: studyTool.message,
            role: 'assistant',
            type: 'chat',
            studyTool
          };
          
          setCurrentStudyTool(studyTool);
          // Don't hide the study tool if it's already showing (for flashcards)
          if (studyToolType !== 'flashcards') {
            setShowStudyTool(false);
          }
        } else {
          aiMessage = {
            id: generateUniqueId(),
            content: response.content || response as string,
            role: 'assistant',
            type: 'chat'
          };
        }

        // Add AI message to the current session
        addMessageToCurrentSession([userMessage, aiMessage]);
      } catch (error: any) {
        // Handle API errors
        let errorMessage = "I apologize, but I'm having trouble processing your request. ";
        
        if (error.status === 503) {
          errorMessage += "The AI service is temporarily unavailable. Please try again in a few moments.";
        } else {
          errorMessage += "There was an error generating a response. Please try again.";
        }

        const errorAiMessage: Message = {
          id: generateUniqueId(),
          content: errorMessage,
          role: 'assistant',
          type: 'chat'
        };

        addMessageToCurrentSession([userMessage, errorAiMessage]);
        // Close study tool modal if there's an error
        setShowStudyTool(false);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Close study tool modal if there's an error
      setShowStudyTool(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleTopicClick = async (topic: string) => {
    await handleSubmit(topic, false);
  };

  const handleStudyToolClick = () => {
    setShowStudyTool(true);
  };

  const handleCloseStudyTool = () => {
    setShowStudyTool(false);
  };

  const handleSuggestionClick = async (suggestion: string) => {
    await handleSubmit(suggestion, false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto relative">
          <div className="max-w-5xl mx-auto p-4 space-y-6">
            <EmptyChatState 
              show={!isProcessing && (!messages || messages.length === 0)}
              onSuggestionClick={handleSuggestionClick}
            />
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
                  {message.attachedFiles && message.attachedFiles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {message.attachedFiles.map((attachment: AttachedFile, index: number) => (
                        <FileAttachment
                          key={index}
                          fileName={attachment.file.name}
                          fileType={attachment.file.type}
                          showRemoveButton={false}
                        />
                      ))}
                    </div>
                  )}
                  <div
                    className={`${
                      message.role === 'user'
                        ? 'bg-gray-100 border border-gray-200 text-gray-800 p-4 rounded-2xl'
                        : 'bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl text-gray-800'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <MessageContent 
                        message={message} 
                        onTopicClick={handleTopicClick}
                        onStudyToolClick={handleStudyToolClick}
                        showStudyTool={showStudyTool}
                        onCloseStudyTool={handleCloseStudyTool}
                        isProcessing={isProcessing}
                      />
                    ) : (
                      <div className="text-[15px] leading-relaxed">
                        {message.content}
                      </div>
                    )}
                  </div>
                  {message.role === 'assistant' && (
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(message.content);
                          const button = document.activeElement as HTMLButtonElement;
                          if (button) {
                            const icon = button.querySelector('svg');
                            if (icon) {
                              icon.classList.add('text-green-500');
                              setTimeout(() => icon.classList.remove('text-green-500'), 2000);
                            }
                          }
                        } catch (err) {
                          console.error('Failed to copy text:', err);
                        }
                      }}
                      className="self-start mt-2 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                      title="Copy message"
                    >
                      <Copy className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isProcessing && <LoadingMessage />}
            <div ref={messagesEndRef} />
          </div>
        </div>

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

      {/* Modals and Study Tools */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFilesSelected={handleFilesSelected}
      />
      
      {/* Only render Flashcards once, at the root level */}
      {currentStudyTool?.type === 'flashcards' && (
        <Flashcards
          topic={currentStudyTool.topic}
          cards={currentStudyTool.data}
          isOpen={showStudyTool}
          onClose={handleCloseStudyTool}
          isLoading={isProcessing && (!currentStudyTool.data || currentStudyTool.data.length === 0)}
        />
      )}
      
      {currentStudyTool?.type === 'mcq' && (
        <MCQ
          topic={currentStudyTool.topic}
          questions={currentStudyTool.data}
          isOpen={showStudyTool}
          onClose={handleCloseStudyTool}
        />
      )}
    </div>
  );
} 