import { SquareCheck } from "lucide-react"

import type { Task } from "@/lib/api/generated/types.gen"
import { getTaskIdentifier } from "@/lib/tasks"
import { cn } from "@/lib/utils"

/** Jira issue key: type icon + key, struck through once the task is done. */
export function TaskKey({ task, className }: { task: Pick<Task, "identifier" | "index" | "done">; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground",
        task.done && "line-through",
        className
      )}
    >
      <SquareCheck className="size-4 text-information" aria-hidden />
      {getTaskIdentifier(task)}
    </span>
  )
}
