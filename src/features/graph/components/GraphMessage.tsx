'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Bot, Copy, Check } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface GraphMessageProps {
  message: Message;
}

export function GraphMessage({ message }: GraphMessageProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const isUser = message.role === 'user';
  const [imagesLoaded, setImagesLoaded] = React.useState({
    avatar: true
  });

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast.success('Message copied to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
      toast.error('Failed to copy message');
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full`}>
      <div className={`flex flex-col ${isUser ? 'pl-4 items-end' : 'pr-4 items-start'} max-w-[70%] w-full`}>
        {!isUser && (
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-8 h-8 relative rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
              {imagesLoaded.avatar ? (
                <Image
                  src="/images/noetica_black.png"
                  alt="Assistant"
                  fill
                  className="object-cover p-1"
                  onError={() => setImagesLoaded(prev => ({ ...prev, avatar: false }))}
                  onLoad={() => setImagesLoaded(prev => ({ ...prev, avatar: true }))}
                  priority
                />
              ) : (
                <Bot className="w-5 h-5 text-gray-600" />
              )}
            </div>
            <span className="text-sm text-gray-600">Carole</span>
          </div>
        )}
        <div
          className={cn(
            isUser
              ? 'bg-gray-100 border border-gray-200 text-gray-800 p-4 rounded-2xl'
              : 'bg-gray-50/80 backdrop-blur-sm p-4 rounded-2xl text-gray-800'
          )}
        >
          <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        <div className="mt-1 flex justify-end">
          <button
            onClick={() => handleCopyMessage(message.content, message.id)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Copy message"
          >
            {copiedMessageId === message.id ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4 text-gray-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 