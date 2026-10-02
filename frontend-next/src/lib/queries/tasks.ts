"use client"

import { useQuery } from "@tanstack/react-query"

import { tasksList } from "@/lib/api/generated/sdk.gen"
import type { Task } from "@/lib/api/generated/types.gen"

export const taskKeys = {
  all: ["tasks"] as const,
  open: () => ["tasks", "open"] as const,
  detail: (id: number) => ["tasks", id] as const,
}

/** Undone tasks across all projects, earliest due first ("Para ti"). */
export function useOpenTasks() {
  return useQuery({
    queryKey: taskKeys.open(),
    queryFn: async (): Promise<Task[]> => {
      const { data } = await tasksList({
        query: {
          filter: "done = false",
          sort_by: ["due_date", "id"],
          order_by: ["asc", "desc"],
          per_page: 50,
          page: 1,
        },
      })
      return data.items ?? []
    },
  })
}
