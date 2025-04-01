'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import React from 'react';

interface EmptyGraphStateProps {
  onSubmit: (message: string) => void;
  show?: boolean;
}

const suggestions = [
  'Create a bar chart showing monthly sales data',
  'Generate a pie chart of market share distribution',
  'Plot a line graph of temperature changes',
  'Visualize data with a scatter plot',
  'Make a histogram of age distribution',
  'Design a bubble chart of population data'
];

export function EmptyGraphState({ onSubmit, show = true }: EmptyGraphStateProps) {
  return (
    <AnimatePresence>
      {show && (
        <>
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

          {/* Graph Suggestions */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0 px-4 mb-4"
          >
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={index}
                    onClick={() => onSubmit(suggestion)}
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
        </>
      )}
    </AnimatePresence>
  );
} 