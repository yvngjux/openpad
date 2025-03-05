'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useSpaces } from '@/contexts/SpaceContext';

interface SaveChatDialogProps {
  type: 'regular' | 'cursus';
  onSave: (name: string, spaceId: string) => void;
  onClose: () => void;
  defaultName?: string;
}

export const SaveChatDialog: React.FC<SaveChatDialogProps> = ({
  type,
  onSave,
  onClose,
  defaultName = ''
}) => {
  const [fileName, setFileName] = useState(defaultName);
  const { spaces, selectedSpace } = useSpaces();

  const handleSave = () => {
    if (!fileName.trim()) return;
    
    if (spaces.length === 0) {
      // If no spaces exist, create a default one
      onSave(fileName, 'default');
    } else if (selectedSpace) {
      // If a space is selected, save to that space
      onSave(fileName, selectedSpace);
    } else {
      // If spaces exist but none selected, save to first space
      onSave(fileName, spaces[0].id);
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur-[6px] bg-white/40 flex items-center justify-center z-50">
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 w-[400px] border border-gray-200/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Name Your {type === 'cursus' ? 'Cursus' : ''} Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chat Name
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter a name for your chat..."
              className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>

          {spaces.length > 0 && !selectedSpace && (
            <div>
              <label htmlFor="space-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Space
              </label>
              <select
                id="space-select"
                value={selectedSpace || spaces[0].id}
                onChange={(e) => onSave(fileName, e.target.value)}
                className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select a space for your chat"
              >
                {spaces.map(space => (
                  <option key={space.id} value={space.id}>
                    {space.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
              disabled={!fileName.trim()}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 