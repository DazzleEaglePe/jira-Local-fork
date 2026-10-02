"use client"

import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { patchTasksRead, projectViewTasksList, tasksCreate } from "@/lib/api/generated/sdk.gen"
import type { Task } from "@/lib/api/generated/types.gen"
import { taskPatchOps } from "@/lib/task-patch"
import { rangeFilter, type TimelineRange } from "@/lib/timeline"
import { boardKeys } from "./board"
import { taskKeys } from "./tasks"

export const VIEW_PAGE_SIZE = 50

export type ViewSort = { field: string; direction: "asc" | "desc" }

/** Server-sorted, paginated tasks of a list/table view ("Cargar más" = next page). */
export function useViewTasks(project: number, view: number, sort: ViewSort[]) {
  return useInfiniteQuery({
    queryKey: [...taskKeys.all, "view", project, view, sort],
    initialPageParam: 1,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await projectViewTasksList({
        path: { project, view },
        query: {
          page: pageParam,
          per_page: VIEW_PAGE_SIZE,
          // done last by default, like Vikunja's list view; id breaks ties
          sort_by: [...sort.map((item) => item.field), "id"],
          order_by: [...sort.map((item) => item.direction), "desc"],
        },
        signal,
      })
      return { items: (data.items ?? []) as Task[], totalPages: data.total_pages ?? 1, total: data.total ?? 0 }
    },
    getNextPageParam: (last, pages) => (pages.length < last.totalPages ? pages.length + 1 : undefined),
    placeholderData: keepPreviousData,
    enabled: project !== 0 && view > 0,
  })
}

/** Done checkbox in list/table rows (task id passed at call time). */
export function useToggleTaskDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task: Task) => {
      await patchTasksRead({ path: { task: task.id as number }, body: taskPatchOps({ done: !task.done }) })
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
      ]),
  })
}

export function useQuickCreateTask(project: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      const { data } = await tasksCreate({ path: { project }, body: { title } })
      return data as Task
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
        queryClient.invalidateQueries({ queryKey: boardKeys.all }),
      ]),
  })
}

const TIMELINE_PAGE_SIZE = 100
// Guard against runaway paging on huge projects; the timeline is a read-only overview.
const TIMELINE_MAX_PAGES = 10

/** Every task of a gantt view whose dates touch the range, sorted like the Vue gantt. */
export function useTimelineTasks(project: number, view: number, range: TimelineRange, timezone?: string) {
  return useQuery({
    queryKey: [...taskKeys.all, "timeline", project, view, range.from.getTime(), range.to.getTime()],
    queryFn: async ({ signal }) => {
      const tasks: Task[] = []
      for (let page = 1; page <= TIMELINE_MAX_PAGES; page++) {
        const { data } = await projectViewTasksList({
          path: { project, view },
          query: {
            page,
            per_page: TIMELINE_PAGE_SIZE,
            filter: rangeFilter(range),
            filter_timezone: timezone,
            filter_include_nulls: false,
            sort_by: ["start_date", "done", "id"],
            order_by: ["asc", "asc", "desc"],
          },
          signal,
        })
        tasks.push(...((data.items ?? []) as Task[]))
        if (page >= (data.total_pages ?? 1)) break
      }
      return tasks
    },
    placeholderData: keepPreviousData,
    enabled: project !== 0 && view > 0,
  })
}
