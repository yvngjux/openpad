export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  lastReviewed?: Date;
  nextReview?: Date;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  description?: string;
  cards: Flashcard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlashcardSession {
  deckId: string;
  currentCardIndex: number;
  correctAnswers: number;
  incorrectAnswers: number;
  startTime: Date;
  endTime?: Date;
}

export interface FlashcardAPIResponse {
  success: boolean;
  deck?: FlashcardDeck;
  error?: string;
} 