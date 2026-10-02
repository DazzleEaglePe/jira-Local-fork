"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  bucketsList,
  labelsCreate,
  labelsList,
  patchTasksRead,
  projectsUsersSearch,
  taskAssigneesCreate,
  taskAssigneesDelete,
  taskBucketUpdate,
  taskCommentsCreate,
  taskCommentsDelete,
  taskCommentsList,
  taskLabelsCreate,
  taskLabelsDelete,
  tasksDelete,
  tasksRead,
} from "@/lib/api/generated/sdk.gen"
import type { Label, Task, User } from "@/lib/api/generated/types.gen"
import { taskPatchOps, type TaskChanges } from "@/lib/task-patch"
import { boardKeys } from "./board"
import { taskKeys } from "./tasks"

export const commentKeys = { list: (taskId: number) => ["comments", taskId] as const }
export const labelKeys = { all: ["labels"] as const }

/** Board, "Para ti" and other task lists must reflect detail edits. */
function invalidateTaskLists(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: boardKeys.all }),
    queryClient.invalidateQueries({ queryKey: taskKeys.open() }),
  ])
}

export function useTask(taskId: number) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async ({ signal }) => {
      const { data } = await tasksRead({ path: { task: taskId }, query: { expand: ["buckets", "comment_count"] }, signal })
      return data as Task
    },
    enabled: taskId > 0,
  })
}

export function useUpdateTask(taskId: number) {
  const queryClient = useQueryClient()
  const key = taskKeys.detail(taskId)
  return useMutation({
    mutationFn: async (changes: TaskChanges) => {
      const { data } = await patchTasksRead({ path: { task: taskId }, body: taskPatchOps(changes) })
      return data as Task
    },
    // Optimistic: the field updates immediately; rolled back if the server refuses.
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Task>(key)
      if (previous) queryClient.setQueryData<Task>(key, { ...previous, ...changes })
      return { previous }
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous)
    },
    onSuccess: (task) => queryClient.setQueryData<Task>(key, (current) => ({ ...current, ...task })),
    onSettled: () => invalidateTaskLists(queryClient),
  })
}

export function useDeleteTask(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await tasksDelete({ path: { task: taskId } })
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) })
      return invalidateTaskLists(queryClient)
    },
  })
}

/** Buckets of a kanban view: the task's "status" options, as Jira columns. */
export function useViewBuckets(project: number, view?: number) {
  return useQuery({
    queryKey: ["buckets", project, view],
    queryFn: async () => {
      const { data } = await bucketsList({ path: { project, view: view as number } })
      return (data.items ?? []).sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    },
    enabled: project > 0 && Boolean(view),
  })
}

export function useMoveTaskToBucket(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ project, view, bucket }: { project: number; view: number; bucket: number }) => {
      await taskBucketUpdate({ path: { project, view, bucket }, body: { task_id: taskId } })
    },
    onSettled: () =>
      Promise.all([invalidateTaskLists(queryClient), queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })]),
  })
}

export function useProjectUserSearch(project: number, query: string) {
  return useQuery({
    queryKey: ["project-users", project, query],
    queryFn: async () => {
      const { data } = await projectsUsersSearch({ path: { project }, query: { q: query } })
      return (data.items ?? []) as User[]
    },
    enabled: project > 0,
    staleTime: 60_000,
  })
}

export function useToggleAssignee(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ user, assigned }: { user: User; assigned: boolean }) => {
      if (assigned) await taskAssigneesDelete({ path: { task: taskId, user: user.id as number } })
      else await taskAssigneesCreate({ path: { task: taskId }, body: { user_id: user.id } })
    },
    onSettled: () =>
      Promise.all([invalidateTaskLists(queryClient), queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })]),
  })
}

export function useLabels() {
  return useQuery({
    queryKey: labelKeys.all,
    queryFn: async () => {
      const { data } = await labelsList({ query: { page: 1, per_page: 500 } })
      return (data.items ?? []) as Label[]
    },
  })
}

export function useToggleLabel(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ label, attached }: { label: Label; attached: boolean }) => {
      if (attached) await taskLabelsDelete({ path: { task: taskId, label: label.id as number } })
      else await taskLabelsCreate({ path: { task: taskId }, body: { label_id: label.id } })
    },
    onSettled: () =>
      Promise.all([invalidateTaskLists(queryClient), queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) })]),
  })
}

export function useCreateLabel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { title: string; hex_color: string }) => {
      const { data } = await labelsCreate({ body: input })
      return data as Label
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: labelKeys.all }),
  })
}

export function useComments(taskId: number) {
  return useQuery({
    queryKey: commentKeys.list(taskId),
    queryFn: async () => {
      const { data } = await taskCommentsList({ path: { task: taskId }, query: { order_by: "asc", per_page: 100, page: 1 } })
      return data.items ?? []
    },
    enabled: taskId > 0,
  })
}

export function useAddComment(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (comment: string) => {
      const { data } = await taskCommentsCreate({ path: { task: taskId }, body: { comment } })
      return data
    },
    onSettled: () =>
      Promise.all([queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) }), invalidateTaskLists(queryClient)]),
  })
}

export function useDeleteComment(taskId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: number) => {
      await taskCommentsDelete({ path: { task: taskId, commentid: commentId } })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: commentKeys.list(taskId) }),
  })
}
