'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FlashcardLoading } from './FlashcardLoading';

interface FlashcardData {
  front: string;
  back: string;
}

interface FlashcardsProps {
  topic: string;
  cards: FlashcardData[];
  isOpen: boolean;
  onClose: () => void;
  isLoading?: boolean;
}

export function Flashcards({ topic, cards, isOpen, onClose, isLoading = false }: FlashcardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Always render the Dialog to maintain consistent animation
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isLoading ? (
          <div className="min-h-[300px] flex items-center justify-center">
            <FlashcardLoading />
          </div>
        ) : !cards || cards.length === 0 ? (
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Error Loading Flashcards
            </DialogTitle>
            <DialogDescription className="text-center text-red-500">
              No flashcards available. Please try again.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <div className="space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                {topic}
              </DialogTitle>
              <DialogDescription className="text-center">
                Card {currentIndex + 1} of {cards.length}
              </DialogDescription>
            </DialogHeader>

            <div 
              className="relative min-h-[200px] bg-white rounded-xl p-6 shadow-sm border cursor-pointer select-none"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div className="text-center text-lg">
                {isFlipped ? cards[currentIndex].back : cards[currentIndex].front}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  handlePrevious();
                }}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(false);
                  handleNext();
                }}
                disabled={currentIndex === cards.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  function handleNext() {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
  }

  function handlePrevious() {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
  }
} 