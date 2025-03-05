'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Square,
  LineChart,
  Leaf,
  Bot,
  X
} from 'lucide-react';
import { AIInputWithLoading } from './AIInputWithLoading';
import Image from 'next/image';
import { useSpaces } from '@/contexts/SpaceContext';
import { useRouter } from 'next/navigation';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  type: 'regular' | 'cursus';
}

interface QuickAction {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    icon: <Square className="w-6 h-6 text-gray-800" />,
    title: 'Teach me about the Quadratic Formula',
    description: 'Learn the mathematical concepts'
  },
  {
    icon: <LineChart className="w-6 h-6 text-gray-800" />,
    title: 'Graph the Derivative of f(x) = x^2',
    description: 'Visualize mathematical functions'
  },
  {
    icon: <Leaf className="w-6 h-6 text-gray-800" />,
    title: 'Explain the structure of a plant cell',
    description: 'Understand biology concepts'
  }
];

export default function ChatInterface() {
  const router = useRouter();
  const mounted = useRef(true);
  const [imagesLoaded, setImagesLoaded] = useState({
    logo: true,
    avatar: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const {
    spaces,
    selectedSpace,
    selectedFile,
    createSpace,
    createFile,
    getCurrentFileMessages,
    addMessageToFile,
    setSelectedFile,
    setSelectedSpace
  } = useSpaces();

  const messages = getCurrentFileMessages();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (selectedFile && mounted.current) {
      const currentFile = spaces.flatMap(s => s.files).find(f => f.id === selectedFile);
      if (currentFile?.type === 'cursus') {
        router.replace('/cursus');
      }
    }
  }, [selectedFile, spaces, router]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (mounted.current) {
      setIsLoading(true);
      timeoutId = setTimeout(() => {
        if (mounted.current) {
          setIsLoading(false);
        }
      }, 100);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [selectedFile]);

  if (isLoading) {
    return null;
  }

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (inputValue: string) => {
    if (!inputValue.trim() || isProcessing) return;

    try {
      setIsProcessing(true);

      // Create both messages upfront
      const messages = [
        {
          id: generateUniqueId(),
          content: inputValue,
          role: 'user',
          type: 'regular'
        },
        {
          id: generateUniqueId(),
          content: 'This is a simulated AI response.',
          role: 'assistant',
          type: 'regular'
        }
      ];

      // Create file if this is the first message
      if (!selectedFile) {
        const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newFile = createFile(`Chat ${timestamp}`, 'regular', defaultSpace.id);
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

  const handleQuickAction = (action: QuickAction) => {
    handleSubmit(action.title);
  };

  const getGreeting = () => {
    if (spaces.length === 0) {
      return "Let's start by creating your first space!";
    }
    return "What would you like to learn about today?";
  };

  // Show empty state if no file is selected
  if (!selectedFile) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="flex-1 overflow-y-auto">
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
                <h1 className="text-3xl font-mono mb-2">{getGreeting()}</h1>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:border-gray-400 transition-all duration-200 text-left group shadow-sm hover:shadow-md"
                >
                  <div className="mb-3 group-hover:scale-110 transition-transform duration-200">
                    {action.icon}
                  </div>
                  <h3 className="text-gray-800 font-medium mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
            <AIInputWithLoading 
              onSubmit={handleSubmit} 
              autoAnimate={true}
              submitted={isProcessing}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show chat messages if we have a selected file
  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {selectedFile ? spaces.find(s => s.id === selectedSpace)?.name || 'New Chat' : 'New Chat'}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 space-y-6">
          {messages && messages.map((message) => (
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
                    <span className="text-sm text-gray-600">Carole</span>
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

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <AIInputWithLoading 
            onSubmit={handleSubmit} 
            autoAnimate={messages.length === 0}
            submitted={isProcessing}
          />
        </div>
      </div>

      {/* Create Space Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-[6px] bg-white/40 flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 w-[400px] border border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Space</h2>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setNewSpaceName('');
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Space Name</label>
                <input
                  type="text"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  placeholder="Enter space name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewSpaceName('');
                  }}
                  className="px-4 py-2 text-white bg-black hover:bg-black/90 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (newSpaceName.trim()) {
                      createSpace(newSpaceName);
                      if (selectedFile) {
                        handleSubmit(selectedFile);
                      }
                      setIsCreateModalOpen(false);
                      setNewSpaceName('');
                    }
                  }}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 