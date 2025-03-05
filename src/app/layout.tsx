import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SpaceProvider } from "@/contexts/SpaceContext";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
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
