'use client';

import { CursusIDE } from "@/components/cursus/CursusIDE";
import { CursusChatInterface } from "@/components/cursus/CursusChatInterface";

export default function CursusPage() {
  return (
    <div className="h-full flex p-4 gap-4 bg-gray-50/50">
      <div className="w-1/2 h-full rounded-2xl overflow-hidden shadow-lg bg-[#1E1E1E]">
        <CursusIDE />
      </div>
      <div className="w-1/2 h-full">
        <CursusChatInterface />
      </div>
    </div>
  );
} 