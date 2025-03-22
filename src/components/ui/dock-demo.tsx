import { Dock } from "@/components/ui/dock-two"
import {
  Home,
  Bell,
  HelpCircle,
  Settings,
  Shield,
} from "lucide-react"
import { useRouter } from "next/navigation"

export function DockDemo() {
  const router = useRouter()
  
  const items = [
    { icon: Home, label: "Home", onClick: () => router.push("/") },
    { icon: Bell, label: "Notifications", onClick: () => router.push("/notifications") },
    { icon: HelpCircle, label: "Support", onClick: () => router.push("/support") },
    { icon: Settings, label: "Settings", onClick: () => router.push("/settings") },
    { icon: Shield, label: "Security", onClick: () => router.push("/security") }
  ]

  return <Dock items={items} className="h-auto" />
} 