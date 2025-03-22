'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface MCQProps {
  topic: string;
  questions: MCQQuestion[];
  isOpen: boolean;
  onClose: () => void;
}

export function MCQ({ topic, questions, isOpen, onClose }: MCQProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return; // Prevent changing answer after selection
    setSelectedAnswer(index);
    if (index === questions[currentIndex].correctAnswer) {
      setScore(score + 1);
    }
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Multiple Choice Quiz: {topic}
          </DialogTitle>
          <DialogDescription className="text-center">
            Test your knowledge about {topic}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-6 py-6">
          <div className="text-center text-sm text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="text-lg font-semibold">
            {questions[currentIndex].question}
          </div>
          <div className="space-y-3">
            {questions[currentIndex].options.map((option, index) => (
              <Button
                key={index}
                variant={
                  selectedAnswer === null
                    ? 'outline'
                    : index === questions[currentIndex].correctAnswer
                    ? 'secondary'
                    : selectedAnswer === index
                    ? 'destructive'
                    : 'outline'
                }
                className="w-full justify-start text-left"
                onClick={() => handleAnswerSelect(index)}
                disabled={selectedAnswer !== null}
              >
                <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
                {selectedAnswer !== null &&
                  index === questions[currentIndex].correctAnswer && (
                    <CheckCircle className="ml-auto h-4 w-4 text-green-500" />
                  )}
                {selectedAnswer === index &&
                  index !== questions[currentIndex].correctAnswer && (
                    <XCircle className="ml-auto h-4 w-4 text-red-500" />
                  )}
              </Button>
            ))}
          </div>
          {showExplanation && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold">Explanation:</p>
              <p>{questions[currentIndex].explanation}</p>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Score: {score}/{questions.length}
            </div>
            {currentIndex < questions.length - 1 ? (
              <Button
                onClick={handleNext}
                disabled={selectedAnswer === null}
                className="ml-auto"
              >
                Next Question
              </Button>
            ) : (
              <Button
                onClick={handleRestart}
                disabled={selectedAnswer === null}
                className="ml-auto"
              >
                Restart Quiz
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 