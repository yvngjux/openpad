'use client';

import { useState } from 'react';
import { useSpaces } from '@/contexts/SpaceContext';
import { FolderSelectionDialog } from './FolderSelectionDialog';

interface SaveFileDialogProps {
  onSave: (name: string, spaceId: string) => void;
  onClose: () => void;
  type: 'regular' | 'cursus';
}

export const SaveFileDialog = ({
  onSave,
  onClose,
  type
}: SaveFileDialogProps) => {
  const [fileName, setFileName] = useState('');
  const [showFolderSelection, setShowFolderSelection] = useState(false);
  const { spaces } = useSpaces();

  const handleSave = () => {
    if (!fileName.trim()) return;

    // If there's only the default space, use it
    if (spaces.length === 1) {
      onSave(fileName, spaces[0].id);
      onClose();
      return;
    }

    // If there are multiple spaces, show folder selection
    setShowFolderSelection(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Save Chat
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
                Chat Name
              </label>
              <input
                type="text"
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter chat name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-sm text-gray-500">
              This chat will be saved as a {type === 'cursus' ? 'Cursus' : 'Regular'} chat file.
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!fileName.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      {showFolderSelection && (
        <FolderSelectionDialog
          type={type}
          onSelect={(spaceId) => {
            onSave(fileName, spaceId);
            onClose();
          }}
          onClose={() => setShowFolderSelection(false)}
        />
      )}
    </>
  );
}; 