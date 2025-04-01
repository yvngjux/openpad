'use client';

import Image from 'next/image';
import React from 'react';
import { AIInputWithSearch } from './AIInputWithSearch';

interface EmptyGraphStateProps {
  onSubmit: (message: string) => void;
}

const suggestions = [
  'Create a bar chart showing monthly sales data',
  'Generate a pie chart of market share distribution',
  'Plot a line graph of temperature changes',
  'Visualize data with a scatter plot',
  'Make a histogram of age distribution',
  'Design a bubble chart of population data'
];

export function EmptyGraphState({ onSubmit }: EmptyGraphStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 relative">
      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <Image
          src="/images/noetica.png"
          alt="OpenPad Logo"
          width={192}
          height={192}
          className="opacity-10"
          priority
        />
      </div>

      <div className="w-full max-w-2xl space-y-8 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSubmit(suggestion)}
              className="p-4 text-left bg-white/50 hover:bg-white/80 border border-gray-200 rounded-xl transition-colors duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <AIInputWithSearch onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
} 