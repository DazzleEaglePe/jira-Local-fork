"use client"

import { useRef, useState } from "react"
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { getErrorMessage } from "@/lib/api/client"
import { findTaskLocation, moveTask, planDrop, type BoardBucket } from "@/lib/board"
import { gsap, MOTION_OK } from "@/lib/gsap"
import { boardKeys, usePersistMove } from "@/lib/queries/board"
import { BoardCardContent } from "./board-card"
import { BoardColumn } from "./board-column"
import { CreateColumn } from "./create-column"

type DndData = { type: "task" | "bucket"; bucketId: number }

/**
 * Keyboard moves: ←/→ jump straight to the neighbouring column (ordered on screen),
 * ↑/↓ reorder within the column via dnd-kit's sortable getter.
 */
const boardKeyboardCoordinates: KeyboardCoordinateGetter = (event, args) => {
  if (event.code !== "ArrowLeft" && event.code !== "ArrowRight") {
    return sortableKeyboardCoordinates(event, args)
  }
  const { active, over, droppableContainers } = args.context
  if (!active) return undefined
  const columns = droppableContainers
    .getEnabled()
    .filter((container) => (container.data.current as DndData | undefined)?.type === "bucket" && container.rect.current)
    .sort((a, b) => a.rect.current!.left - b.rect.current!.left)
  const currentBucket = ((over?.data.current ?? active.data.current) as DndData | undefined)?.bucketId
  const index = columns.findIndex((container) => (container.data.current as DndData).bucketId === currentBucket)
  const target = columns[index + (event.code === "ArrowLeft" ? -1 : 1)]
  if (index < 0 || !target?.rect.current) return undefined
  event.preventDefault()
  return { x: target.rect.current.left + 8, y: target.rect.current.top + 8 }
}

function parseTaskId(id: string | number): number {
  return Number(String(id).replace("task:", ""))
}

/** Where a dragged task would land given what it's hovering. */
function dropTarget(buckets: BoardBucket[], over: DragOverEvent["over"]) {
  if (!over) return null
  const data = over.data.current as DndData | undefined
  if (!data) return null
  const bucket = buckets.find((item) => item.id === data.bucketId)
  if (!bucket) return null
  if (data.type === "bucket") return { bucketId: bucket.id, index: bucket.tasks.length }
  const index = bucket.tasks.findIndex((task) => task.id === parseTaskId(over.id))
  return { bucketId: bucket.id, index: index < 0 ? bucket.tasks.length : index }
}

export function Board({
  buckets,
  project,
  view,
  doneBucketId,
  filter,
}: {
  buckets: BoardBucket[]
  project: number
  view: number
  doneBucketId?: number
  filter: string
}) {
  const queryClient = useQueryClient()
  const persistMove = usePersistMove()
  // Local copy only while dragging; otherwise the query cache is the source of truth.
  const [draft, setDraft] = useState<BoardBucket[] | null>(null)
  const [activeId, setActiveId] = useState<number | null>(null)
  const originBucket = useRef<number | null>(null)
  const columns = draft ?? buckets

  const needle = filter.trim().toLowerCase()
  const visibleTaskIds = needle
    ? new Set(columns.flatMap((bucket) => bucket.tasks).filter((task) => task.title?.toLowerCase().includes(needle)).map((task) => task.id))
    : undefined

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: boardKeyboardCoordinates })
  )

  const titleOf = (id: string | number) =>
    columns.flatMap((bucket) => bucket.tasks).find((task) => task.id === parseTaskId(id))?.title ?? "tarea"
  const bucketTitle = (bucketId?: number) => columns.find((bucket) => bucket.id === bucketId)?.title ?? ""
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste "${titleOf(active.id)}".`,
    onDragOver: ({ active, over }) =>
      over ? `"${titleOf(active.id)}" sobre ${bucketTitle((over.data.current as DndData)?.bucketId)}.` : "Fuera del tablero.",
    onDragEnd: ({ active, over }) =>
      over ? `"${titleOf(active.id)}" soltada en ${bucketTitle((over.data.current as DndData)?.bucketId)}.` : "Movimiento cancelado.",
    onDragCancel: ({ active }) => `Movimiento de "${titleOf(active.id)}" cancelado.`,
  }

  function onDragStart({ active }: DragStartEvent) {
    const taskId = parseTaskId(active.id)
    setActiveId(taskId)
    setDraft(buckets)
    originBucket.current = findTaskLocation(buckets, taskId)?.bucketId ?? null
  }

  // Live move across columns so the target column makes room while hovering.
  function onDragOver({ active, over }: DragOverEvent) {
    setDraft((current) => {
      if (!current) return current
      const taskId = parseTaskId(active.id)
      const from = findTaskLocation(current, taskId)
      const target = dropTarget(current, over)
      if (!from || !target || from.bucketId === target.bucketId) return current
      return moveTask(current, taskId, target.bucketId, target.index)
    })
  }

  async function onDragEnd({ active, over }: DragEndEvent) {
    const taskId = parseTaskId(active.id)
    const current = draft ?? buckets
    setActiveId(null)
    const target = dropTarget(current, over)
    const from = findTaskLocation(current, taskId)
    if (!target || !from) {
      setDraft(null)
      return
    }

    const { buckets: next, position } = planDrop(current, taskId, target.bucketId, target.index)
    const changedBucket = originBucket.current !== target.bucketId

    // Optimistic: commit the new order to the cache, then persist.
    queryClient.setQueryData<BoardBucket[]>(boardKeys.view(project, view), next)
    setDraft(null)
    settle(taskId)

    try {
      await persistMove.mutateAsync({
        project,
        view,
        taskId,
        position,
        toBucketId: changedBucket ? target.bucketId : undefined,
      })
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo mover la tarea"))
    }
  }

  const activeTask = activeId ? columns.flatMap((bucket) => bucket.tasks).find((task) => task.id === activeId) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setDraft(null)
        setActiveId(null)
      }}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "Para mover una tarea, presiona espacio o Enter, usa las flechas para moverla y presiona espacio o Enter de nuevo para soltarla. Esc cancela.",
        },
      }}
    >
      <div className="flex h-full gap-3 overflow-x-auto px-6 pb-4">
        {columns.map((bucket) => (
          <BoardColumn
            key={bucket.id}
            bucket={bucket}
            project={project}
            view={view}
            isDone={bucket.id === doneBucketId}
            dragDisabled={Boolean(visibleTaskIds)}
            visibleTaskIds={visibleTaskIds}
            canDelete={columns.length > 1}
          />
        ))}
        <CreateColumn project={project} view={view} />
      </div>
      <DragOverlay>
        {activeTask && (
          <div className="w-[17.25rem] rotate-2 cursor-grabbing rounded-md bg-card p-3 shadow-overlay">
            <BoardCardContent task={activeTask} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

/** GSAP "settle" feedback on the card that was just dropped (skipped for reduced motion). */
function settle(taskId: number) {
  if (!window.matchMedia(MOTION_OK).matches) return
  requestAnimationFrame(() => {
    const element = document.querySelector(`[data-task-id="${taskId}"]`)
    if (!element) return
    gsap.fromTo(element, { scale: 1.03 }, { scale: 1, duration: 0.35, ease: "back.out(2)", clearProps: "scale" })
  })
}
