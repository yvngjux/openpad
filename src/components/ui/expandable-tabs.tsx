'use client';

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface Tab {
  title: string;
  icon: LucideIcon;
  type?: never;
  href: string;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
}

const tooltipVariants = {
  initial: { opacity: 0, y: 2 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 }
};

const tooltipTransition = { duration: 0.1 };

export function ExpandableTabs({
  tabs,
  className,
}: ExpandableTabsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const Separator = () => (
    <div className="mx-2 h-[16px] w-[1px] bg-gray-200" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-gray-200 bg-white px-2 py-1",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <div 
            key={tab.title} 
            className="relative"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <Link href={tab.href}>
              <button
                className={cn(
                  "flex items-center justify-center rounded-lg p-2 mx-0.5",
                  "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
                  "transition-colors duration-150"
                )}
                aria-label={tab.title}
              >
                <Icon size={18} />
              </button>
            </Link>
            <AnimatePresence>
              {hoveredIndex === index && (
                <motion.div
                  variants={tooltipVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={tooltipTransition}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1"
                >
                  <div className="relative px-2 py-1 rounded-md bg-white border border-gray-200 shadow-sm">
                    <span className="text-xs text-gray-700 whitespace-nowrap">
                      {tab.title}
                    </span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white border-r border-b border-gray-200" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
} 