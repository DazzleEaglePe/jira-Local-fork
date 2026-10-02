"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { CalendarDays, MessageSquare } from "lucide-react"

import { PriorityIcon } from "@/components/task/priority-icon"
import { TaskKey } from "@/components/task/task-key"
import { AssigneeStack, LabelLozenge } from "@/components/task/task-meta"
import type { BoardTask } from "@/lib/board"
import { formatTaskDate, isTaskOverdue } from "@/lib/tasks"
import { cn } from "@/lib/utils"

export const taskDndId = (taskId: number) => `task:${taskId}`

/** Card body shared by the sortable card and the drag overlay. */
export function BoardCardContent({ task }: { task: BoardTask }) {
  const due = formatTaskDate(task.due_date)
  const overdue = isTaskOverdue(task)

  return (
    <>
      <Link
        href={`/tasks/${task.id}`}
        className="block text-sm leading-5 break-words hover:underline focus-visible:underline focus-visible:outline-none"
        onClick={(event) => event.stopPropagation()}
        draggable={false}
      >
        {task.title}
      </Link>
      {(task.labels?.length ?? 0) > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.labels!.map((label) => (
            <LabelLozenge key={label.id} label={label} />
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <TaskKey task={task} />
        {due && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-sm px-1 text-xs text-muted-foreground",
              overdue && "bg-destructive/10 font-medium text-danger-foreground"
            )}
          >
            <CalendarDays className="size-3" /> {due}
          </span>
        )}
        {(task.comment_count ?? 0) > 0 && (
          <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground" aria-label={`${task.comment_count} comentarios`}>
            <MessageSquare className="size-3" /> {task.comment_count}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          <PriorityIcon priority={task.priority} />
          <AssigneeStack users={task.assignees} />
        </span>
      </div>
    </>
  )
}

export function BoardCard({ task, bucketId, disabled }: { task: BoardTask; bucketId: number; disabled?: boolean }) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: taskDndId(task.id),
    data: { type: "task", bucketId },
    disabled,
    attributes: { roleDescription: "tarjeta arrastrable" },
  })

  return (
    <li
      ref={setNodeRef}
      data-task-id={task.id}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "cursor-grab list-none rounded-md bg-card p-3 shadow-raised transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        isDragging && "opacity-40",
        disabled && "cursor-pointer"
      )}
      onClick={() => router.push(`/tasks/${task.id}`)}
      {...attributes}
      {...listeners}
    >
      <BoardCardContent task={task} />
    </li>
  )
}
