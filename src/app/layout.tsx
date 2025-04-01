import type { Metadata } from "next";
import "./globals.css";
import RootLayoutClient from "@/components/RootLayoutClient";
import { RedirectHandler } from "@/components/RedirectHandler";

export const metadata: Metadata = {
  title: "OpenPad",
  description: "Your AI-powered learning platform",
  icons: {
    icon: '/images/noetica_black.png',
    shortcut: '/images/noetica_black.png',
    apple: '/images/noetica_black.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RootLayoutClient>
      <RedirectHandler />
      {children}
    </RootLayoutClient>
  );
}
