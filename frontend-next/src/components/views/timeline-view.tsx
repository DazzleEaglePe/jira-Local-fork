"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { format, isSameDay, isWeekend } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react"

import { TaskKey } from "@/components/task/task-key"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Task } from "@/lib/api/generated/types.gen"
import { useSession } from "@/lib/auth/session-store"
import { readableTextColor, toHex } from "@/lib/color"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { useTimelineTasks } from "@/lib/queries/view-tasks"
import { formatTaskDate } from "@/lib/tasks"
import { barGeometry, defaultRange, rangeDays, shiftRange, taskSpan, type TimelineRange } from "@/lib/timeline"
import { cn } from "@/lib/utils"

const DAY_WIDTH = 32
const ROW_HEIGHT = 40
const SHIFT_DAYS = 28

function monthSegments(days: Date[]) {
  const segments: { key: string; label: string; span: number }[] = []
  for (const day of days) {
    const key = format(day, "yyyy-MM")
    const last = segments.at(-1)
    if (last?.key === key) last.span++
    else segments.push({ key, label: format(day, "LLLL yyyy", { locale: es }), span: 1 })
  }
  return segments
}

function TimelineBar({ task, range }: { task: Task; range: TimelineRange }) {
  const span = taskSpan(task)
  const geometry = span && barGeometry(span, range)
  if (!span || !geometry) return null
  const color = toHex(task.hex_color)
  const dates =
    span.start.getTime() === span.end.getTime()
      ? formatTaskDate(span.start.toISOString())
      : `${formatTaskDate(span.start.toISOString())} – ${formatTaskDate(span.end.toISOString())}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/tasks/${task.id}`}
          data-bar
          className={cn(
            "absolute top-2 flex h-6 items-center overflow-hidden rounded-sm px-2 text-xs font-medium shadow-raised transition-[filter] hover:brightness-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            !color && "bg-information text-white",
            task.done && "opacity-60",
            geometry.clippedStart && "rounded-l-none",
            geometry.clippedEnd && "rounded-r-none",
          )}
          style={{
            left: geometry.startDay * DAY_WIDTH + 2,
            width: geometry.days * DAY_WIDTH - 4,
            ...(color ? { backgroundColor: color, color: readableTextColor(color) } : {}),
          }}
        >
          <span className="truncate">{task.title}</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {task.title} · {dates}
      </TooltipContent>
    </Tooltip>
  )
}

/** Read-only Jira-style timeline ("Cronograma") for gantt views. */
export function TimelineView({ project, view }: { project: number; view: number }) {
  const timezone = useSession((state) => state.user?.settings?.timezone)
  const [range, setRange] = useState(() => defaultRange())
  const [scrollRequest, setScrollRequest] = useState(0)
  const tasks = useTimelineTasks(project, view, range, timezone || undefined)
  const scroller = useRef<HTMLDivElement>(null)
  const days = rangeDays(range)
  const today = new Date()
  const todayIndex = days.findIndex((day) => isSameDay(day, today))
  const rows = (tasks.data ?? []).filter((task) => taskSpan(task) !== null)

  // Open on today, like Jira, leaving a few days of context on the left.
  useEffect(() => {
    if (scroller.current && todayIndex >= 0) scroller.current.scrollLeft = Math.max(todayIndex - 3, 0) * DAY_WIDTH
  }, [todayIndex, scrollRequest])

  useGSAP(
    () => {
      if (!tasks.data) return
      gsap.matchMedia().add(MOTION_OK, () => {
        // fromTo + clearProps: a refetch mid-animation must not freeze bars at a partial scale.
        gsap.fromTo(
          "[data-bar]",
          { scaleX: 0 },
          { scaleX: 1, transformOrigin: "left center", duration: 0.4, stagger: 0.015, ease: "power2.out", clearProps: "transform" },
        )
      })
    },
    { scope: scroller, dependencies: [tasks.data], revertOnUpdate: true },
  )

  const width = days.length * DAY_WIDTH

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 pb-3">
        <Button variant="outline" size="sm" onClick={() => {
            setRange(defaultRange())
            setScrollRequest((count) => count + 1)
          }}
        >
          Hoy
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Periodo anterior" onClick={() => setRange(shiftRange(range, -SHIFT_DAYS))}>
          <ChevronLeft />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Periodo siguiente" onClick={() => setRange(shiftRange(range, SHIFT_DAYS))}>
          <ChevronRight />
        </Button>
        <span className="text-sm text-muted-foreground">
          {format(range.from, "d MMM", { locale: es })} – {format(range.to, "d MMM yyyy", { locale: es })}
        </span>
        {tasks.isFetching && <span className="text-xs text-muted-foreground">Actualizando…</span>}
      </div>

      <div ref={scroller} className="relative min-h-0 flex-1 overflow-auto border-t">
        <div className="relative" style={{ width: width + 288 }}>
          {/* header */}
          <div className="sticky top-0 z-20 flex border-b bg-background">
            <div className="sticky left-0 z-30 flex w-72 shrink-0 items-end border-r bg-background px-4 pb-1.5 text-xs font-semibold text-muted-foreground">
              Tarea
            </div>
            <div style={{ width }}>
              <div className="flex">
                {monthSegments(days).map((segment) => (
                  <div
                    key={segment.key}
                    className="truncate border-l px-2 py-1 text-xs font-semibold capitalize first:border-l-0"
                    style={{ width: segment.span * DAY_WIDTH }}
                  >
                    {segment.label}
                  </div>
                ))}
              </div>
              <div className="flex">
                {days.map((day, index) => (
                  <div
                    key={day.getTime()}
                    className={cn(
                      "py-1 text-center text-[11px] text-muted-foreground",
                      isWeekend(day) && "bg-muted",
                      index === todayIndex && "font-bold text-selected-foreground",
                    )}
                    style={{ width: DAY_WIDTH }}
                  >
                    {format(day, "d")}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* body: sticky task column + day grid, so nothing shows through under the column */}
          <div className="flex" style={{ minHeight: Math.max(rows.length, 6) * ROW_HEIGHT }}>
            <div className="sticky left-0 z-10 w-72 shrink-0 border-r bg-background">
              {tasks.isPending ? (
                <div className="flex flex-col gap-2 p-4">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Skeleton key={index} className="h-6" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-muted-foreground">
                  <CalendarRange className="size-8" />
                  <p className="font-medium text-foreground">No hay tareas con fechas en este periodo</p>
                  <p>Asigna fecha de inicio, fin o vencimiento a una tarea para verla aquí.</p>
                </div>
              ) : (
                <ul>
                  {rows.map((task) => (
                    <li key={task.id} className="border-b border-border/60" style={{ height: ROW_HEIGHT }}>
                      <Link href={`/tasks/${task.id}`} className="flex h-full items-center gap-2 px-4 text-sm hover:bg-accent">
                        <TaskKey task={task} className="shrink-0" />
                        <span className={cn("truncate", task.done && "text-muted-foreground line-through")}>
                          {task.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="relative" style={{ width }}>
              <div aria-hidden className="pointer-events-none absolute inset-0 flex">
                {days.map((day) => (
                  <div key={day.getTime()} className={cn("h-full", isWeekend(day) && "bg-muted")} style={{ width: DAY_WIDTH }} />
                ))}
              </div>
              {todayIndex >= 0 && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 z-[1] w-0.5 bg-selected-foreground"
                  style={{ left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2 - 1 }}
                />
              )}
              {rows.map((task) => (
                <div key={task.id} className="relative border-b border-border/60" style={{ height: ROW_HEIGHT }}>
                  <TimelineBar task={task} range={range} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
