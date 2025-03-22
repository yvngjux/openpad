'use client';

import { SpaceProvider } from "@/contexts/SpaceContext";
import Sidebar from "@/components/Sidebar";

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SpaceProvider>
          <div className="flex h-screen bg-[#f7f7f7]">
            <div className="relative z-50">
              <Sidebar />
            </div>
            <div className="flex-1 bg-white rounded-tl-3xl rounded-bl-3xl relative z-0 pointer-events-none">
              <div className="w-full h-full pointer-events-auto">
                {children}
              </div>
            </div>
          </div>
        </SpaceProvider>
      </body>
    </html>
  );
} 