import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const flashcardSuggestions = [
  "Create flashcards for biology terms",
  "Help me study for my math exam",
  "Generate vocabulary flashcards",
  "Make flashcards for historical dates"
];

interface EmptyFlashcardsStateProps {
  onSuggestionClick: (suggestion: string) => void;
  show: boolean;
}

export function EmptyFlashcardsState({ onSuggestionClick, show }: EmptyFlashcardsStateProps) {
  return (
    <AnimatePresence>
      {show && (
        <div className="h-full flex flex-col items-center justify-center relative">
          {/* Background Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="relative w-48 h-48">
              <Image
                src="/images/noetica.png"
                alt="OpenPad Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>

          {/* Flashcard Suggestions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0 px-4"
          >
            <div className="max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-3">
                {flashcardSuggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => onSuggestionClick(suggestion)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex px-4 py-3 text-left bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
} 