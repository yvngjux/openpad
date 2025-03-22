import { Play } from 'lucide-react';

interface ExecuteBarProps {
  onExecute: () => void;
  isExecuting: boolean;
}

export function ExecuteBar({ onExecute, isExecuting }: ExecuteBarProps) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onExecute}
        disabled={isExecuting}
        className="flex items-center space-x-2 px-4 py-1.5 bg-black text-white rounded-lg hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {isExecuting ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        <span>{isExecuting ? 'Running...' : 'Run'}</span>
      </button>
    </div>
  );
} 