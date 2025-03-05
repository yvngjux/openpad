'use client';

import { useEffect, useState } from 'react';

interface CursusIDEProps {
  className?: string;
}

export const CursusIDE = ({ className }: CursusIDEProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src="http://localhost:8080"
        title="Code Editor"
        className="w-full h-full border-none bg-[#1E1E1E]"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}; 