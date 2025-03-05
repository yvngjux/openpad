'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  content: string;
  role: string;
  type: 'regular' | 'cursus';
}

interface File {
  id: string;
  name: string;
  spaceId: string;
  type: 'regular' | 'cursus';
  messages: Message[];
}

interface Space {
  id: string;
  name: string;
  files: File[];
  isExpanded: boolean;
  isDefault?: boolean;
}

interface SpaceContextType {
  spaces: Space[];
  selectedSpace: string | null;
  selectedFile: string | null;
  createSpace: (name: string) => Space;
  createFile: (name: string, type: 'regular' | 'cursus', spaceId?: string) => File;
  getDefaultSpace: () => Space;
  setSelectedSpace: (id: string | null) => void;
  setSelectedFile: (id: string | null) => void;
  toggleSpaceExpanded: (id: string) => void;
  getFileById: (id: string) => File | undefined;
  getSpaceById: (id: string) => Space | undefined;
  addMessageToFile: (fileId: string, message: { content: string; role: string } | { content: string; role: string }[]) => void;
  getCurrentFileMessages: () => Message[];
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: ReactNode }) {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Initialize default space on first load
  useEffect(() => {
    if (spaces.length === 0) {
      const defaultSpace: Space = {
        id: uuidv4(),
        name: 'My Chats',
        files: [],
        isExpanded: true,
        isDefault: true
      };
      setSpaces([defaultSpace]);
      setSelectedSpace(defaultSpace.id);
    }
  }, []);

  const getDefaultSpace = () => {
    return spaces.find(space => space.isDefault) || spaces[0];
  };

  const createSpace = (name: string): Space => {
    const newSpace: Space = {
      id: uuidv4(),
      name,
      files: [],
      isExpanded: true
    };
    setSpaces(prev => [...prev, newSpace]);
    return newSpace;
  };

  const createFile = (name: string, type: 'regular' | 'cursus', spaceId?: string): File => {
    const targetSpaceId = spaceId || getDefaultSpace().id;
    const newFile: File = {
      id: uuidv4(),
      name,
      spaceId: targetSpaceId,
      type,
      messages: []
    };

    setSpaces(prev => prev.map(space => {
      if (space.id === targetSpaceId) {
        return {
          ...space,
          files: [...space.files, newFile]
        };
      }
      return space;
    }));

    setSelectedFile(newFile.id);
    return newFile;
  };

  const toggleSpaceExpanded = (id: string) => {
    setSpaces(prev => prev.map(space => {
      if (space.id === id) {
        return { ...space, isExpanded: !space.isExpanded };
      }
      return space;
    }));
  };

  const getFileById = (id: string): File | undefined => {
    for (const space of spaces) {
      const file = space.files.find(f => f.id === id);
      if (file) return file;
    }
    return undefined;
  };

  const getSpaceById = (id: string): Space | undefined => {
    return spaces.find(space => space.id === id);
  };

  const addMessageToFile = (fileId: string, message: { content: string; role: string } | { content: string; role: string }[]) => {
    const file = getFileById(fileId);
    if (!file) return;

    const messages = Array.isArray(message) ? message : [message];
    const newMessages: Message[] = messages.map(msg => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: msg.content,
      role: msg.role as 'user' | 'assistant',
      type: file.type
    }));

    setSpaces(prev => prev.map(space => ({
      ...space,
      files: space.files.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            messages: [...(f.messages || []), ...newMessages]
          };
        }
        return f;
      })
    })));
  };

  const getCurrentFileMessages = useCallback((): Message[] => {
    if (!selectedFile) return [];
    const file = getFileById(selectedFile);
    if (!file || !file.messages) return [];
    return file.messages;
  }, [selectedFile, spaces]);

  return (
    <SpaceContext.Provider value={{
      spaces,
      selectedSpace,
      selectedFile,
      createSpace,
      createFile,
      getDefaultSpace,
      setSelectedSpace,
      setSelectedFile,
      toggleSpaceExpanded,
      getFileById,
      getSpaceById,
      addMessageToFile,
      getCurrentFileMessages,
    }}>
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