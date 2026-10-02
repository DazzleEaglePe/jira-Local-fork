"use client"

import { useState } from "react"
import { toast } from "sonner"

import { Textarea } from "@/components/ui/textarea"
import { getErrorMessage } from "@/lib/api/client"
import { useUpdateTask } from "@/lib/queries/task-detail"

/** Jira summary: large heading, click to edit inline (Enter saves, Esc cancels). */
export function TaskTitle({ taskId, title }: { taskId: number; title: string }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(title)
  const update = useUpdateTask(taskId)

  function startEditing() {
    setDraft(title)
    setEditing(true)
  }

  function save() {
    setEditing(false)
    const value = draft.trim()
    if (!value || value === title) return
    update.mutate({ title: value }, { onError: (error) => toast.error(getErrorMessage(error, "No se pudo renombrar la tarea")) })
  }

  if (editing) {
    return (
      <Textarea
        autoFocus
        value={draft}
        aria-label="Título de la tarea"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={save}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.nativeEvent.isComposing) {
            event.preventDefault()
            save()
          }
          if (event.key === "Escape") {
            event.stopPropagation() // don't close the modal
            setEditing(false)
          }
        }}
        className="min-h-0 resize-none px-2 py-1 text-2xl font-semibold md:text-2xl"
        rows={1}
      />
    )
  }

  return (
    <h1>
      <button
        type="button"
        onClick={startEditing}
        className="w-full rounded-md px-2 py-1 text-left text-2xl font-semibold break-words hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        aria-label={`Título: ${title}. Editar`}
      >
        {title}
      </button>
    </h1>
  )
}
