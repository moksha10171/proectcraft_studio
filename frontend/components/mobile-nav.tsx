"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Home, Folder, Grid3x3, Info, ChevronRight, HelpCircle, Zap, BookOpen, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCallback } from "react"
import { Logo } from "@/components/logo"
import { BetaBadge } from "@/components/beta-badge"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const closeNav = useCallback(() => onOpenChange(false), [onOpenChange])

  const mainLinks = [
    { href: "/studio", label: "Studio", icon: Zap, badge: "Beta" },
    { href: "/", label: "Home", icon: Home },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/resources", label: "Resources", icon: BookOpen },
    { href: "/categories", label: "Categories", icon: Grid3x3 },
    { href: "/cost-calculator", label: "Cost Calculator", icon: Calculator },
    { href: "/about", label: "About", icon: Info },
  ]

  const supportLinks = [
    { href: "/faq", label: "FAQ", icon: HelpCircle },
    { href: "/#setup-guide", label: "Setup Guide", icon: HelpCircle },
  ]

  const legalLinks = [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ]

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent id="mobile-navigation" side="left" className="max-w-[min(300px,90vw)] w-[300px] p-0 border-r border-border">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>
            <Link href="/" className="block transition-opacity hover:opacity-80" onClick={closeNav} aria-label="ProjectCraft - Home">
              <Logo showText={true} />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-73px)]">
          <nav className="flex-1 overflow-y-auto p-4 scrollbar-thin" aria-label="Mobile menu">
            <div className="space-y-1">
              {mainLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeNav}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-smooth",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-muted hover:text-foreground active:scale-[0.98]"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="flex-1">{link.label}</span>
                    {link.badge && <BetaBadge size="sm" />}
                    <ChevronRight className="h-4 w-4 opacity-40" aria-hidden="true" />
                  </Link>
                )
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support</p>
              <div className="space-y-1">
                {supportLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeNav}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/70 hover:bg-muted hover:text-foreground transition-smooth"
                  >
                    <link.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
              <div className="space-y-1">
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeNav}
                    className="block rounded-xl px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
