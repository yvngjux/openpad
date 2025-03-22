'use client';

import { Button } from './ui/button';
import { Brain, BookOpen } from 'lucide-react';

interface StudyToolButtonProps {
  type: 'flashcards' | 'mcq';
  onClick: () => void;
}

export function StudyToolButton({ type, onClick }: StudyToolButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="mt-4 w-full max-w-[300px] h-12 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
    >
      {type === 'flashcards' ? (
        <>
          <BookOpen className="w-5 h-5" />
          <span>Open Flashcards</span>
        </>
      ) : (
        <>
          <Brain className="w-5 h-5" />
          <span>Start Quiz</span>
        </>
      )}
    </Button>
  );
} 