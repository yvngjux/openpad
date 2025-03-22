import { FlashcardDeck } from '@/features/flashcards/types';

export interface AttachedFile {
  file: File;
  content: string;
  type: 'pdf' | 'text';
}

export interface StudyTool {
  type: 'flashcards' | 'mcq';
  topic: string;
  data: any[];
  message: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  type: 'regular' | 'cursus' | 'flashcards' | 'chat';
  deck?: FlashcardDeck;
  attachedFiles?: AttachedFile[];
  studyTool?: StudyTool;
  timestamp?: string;
}

export interface ChatResponse {
  content?: string;
  type?: 'flashcards' | 'mcq';
  topic?: string;
  data?: any[];
  message?: string;
}

export interface MessageContentProps {
  message: Message;
  onTopicClick: (topic: string) => void;
} 