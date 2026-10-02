"use client"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { CommandPalette } from "./command-palette"
import { CreateProjectDialog } from "./create-project-dialog"
import { PageTransition } from "./page-transition"
import { TopNav } from "./top-nav"

/**
 * Jira layout: a full-width 48px top bar with the sidebar starting below it
 * (shadcn "site header" sidebar pattern via --header-height).
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="[--header-height:3rem]">
        <SidebarProvider
          className="flex flex-col"
          style={{ "--sidebar-width": "18rem" } as React.CSSProperties}
        >
          <TopNav />
          <div className="flex flex-1">
            <AppSidebar />
            <SidebarInset>
              <PageTransition>{children}</PageTransition>
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
      <CommandPalette />
      <CreateProjectDialog />
    </>
  )
}
