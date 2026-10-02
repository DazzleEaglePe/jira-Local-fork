import { RequireAuth } from "@/components/auth/require-auth"
import { AppShell } from "@/components/shell/app-shell"

export default function AppLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
      {modal}
    </RequireAuth>
  )
}
