import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface DockProps {
  className?: string
  items: {
    icon: LucideIcon
    label: string
    onClick?: () => void
  }[]
}

interface DockIconButtonProps {
  icon: LucideIcon
  label: string
  onClick?: () => void
  className?: string
}

const DockIconButton = React.forwardRef<HTMLButtonElement, DockIconButtonProps>(
  ({ icon: Icon, label, onClick, className }, ref) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={cn(
          "relative group p-2.5 rounded-lg",
          "transition-transform",
          className
        )}
      >
        <Icon className="w-[18px] h-[18px] text-gray-600 group-hover:text-gray-900 transition-colors" />
        <span className={cn(
          "absolute -top-8 left-1/2 -translate-x-1/2",
          "px-2 py-1 text-[11px] text-gray-700",
          "opacity-0 group-hover:opacity-100",
          "transition-opacity whitespace-nowrap pointer-events-none"
        )}>
          {label}
        </span>
      </motion.button>
    )
  }
)
DockIconButton.displayName = "DockIconButton"

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ items, className }, ref) => {
    return (
      <div ref={ref} className={cn("w-full px-3 py-1.5", className)}>
        <div className={cn(
          "flex items-center justify-between px-3 py-1 rounded-xl",
          "border border-white bg-white",
          "shadow-sm"
        )}>
          {items.map((item) => (
            <DockIconButton key={item.label} {...item} />
          ))}
        </div>
      </div>
    )
  }
)
Dock.displayName = "Dock"

export { Dock } 