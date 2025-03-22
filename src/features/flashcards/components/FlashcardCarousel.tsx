'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Flashcard } from '../types';

interface FlashcardCarouselProps {
  cards: Flashcard[];
  onClose?: () => void;
  onCardComplete?: (cardId: string, isCorrect: boolean) => void;
  onExplainRequest?: (question: string, answer: string) => void;
  isLoading?: boolean;
}

export const FlashcardCarousel: React.FC<FlashcardCarouselProps> = ({
  cards,
  onClose,
  onCardComplete,
  onExplainRequest,
  isLoading = false,
}) => {
  const [selectedCard, setSelectedCard] = useState<Flashcard | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset selected card when cards change
  React.useEffect(() => {
    setSelectedCard(null);
  }, [cards]);

  const showAnswer = (card: Flashcard) => {
    if (!isDragging) {
      setSelectedCard(card);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
        <p className="text-gray-500">Generating your flashcards...</p>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="w-full max-w-[800px] mx-auto flex flex-col items-center justify-center min-h-[400px] text-gray-500">
        No flashcards available
      </div>
    );
  }

  const renderModal = () => (
    <AnimatePresence>
      {selectedCard && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            style={{ 
              zIndex: 40,
              position: 'fixed',
              top: '64px', // Height of the navbar
              left: '240px', // Width of the sidebar
              right: 0,
              bottom: 0,
            }}
            onClick={() => setSelectedCard(null)}
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: 50 }}
          >
            <div 
              className="w-[400px] bg-white rounded-2xl p-8 shadow-xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCard(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100
                         transition-colors duration-200"
                aria-label="Close answer modal"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              <div className="space-y-6">
                <div className="text-sm text-gray-500 uppercase tracking-wider">Question</div>
                <div className="text-lg font-medium text-gray-800">
                  {selectedCard.question}
                </div>

                <div className="h-px bg-gray-200" />

                <div className="text-sm text-gray-500 uppercase tracking-wider">Answer</div>
                <div className="text-lg font-medium text-gray-800">
                  {selectedCard.answer}
                </div>

                <div className="h-px bg-gray-200" />

                <button
                  onClick={() => {
                    onExplainRequest?.(selectedCard.question, selectedCard.answer);
                    setSelectedCard(null); // Close the modal
                  }}
                  className="w-full py-3 px-4 bg-white hover:bg-gray-50 
                           text-gray-900 font-medium rounded-lg
                           border border-grey
                           transition-all duration-200 ease-in-out
                           flex items-center justify-center space-x-2"
                >
                  <span>Explain</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="relative w-full overflow-hidden">
        <motion.div
          ref={containerRef}
          className="flex space-x-12 px-6"
          drag="x"
          dragConstraints={{
            left: -((cards.length - 1) * (200 + 48)),
            right: 0
          }}
          dragElastic={0}
          dragMomentum={false}
          dragTransition={{ power: 0.4 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
          style={{ cursor: "grab" }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className={cn(
                "flex-shrink-0 w-[200px] h-[400px] bg-white rounded-xl p-6",
                "flex items-center justify-center text-center",
                "transition-all duration-200 ease-in-out",
                "border border-gray-200 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]",
                "hover:shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] hover:border-gray-300"
              )}
              onClick={() => showAnswer(card)}
              whileHover={{ 
                y: -2,
                transition: { duration: 0.2 }
              }}
              initial={false}
            >
              <div className="text-base font-medium text-gray-800 leading-relaxed">
                {card.question.split(' ')
                  .reduce((acc: string[], word, i) => {
                    if (i > 0 && i % 3 === 0) {
                      acc.push('\n');
                    }
                    acc.push(word);
                    return acc;
                  }, [])
                  .join(' ')
                }
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {mounted && createPortal(renderModal(), document.body)}
    </div>
  );
}; 