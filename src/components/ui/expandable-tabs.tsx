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

const buttonVariants = {
  initial: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
  animate: {
    gap: 0,
    paddingLeft: ".5rem",
    paddingRight: ".5rem",
  },
};

const tooltipVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 5 }
};

const transition = { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 };
const tooltipTransition = { duration: 0.2, ease: "easeOut" };

export function ExpandableTabs({
  tabs,
  className,
}: ExpandableTabsProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-border" aria-hidden="true" />
  );

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border bg-background p-1 shadow-sm",
        className
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        return (
          <motion.div 
            key={tab.title} 
            className="relative"
            onHoverStart={() => setHoveredIndex(index)}
            onHoverEnd={() => setHoveredIndex(null)}
          >
            <Link href={tab.href}>
              <motion.button
                variants={buttonVariants}
                initial={false}
                animate="animate"
                transition={transition}
                className={cn(
                  "relative flex items-center rounded-xl px-4 py-2 text-sm font-medium transition-colors duration-300",
                  "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={20} />
              </motion.button>
            </Link>
            <AnimatePresence>
              {hoveredIndex === index && (
                <motion.div
                  variants={tooltipVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={tooltipTransition}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50"
                >
                  <div className="relative px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg">
                    <span className="text-xs font-medium bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      {tab.title}
                    </span>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-white border-r border-b border-gray-200/50" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
} 