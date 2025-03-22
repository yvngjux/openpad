'use client';

import * as React from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AiInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function AiInput({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  placeholder = 'Type your message...'
}: AiInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex space-x-2">
      <div className="relative flex-1">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10 min-h-[56px] bg-white/50 backdrop-blur-sm"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}
      </div>
      <Button 
        type="submit"
        size="lg"
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-sm"
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <span>Send</span>
            <Send className="w-4 h-4 ml-2" />
          </>
        )}
      </Button>
    </form>
  );
} 