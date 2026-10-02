"use client"

import { useState } from "react"
import { Check, Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { PROJECT_COLORS } from "@/components/shell/create-project-dialog"
import { PageHeader } from "@/components/shell/page-header"
import { LabelLozenge } from "@/components/task/task-meta"
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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label as FieldLabel } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import type { Label } from "@/lib/api/generated/types.gen"
import { getErrorMessage } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"
import { toHex } from "@/lib/color"
import { useDeleteLabel, useUpdateLabel } from "@/lib/queries/labels-teams"
import { useCreateLabel, useLabels } from "@/lib/queries/task-detail"
import { cn } from "@/lib/utils"

type Draft = { id?: number; title: string; color: string; description: string }

function LabelDialog({ draft, onClose }: { draft: Draft | null; onClose: () => void }) {
  const [form, setForm] = useState<Draft | null>(draft)
  const create = useCreateLabel()
  const update = useUpdateLabel()
  const current = form ?? draft

  async function save() {
    if (!current || !current.title.trim()) return
    const body = { title: current.title.trim(), hex_color: current.color, description: current.description }
    try {
      if (current.id) await update.mutateAsync({ id: current.id, ...body })
      else await create.mutateAsync(body)
      toast.success(current.id ? "Etiqueta actualizada" : "Etiqueta creada")
      onClose()
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo guardar la etiqueta"))
    }
  }

  return (
    <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {current && (
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <DialogHeader>
              <DialogTitle>{current.id ? "Editar etiqueta" : "Crear etiqueta"}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center rounded-md bg-muted p-4">
              <LabelLozenge label={{ title: current.title || "Vista previa", hex_color: current.color }} />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="label-title">Nombre *</FieldLabel>
              <Input
                id="label-title"
                autoFocus
                value={current.title}
                onChange={(event) => setForm({ ...current, title: event.target.value })}
              />
            </div>
            <div className="grid gap-1.5">
              <FieldLabel id="label-color">Color</FieldLabel>
              <div role="radiogroup" aria-labelledby="label-color" className="flex flex-wrap gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={current.color === color}
                    aria-label={`#${color}`}
                    onClick={() => setForm({ ...current, color })}
                    className={cn(
                      "flex size-7 items-center justify-center rounded-md text-white",
                      current.color === color && "ring-2 ring-ring ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: `#${color}` }}
                  >
                    {current.color === color && <Check className="size-4" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5">
              <FieldLabel htmlFor="label-description">Descripción</FieldLabel>
              <Textarea
                id="label-description"
                value={current.description}
                onChange={(event) => setForm({ ...current, description: event.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={create.isPending || update.isPending}>
                Guardar
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function LabelsPage() {
  const me = useSession((state) => state.user)
  const labels = useLabels()
  const remove = useDeleteLabel()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [toDelete, setToDelete] = useState<Label | null>(null)
  // Remount the dialog per draft so its form state starts fresh
  const dialogKey = draft ? `${draft.id ?? "new"}` : "closed"

  function edit(label: Label) {
    setDraft({
      id: label.id,
      title: label.title ?? "",
      color: (toHex(label.hex_color) ?? `#${PROJECT_COLORS[1]}`).slice(1),
      description: label.description ?? "",
    })
  }

  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Etiquetas"
        actions={
          <Button onClick={() => setDraft({ title: "", color: PROJECT_COLORS[1], description: "" })}>
            <Plus /> Crear etiqueta
          </Button>
        }
      >
        <p className="text-muted-foreground">Clasifica tareas en todos tus proyectos.</p>
      </PageHeader>

      <div className="px-6">
        {labels.isPending ? (
          <Skeleton className="h-40" />
        ) : (labels.data?.length ?? 0) === 0 ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Tag />
              </EmptyMedia>
              <EmptyTitle>Aún no hay etiquetas</EmptyTitle>
              <EmptyDescription>Crea una aquí o directamente desde una tarea.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y rounded-lg border">
            {labels.data!.map((label) => {
              const mine = label.created_by?.id === me?.id
              return (
                <li key={label.id} className="flex items-center gap-3 px-4 py-2.5">
                  <LabelLozenge label={label} />
                  <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{label.description}</span>
                  {mine ? (
                    <>
                      <Button variant="ghost" size="icon-sm" aria-label={`Editar ${label.title}`} onClick={() => edit(label)}>
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${label.title}`} onClick={() => setToDelete(label)}>
                        <Trash2 />
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      de {label.created_by?.name || label.created_by?.username}
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <LabelDialog key={dialogKey} draft={draft} onClose={() => setDraft(null)} />

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la etiqueta “{toDelete?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>Se quitará de todas las tareas que la usan.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() =>
                toDelete?.id &&
                remove.mutate(toDelete.id, {
                  onSuccess: () => toast.success("Etiqueta eliminada"),
                  onError: (error) => toast.error(getErrorMessage(error, "No se pudo eliminar la etiqueta")),
                })
              }
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
