import React, { useEffect, useRef, useState } from 'react';

interface DesmosCalculatorProps {
  expression?: string;
  className?: string;
  onClose?: () => void;
}

export const DesmosCalculator: React.FC<DesmosCalculatorProps> = ({ expression, className, onClose }) => {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const calculatorInstance = useRef<any>(null);
  const [currentExpression, setCurrentExpression] = useState(expression || '');

  // Helper function to process mathematical commands
  const processCommand = (expr: string) => {
    if (!calculatorInstance.current) return;

    // Remove existing expressions
    calculatorInstance.current.removeExpressions();

    // Process special commands
    if (expr.startsWith('derivative')) {
      const func = expr.replace('derivative', '').trim();
      calculatorInstance.current.setExpression({ id: 'original', latex: func, color: '#1a73e8' });
      calculatorInstance.current.setExpression({ id: 'derivative', latex: `\\frac{d}{dx}(${func})`, color: '#d93025' });
    } else if (expr.startsWith('integrate')) {
      const func = expr.replace('integrate', '').trim();
      calculatorInstance.current.setExpression({ id: 'original', latex: func, color: '#1a73e8' });
      calculatorInstance.current.setExpression({ id: 'integral', latex: `\\int ${func} dx`, color: '#137333' });
    } else if (expr.startsWith('solve')) {
      const equation = expr.replace('solve', '').trim();
      calculatorInstance.current.setExpression({ id: 'equation', latex: equation, color: '#1a73e8' });
    } else {
      // Regular expression
      calculatorInstance.current.setExpression({ id: 'graph1', latex: expr });
    }
  };

  useEffect(() => {
    if (!calculatorRef.current) return;

    // Load Desmos script dynamically
    const script = document.createElement('script');
    script.src = 'https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
    script.async = true;
    script.onload = () => {
      if (!calculatorRef.current) return;
      
      // Initialize calculator with settings matching the inspiration
      calculatorInstance.current = Desmos.GraphingCalculator(calculatorRef.current, {
        expressions: true,
        expressionsCollapsed: false,
        settingsMenu: false,
        zoomButtons: true,
        lockViewport: false,
        border: false,
        keypad: false,
        expressionsTopbar: false,
        backgroundColor: '#ffffff',
        defaultExpression: false,
        administerSecretFolders: false,
        images: false,
        folders: false,
        notes: false,
        sliders: false,
        links: false,
        showGrid: true,
        showXAxis: true,
        showYAxis: true,
        xAxisNumbers: true,
        yAxisNumbers: true,
        polarNumbers: false,
        restrictGridToFirstQuadrant: false,
        restrictedFunctions: false,
        trace: false,
        points: false,
        lines: false,
        fill: false,
        fontSize: 16,
        expressionsWidth: 240,
        language: 'en',
        gridOpacity: 0.75,
        textColor: '#000000',
        labelSize: 1,
        projectorMode: false,
        authorFeatures: false,
        plotSingleVariableImplicitEquations: false,
        plotImplicits: false,
        plotInequalities: true,
        colors: true
      });

      // Add helper text
      calculatorInstance.current.setExpression({
        id: 'helper',
        latex: '\\text{Available commands:}\\\\\\text{derivative, integrate, solve}',
        color: '#70757a',
        hidden: true
      });

      // Set expression if provided
      if (expression) {
        processCommand(expression);
        setCurrentExpression(expression);
      }

      // Apply custom styles to match inspiration
      const container = calculatorRef.current.querySelector('.dcg-container');
      if (container) {
        container.setAttribute('style', `
          --dcg-expression-background: #e8f0fe;
          --dcg-expression-color: #1a73e8;
          --dcg-expression-selected: #1967d2;
          --dcg-expression-error: #d93025;
          --dcg-expression-border: transparent;
          --dcg-expression-margin: 4px;
          --dcg-expression-font-family: 'Roboto', sans-serif;
        `);
      }
    };

    document.head.appendChild(script);

    return () => {
      if (calculatorInstance.current) {
        calculatorInstance.current.destroy();
      }
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (calculatorInstance.current && expression && expression !== currentExpression) {
      processCommand(expression);
      setCurrentExpression(expression);
    }
  }, [expression, currentExpression]);

  return (
    <div className="fixed right-4 top-4 z-50 bg-white rounded-lg shadow-lg w-[600px] overflow-hidden">
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg leading-none hover:bg-gray-100 rounded-lg w-6 h-6 flex items-center justify-center transition-colors"
        >
          ×
        </button>
      </div>
      <div 
        ref={calculatorRef} 
        className="w-full h-[400px]"
      />
    </div>
  );
}; 