"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Search, Menu } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState, useCallback } from "react"
import { MobileNav } from "@/components/mobile-nav"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { BetaBadge } from "@/components/beta-badge"

export function Header() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const openMobileNav = useCallback(() => setMobileNavOpen(true), [])

  const navLinks = [
    { href: "/studio", label: "Studio", badge: true },
    { href: "/projects", label: "Projects" },
    { href: "/resources", label: "Resources" },
    { href: "/categories", label: "Categories" },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="ProjectCraft - Home">
              <Logo />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-smooth flex items-center gap-1.5",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/70 hover:bg-secondary hover:text-foreground"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                    {link.badge && <BetaBadge size="sm" />}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" asChild className="rounded-xl h-11 w-11 min-h-[44px] min-w-[44px] transition-smooth">
              <Link href="/search" aria-label="Search projects">
                <Search className="h-5 w-5" />
              </Link>
            </Button>

            <ThemeToggle />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-11 w-11 min-h-[44px] min-w-[44px] md:hidden transition-smooth"
              onClick={openMobileNav}
              aria-label="Open navigation menu"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
    </>
  )
}
