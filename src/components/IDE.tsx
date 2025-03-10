'use client';

import { useEffect, useState } from 'react';

interface IDEProps {
  className?: string;
}

export const IDE = ({ className }: IDEProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const codeServerUrl = process.env.NEXT_PUBLIC_CODE_SERVER_URL || 'http://localhost:8080';

  useEffect(() => {
    // Add any initialization logic here
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${className}`}>
      <iframe
        src={codeServerUrl}
        className="w-full h-full border-none"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}; 