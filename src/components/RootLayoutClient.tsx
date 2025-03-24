'use client';

import { SpaceProvider } from "@/contexts/SpaceContext";
import Sidebar from "@/components/Sidebar";
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en">
      <body className="font-sans">
        <SpaceProvider>
          <div className="flex h-screen bg-white">
            <Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
            <div className="flex-1">
              {/* Invisible Header */}
              <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-50">
                <AnimatePresence>
                  {!isSidebarOpen && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSidebarOpen(true)}
                      className="absolute top-3 left-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Toggle navigation menu"
                    >
                      <Menu className="w-6 h-6 text-gray-700" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </header>
              <main className="w-full h-full">
                {children}
              </main>
            </div>
          </div>
        </SpaceProvider>
      </body>
    </html>
  );
} 