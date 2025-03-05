'use client';

import { Folder } from 'lucide-react';
import { useSpaces } from '@/contexts/SpaceContext';

interface FolderSelectionDialogProps {
  onSelect: (spaceId: string) => void;
  onClose: () => void;
  type: 'regular' | 'cursus';
}

export const FolderSelectionDialog = ({
  onSelect,
  onClose,
  type
}: FolderSelectionDialogProps) => {
  const { spaces } = useSpaces();

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Select Folder to Save Chat
        </h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {spaces.map((space) => (
            <button
              key={space.id}
              onClick={() => {
                onSelect(space.id);
                onClose();
              }}
              className="w-full flex items-center gap-3 p-3 hover:bg-gray-100 rounded-xl transition-colors text-left"
            >
              <div className="p-2 bg-gray-100 rounded-lg">
                <Folder className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{space.name}</p>
                <p className="text-sm text-gray-500">
                  {space.files.filter(f => f.type === type).length} {type === 'cursus' ? 'Cursus' : 'Regular'} chats
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}; 