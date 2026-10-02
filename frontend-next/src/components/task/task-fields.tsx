"use client"

import { useDeferredValue, useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Check, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { PROJECT_COLORS } from "@/components/shell/create-project-dialog"
import { initials } from "@/components/shell/user-menu"
import { PriorityIcon } from "@/components/task/priority-icon"
import { LabelLozenge } from "@/components/task/task-meta"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Label, Task, User } from "@/lib/api/generated/types.gen"
import { getErrorMessage } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"
import {
  useCreateLabel,
  useLabels,
  useProjectUserSearch,
  useToggleAssignee,
  useToggleLabel,
  useUpdateTask,
} from "@/lib/queries/task-detail"
import { PRIORITIES, PRIORITY_LABELS, parseTaskDate } from "@/lib/tasks"
import { cn } from "@/lib/utils"

/** "Label | value" row of the Jira details card. */
export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-2 py-1.5">
      <span className="text-sm font-medium text-subtle-foreground">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

// Value cells look like plain text until hovered, as in Jira.
const VALUE_BUTTON = "h-auto min-h-8 w-full justify-start px-2 py-1 font-normal hover:bg-accent"

const userName = (user: User) => user.name || user.username || "?"

function UserChip({ user }: { user: User }) {
  return (
    <span className="flex items-center gap-2">
      <Avatar className="size-6">
        <AvatarFallback className="bg-discovery text-[10px] font-semibold text-white">{initials(userName(user))}</AvatarFallback>
      </Avatar>
      <span className="truncate">{userName(user)}</span>
    </span>
  )
}

export function AssigneesField({ task }: { task: Task }) {
  const me = useSession((state) => state.user)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const deferred = useDeferredValue(query)
  const users = useProjectUserSearch(open ? (task.project_id ?? 0) : 0, deferred)
  const toggle = useToggleAssignee(task.id as number)
  const assigned = task.assignees ?? []
  const isAssigned = (user: User) => assigned.some((item) => item.id === user.id)

  async function onToggle(user: User) {
    try {
      await toggle.mutateAsync({ user, assigned: isAssigned(user) })
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar el responsable"))
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className={VALUE_BUTTON} aria-label="Cambiar responsables">
            {assigned.length ? (
              <span className="flex flex-col gap-1">
                {assigned.map((user) => (
                  <UserChip key={user.id} user={user} />
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">Sin asignar</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Buscar personas" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>{users.isPending ? "Buscando…" : "Sin resultados."}</CommandEmpty>
              <CommandGroup>
                {(users.data ?? []).map((user) => (
                  <CommandItem key={user.id} value={String(user.id)} onSelect={() => void onToggle(user)}>
                    <UserChip user={user} />
                    {isAssigned(user) && <Check className="ml-auto" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {me && !assigned.some((user) => user.id === me.id) && (
        <Button variant="link" size="sm" className="h-auto px-2 text-information" onClick={() => void onToggle(me as User)}>
          Asignarme a mí
        </Button>
      )}
    </div>
  )
}

export function PriorityField({ task }: { task: Task }) {
  const update = useUpdateTask(task.id as number)
  const options = [PRIORITIES.UNSET, PRIORITIES.LOW, PRIORITIES.MEDIUM, PRIORITIES.HIGH, PRIORITIES.URGENT, PRIORITIES.DO_NOW]

  return (
    <Select
      value={String(task.priority ?? 0)}
      onValueChange={(value) =>
        update.mutate({ priority: Number(value) }, { onError: (error) => toast.error(getErrorMessage(error)) })
      }
    >
      <SelectTrigger className="h-8 w-full border-transparent shadow-none hover:bg-accent" aria-label="Prioridad">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((priority) => (
          <SelectItem key={priority} value={String(priority)}>
            <span className="flex items-center gap-2">
              {priority ? <PriorityIcon priority={priority} /> : <span className="size-4" />}
              {priority ? PRIORITY_LABELS[priority] : "Sin prioridad"}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function DateField({ task, field, label }: { task: Task; field: "due_date" | "start_date" | "end_date"; label: string }) {
  const update = useUpdateTask(task.id as number)
  const [open, setOpen] = useState(false)
  const date = parseTaskDate(task[field])

  function save(value: Date | null) {
    setOpen(false)
    update.mutate(
      { [field]: value ? value.toISOString() : "" },
      { onError: (error) => toast.error(getErrorMessage(error, "No se pudo guardar la fecha")) }
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={VALUE_BUTTON} aria-label={`${label}: ${date ? format(date, "PPP", { locale: es }) : "sin fecha"}`}>
          {date ? (
            <span className="flex items-center gap-2">
              <CalendarDays className="size-4 text-muted-foreground" /> {format(date, "d MMM yyyy", { locale: es })}
            </span>
          ) : (
            <span className="text-muted-foreground">Añadir fecha</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" locale={es} selected={date ?? undefined} onSelect={(value) => save(value ?? null)} autoFocus />
        {date && (
          <div className="border-t p-2">
            <Button variant="ghost" size="sm" className="w-full" onClick={() => save(null)}>
              <X /> Quitar fecha
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function LabelsField({ task }: { task: Task }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const labels = useLabels()
  const toggle = useToggleLabel(task.id as number)
  const createLabel = useCreateLabel()
  const attached = task.labels ?? []
  const isAttached = (label: Label) => attached.some((item) => item.id === label.id)
  const needle = query.trim().toLowerCase()
  const matches = (labels.data ?? []).filter((label) => label.title?.toLowerCase().includes(needle))
  const exact = (labels.data ?? []).some((label) => label.title?.toLowerCase() === needle)

  async function onToggle(label: Label) {
    try {
      await toggle.mutateAsync({ label, attached: isAttached(label) })
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la etiqueta"))
    }
  }

  async function onCreate() {
    try {
      const color = PROJECT_COLORS[(labels.data?.length ?? 0) % PROJECT_COLORS.length]
      const label = await createLabel.mutateAsync({ title: query.trim(), hex_color: color })
      setQuery("")
      await toggle.mutateAsync({ label, attached: false })
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la etiqueta"))
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className={VALUE_BUTTON} aria-label="Cambiar etiquetas">
          {attached.length ? (
            <span className="flex flex-wrap gap-1">
              {attached.map((label) => (
                <LabelLozenge key={label.id} label={label} />
              ))}
            </span>
          ) : (
            <span className="text-muted-foreground">Añadir etiquetas</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar o crear etiqueta" value={query} onValueChange={setQuery} />
          <CommandList>
            <CommandEmpty>Sin etiquetas.</CommandEmpty>
            <CommandGroup>
              {matches.map((label) => (
                <CommandItem key={label.id} value={String(label.id)} onSelect={() => void onToggle(label)}>
                  <LabelLozenge label={label} />
                  {isAttached(label) && <Check className="ml-auto" />}
                </CommandItem>
              ))}
              {needle && !exact && (
                <CommandItem value={`create:${needle}`} onSelect={() => void onCreate()}>
                  <Plus /> Crear etiqueta “{query.trim()}”
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function ProgressField({ task }: { task: Task }) {
  const update = useUpdateTask(task.id as number)
  const value = Math.round((task.percent_done ?? 0) * 100)
  return (
    <Select
      value={String(value)}
      onValueChange={(next) => update.mutate({ percent_done: Number(next) / 100 })}
    >
      <SelectTrigger className="h-8 w-full border-transparent shadow-none hover:bg-accent" aria-label="Progreso">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((percent) => (
          <SelectItem key={percent} value={String(percent)}>
            <span className={cn(percent === 100 && "font-medium text-success-foreground")}>{percent} %</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
