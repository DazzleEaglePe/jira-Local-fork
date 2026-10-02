"use client"

import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useSession } from "@/lib/auth/session-store"

export default function DashboardPage() {
  const user = useSession((state) => state.user)
  const logout = useSession((state) => state.logout)

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Hola, {user?.name || user?.username}</h1>
      <p className="text-muted-foreground">Sesión iniciada contra la API de Vikunja.</p>
      <div>
        <Button variant="outline" onClick={() => void logout()}>
          <LogOut /> Cerrar sesión
        </Button>
      </div>
    </main>
  )
}
