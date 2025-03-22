import { useEffect, useRef, useState } from "react";

const codingQuestions = [
  "How do I debug this function?",
  "Can you explain this code snippet?",
  "How can I optimize this algorithm?",
  "What's the best way to structure this component?",
  "Help me understand this error message",
  "How do I use Git branches effectively?",
  "Explain this design pattern",
  "What are the best practices for error handling?",
  "How can I improve my code readability?",
  "Help me refactor this code",
  "What's the difference between let and const?",
  "How do I implement authentication?",
];

export function useCursusAnimatedPlaceholders() {
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