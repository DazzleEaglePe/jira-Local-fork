"use client"

import { useParams } from "next/navigation"

import { TaskDetail } from "@/components/task/task-detail"

/** Full-page task view: direct links and reloads land here. */
export default function TaskPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <div className="mx-auto w-full max-w-6xl py-2">
      <TaskDetail taskId={Number(id)} />
    </div>
  )
}
