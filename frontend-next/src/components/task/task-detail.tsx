"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatDistanceToNow, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Check, Ellipsis, Link2, Star, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { DateField, DetailRow, AssigneesField, LabelsField, PriorityField, ProgressField } from "@/components/task/task-fields"
import { TaskKey } from "@/components/task/task-key"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useDocumentTitle } from "@/hooks/use-document-title"
import type { Task } from "@/lib/api/generated/types.gen"
import { getErrorMessage } from "@/lib/api/client"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { projectColor, projectTitle } from "@/lib/projects"
import { useProject } from "@/lib/queries/projects"
import { useDeleteTask, useMoveTaskToBucket, useTask, useUpdateTask, useViewBuckets } from "@/lib/queries/task-detail"
import { getTaskIdentifier } from "@/lib/tasks"
import { cn } from "@/lib/utils"
import { defaultView } from "@/lib/views"
import { RichTextEditor, RichTextView, isEmptyHtml } from "./rich-text"
import { TaskComments } from "./task-comments"
import { TaskTitle } from "./task-title"

function relative(value?: string) {
  return value ? formatDistanceToNow(parseISO(value), { addSuffix: true, locale: es }) : ""
}

/** Status = the task's column in the project's board, like Jira's status button. */
function StatusControl({ task }: { task: Task }) {
  const project = useProject(task.project_id ?? 0)
  const kanban = project.data?.views?.find((view) => view.view_kind === "kanban") ?? defaultView(project.data?.views)
  const buckets = useViewBuckets(task.project_id ?? 0, kanban?.view_kind === "kanban" ? kanban.id : undefined)
  const move = useMoveTaskToBucket(task.id as number)
  const update = useUpdateTask(task.id as number)
  const current = task.buckets?.find((bucket) => bucket.project_view_id === kanban?.id)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buckets.data && kanban?.id && (
        <Select
          value={current?.id ? String(current.id) : undefined}
          onValueChange={(value) =>
            move.mutate(
              { project: task.project_id as number, view: kanban.id as number, bucket: Number(value) },
              { onError: (error) => toast.error(getErrorMessage(error, "No se pudo cambiar el estado")) }
            )
          }
        >
          <SelectTrigger size="sm" className="bg-secondary font-semibold" aria-label="Estado">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {buckets.data.map((bucket) => (
              <SelectItem key={bucket.id} value={String(bucket.id)}>
                {bucket.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        size="sm"
        variant={task.done ? "secondary" : "outline"}
        className={cn(task.done && "text-success-foreground")}
        onClick={() =>
          update.mutate({ done: !task.done }, { onError: (error) => toast.error(getErrorMessage(error)) })
        }
      >
        <Check /> {task.done ? "Hecha" : "Marcar como hecha"}
      </Button>
    </div>
  )
}

function Description({ task }: { task: Task }) {
  const [editing, setEditing] = useState(false)
  const update = useUpdateTask(task.id as number)

  function save(html: string) {
    update.mutate(
      { description: html },
      {
        onSuccess: () => setEditing(false),
        onError: (error) => toast.error(getErrorMessage(error, "No se pudo guardar la descripción")),
      }
    )
  }

  return (
    <section aria-labelledby="description-heading" className="flex flex-col gap-2">
      <h2 id="description-heading" className="font-semibold">
        Descripción
      </h2>
      {editing ? (
        <RichTextEditor
          initialHtml={task.description}
          placeholder="Añade una descripción…"
          saving={update.isPending}
          onSave={save}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-md px-2 py-1.5 text-left hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label="Editar descripción"
        >
          {isEmptyHtml(task.description) ? (
            <span className="text-muted-foreground">Añade una descripción…</span>
          ) : (
            <RichTextView html={task.description} />
          )}
        </button>
      )}
    </section>
  )
}

export function TaskDetail({ taskId, onClose }: { taskId: number; onClose?: () => void }) {
  const router = useRouter()
  const { data: task, isPending, isError } = useTask(taskId)
  const { data: project } = useProject(task?.project_id ?? 0)
  const update = useUpdateTask(taskId)
  const deleteTask = useDeleteTask(taskId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useDocumentTitle(task ? `${getTaskIdentifier(task)} ${task.title}` : null)

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from("[data-animate]", { y: 8, autoAlpha: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" })
      })
    },
    { dependencies: [Boolean(task)], scope: root, revertOnUpdate: true }
  )

  async function copyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/tasks/${taskId}`)
    toast.success("Enlace copiado")
  }

  async function onDelete() {
    try {
      await deleteTask.mutateAsync()
      toast.success("Tarea eliminada")
      if (onClose) onClose()
      else router.push(project ? `/projects/${project.id}` : "/dashboard")
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar la tarea"))
    }
  }

  if (isError) {
    return <p className="p-6 text-danger-foreground">No se encontró la tarea o no tienes acceso.</p>
  }

  if (isPending || !task) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  return (
    <div ref={root} className="flex flex-col">
      <header className="flex items-center gap-2 px-6 pt-4 pb-2">
        <nav aria-label="Ruta de navegación" className="flex min-w-0 items-center gap-1.5 text-sm text-subtle-foreground">
          {project && (
            <>
              <Link href={`/projects/${project.id}`} className="flex items-center gap-1.5 truncate hover:underline">
                <span aria-hidden className="size-4 rounded-sm" style={{ backgroundColor: projectColor(project.hex_color) }} />
                {projectTitle(project)}
              </Link>
              <span aria-hidden>/</span>
            </>
          )}
          <button type="button" onClick={() => void copyLink()} className="hover:underline" aria-label="Copiar enlace de la tarea">
            <TaskKey task={task} />
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Copiar enlace" onClick={() => void copyLink()}>
                <Link2 />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copiar enlace</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={task.is_favorite}
                aria-label={task.is_favorite ? "Quitar de favoritos" : "Marcar como favorita"}
                onClick={() => update.mutate({ is_favorite: !task.is_favorite })}
              >
                <Star className={cn(task.is_favorite && "fill-warning text-warning")} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{task.is_favorite ? "Quitar de favoritos" : "Favorita"}</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Más acciones">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
                <Trash2 /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onClose && (
            <Button variant="ghost" size="icon-sm" aria-label="Cerrar" onClick={onClose}>
              <X />
            </Button>
          )}
        </div>
      </header>

      <div className="grid gap-8 px-6 pb-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div data-animate className="-mx-2">
            <TaskTitle taskId={taskId} title={task.title ?? ""} />
          </div>
          <div data-animate>
            <Description task={task} />
          </div>
          <div data-animate>
            <TaskComments taskId={taskId} />
          </div>
        </div>

        <aside className="flex flex-col gap-3" aria-label="Detalles de la tarea">
          <div data-animate>
            <StatusControl task={task} />
          </div>
          <section data-animate className="rounded-lg border">
            <h2 className="border-b px-4 py-2.5 font-semibold">Detalles</h2>
            <div className="px-4 py-2">
              <DetailRow label="Responsables">
                <AssigneesField task={task} />
              </DetailRow>
              <DetailRow label="Prioridad">
                <PriorityField task={task} />
              </DetailRow>
              <DetailRow label="Etiquetas">
                <LabelsField task={task} />
              </DetailRow>
              <DetailRow label="Vencimiento">
                <DateField task={task} field="due_date" label="Fecha de vencimiento" />
              </DetailRow>
              <DetailRow label="Inicio">
                <DateField task={task} field="start_date" label="Fecha de inicio" />
              </DetailRow>
              <DetailRow label="Fin">
                <DateField task={task} field="end_date" label="Fecha de fin" />
              </DetailRow>
              <DetailRow label="Progreso">
                <ProgressField task={task} />
              </DetailRow>
              {task.created_by && (
                <DetailRow label="Informador">
                  <span className="px-2">{task.created_by.name || task.created_by.username}</span>
                </DetailRow>
              )}
            </div>
          </section>
          <p data-animate className="px-1 text-xs text-muted-foreground">
            Creada {relative(task.created)}
            <br />
            Actualizada {relative(task.updated)}
          </p>
        </aside>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {getTaskIdentifier(task)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará “{task.title}” con sus comentarios y adjuntos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void onDelete()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
