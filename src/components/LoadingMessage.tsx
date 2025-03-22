import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MessageLoading } from './MessageLoading';

const loadingMessages = [
  "Looking for data",
  "Gathering information",
  "Processing knowledge",
  "Analyzing context",
  "Generating response",
  "Organizing thoughts",
  "Connecting ideas"
];

export const LoadingMessage = () => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

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
            <Image
              src="/images/noetica_black.png"
              alt="Carole"
              fill
              className="object-cover p-1"
              priority
            />
          </div>
          <span className="text-sm text-gray-600">Carole</span>
        </div>
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
  );
}; 