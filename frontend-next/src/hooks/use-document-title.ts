import { useEffect } from "react"

/**
 * Browser tab title for client-rendered pages whose title depends on fetched data
 * (static `metadata` can't know the project name).
 */
export function useDocumentTitle(title: string | null | undefined) {
  useEffect(() => {
    if (title) document.title = `${title} · Jira-Local`
  }, [title])
}
