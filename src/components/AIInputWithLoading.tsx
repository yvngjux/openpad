'use client';

import { CornerRightUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutoResizeTextarea } from "@/components/hooks/use-auto-resize-textarea";
import { useAnimatedPlaceholders } from "@/components/hooks/use-animated-placeholders";
import { AnimatePresence, motion } from "framer-motion";

interface AIInputWithLoadingProps {
  id?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string) => void | Promise<void>;
  className?: string;
  autoAnimate?: boolean;
  submitted?: boolean;
  onFocus?: () => void;
  usePlaceholders?: () => { currentPlaceholder: string };
  showDescription?: boolean;
}

export function AIInputWithLoading({
  id = "ai-input-with-loading",
  minHeight = 56,
  maxHeight = 200,
  onSubmit,
  className,
  autoAnimate = false,
  submitted: externalSubmitted = false,
  onFocus,
  usePlaceholders = useAnimatedPlaceholders,
  showDescription = true
}: AIInputWithLoadingProps) {
  const [inputValue, setInputValue] = useState("");
  const { currentPlaceholder } = usePlaceholders();
  
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = async () => {
    if (!inputValue.trim() || externalSubmitted) return;
    await onSubmit?.(inputValue);
    setInputValue("");
    adjustHeight(true);
  };

  return (
    <div className={cn("w-full py-4", className)} style={{ "--minHeight": `${minHeight}px` } as React.CSSProperties}>
      <div className="flex flex-col w-full gap-2">
        <div className="relative w-full">
          <Textarea
            id={id}
            placeholder={!autoAnimate ? "Enter your message..." : ""}
            className={cn(
              "w-full bg-black/5 dark:bg-white/5 rounded-2xl pl-6 pr-12 py-4",
              "placeholder:text-black/70 dark:placeholder:text-white/70",
              "border-none ring-black/30 dark:ring-white/30",
              "text-black dark:text-white resize-none text-wrap leading-[1.2]",
              "min-h-dynamic focus:ring-2 focus:ring-blue-500/50 transition-shadow",
              "text-base sm:text-lg"
            )}
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => {
              const newValue = e.target.value;
              setInputValue(newValue);
              adjustHeight();
              if (onFocus) {
                onFocus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            onFocus={() => {
              if (onFocus) {
                onFocus();
              }
            }}
            disabled={externalSubmitted}
          />
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <AnimatePresence mode="wait">
              {!inputValue && autoAnimate && (
                <motion.p
                  key={currentPlaceholder}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{
                    y: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="pl-6 pr-12 py-4 text-black/50 dark:text-white/50 text-base sm:text-lg truncate"
                >
                  {currentPlaceholder}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={handleSubmit}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 rounded-xl p-2",
              externalSubmitted ? "bg-none" : "bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10",
              "transition-all duration-200"
            )}
            type="button"
            disabled={externalSubmitted}
            aria-label={externalSubmitted ? "Processing..." : "Submit message"}
          >
            {externalSubmitted ? (
              <div
                className="w-5 h-5 bg-black dark:bg-white rounded-sm animate-spin transition duration-700"
                style={{ animationDuration: "1s" }}
              />
            ) : (
              <CornerRightUp
                className={cn(
                  "w-5 h-5 transition-all duration-200 dark:text-white",
                  inputValue ? "opacity-100 scale-100" : "opacity-30 scale-95"
                )}
              />
            )}
          </button>
        </div>
        {showDescription && (
          <p className="text-xs text-center text-black/70 dark:text-white/70">
            Hi, I&apos;m Carole, your AI assistant. I&apos;m here to help you learn and understand complex topics in a simple way.
          </p>
        )}
      </div>
    </div>
  );
} 