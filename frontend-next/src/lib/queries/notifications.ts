"use client"

import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query"

import { notificationsList, notificationsMarkAllRead, notificationsMarkRead } from "@/lib/api/generated/sdk.gen"
import type { DatabaseNotification, PaginatedDatabaseNotification } from "@/lib/api/generated/types.gen"
import { parseTaskDate } from "@/lib/tasks"

export const notificationKeys = { all: ["notifications"] as const }

const PER_PAGE = 20
// No websocket in the Next app yet, so poll the way Vue does when its socket is down.
const POLL_MS = 10_000

type Pages = InfiniteData<PaginatedDatabaseNotification, number>

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: notificationKeys.all,
    queryFn: async ({ pageParam, signal }) => {
      const { data } = await notificationsList({ query: { page: pageParam, per_page: PER_PAGE }, signal })
      return data
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) =>
      lastPageParam < (lastPage.total_pages ?? 0) ? lastPageParam + 1 : undefined,
    refetchInterval: POLL_MS,
  })
}

function usePatchNotifications() {
  const queryClient = useQueryClient()
  return (patch: (row: DatabaseNotification) => DatabaseNotification) =>
    queryClient.setQueryData<Pages>(
      notificationKeys.all,
      (current) =>
        current && {
          ...current,
          pages: current.pages.map((page) => ({ ...page, items: (page.items ?? []).map(patch) })),
        },
    )
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const patch = usePatchNotifications()
  return useMutation({
    mutationFn: (id: number) => notificationsMarkRead({ path: { notificationid: id }, body: { read: true } }),
    onMutate: (id) => {
      const readAt = new Date().toISOString()
      patch((row) => (row.id === id ? { ...row, read_at: readAt } : row))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  const patch = usePatchNotifications()
  return useMutation({
    mutationFn: () => notificationsMarkAllRead(),
    onMutate: () => {
      const readAt = new Date().toISOString()
      patch((row) => (parseTaskDate(row.read_at) === null ? { ...row, read_at: readAt } : row))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
