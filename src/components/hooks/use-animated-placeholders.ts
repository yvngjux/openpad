import { useEffect, useRef, useState } from "react";

const stemQuestions = [
  "What is the relationship between force and acceleration?",
  "How does DNA replication work?",
  "Explain the concept of quantum entanglement",
  "What causes the greenhouse effect?",
  "How do neural networks learn patterns?",
  "What is the role of mitochondria in cells?",
  "Explain the theory of relativity",
  "How do black holes form?",
  "What is the significance of the Fibonacci sequence?",
  "How does photosynthesis work?",
  "What are the applications of calculus in real life?",
  "Explain the process of protein synthesis",
];

export function useAnimatedPlaceholders() {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % stemQuestions.length);
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
    currentPlaceholder: stemQuestions[currentPlaceholder],
  };
} 