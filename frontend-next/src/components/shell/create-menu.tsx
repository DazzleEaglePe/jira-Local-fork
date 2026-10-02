"use client"

import { ChevronDown, FolderPlus, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUi } from "@/lib/ui-store"

/** "Crear" next to the search box, as in Jira. Task creation lives on the board (sprint 4). */
export function CreateMenu() {
  const setCreateProjectOpen = useUi((state) => state.setCreateProjectOpen)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" className="shrink-0">
          <Plus />
          <span className="hidden sm:inline">Crear</span>
          <ChevronDown className="hidden opacity-80 sm:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Crear</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => setCreateProjectOpen(true)}>
          <FolderPlus /> Proyecto
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
