'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Message, AttachedFile } from '@/types/chat';

export interface File {
  id: string;
  name: string;
  type: 'regular' | 'cursus' | 'flashcards';
  spaceId: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  summary?: string;  // Auto-generated summary of the conversation
  title?: string;    // Auto-generated or user-set title
  lastAccessedAt?: string; // For sorting recent conversations
  metadata?: {
    model?: string;
    historyEnabled?: boolean;
    systemPrompt?: string;
  };
}

export interface Space {
  id: string;
  name: string;
  isDefault?: boolean;
  isExpanded?: boolean;
  files: File[];
  createdAt: string;
  updatedAt: string;
}

export interface SpaceContextType {
  spaces: Space[];
  selectedSpace: string | null;
  setSelectedSpace: (spaceId: string) => void;
  createSpace: (name: string) => Space;
  deleteSpace: (spaceId: string) => void;
  createFile: (name: string, type: 'regular' | 'cursus' | 'flashcards', spaceId: string) => File;
  deleteFile: (fileId: string) => void;
  getCurrentFileMessages: () => Message[];
  addMessageToFile: (messages: Message[]) => void;
  addMessageToCurrentSession: (messages: Message[]) => void;
  selectedFile: string | null;
  setSelectedFile: (fileId: string | null) => void;
  updateFileName: (fileId: string, newName: string) => void;
  updateSpaceName: (spaceId: string, newName: string) => void;
  getDefaultSpace: () => Space;
  getFileById: (fileId: string) => File | undefined;
  getSpaceById: (spaceId: string) => Space | undefined;
  toggleSpaceExpanded: (spaceId: string) => void;
  createNewSession: (type?: 'regular' | 'cursus' | 'flashcards') => File;
  currentSession: File | null;
  setCurrentSession: (session: File | null) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<File | null>(null);

  // Initialize default space and current session
  useEffect(() => {
    if (spaces.length === 0) {
      const defaultSpace: Space = {
        id: uuidv4(),
        name: 'My Chats',
        files: [],
        isDefault: true,
        isExpanded: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSpaces([defaultSpace]);
      
      // Create an initial session
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const initialSession: File = {
        id: uuidv4(),
        name: `Chat ${timestamp}`,
        type: 'regular',
        spaceId: defaultSpace.id,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setSpaces(prev => [{
        ...defaultSpace,
        files: [initialSession]
      }]);
      setCurrentSession(initialSession);
      setSelectedFile(initialSession.id);
      setSelectedSpace(defaultSpace.id);
    }
  }, []);

  // Auto-save current session when it changes
  useEffect(() => {
    if (currentSession) {
      setSpaces(prev =>
        prev.map(space =>
          space.id === currentSession.spaceId
            ? {
                ...space,
                files: space.files.map(f =>
                  f.id === currentSession.id ? currentSession : f
                )
              }
            : space
        )
      );
    }
  }, [currentSession]);

  const generateChatTitle = (messages: Message[]): string => {
    // If there are no messages, return a default title
    if (messages.length === 0) return 'New Chat';

    // Get all user messages
    const userMessages = messages.filter(msg => msg.role === 'user');
    if (userMessages.length === 0) return 'New Chat';

    // Get the first user message as it usually contains the main topic
    const firstUserMessage = userMessages[0].content;

    // Clean up the message
    let title = firstUserMessage
      .replace(/@\w+\s*/g, '')  // Remove @ commands
      .replace(/[^\w\s?]/g, '') // Remove special characters except ? and spaces
      .trim();

    // If it's a question, keep it as a question but make it concise
    if (title.toLowerCase().startsWith('what') || 
        title.toLowerCase().startsWith('how') || 
        title.toLowerCase().startsWith('why') || 
        title.toLowerCase().startsWith('can') || 
        title.toLowerCase().startsWith('explain')) {
      // Keep the question format but make it concise
      title = title.split(/[.!]|(?<=\?)/)[0].trim();
      // Ensure it ends with a question mark if it's a question
      if (!title.endsWith('?')) {
        title += '?';
      }
    } else {
      // For non-questions, make it a title-like format
      title = title
        .split(/[.!?]|\s+/)[0] // Take first sentence or phrase
        .split(' ')
        .slice(0, 6) // Take first 6 words max
        .join(' ')
        .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
    }

    // Limit length and add ellipsis if needed
    if (title.length > 40) {
      title = title.substring(0, 40).trim() + '...';
    }

    return title || 'New Chat';
  };

  const createNewSession = (type?: 'regular' | 'cursus' | 'flashcards') => {
    const defaultSpace = getDefaultSpace();
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sessionType = type || 'regular';

    // If we're creating a flashcards session, check if there's an active one
    if (sessionType === 'flashcards' && currentSession?.type === 'flashcards') {
      return currentSession;
    }

    const newSession: File = {
      id: uuidv4(),
      name: `${sessionType === 'flashcards' ? 'Flashcards' : 'Chat'} ${timestamp}`,
      type: sessionType,
      spaceId: defaultSpace.id,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      title: sessionType === 'flashcards' ? 'New Flashcards' : 'New Chat',
      metadata: {
        model: 'mixtral-8x7b-32768',
        historyEnabled: true,
        systemPrompt: sessionType === 'flashcards' 
          ? "You are a flashcard generation AI. You create clear, concise, and educational flashcards."
          : "Hi! I'm Carole, your STEM tutor and assistant."
      }
    };

    // Only create a new session if we don't have an active one of the same type
    if (!currentSession || currentSession.type !== sessionType) {
      setSpaces(prev =>
        prev.map(space =>
          space.id === defaultSpace.id
            ? { ...space, files: [...space.files, newSession] }
            : space
        )
      );

      setCurrentSession(newSession);
      setSelectedFile(newSession.id);
      setSelectedSpace(defaultSpace.id);
    }

    return newSession;
  };

  const addMessageToCurrentSession = (messages: Message[]) => {
    if (!currentSession) return;

    // Ensure messages are added only to sessions of matching type
    const newMessages = messages.map(msg => ({
      ...msg,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      type: currentSession.type // Ensure message type matches session type
    }));

    const updatedMessages = [...currentSession.messages, ...newMessages];
    
    // Generate title from the first user message if not already set
    let title = currentSession.title;
    if (!title && newMessages.some(msg => msg.role === 'user')) {
      const firstUserMessage = updatedMessages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        title = generateChatTitle([firstUserMessage]);
      }
    }

    const updatedSession = {
      ...currentSession,
      messages: updatedMessages,
      updatedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      title
    };

    // Update both the current session and the spaces state
    setCurrentSession(updatedSession);
    setSpaces(prev =>
      prev.map(space =>
        space.id === updatedSession.spaceId
          ? {
              ...space,
              files: space.files.map(f =>
                f.id === updatedSession.id ? updatedSession : f
              )
            }
          : space
      )
    );
  };

  const switchToSession = (fileId: string | null) => {
    if (!fileId) {
      setCurrentSession(null);
      setSelectedFile(null);
      setSelectedSpace(null);
      return;
    }

    const file = getFileById(fileId);
    if (!file) return;

    // If switching to a different session type, ensure we're not carrying over state
    if (currentSession && currentSession.type !== file.type) {
      sessionStorage.removeItem('lastExplainedFlashcard');
    }

    // Update the file's last accessed time
    const updatedFile = {
      ...file,
      lastAccessedAt: new Date().toISOString()
    };

    // Update the spaces state with the updated file
    setSpaces(prev =>
      prev.map(space =>
        space.id === updatedFile.spaceId
          ? {
              ...space,
              files: space.files.map(f =>
                f.id === fileId ? updatedFile : f
              )
            }
          : space
      )
    );

    // Set the current session and update selected states
    setCurrentSession(updatedFile);
    setSelectedFile(fileId);
    setSelectedSpace(updatedFile.spaceId);
  };

  const getDefaultSpace = () => {
    return spaces.find(s => s.isDefault) || spaces[0];
  };

  const getSpaceById = (id: string) => {
    return spaces.find(s => s.id === id);
  };

  const getFileById = (fileId: string) => {
    for (const space of spaces) {
      const file = space.files.find(f => f.id === fileId);
      if (file) return file;
    }
    return undefined;
  };

  const createSpace = (name: string): Space => {
    const newSpace: Space = {
      id: uuidv4(),
      name,
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSpaces(prev => [...prev, newSpace]);
    return newSpace;
  };

  const deleteSpace = (spaceId: string) => {
    setSpaces(prev => prev.filter(s => s.id !== spaceId));
  };

  const createFile = (name: string, type: 'regular' | 'cursus' | 'flashcards', spaceId: string): File => {
    const targetSpaceId = spaceId || getDefaultSpace().id;
    const newFile: File = {
      id: uuidv4(),
      name,
      spaceId: targetSpaceId,
      type,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSpaces(prev => {
      const newSpaces = prev.map(space =>
        space.id === targetSpaceId
          ? { ...space, files: [...space.files, newFile] }
          : space
      );
      return newSpaces;
    });

    return newFile;
  };

  const deleteFile = (fileId: string) => {
    setSpaces(prev =>
      prev.map(space => ({
        ...space,
        files: space.files.filter(f => f.id !== fileId)
      }))
    );
  };

  const getCurrentFileMessages = () => {
    if (!selectedFile) return [];
    
    // Find the file in all spaces
    for (const space of spaces) {
      const file = space.files.find(f => f.id === selectedFile);
      if (file) {
        return file.messages;
      }
    }
    
    return [];
  };

  const addMessageToFile = (messages: Message[]) => {
    // Find the file and its space
    let targetSpace: Space | undefined;
    let targetFile: File | undefined;

    for (const space of spaces) {
      const file = space.files.find(f => f.id === selectedFile);
      if (file) {
        targetSpace = space;
        targetFile = file;
        break;
      }
    }

    if (!targetSpace || !targetFile) {
      console.error(`File with ID ${selectedFile} not found`);
      return;
    }

    const newMessages: Message[] = messages.map(msg => {
      const { id: _, ...rest } = msg;
      return {
        id: uuidv4(),
        ...rest
      };
    });

    const updatedMessages = [...targetFile.messages, ...newMessages];
    
    // Generate title from the first user message if not already set
    let title = targetFile.title;
    if ((!title || title === 'New Chat') && newMessages.some(msg => msg.role === 'user')) {
      const firstUserMessage = updatedMessages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        title = generateChatTitle([firstUserMessage]);
      }
    }

    setSpaces(prev =>
      prev.map(space =>
        space.id === targetSpace!.id
          ? {
              ...space,
              files: space.files.map(f =>
                f.id === selectedFile
                  ? {
                      ...f,
                      messages: updatedMessages,
                      updatedAt: new Date().toISOString(),
                      lastAccessedAt: new Date().toISOString(),
                      title: title || f.title
                    }
                  : f
              )
            }
          : space
      )
    );
  };

  const updateFileName = (fileId: string, newName: string) => {
    setSpaces(prev =>
      prev.map(space => ({
        ...space,
        files: space.files.map(f =>
          f.id === fileId ? { ...f, name: newName } : f
        )
      }))
    );
  };

  const updateSpaceName = (spaceId: string, newName: string) => {
    setSpaces(prev =>
      prev.map(space =>
        space.id === spaceId ? { ...space, name: newName } : space
      )
    );
  };

  const toggleSpaceExpanded = (spaceId: string) => {
    setSpaces(prev =>
      prev.map(space =>
        space.id === spaceId
          ? { ...space, isExpanded: !space.isExpanded }
          : space
      )
    );
  };

  const value = {
    spaces,
    selectedSpace,
    setSelectedSpace,
    createSpace,
    deleteSpace,
    createFile,
    deleteFile,
    getCurrentFileMessages,
    addMessageToFile,
    addMessageToCurrentSession,
    selectedFile,
    setSelectedFile: switchToSession,
    updateFileName,
    updateSpaceName,
    getDefaultSpace,
    getFileById,
    getSpaceById,
    toggleSpaceExpanded,
    createNewSession,
    currentSession,
    setCurrentSession
  };

  return (
    <SpaceContext.Provider value={value}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpaces() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useSpaces must be used within a SpaceProvider');
  }
  return context;
} 