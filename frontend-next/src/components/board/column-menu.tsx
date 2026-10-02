"use client"

import { useState } from "react"
import { Ellipsis, Gauge, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage } from "@/lib/api/client"
import type { BoardBucket } from "@/lib/board"
import { useDeleteBucket, useUpdateBucket } from "@/lib/queries/board"

type Edit = "rename" | "limit" | "delete" | null

/** Column "…" menu: rename, WIP limit, delete (Jira column actions). */
export function ColumnMenu({
  bucket,
  project,
  view,
  canDelete,
}: {
  bucket: BoardBucket
  project: number
  view: number
  canDelete: boolean
}) {
  const [edit, setEdit] = useState<Edit>(null)
  const [value, setValue] = useState("")
  const update = useUpdateBucket(project, view)
  const remove = useDeleteBucket(project, view)

  function open(kind: Edit) {
    setValue(kind === "rename" ? bucket.title : String(bucket.limit || ""))
    setEdit(kind)
  }

  async function saveEdit() {
    const changes =
      edit === "rename"
        ? { title: value.trim() || bucket.title }
        : { limit: Math.max(0, Number.parseInt(value, 10) || 0) }
    try {
      await update.mutateAsync({ id: bucket.id, title: bucket.title, limit: bucket.limit, position: bucket.position, ...changes })
      setEdit(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo actualizar la columna"))
    }
  }

  async function confirmDelete() {
    try {
      await remove.mutateAsync(bucket.id)
      toast.success(`Columna "${bucket.title}" eliminada`)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo eliminar la columna"))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="ml-auto size-7 text-subtle-foreground" aria-label={`Acciones de la columna ${bucket.title}`}>
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => open("rename")}>
            <Pencil /> Cambiar nombre
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => open("limit")}>
            <Gauge /> Límite de tareas (WIP)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!canDelete} onSelect={() => setEdit("delete")}>
            <Trash2 /> Eliminar columna
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={edit === "rename" || edit === "limit"} onOpenChange={(next) => !next && setEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void saveEdit()
            }}
            className="grid gap-4"
          >
            <DialogHeader>
              <DialogTitle>{edit === "rename" ? "Cambiar nombre de la columna" : "Límite de tareas en progreso"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor="column-value">{edit === "rename" ? "Nombre" : "Máximo de tareas (0 = sin límite)"}</Label>
              <Input
                id="column-value"
                autoFocus
                type={edit === "limit" ? "number" : "text"}
                min={0}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEdit(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={edit === "delete"} onOpenChange={(next) => !next && setEdit(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la columna “{bucket.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Sus {bucket.count} tareas pasarán a la columna por defecto del tablero. Las tareas no se eliminan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => void confirmDelete()}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
