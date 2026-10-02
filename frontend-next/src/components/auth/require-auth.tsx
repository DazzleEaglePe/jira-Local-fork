"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"
import { onUnauthorized } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"

/** Client-side guard for the authenticated area (the token lives in localStorage). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const status = useSession((state) => state.status)
  const bootstrap = useSession((state) => state.bootstrap)
  const expire = useSession((state) => state.expire)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    void bootstrap()
    return onUnauthorized(expire)
  }, [bootstrap, expire])

  useEffect(() => {
    if (status === "anonymous") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [status, router, pathname])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground" aria-live="polite">
        <Spinner className="size-6" />
        <span className="sr-only">Cargando sesión…</span>
      </div>
    )
  }

  return children
}
