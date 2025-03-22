import { useEffect, useRef, useState } from "react";

const codingQuestions = [
  "How do I implement this feature?",
  "Can you explain this code pattern?",
  "Help me optimize this function",
  "What's the best way to structure this component?",
  "How can I fix this bug?",
  "Explain this error message",
  "How do I use this API?",
  "What are the best practices for this?",
  "Help me refactor this code",
  "How can I improve performance?",
  "What's the difference between these approaches?",
  "How do I test this component?"
];

export function useCursusPlaceholders() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % codingQuestions.length);
    }, 4000);
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    currentPlaceholder: codingQuestions[currentPlaceholder],
  };
} 