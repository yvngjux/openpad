import React, { useRef, useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Paperclip, Send } from "lucide-react";

export interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit: (value: string, withSearch: boolean) => void;
  onFileSelect?: () => void;
  className?: string;
  submitted?: boolean;
  autoAnimate?: boolean;
}

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "Ask me anything...",
  minHeight = 48,
  maxHeight = 164,
  onSubmit,
  onFileSelect,
  className,
  submitted = false,
  autoAnimate = false
}: AIInputWithSearchProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const focusTextarea = () => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    focusTextarea();

    if (!submitted) {
      focusTextarea();
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('button') && !target.closest('a')) {
        focusTextarea();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [submitted]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted) return;

    const trimmedValue = value.trim();
    if (!trimmedValue) return;

    onSubmit(trimmedValue, showSearch);
    setValue('');
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className={cn("w-full py-4", className)}>
        <div className="relative max-w-5xl w-full mx-auto">
          <div className="relative flex flex-col">
            <textarea
              id={id}
              value={value}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-xl px-4 py-3 pr-32 bg-white border border-gray-200 text-gray-900",
                "placeholder:text-gray-500 resize-none focus-visible:outline-none focus-visible:ring-1",
                "focus-visible:ring-gray-300 leading-[1.2] min-h-[48px] max-h-[164px] overflow-y-auto"
              )}
              ref={textareaRef}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              disabled={submitted}
              aria-label="Message input"
            />

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className={cn(
                  "rounded-full transition-all flex items-center gap-2 px-1.5 py-1 border h-8",
                  showSearch
                    ? "bg-blue-500/15 border-blue-400 text-blue-500"
                    : "bg-gray-100 border-transparent text-gray-400 hover:text-gray-600"
                )}
                aria-label="Toggle web search"
                title="Toggle web search"
              >
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <motion.div
                    animate={{
                      rotate: showSearch ? 180 : 0,
                      scale: showSearch ? 1.1 : 1,
                    }}
                    whileHover={{
                      rotate: showSearch ? 180 : 15,
                      scale: 1.1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 10,
                      },
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 25,
                    }}
                  >
                    <Globe
                      className={cn(
                        "w-4 h-4",
                        showSearch
                          ? "text-blue-500"
                          : "text-inherit"
                      )}
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {showSearch && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{
                        width: "auto",
                        opacity: 1,
                      }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm overflow-hidden whitespace-nowrap text-blue-500 flex-shrink-0"
                    >
                      Search
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <button
                type="button"
                onClick={onFileSelect}
                className="rounded-lg hover:bg-gray-100 transition-colors p-2"
                aria-label="Upload files"
                title="Upload files"
              >
                <Paperclip className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
              </button>

              <button
                type="submit"
                disabled={!value.trim() || submitted}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  value.trim() && !submitted
                    ? "bg-blue-500/15 text-blue-500"
                    : "bg-gray-100 text-gray-400 hover:text-gray-600"
                )}
                aria-label="Send message"
                title="Send message"
              >
                {submitted ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 