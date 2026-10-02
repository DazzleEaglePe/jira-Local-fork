"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getErrorMessage } from "@/lib/api/client"
import { useCreateBucket } from "@/lib/queries/board"

/** "+" at the end of the board to add a column, as in Jira. */
export function CreateColumn({ project, view }: { project: number; view: number }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const create = useCreateBucket(project, view)

  async function submit() {
    const value = title.trim()
    if (!value) return
    try {
      await create.mutateAsync(value)
      setTitle("")
      setOpen(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo crear la columna"))
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" size="icon" className="shrink-0" aria-label="Crear columna" onClick={() => setOpen(true)}>
        <Plus />
      </Button>
    )
  }

  return (
    <div className="flex w-72 shrink-0 flex-col gap-2 self-start rounded-lg bg-muted p-2">
      <Input
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Nombre de la columna"
        aria-label="Nombre de la nueva columna"
        onKeyDown={(event) => {
          if (event.key === "Enter") void submit()
          if (event.key === "Escape") setOpen(false)
        }}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void submit()} disabled={create.isPending}>
          Crear
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
