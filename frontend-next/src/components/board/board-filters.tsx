"use client"

import { ChevronDown, Search, UserX } from "lucide-react"

import { initials } from "@/components/shell/user-menu"
import { LabelLozenge } from "@/components/task/task-meta"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { BoardBucket } from "@/lib/board"
import {
  boardAssignees,
  boardLabels,
  EMPTY_BOARD_FILTER,
  isFilterActive,
  toggleId,
  UNASSIGNED,
  type BoardFilter,
} from "@/lib/board-filter"
import { cn } from "@/lib/utils"

const MAX_AVATARS = 6

function AvatarToggle({
  label,
  pressed,
  onToggle,
  children,
}: {
  label: string
  pressed: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-pressed={pressed}
          aria-label={label}
          onClick={onToggle}
          className={cn(
            "relative rounded-full border-2 border-background transition-transform hover:z-10 hover:-translate-y-0.5 focus-visible:z-10 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            pressed && "z-10 border-selected-foreground",
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** Jira board toolbar: search, assignee avatars and a label picker. */
export function BoardFilters({
  buckets,
  value,
  onChange,
}: {
  buckets: BoardBucket[]
  value: BoardFilter
  onChange: (value: BoardFilter) => void
}) {
  const assignees = boardAssignees(buckets)
  const labels = boardLabels(buckets)
  const shown = assignees.slice(0, MAX_AVATARS)
  const hidden = assignees.slice(MAX_AVATARS)
  const hasUnassigned = buckets.some((bucket) => bucket.tasks.some((task) => !task.assignees?.length))
  const toggleAssignee = (id: number) => onChange({ ...value, assignees: toggleId(value.assignees, id) })

  return (
    <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
      <div className="relative w-56">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.text}
          onChange={(event) => onChange({ ...value, text: event.target.value })}
          placeholder="Buscar en el tablero"
          aria-label="Buscar en el tablero"
          className="h-8 pl-8"
        />
      </div>

      {(assignees.length > 0 || hasUnassigned) && (
        <div role="group" aria-label="Filtrar por responsable" className="flex items-center -space-x-1">
          {shown.map((user) => {
            const name = user.name || user.username || "?"
            return (
              <AvatarToggle
                key={user.id}
                label={name}
                pressed={value.assignees.includes(user.id)}
                onToggle={() => toggleAssignee(user.id)}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-discovery text-[11px] font-semibold text-white">
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
              </AvatarToggle>
            )
          })}
          {hidden.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`${hidden.length} responsables más`}
                  className={cn(
                    "relative flex size-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-semibold",
                    hidden.some((user) => value.assignees.includes(user.id)) && "border-selected-foreground",
                  )}
                >
                  +{hidden.length}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56 p-1">
                {hidden.map((user) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                  >
                    <Checkbox
                      checked={value.assignees.includes(user.id)}
                      onCheckedChange={() => toggleAssignee(user.id)}
                    />
                    {user.name || user.username}
                  </label>
                ))}
              </PopoverContent>
            </Popover>
          )}
          {hasUnassigned && (
            <AvatarToggle
              label="Sin asignar"
              pressed={value.assignees.includes(UNASSIGNED)}
              onToggle={() => toggleAssignee(UNASSIGNED)}
            >
              <Avatar className="size-8">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  <UserX className="size-4" />
                </AvatarFallback>
              </Avatar>
            </AvatarToggle>
          )}
        </div>
      )}

      {labels.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={value.labels.length > 0 ? "secondary" : "ghost"}
              size="sm"
              className={cn(value.labels.length > 0 && "bg-selected text-selected-foreground hover:bg-selected")}
            >
              Etiqueta
              {value.labels.length > 0 && (
                <span className="rounded-full bg-selected-foreground px-1.5 text-[11px] text-white">
                  {value.labels.length}
                </span>
              )}
              <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-0">
            <Command>
              <CommandInput placeholder="Buscar etiquetas" />
              <CommandList>
                <CommandEmpty>Sin resultados.</CommandEmpty>
                <CommandGroup>
                  {labels.map((label) => (
                    <CommandItem
                      key={label.id}
                      value={label.title ?? String(label.id)}
                      onSelect={() => onChange({ ...value, labels: toggleId(value.labels, label.id) })}
                    >
                      <Checkbox checked={value.labels.includes(label.id)} tabIndex={-1} aria-hidden />
                      <LabelLozenge label={label} />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {isFilterActive(value) && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onChange(EMPTY_BOARD_FILTER)}>
            Borrar filtros
          </Button>
          <span className="text-xs text-muted-foreground">Arrastrar está desactivado mientras filtras.</span>
        </>
      )}
    </div>
  )
}
