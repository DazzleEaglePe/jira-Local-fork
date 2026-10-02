"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/client"
import { useCreateTaskInBucket } from "@/lib/queries/board"

/** Jira "+ Crear" at the bottom of a column: inline textarea, Enter to create, Esc to cancel. */
export function CreateTaskInline({ project, view, bucketId }: { project: number; view: number; bucketId: number }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const createTask = useCreateTaskInBucket(project, view)

  async function submit() {
    const value = title.trim()
    if (!value) return
    try {
      await createTask.mutateAsync({ title: value, bucketId })
      setTitle("") // stay open to add several in a row, like Jira
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la tarea"))
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-full justify-start text-subtle-foreground" onClick={() => setOpen(true)}>
        <Plus /> Crear
      </Button>
    )
  }

  return (
    <div className="rounded-md bg-card p-2 shadow-raised">
      <Textarea
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="¿Qué hay que hacer?"
        aria-label="Título de la nueva tarea"
        className="min-h-16 resize-none border-0 p-1 shadow-none focus-visible:ring-0"
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault()
            void submit()
          }
          if (event.key === "Escape") {
            setOpen(false)
            setTitle("")
          }
        }}
        onBlur={() => !title.trim() && setOpen(false)}
        disabled={createTask.isPending}
      />
      <p className="px-1 text-xs text-muted-foreground">Enter para crear · Esc para cancelar</p>
    </div>
  )
}
