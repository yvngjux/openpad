'use client';

import { useState, createContext, useContext } from 'react';
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
  MessageSquare,
  Menu
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSpaces } from '@/contexts/SpaceContext';
import { Input } from '@/components/ui/input';
import { DockDemo } from '@/components/ui/dock-demo';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type ChatType = 'regular' | 'cursus' | 'flashcards';

interface FileIconProps {
  type: ChatType;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

const isChatType = (type: unknown): type is ChatType => {
  return type === 'cursus' || type === 'regular' || type === 'flashcards';
};

const FileIcon: React.FC<FileIconProps> = ({ type }) => {
  if (type === 'cursus') {
    return <Code className="w-4 h-4" />;
  }
  if (type === 'flashcards') {
    return <FileText className="w-4 h-4" />;
  }
  return <MessageSquare className="w-4 h-4" />;
};

interface SidebarProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function Sidebar({ isOpen, onOpenChange }: SidebarProps) {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newItemType, setNewItemType] = useState<'folder' | 'file'>('folder');
  const [newItemName, setNewItemName] = useState('');
  const [open, setOpen] = useState(true);

  const {
    spaces,
    selectedSpace,
    selectedFile,
    setSelectedSpace,
    setSelectedFile,
    createSpace,
    createFile,
    toggleSpaceExpanded,
    createNewSession
  } = useSpaces();

  const handleMobileMenuToggle = (value: boolean) => {
    setOpen(value);
    onOpenChange?.(value);
  };

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
      {/* Desktop Sidebar */}
      <motion.div
        className="h-screen hidden md:flex md:flex-col bg-[#f7f7f7] rounded-r-3xl z-50 border-r border-gray-200/80 relative"
        initial={false}
        animate={{
          width: open ? "280px" : "60px",
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.2
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          {/* Logo - Fixed size and position */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <Image
              src="/images/noetica.png"
              alt="Noetica Logo"
              fill
              sizes="40px"
              className="object-contain"
              priority
            />
          </div>
          
          {/* Greeting - Only visible when sidebar is open */}
          <motion.h1 
            className="text-xl font-semibold text-gray-800 origin-left"
            initial={false}
            animate={{
              opacity: open ? 1 : 0,
              x: open ? 0 : -10,
            }}
            transition={{
              type: "tween",
              duration: 0.15,
              ease: "easeOut"
            }}
          >
            Hi, Julien
          </motion.h1>
        </div>

        {/* Search Bar */}
        <motion.div 
          className="px-4 mb-4"
          initial={false}
          animate={{
            opacity: open ? 1 : 0,
          }}
          transition={{
            type: "tween",
            duration: 0.15,
            ease: "easeOut"
          }}
        >
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
        </motion.div>

        {/* Main Links - Fixed position */}
        <div className="mt-13 px-3 py-2 space-y-2">
          <Link 
            href="/cursus" 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
            onClick={(e) => {
              e.preventDefault();
              setSelectedFile(null);
              router.replace('/cursus');
            }}
          >
            <div className="w-5 flex items-center justify-center">
              <Code className="w-5 h-5" />
            </div>
            {open && (
              <span className="ml-2">Cursus</span>
            )}
          </Link>
          <Link 
            href="/" 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
            onClick={(e) => {
              e.preventDefault();
              const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
              const newSession = createNewSession();
              toggleSpaceExpanded(defaultSpace.id);
              setSelectedSpace(defaultSpace.id);
              setSelectedFile(newSession.id);
              router.replace('/');
            }}
          >
            <div className="w-5 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            {open && (
              <span className="ml-2">Chat</span>
            )}
          </Link>
          <Link 
            href="/flashcards" 
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
            onClick={(e) => {
              e.preventDefault();
              const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
              const newSession = createNewSession('flashcards');
              toggleSpaceExpanded(defaultSpace.id);
              setSelectedSpace(defaultSpace.id);
              setSelectedFile(newSession.id);
              router.replace('/flashcards');
            }}
          >
            <div className="w-5 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            {open && (
              <span className="ml-2">Flashcards</span>
            )}
          </Link>
        </div>

        {open && (
          <div className="mt-4 px-3 py-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                Spaces
              </span>
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
                        {space.files
                          .sort((a, b) => {
                            const aTime = new Date(a.lastAccessedAt || a.updatedAt).getTime();
                            const bTime = new Date(b.lastAccessedAt || b.updatedAt).getTime();
                            return bTime - aTime;
                          })
                          .map(file => (
                            <motion.div
                              key={file.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -10 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Link
                                href={file.type === 'cursus' ? '/cursus' : file.type === 'flashcards' ? '/flashcards' : '/'}
                                className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer ${
                                  selectedFile === file.id ? 'bg-gray-200/70 font-medium' : ''
                                }`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedFile(file.id);
                                  router.replace(file.type === 'cursus' ? '/cursus' : file.type === 'flashcards' ? '/flashcards' : '/');
                                }}
                              >
                                {file.type === 'cursus' ? <Code className="w-4 h-4" /> : 
                                 file.type === 'flashcards' ? <FileText className="w-4 h-4" /> : 
                                 <MessageSquare className="w-4 h-4" />}
                                <span className="truncate">{file.name}</span>
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
        )}

        {/* Bottom Links */}
        <motion.div 
          className="mt-auto border-t border-gray-200"
          animate={{
            opacity: open ? 1 : 0,
            display: open ? "block" : "none"
          }}
        >
          <DockDemo />
        </motion.div>
      </motion.div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <AnimatePresence>
          {(isOpen ?? open) && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => handleMobileMenuToggle(false)}
              />
              
              {/* Sidebar */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#f7f7f7] z-50 overflow-y-auto rounded-r-3xl border-r border-gray-200/80 flex flex-col"
              >
                {/* Header */}
                <div className="h-14 px-4 flex items-center gap-3 border-b border-gray-200/80">
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src="/images/noetica.png"
                      alt="Noetica Logo"
                      fill
                      sizes="32px"
                      className="object-contain"
                      priority
                    />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-800">
                    Hi, Julien
                  </h1>
                  <button
                    onClick={() => handleMobileMenuToggle(false)}
                    className="p-2 hover:bg-gray-200/50 rounded-lg transition-colors ml-auto"
                    aria-label="Close navigation menu"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <div className="relative mb-6">
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

                    {/* Main Links */}
                    <div className="space-y-2">
                      <Link 
                        href="/cursus" 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedFile(null);
                          router.replace('/cursus');
                          handleMobileMenuToggle(false);
                        }}
                      >
                        <Code className="w-5 h-5" />
                        <span className="ml-2">Cursus</span>
                      </Link>
                      <Link 
                        href="/" 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
                          const newSession = createNewSession();
                          toggleSpaceExpanded(defaultSpace.id);
                          setSelectedSpace(defaultSpace.id);
                          setSelectedFile(newSession.id);
                          router.replace('/');
                          handleMobileMenuToggle(false);
                        }}
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span className="ml-2">Chat</span>
                      </Link>
                      <Link 
                        href="/flashcards" 
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          const defaultSpace = spaces.find(s => s.isDefault) || spaces[0];
                          const newSession = createNewSession('flashcards');
                          toggleSpaceExpanded(defaultSpace.id);
                          setSelectedSpace(defaultSpace.id);
                          setSelectedFile(newSession.id);
                          router.replace('/flashcards');
                          handleMobileMenuToggle(false);
                        }}
                      >
                        <FileText className="w-5 h-5" />
                        <span className="ml-2">Flashcards</span>
                      </Link>
                    </div>

                    {/* Spaces Section */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                          Spaces
                        </span>
                        <button
                          onClick={() => {
                            setIsCreateModalOpen(true);
                            handleMobileMenuToggle(false);
                          }}
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
                              >
                                {space.isExpanded ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </button>
                              <div 
                                className="flex-1 flex items-center space-x-2"
                                onClick={() => {
                                  setSelectedSpace(space.id);
                                  handleMobileMenuToggle(false);
                                }}
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
                                  {space.files
                                    .sort((a, b) => {
                                      const aTime = new Date(a.lastAccessedAt || a.updatedAt).getTime();
                                      const bTime = new Date(b.lastAccessedAt || b.updatedAt).getTime();
                                      return bTime - aTime;
                                    })
                                    .map(file => (
                                      <motion.div
                                        key={file.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                      >
                                        <Link
                                          href={file.type === 'cursus' ? '/cursus' : file.type === 'flashcards' ? '/flashcards' : '/'}
                                          className={`flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors cursor-pointer ${
                                            selectedFile === file.id ? 'bg-gray-200/70 font-medium' : ''
                                          }`}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            setSelectedFile(file.id);
                                            router.replace(file.type === 'cursus' ? '/cursus' : file.type === 'flashcards' ? '/flashcards' : '/');
                                            handleMobileMenuToggle(false);
                                          }}
                                        >
                                          {file.type === 'cursus' ? <Code className="w-4 h-4" /> : 
                                           file.type === 'flashcards' ? <FileText className="w-4 h-4" /> : 
                                           <MessageSquare className="w-4 h-4" />}
                                          <span className="truncate">{file.name}</span>
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
                </div>

                {/* Bottom Dock */}
                <div className="mt-auto border-t border-gray-200/80">
                  <DockDemo />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
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