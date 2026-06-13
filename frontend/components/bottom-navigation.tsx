"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Folder, Grid3x3, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNavigation() {
  const pathname = usePathname()

  const links = [
    { href: "/studio", label: "Studio", icon: Zap },
    { href: "/", label: "Home", icon: Home },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/categories", label: "Categories", icon: Grid3x3 },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 md:hidden safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1">
        {links.map((link) => {
          const isActive =
            pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-xs font-medium transition-all",
                isActive ? "text-primary" : "text-muted-foreground active:scale-95",
              )}
              aria-label={link.label}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors",
                  isActive && "bg-primary/10",
                  link.href === "/studio" && !isActive && "bg-teal-600 text-white",
                )}
              >
                <link.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              </div>
              <span className="mt-0.5">{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
