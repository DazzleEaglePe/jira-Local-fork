"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  columnVisibilityFeature,
  createColumnHelper,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type ColumnVisibilityState,
  type SortingState,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Plus } from "lucide-react"
import { toast } from "sonner"

import { PriorityIcon } from "@/components/task/priority-icon"
import { TaskKey } from "@/components/task/task-key"
import { AssigneeStack, LabelLozenge } from "@/components/task/task-meta"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { Task } from "@/lib/api/generated/types.gen"
import { getErrorMessage } from "@/lib/api/client"
import { useQuickCreateTask, useToggleTaskDone, useViewTasks } from "@/lib/queries/view-tasks"
import { formatTaskDate, isTaskOverdue } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const features = tableFeatures({ rowSortingFeature, columnVisibilityFeature })
const helper = createColumnHelper<typeof features, Task>()
const EMPTY: Task[] = []

// Column ids double as Vikunja sort_by fields.
const columns = helper.columns([
  helper.accessor("done", {
    id: "done",
    header: () => <span className="sr-only">Hecha</span>,
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => <DoneCheckbox task={row.original} />,
  }),
  helper.accessor("id", {
    id: "id", // Vikunja sorts by id, not by the per-project index
    header: "Clave",
    cell: ({ row }) => <TaskKey task={row.original} />,
  }),
  helper.accessor("title", {
    id: "title",
    header: "Resumen",
    enableHiding: false,
    cell: ({ row }) => <span className="line-clamp-2">{row.original.title}</span>,
  }),
  helper.accessor("priority", {
    id: "priority",
    header: "Prioridad",
    cell: ({ row }) => <PriorityIcon priority={row.original.priority} />,
  }),
  helper.accessor("assignees", {
    id: "assignees",
    header: "Responsables",
    enableSorting: false,
    cell: ({ row }) => <AssigneeStack users={row.original.assignees} />,
  }),
  helper.accessor("labels", {
    id: "labels",
    header: "Etiquetas",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="flex flex-wrap gap-1">
        {(row.original.labels ?? []).map((label) => (
          <LabelLozenge key={label.id} label={label} />
        ))}
      </span>
    ),
  }),
  helper.accessor("due_date", {
    id: "due_date",
    header: "Vencimiento",
    cell: ({ row }) => {
      const due = formatTaskDate(row.original.due_date)
      return due ? (
        <span className={cn(isTaskOverdue(row.original) && "font-medium text-danger-foreground")}>{due}</span>
      ) : null
    },
  }),
  helper.accessor("start_date", {
    id: "start_date",
    header: "Inicio",
    cell: ({ row }) => formatTaskDate(row.original.start_date),
  }),
  helper.accessor("percent_done", {
    id: "percent_done",
    header: "Progreso",
    cell: ({ row }) => `${Math.round((row.original.percent_done ?? 0) * 100)} %`,
  }),
  helper.accessor("created", {
    id: "created",
    header: "Creada",
    cell: ({ row }) => formatTaskDate(row.original.created),
  }),
])

const COLUMN_LABELS: Record<string, string> = {
  id: "Clave",
  priority: "Prioridad",
  assignees: "Responsables",
  labels: "Etiquetas",
  due_date: "Vencimiento",
  start_date: "Inicio",
  percent_done: "Progreso",
  created: "Creada",
}

/** "Lista" shows the essentials; "Tabla" shows everything and lets you pick columns. */
const COMPACT_HIDDEN: ColumnVisibilityState = { start_date: false, percent_done: false, created: false }

function DoneCheckbox({ task }: { task: Task }) {
  const toggle = useToggleTaskDone()
  return (
    <Checkbox
      checked={Boolean(task.done)}
      aria-label={task.done ? `Marcar "${task.title}" como pendiente` : `Marcar "${task.title}" como hecha`}
      onClick={(event) => event.stopPropagation()}
      onCheckedChange={() =>
        toggle.mutate(task, { onError: (error) => toast.error(getErrorMessage(error, "No se pudo actualizar la tarea")) })
      }
    />
  )
}

function QuickCreate({ project }: { project: number }) {
  const [title, setTitle] = useState("")
  const create = useQuickCreateTask(project)

  async function submit() {
    const value = title.trim()
    if (!value) return
    try {
      await create.mutateAsync(value)
      setTitle("")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la tarea"))
    }
  }

  return (
    <div className="flex items-center gap-2 border-t px-3 py-2">
      <Plus className="size-4 text-muted-foreground" />
      <Input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => event.key === "Enter" && void submit()}
        placeholder="Crear tarea — escribe un resumen y presiona Enter"
        aria-label="Crear tarea"
        disabled={create.isPending}
        className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
      />
    </div>
  )
}

export function TaskTable({ project, view, mode }: { project: number; view: number; mode: "list" | "table" }) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: "done", desc: false }])
  const [visibility, setVisibility] = useState<ColumnVisibilityState>(mode === "list" ? COMPACT_HIDDEN : {})
  const query = useViewTasks(
    project,
    view,
    sorting.map((sort) => ({ field: sort.id, direction: sort.desc ? "desc" : "asc" }))
  )
  const data = query.data?.pages.flatMap((page) => page.items) ?? EMPTY

  const table = useTable({
    features,
    columns,
    data,
    manualSorting: true, // Vikunja sorts on the server
    state: { sorting, columnVisibility: visibility },
    onSortingChange: (updater) => setSorting((current) => (typeof updater === "function" ? updater(current) : updater)),
    onColumnVisibilityChange: (updater) =>
      setVisibility((current) => (typeof updater === "function" ? updater(current) : updater)),
    getRowId: (task) => String(task.id),
  })

  return (
    <div className="flex flex-col gap-2 px-6 pb-6">
      {mode === "table" && (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 /> Columnas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(checked) => column.toggleVisibility(Boolean(checked))}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {COLUMN_LABELS[column.id] ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-left">
          <thead className="border-b bg-muted text-xs font-semibold text-subtle-foreground">
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id}>
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : undefined}
                      className={cn("px-3 py-2 whitespace-nowrap", header.column.id === "done" && "w-10")}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 hover:text-foreground"
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {query.isPending
              ? Array.from({ length: 6 }, (_, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td colSpan={columns.length} className="px-3 py-2">
                      <Skeleton className="h-6" />
                    </td>
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => router.push(`/tasks/${row.original.id}`)}
                    className={cn(
                      "cursor-pointer border-b transition-colors last:border-0 hover:bg-accent",
                      row.original.done && "text-muted-foreground"
                    )}
                  >
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2 align-middle">
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!query.isPending && data.length === 0 && (
          <p className="px-3 py-6 text-center text-muted-foreground">Esta vista no tiene tareas todavía.</p>
        )}
        <QuickCreate project={project} />
      </div>

      {query.hasNextPage && (
        <Button variant="ghost" onClick={() => void query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          Cargar más
        </Button>
      )}
    </div>
  )
}
