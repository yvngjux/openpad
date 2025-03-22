'use client';

import { useState, useEffect, useRef } from 'react';
import { Bot } from 'lucide-react';
import { AIInputWithSearch } from '@/components/AIInputWithSearch';
import { CursusExtensionWarning } from './CursusExtensionWarning';
import { checkCursusExtension } from '@/lib/utils/extension-checker';
import { useSpaces } from '@/contexts/SpaceContext';
import { useCursusPlaceholders } from '@/lib/hooks/use-cursus-placeholders';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type MessageRole = 'user' | 'assistant';

interface Message {
  id: string;
  content: string;
  role: MessageRole;
  type: 'regular' | 'cursus';
}

export const CursusChatInterface = () => {
  const router = useRouter();
  const mounted = useRef(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExtensionWarning, setShowExtensionWarning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState({
    logo: true,
    avatar: true
  });

  const {
    selectedFile,
    createFile,
    addMessageToFile,
    setSelectedFile,
    getCurrentFileMessages,
    getFileById,
    spaces,
    setSelectedSpace
  } = useSpaces();

  // Check if the selected file is a Cursus file
  const selectedFileData = selectedFile ? getFileById(selectedFile) : null;
  const isValidCursusFile = selectedFileData?.type === 'cursus';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Clear selected file if it's not a Cursus file
  useEffect(() => {
    if (selectedFile && !isValidCursusFile && mounted.current) {
      setSelectedFile(null);
    }
  }, [selectedFile, isValidCursusFile, setSelectedFile]);

  // Update effect to use router
  useEffect(() => {
    if (selectedFile && mounted.current) {
      const currentFile = spaces.flatMap(s => s.files).find(f => f.id === selectedFile);
      if (currentFile?.type !== 'cursus') {
        router.replace('/');
      }
    }
  }, [selectedFile, spaces, router]);

  const messages = getCurrentFileMessages().filter(msg => msg.type === 'cursus');

  const checkForIDERelatedQuery = (input: string): boolean => {
    const ideKeywords = [
      'ide', 'editor', 'edit', 'read', 'write', 'file', 'code', 'open',
      'show', 'modify', 'change', 'update', 'delete', 'create', 'extension'
    ];
    return ideKeywords.some(keyword => input.toLowerCase().includes(keyword));
  };

  const handleSubmit = async (inputValue: string) => {
    if (!inputValue.trim() || isProcessing) return;

    // Check if the query is IDE-related
    if (checkForIDERelatedQuery(inputValue)) {
      const isExtensionActive = await checkCursusExtension();
      if (!isExtensionActive) {
        setShowExtensionWarning(true);
        return;
      }
    }

    try {
      setIsProcessing(true);

      // Create both messages upfront
      const messages = [
        {
          id: Date.now().toString(),
          content: inputValue,
          role: 'user',
          type: 'cursus'
        },
        {
          id: Date.now().toString(),
          content: 'This is a simulated AI response. You can replace this with your actual AI service call.',
          role: 'assistant',
          type: 'cursus'
        }
      ];

      // Create file if this is the first message
      if (!selectedFile || !isValidCursusFile) {
        const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newFile = createFile(`Cursus Chat ${timestamp}`, 'cursus', defaultSpace.id);
        addMessageToFile(newFile.id, messages);
        setSelectedSpace(defaultSpace.id);
        setSelectedFile(newFile.id);
      } else {
        addMessageToFile(selectedFile, messages);
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('Error processing message:', error);
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    // File selection is handled within the AIInputWithSearch component
    // We just need this to satisfy the prop type
  };

  return (
    <div className="h-full flex flex-col">
      {showExtensionWarning && (
        <CursusExtensionWarning onClose={() => setShowExtensionWarning(false)} />
      )}
      
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-8">
            {/* Welcome Section */}
            <div className="text-center mb-12">
              <div className="mb-4">
                <div className="inline-block mb-4 relative w-24 h-24">
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
                <h1 className="text-3xl font-mono mb-2 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">Welcome to Cursus Assistant</h1>
                <p className="text-gray-600">I can help you with your coding tasks, explain concepts, and provide guidance.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Chat Header */}
          <div className="py-4">
            <div className="max-w-5xl mx-auto px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Cursus
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto p-4 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div className={`flex flex-col max-w-[70%] ${
                    message.role === 'assistant' ? 'pr-4' : 'pl-4'
                  }`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-8 h-8 relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {imagesLoaded.avatar ? (
                            <Image
                              src="/images/noetica_black.png"
                              alt="Noetica Logo"
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
                        <span className="text-sm text-gray-600">Cursus</span>
                      </div>
                    )}
                    <div
                      className={`${
                        message.role === 'user'
                          ? 'bg-black text-white p-4 rounded-2xl ml-auto'
                          : 'bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl text-gray-800'
                      }`}
                    >
                      <p className={`text-[15px] leading-relaxed ${
                        message.role === 'assistant' ? 'max-w-[600px]' : ''
                      }`}>
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Input Area */}
      <div className="mt-auto">
        <div className="max-w-5xl mx-auto px-4">
          <AIInputWithSearch 
            onSubmit={handleSubmit}
            onFileSelect={handleFileSelect}
            submitted={isProcessing}
            placeholder="Ask me anything..."
            autoAnimate={messages.length === 0}
          />
          <p className="text-xs text-center text-gray-600 pb-4">
            Hi, I&apos;m Cursus, your coding AI assistant. I&apos;m here to help you write better code and understand programming concepts.
          </p>
        </div>
      </div>
    </div>
  );
};