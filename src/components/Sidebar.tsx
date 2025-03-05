'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Settings,
  HelpCircle,
  Home,
  Plus,
  Folder,
  FileText,
  X,
  Code,
  ChevronDown,
  Search,
  Shield,
  Bell,
  ChevronRight,
  Bot
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpaces } from '@/contexts/SpaceContext';
import { Input } from '@/components/ui/input';
import { ExpandableTabs } from '@/components/ui/expandable-tabs';
import { useRouter } from 'next/navigation';

type ChatType = 'regular' | 'cursus';

interface FileIconProps {
  type: ChatType;
}

const isChatType = (type: unknown): type is ChatType => {
  return type === 'cursus' || type === 'regular';
};

const FileIcon: React.FC<FileIconProps> = ({ type }) => {
  if (type === 'cursus') {
    return <Code className="w-4 h-4" />;
  }
  return <Bot className="w-4 h-4" />;
};

export default function Sidebar() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'folder' | 'file'>('folder');
  const [newItemName, setNewItemName] = useState('');

  const {
    spaces,
    selectedSpace,
    selectedFile,
    setSelectedSpace,
    setSelectedFile,
    createSpace,
    createFile,
    toggleSpaceExpanded
  } = useSpaces();

  const handleCreateItem = () => {
    if (!newItemName.trim()) return;

    if (newItemType === 'folder') {
      createSpace(newItemName);
    } else if (newItemType === 'file' && selectedSpace) {
      createFile(newItemName, 'regular', selectedSpace);
    }

    setNewItemName('');
    setIsCreateModalOpen(false);
  };

  return (
    <>
      <div className="h-screen w-[280px] bg-[#f7f7f7] border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center">
          <h1 className="text-xl font-semibold text-gray-800">Hi, Julien</h1>
        </div>

        {/* Search Bar */}
        <div className="px-4 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 pr-16 bg-gray-50/50 border-gray-200/80 hover:border-gray-300 focus:border-gray-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border bg-gray-50 px-1.5 font-mono text-[10px] font-medium text-gray-500">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        {/* Main Links */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <Link 
              href="/cursus" 
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                setSelectedFile(null);
                router.replace('/cursus');
              }}
            >
              <Code className="w-5 h-5" />
              <span>Cursus</span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
              onClick={(e) => {
                e.preventDefault();
                const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
                const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const newFile = createFile(`Chat ${timestamp}`, 'regular', defaultSpace.id);
                toggleSpaceExpanded(defaultSpace.id);
                setSelectedSpace(defaultSpace.id);
                setSelectedFile(newFile.id);
                router.replace('/');
              }}
            >
              <Bot className="w-5 h-5" />
              <span>Chat</span>
            </Link>
          </div>

          <div className="px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">Spaces</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1 hover:bg-gray-200/50 rounded-lg transition-colors text-gray-600"
                aria-label="Create new space or chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Spaces List */}
            <div className="space-y-1">
              {spaces.map(space => (
                <div key={space.id} className="px-3">
                  <div 
                    className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer ${
                      selectedSpace === space.id ? 'bg-gray-200/50' : ''
                    }`}
                  >
                    <button
                      onClick={() => toggleSpaceExpanded(space.id)}
                      className="p-1 hover:bg-gray-200/50 rounded transition-colors"
                      aria-label={space.isExpanded ? "Collapse folder" : "Expand folder"}
                    >
                      {space.isExpanded ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </button>
                    <div 
                      className="flex-1 flex items-center space-x-2"
                      onClick={() => setSelectedSpace(space.id)}
                    >
                      <Folder className="w-5 h-5" />
                      <span>{space.name}</span>
                    </div>
                  </div>
                  <AnimatePresence initial={false}>
                    {space.isExpanded && space.files.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="ml-6 mt-1 space-y-1"
                      >
                        {space.files.map((file) => (
                          <motion.div
                            key={file.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Link
                              href={file.type === 'cursus' ? '/cursus' : '/'}
                              className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer ${
                                selectedFile === file.id ? 'bg-gray-200/70 font-medium' : ''
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedFile(file.id);
                                router.replace(file.type === 'cursus' ? '/cursus' : '/');
                              }}
                            >
                              {isChatType(file.type) ? <FileIcon type={file.type} /> : <FileText className="w-4 h-4" />}
                              <span className="text-sm truncate">{file.name}</span>
                            </Link>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Links */}
        <div className="border-t border-gray-200 p-3">
          <div className="flex flex-col gap-4">
            <ExpandableTabs
              tabs={[
                { title: "Home", icon: Home, href: "/" },
                { title: "Notifications", icon: Bell, href: "/notifications" },
                { type: "separator" },
                { title: "Settings", icon: Settings, href: "/settings" },
                { title: "Support", icon: HelpCircle, href: "/support" },
                { title: "Security", icon: Shield, href: "/security" },
              ]}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 backdrop-blur-[6px] bg-white/40 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 w-[400px] border border-gray-200/50"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Create New {newItemType === 'folder' ? 'Space' : 'Chat'}
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as 'folder' | 'file')}
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Select item type"
                  >
                    <option value="folder">Space (Folder)</option>
                    <option value="file">Chat (File)</option>
                  </select>
                </div>

                {newItemType === 'file' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Space</label>
                    <select
                      value={selectedSpace || ''}
                      onChange={(e) => setSelectedSpace(e.target.value)}
                      className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Select space for chat"
                    >
                      <option value="">Select a space...</option>
                      {spaces.map(space => (
                        <option key={space.id} value={space.id}>{space.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Enter ${newItemType === 'folder' ? 'space' : 'chat'} name...`}
                    className="w-full px-3 py-2 bg-white/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateItem}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/90 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
} 