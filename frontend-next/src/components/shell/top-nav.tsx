"use client"

import Link from "next/link"
import { PanelLeft, Search } from "lucide-react"

import { NotificationsMenu } from "@/components/notifications/notifications-menu"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUi } from "@/lib/ui-store"
import { CreateMenu } from "./create-menu"
import { UserMenu } from "./user-menu"

/** Jira top bar: [toggle + logo] [search + Create] [account]. */
export function TopNav() {
  const { toggleSidebar } = useSidebar()
  const setCommandOpen = useUi((state) => state.setCommandOpen)

  return (
    <header className="sticky top-0 z-50 flex h-(--header-height) w-full items-center gap-2 border-b bg-background pr-4 pl-2">
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label="Mostrar u ocultar la barra lateral">
              <PanelLeft />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Barra lateral ([)</TooltipContent>
        </Tooltip>
        <Link href="/dashboard" className="hidden rounded-sm px-1 sm:block" aria-label="Ir a Para ti">
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG logo */}
          <img src="/cajaica.svg" alt="Caja Ica" width={112} height={22} />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="flex h-8 w-8 items-center gap-2 rounded-md border border-input bg-background px-2.5 text-muted-foreground transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none md:w-full md:max-w-3xl"
          aria-label="Buscar"
        >
          <Search className="size-4 shrink-0" />
          <span className="hidden flex-1 text-left md:inline">Buscar</span>
          <Kbd className="hidden md:inline-flex">Ctrl K</Kbd>
        </button>
        <CreateMenu />
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  )
}
