"use client"

import { useRef } from "react"
import Link from "next/link"
import { CalendarDays, ClipboardCheck } from "lucide-react"

import { PageHeader } from "@/components/shell/page-header"
import { PriorityIcon } from "@/components/task/priority-icon"
import { TaskKey } from "@/components/task/task-key"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import type { Project, Task } from "@/lib/api/generated/types.gen"
import { useSession } from "@/lib/auth/session-store"
import { gsap, MOTION_OK, useGSAP } from "@/lib/gsap"
import { buildProjectTree, projectColor, projectTitle } from "@/lib/projects"
import { useProjects } from "@/lib/queries/projects"
import { useOpenTasks } from "@/lib/queries/tasks"
import { formatTaskDate, isTaskOverdue } from "@/lib/tasks"
import { cn } from "@/lib/utils"

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects/${project.id}`}
      data-animate="card"
      className="flex w-56 shrink-0 flex-col gap-3 rounded-lg border bg-card p-4 shadow-raised transition-colors hover:bg-accent"
    >
      <span
        aria-hidden
        className="size-8 rounded-md bg-muted-foreground/30"
        style={{ backgroundColor: projectColor(project.hex_color) }}
      />
      <span className="truncate font-semibold">{projectTitle(project)}</span>
    </Link>
  )
}

function TaskRow({ task, projectsById }: { task: Task; projectsById: Map<number, Project> }) {
  const project = projectsById.get(task.project_id ?? 0)
  const due = formatTaskDate(task.due_date)
  const overdue = isTaskOverdue(task)

  return (
    <li data-animate="row">
      <Link
        href={`/tasks/${task.id}`}
        className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-accent"
      >
        <TaskKey task={task} className="w-16 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{task.title}</span>
        {project && (
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:flex">
            <span
              aria-hidden
              className="size-3 rounded-sm bg-muted-foreground/30"
              style={{ backgroundColor: projectColor(project.hex_color) }}
            />
            {projectTitle(project)}
          </span>
        )}
        <PriorityIcon priority={task.priority} />
        {due && (
          <span
            className={cn(
              "flex w-28 items-center justify-end gap-1 text-xs text-muted-foreground",
              overdue && "font-medium text-danger-foreground"
            )}
          >
            <CalendarDays className="size-3.5" /> {due}
          </span>
        )}
      </Link>
    </li>
  )
}

export function ForYou() {
  const user = useSession((state) => state.user)
  const projects = useProjects()
  const tasks = useOpenTasks()
  const root = useRef<HTMLDivElement>(null)

  const recentProjects = buildProjectTree(projects.data ?? []).slice(0, 6)
  const projectsById = new Map((projects.data ?? []).map((project) => [project.id ?? 0, project]))

  useGSAP(
    () => {
      gsap.matchMedia().add(MOTION_OK, () => {
        gsap.from("[data-animate=card]", { y: 8, autoAlpha: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" })
        gsap.from("[data-animate=row]", { y: 4, autoAlpha: 0, duration: 0.25, stagger: 0.03, ease: "power1.out" })
      })
    },
    { dependencies: [projects.isSuccess, tasks.isSuccess], scope: root }
  )

  return (
    <div ref={root} className="flex flex-col pb-10">
      <PageHeader title="Para ti">
        <p className="text-muted-foreground">Hola, {user?.name || user?.username}. Esto es lo que tienes pendiente.</p>
      </PageHeader>

      <section className="px-6 pt-2" aria-labelledby="recent-projects">
        <h2 id="recent-projects" className="mb-3 text-sm font-semibold text-subtle-foreground">
          Proyectos recientes
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {projects.isPending
            ? Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-28 w-56 shrink-0" />)
            : recentProjects.map((project) => <ProjectCard key={project.id} project={project} />)}
        </div>
      </section>

      <section className="px-6 pt-6" aria-labelledby="open-work">
        <h2 id="open-work" className="mb-2 text-sm font-semibold text-subtle-foreground">
          Trabajo pendiente {tasks.data && <span className="text-muted-foreground">({tasks.data.length})</span>}
        </h2>
        {tasks.isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-9" />
            ))}
          </div>
        ) : tasks.data && tasks.data.length > 0 ? (
          <ul className="flex flex-col rounded-lg border bg-card p-1">
            {tasks.data.map((task) => (
              <TaskRow key={task.id} task={task} projectsById={projectsById} />
            ))}
          </ul>
        ) : (
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardCheck />
              </EmptyMedia>
              <EmptyTitle>Nada pendiente</EmptyTitle>
              <EmptyDescription>No tienes tareas abiertas. ¡Buen trabajo!</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </section>
    </div>
  )
}
