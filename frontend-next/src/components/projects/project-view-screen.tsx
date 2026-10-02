"use client"

import { useState } from "react"
import Link from "next/link"
import { ChartGantt, LayoutGrid, List, Search, SquareKanban, Table, type LucideIcon } from "lucide-react"

import { Board } from "@/components/board/board"
import { TaskTable } from "@/components/views/task-table"
import { PageHeader } from "@/components/shell/page-header"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useDocumentTitle } from "@/hooks/use-document-title"
import type { ProjectView } from "@/lib/api/generated/types.gen"
import { getProjectAncestors, projectColor, projectTitle } from "@/lib/projects"
import { useBoard } from "@/lib/queries/board"
import { useProject, useProjects } from "@/lib/queries/projects"
import { cn } from "@/lib/utils"
import { sortedViews, viewLabel, type ViewKind } from "@/lib/views"

const VIEW_ICONS: Record<ViewKind, LucideIcon> = {
  list: List,
  gantt: ChartGantt,
  table: Table,
  kanban: SquareKanban,
}

function ViewTabs({ projectId, views, activeId }: { projectId: number; views: ProjectView[]; activeId: number }) {
  return (
    <nav aria-label="Vistas del proyecto" className="mt-2 flex gap-4 border-b">
      {views.map((view) => {
        const Icon = view.view_kind ? VIEW_ICONS[view.view_kind] : LayoutGrid
        const active = view.id === activeId
        return (
          <Link
            key={view.id}
            href={`/projects/${projectId}/views/${view.id}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 border-transparent px-0.5 pb-2 font-medium text-subtle-foreground transition-colors hover:border-border hover:text-foreground",
              active && "border-selected-foreground text-selected-foreground hover:border-selected-foreground hover:text-selected-foreground"
            )}
          >
            <Icon className="size-4" /> {viewLabel(view)}
          </Link>
        )
      })}
    </nav>
  )
}

function BoardSkeleton() {
  return (
    <div className="flex gap-3 px-6">
      {Array.from({ length: 3 }, (_, column) => (
        <div key={column} className="flex w-72 flex-col gap-2 rounded-lg bg-muted p-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 - column }, (_, card) => (
            <Skeleton key={card} className="h-20" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function ProjectViewScreen({ projectId, viewId }: { projectId: number; viewId: number }) {
  const { data: project } = useProject(projectId)
  const { data: projects } = useProjects()
  const views = sortedViews(project?.views)
  const view = views.find((item) => item.id === viewId)
  const isKanban = view?.view_kind === "kanban"
  const board = useBoard(projectId, isKanban ? viewId : 0)
  const [filter, setFilter] = useState("")

  const title = project ? projectTitle(project) : "Cargando…"
  useDocumentTitle(project ? `${view ? viewLabel(view) : "Proyecto"} · ${title}` : null)
  const crumbs = [
    { label: "Proyectos", href: "/projects" },
    ...getProjectAncestors(projects ?? [], projectId).map((ancestor) => ({
      label: projectTitle(ancestor),
      href: `/projects/${ancestor.id}`,
    })),
  ]

  return (
    <div className="flex h-[calc(100svh-var(--header-height))] flex-col">
      <PageHeader
        crumbs={crumbs}
        title={title}
        leading={
          <span
            aria-hidden
            className="size-6 shrink-0 rounded-md bg-muted-foreground/30"
            style={{ backgroundColor: projectColor(project?.hex_color) }}
          />
        }
      >
        {views.length > 0 && <ViewTabs projectId={projectId} views={views} activeId={viewId} />}
      </PageHeader>

      {isKanban && (
        <div className="flex items-center gap-2 px-6 pb-4">
          <div className="relative w-56">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Buscar en el tablero"
              aria-label="Buscar en el tablero"
              className="h-8 pl-8"
            />
          </div>
          {filter && <span className="text-xs text-muted-foreground">Arrastrar está desactivado mientras filtras.</span>}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {!project || (isKanban && board.isPending) ? (
          <BoardSkeleton />
        ) : isKanban && board.data ? (
          <Board buckets={board.data} project={projectId} view={viewId} doneBucketId={view?.done_bucket_id} filter={filter} />
        ) : view?.view_kind === "list" || view?.view_kind === "table" ? (
          <div className="h-full overflow-y-auto">
            <TaskTable project={projectId} view={viewId} mode={view.view_kind} />
          </div>
        ) : (
          <Empty className="mx-6 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutGrid />
              </EmptyMedia>
              <EmptyTitle>Vista {view ? viewLabel(view) : ""} en migración</EmptyTitle>
              <EmptyDescription>
                El cronograma llega en el sprint 7. Mientras tanto usa las vistas Tablero, Lista o Tabla.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
