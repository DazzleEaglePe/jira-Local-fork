"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { isOverLimit, type BoardBucket } from "@/lib/board"
import { TASKS_PER_BUCKET, useLoadMoreTasks } from "@/lib/queries/board"
import { cn } from "@/lib/utils"
import { BoardCard, taskDndId } from "./board-card"
import { ColumnMenu } from "./column-menu"
import { CreateTaskInline } from "./create-task-inline"

export const bucketDndId = (bucketId: number) => `bucket:${bucketId}`

export function BoardColumn({
  bucket,
  project,
  view,
  isDone,
  dragDisabled,
  visibleTaskIds,
  canDelete,
}: {
  bucket: BoardBucket
  project: number
  view: number
  isDone: boolean
  dragDisabled: boolean
  /** The last remaining column can't be deleted */
  canDelete: boolean
  /** When the board is filtered, only these tasks are shown */
  visibleTaskIds?: Set<number>
}) {
  const { setNodeRef, isOver } = useDroppable({ id: bucketDndId(bucket.id), data: { type: "bucket", bucketId: bucket.id } })
  const loadMore = useLoadMoreTasks(project, view)
  const tasks = visibleTaskIds ? bucket.tasks.filter((task) => visibleTaskIds.has(task.id)) : bucket.tasks
  const hasMore = bucket.tasks.length < bucket.count
  const overLimit = isOverLimit(bucket)

  return (
    <section
      aria-label={`${bucket.title}, ${bucket.count} tareas`}
      className={cn(
        "flex max-h-full w-72 shrink-0 flex-col rounded-lg bg-muted transition-colors",
        isOver && "bg-selected/60"
      )}
    >
      <header className="flex items-center gap-2 px-3 pt-3 pb-2 text-xs font-semibold tracking-wide text-subtle-foreground uppercase">
        <span className="truncate">{bucket.title}</span>
        <span className={cn("font-medium", overLimit && "rounded-sm bg-destructive px-1 text-white")}>
          {bucket.limit > 0 ? `${bucket.count} / ${bucket.limit}` : bucket.count}
        </span>
        {isDone && <Check className="size-4 text-success" aria-label="Columna de tareas hechas" />}
        <ColumnMenu bucket={bucket} project={project} view={view} canDelete={canDelete} />
      </header>

      <SortableContext items={tasks.map((task) => taskDndId(task.id))} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-12 flex-1 flex-col gap-1.5 overflow-y-auto px-1.5 pb-1.5">
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} bucketId={bucket.id} disabled={dragDisabled} />
          ))}
        </ul>
      </SortableContext>

      <div className="flex flex-col gap-1 px-1.5 pb-1.5">
        {hasMore && !visibleTaskIds && (
          <Button
            variant="ghost"
            size="sm"
            className="text-subtle-foreground"
            disabled={loadMore.isPending}
            onClick={() =>
              loadMore.mutate({ bucketId: bucket.id, page: Math.floor(bucket.tasks.length / TASKS_PER_BUCKET) + 1 })
            }
          >
            {loadMore.isPending && <Spinner />} Mostrar más ({bucket.count - bucket.tasks.length})
          </Button>
        )}
        <CreateTaskInline project={project} view={view} bucketId={bucket.id} />
      </div>
    </section>
  )
}
