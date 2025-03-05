'use client';

import { AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface CursusExtensionWarningProps {
  onClose?: () => void;
}

export const CursusExtensionWarning = ({ onClose }: CursusExtensionWarningProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100 rounded-xl">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Cursus Extension Required
            </h3>
            <p className="text-gray-600 mb-4">
              To enable full IDE integration and allow Cursus to read, write, and edit your files, please install and activate the Cursus extension:
            </p>
            <div className="bg-orange-50 rounded-xl p-4 space-y-3">
              <h4 className="font-medium text-orange-900">Installation Steps:</h4>
              <ol className="list-decimal list-inside space-y-2 text-orange-800">
                <li>Click the Extensions icon in the left sidebar (or press Cmd/Ctrl + Shift + X)</li>
                <li>Search for &quot;Cursus&quot; in the extensions marketplace</li>
                <li>Click &quot;Install&quot; on the Cursus extension</li>
                <li>Once installed, click &quot;Enable&quot; to activate the extension</li>
                <li>When prompted, allow the extension to access your workspace</li>
              </ol>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <p>
                The extension is required for Cursus to:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Read your code files</li>
                <li>Make edits and improvements</li>
                <li>Track file changes in real-time</li>
                <li>Provide accurate code suggestions</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Remind me later
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}; 