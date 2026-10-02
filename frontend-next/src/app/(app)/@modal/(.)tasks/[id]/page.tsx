"use client"

import { useParams, useRouter } from "next/navigation"

import { TaskDetail } from "@/components/task/task-detail"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

/**
 * Intercepted route: opening /tasks/:id from inside the app shows the task as a
 * modal over the current page (Jira's issue view); closing goes back.
 */
export default function TaskModal() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  return (
    <Dialog open onOpenChange={(open) => !open && router.back()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100svh-4rem)] w-[calc(100%-2rem)] max-w-6xl gap-0 overflow-y-auto p-0 sm:max-w-6xl"
      >
        <DialogTitle className="sr-only">Detalle de la tarea</DialogTitle>
        <DialogDescription className="sr-only">Edita los campos de la tarea y revisa su actividad.</DialogDescription>
        <TaskDetail taskId={Number(id)} onClose={() => router.back()} />
      </DialogContent>
    </Dialog>
  )
}
