'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import Script from 'next/script';

export interface DesmosCalculatorProps {
  className?: string;
  onReady?: () => void;
}

export interface DesmosCalculatorRef {
  addExpression: (latex: string, options?: any) => void;
  clearExpressions: () => void;
  updateSettings: (settings: CalculatorSettings) => void;
  setViewport: (bounds: ViewportBounds) => void;
}

export interface ExpressionOptions {
  color?: string;
  lineStyle?: 'SOLID' | 'DASHED' | 'DOTTED';
  lineWidth?: number;
  pointStyle?: 'POINT' | 'OPEN' | 'CROSS';
  hidden?: boolean;
  label?: string;
  showLabel?: boolean;
}

export interface ViewportBounds {
  left: number;
  right: number;
  bottom: number;
  top: number;
}

export interface CalculatorSettings {
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  squareAxes?: boolean;
  polarMode?: boolean;
  fontSize?: number;
}

declare global {
  interface Window {
    Desmos: any;
  }
}

export const DesmosCalculator = forwardRef<DesmosCalculatorRef, DesmosCalculatorProps>(({ className, onReady }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const initializationAttempts = useRef(0);

  // Load script directly in addition to Next.js Script component
  useEffect(() => {
    if (!window.Desmos && !document.querySelector('script[src*="calculator.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.8/calculator.js?apiKey=ac9b10c7ce5049fe9707849629c0197d';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      document.head.appendChild(script);
    } else if (window.Desmos) {
      setScriptLoaded(true);
    }
  }, []);

  // Initialize calculator
  useEffect(() => {
    const initCalculator = () => {
      if (!calculatorRef.current && containerRef.current && window.Desmos) {
        try {
          calculatorRef.current = window.Desmos.GraphingCalculator(containerRef.current, {
            apiKey: 'ac9b10c7ce5049fe9707849629c0197d',
            modules: true,
            expressions: true,
            keypad: true,
            graphpaper: true,
            administerSecretFolders: true,
            folders: true,
            notes: true,
            zoomButtons: true,
            expressionsTopbar: true,
            pointsOfInterest: true,
            trace: true,
            borders: true,
            labelsSide: true,
            singleVariableSolutions: true,
            complexSolutions: true,
            restrictedFunctions: false,
            superscript: true,
            subscript: true,
            advancedStyling: true,
            expressionsCollapsed: false,
            keypadMode: 'scientific',
            settingsMenu: false,
            expressionsTopbarCollapsed: false,
            expressionsBottombarCollapsed: false,
            keypadCollapsed: false,
            lockViewport: false,
            expressionsPosition: 'bottom'
          });
          onReady?.();
          return true;
        } catch (error) {
          console.error('Error initializing calculator:', error);
          return false;
        }
      }
      return false;
    };

    // Try to initialize immediately
    if (scriptLoaded && !calculatorRef.current) {
      const success = initCalculator();
      if (!success && initializationAttempts.current < 3) {
        // Retry after a short delay if failed
        const timer = setTimeout(() => {
          initializationAttempts.current += 1;
          initCalculator();
        }, 100);
        return () => clearTimeout(timer);
      }
    }

    // Cleanup on unmount
    return () => {
      if (calculatorRef.current) {
        try {
          calculatorRef.current.destroy();
          calculatorRef.current = null;
          initializationAttempts.current = 0;
        } catch (error) {
          console.error('Error destroying calculator:', error);
        }
      }
    };
  }, [scriptLoaded, onReady]);

  // Expose calculator methods to parent
  useImperativeHandle(ref, () => ({
    addExpression: (latex: string, options?: any) => {
      if (calculatorRef.current) {
        calculatorRef.current.setExpression({ latex, ...options });
      }
    },
    clearExpressions: () => {
      if (calculatorRef.current) {
        calculatorRef.current.setBlank();
      }
    },
    updateSettings: (settings: CalculatorSettings) => {
      if (calculatorRef.current) {
        Object.entries(settings).forEach(([key, value]) => {
          calculatorRef.current.setGraphSettings({ [key]: value });
        });
      }
    },
    setViewport: (bounds: ViewportBounds) => {
      if (calculatorRef.current) {
        calculatorRef.current.setViewport(bounds);
      }
    }
  }), []);

  return (
    <>
      <Script 
        src="https://www.desmos.com/api/v1.8/calculator.js?apiKey=ac9b10c7ce5049fe9707849629c0197d"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div 
        ref={containerRef} 
        className={className} 
        style={{ 
          minHeight: '500px', 
          width: '100%', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: 'white'
        }}
      />
    </>
  );
}); 