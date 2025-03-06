import type { Metadata } from "next";
import "./globals.css";
import { SpaceProvider } from "@/contexts/SpaceContext";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "OpenPad",
  description: "Your AI-powered learning platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <SpaceProvider>
          <div className="flex h-screen bg-white">
            <Sidebar />
            <div className="flex-1">
              {children}
            </div>
          </div>
        </SpaceProvider>
      </body>
    </html>
  );
}
