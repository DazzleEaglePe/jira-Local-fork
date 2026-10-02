"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  bucketsCreate,
  bucketsDelete,
  bucketsUpdate,
  projectViewBucketsTasksList,
  projectViewTasksList,
  taskBucketUpdate,
  tasksCreate,
  tasksPositionUpdate,
} from "@/lib/api/generated/sdk.gen"
import { normalizeBuckets, normalizeTask, type BoardBucket } from "@/lib/board"
import { taskKeys } from "./tasks"

export const TASKS_PER_BUCKET = 25

export const boardKeys = {
  all: ["board"] as const,
  view: (project: number, view: number) => ["board", project, view] as const,
}

export function useBoard(project: number, view: number) {
  return useQuery({
    queryKey: boardKeys.view(project, view),
    queryFn: async ({ signal }): Promise<BoardBucket[]> => {
      const { data } = await projectViewBucketsTasksList({
        path: { project, view },
        query: { per_page: TASKS_PER_BUCKET, expand: ["comment_count"] },
        signal,
      })
      return normalizeBuckets(data.items ?? [])
    },
    enabled: project !== 0 && view > 0,
  })
}

type PersistMove = {
  project: number
  view: number
  taskId: number
  /** Set when the task changed column */
  toBucketId?: number
  position: number
}

/** Persists a drag: bucket change first (it may mark the task done), then the position. */
export function usePersistMove() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ project, view, taskId, toBucketId, position }: PersistMove) => {
      if (toBucketId !== undefined) {
        await taskBucketUpdate({ path: { project, view, bucket: toBucketId }, body: { task_id: taskId } })
      }
      await tasksPositionUpdate({ path: { task: taskId }, body: { project_view_id: view, position } })
    },
    onSettled: (_data, _error, { project, view }) =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.view(project, view) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      ]),
  })
}

export function useCreateTaskInBucket(project: number, view: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, bucketId }: { title: string; bucketId: number }) => {
      const { data } = await tasksCreate({ path: { project }, body: { title, bucket_id: bucketId } })
      return normalizeTask(data)
    },
    onSuccess: (task, { bucketId }) =>
      queryClient.setQueryData<BoardBucket[]>(boardKeys.view(project, view), (buckets) =>
        buckets?.map((bucket) =>
          bucket.id === bucketId ? { ...bucket, tasks: [...bucket.tasks, task], count: bucket.count + 1 } : bucket
        )
      ),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.view(project, view) }),
        queryClient.invalidateQueries({ queryKey: taskKeys.all }),
      ]),
  })
}

export function useCreateBucket(project: number, view: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (title: string) => {
      await bucketsCreate({ path: { project, view }, body: { title } })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKeys.view(project, view) }),
  })
}

/** Bucket update is a PUT: title, limit and position must always be sent or they reset. */
export function useUpdateBucket(project: number, view: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bucket: Pick<BoardBucket, "id" | "title" | "limit" | "position">) => {
      await bucketsUpdate({
        path: { project, view, bucket: bucket.id },
        body: { title: bucket.title, limit: bucket.limit, position: bucket.position },
      })
    },
    onMutate: (bucket) =>
      queryClient.setQueryData<BoardBucket[]>(boardKeys.view(project, view), (buckets) =>
        buckets?.map((item) => (item.id === bucket.id ? { ...item, ...bucket } : item))
      ),
    onSettled: () => queryClient.invalidateQueries({ queryKey: boardKeys.view(project, view) }),
  })
}

export function useDeleteBucket(project: number, view: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bucketId: number) => {
      await bucketsDelete({ path: { project, view, bucket: bucketId } })
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: boardKeys.view(project, view) }),
        // the backend may clear the view's default/done bucket
        queryClient.invalidateQueries({ queryKey: ["projects"] }),
      ]),
  })
}

/** Loads the next page of a bucket beyond the first TASKS_PER_BUCKET tasks. */
export function useLoadMoreTasks(project: number, view: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ bucketId, page }: { bucketId: number; page: number }) => {
      const { data } = await projectViewTasksList({
        path: { project, view },
        query: {
          page,
          per_page: TASKS_PER_BUCKET,
          sort_by: ["position"],
          order_by: ["asc"],
          filter: `bucket_id = ${bucketId}`,
          expand: ["comment_count"],
        },
      })
      return (data.items ?? []).map(normalizeTask)
    },
    onSuccess: (tasks, { bucketId }) =>
      queryClient.setQueryData<BoardBucket[]>(boardKeys.view(project, view), (buckets) =>
        buckets?.map((bucket) =>
          bucket.id === bucketId
            ? { ...bucket, tasks: [...bucket.tasks, ...tasks.filter((task) => !bucket.tasks.some((old) => old.id === task.id))] }
            : bucket
        )
      ),
  })
}
