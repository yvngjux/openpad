import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageLoading } from './MessageLoading';
import Image from 'next/image';
import { Bot } from 'lucide-react';

const loadingMessages = [
  "Creating flashcards",
  "Organizing content",
  "Structuring questions",
  "Preparing study materials",
  "Generating answers",
  "Finalizing cards"
];

export const FlashcardLoading = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-start w-full">
      <div className="flex flex-col pr-4 items-start max-w-[70%] w-full">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-8 h-8 relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {imagesLoaded ? (
              <Image
                src="/images/noetica_black.png"
                alt="Carole"
                fill
                className="object-cover p-1"
                onError={() => setImagesLoaded(false)}
                onLoad={() => setImagesLoaded(true)}
                priority
              />
            ) : (
              <Bot className="w-5 h-5 text-gray-600" />
            )}
          </div>
          <span className="text-sm text-gray-600">Carole</span>
        </div>
        <div className="bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl text-gray-800">
          <div className="flex items-center space-x-3">
            <div className="h-6 overflow-hidden relative">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={currentMessageIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{
                    y: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="text-sm text-gray-700 whitespace-nowrap"
                >
                  {loadingMessages[currentMessageIndex]}
                </motion.div>
              </AnimatePresence>
            </div>
            
            {/* Animated dots */}
            <div className="flex items-center">
              <MessageLoading />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 