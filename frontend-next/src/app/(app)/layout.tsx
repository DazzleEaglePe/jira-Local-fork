import { RequireAuth } from "@/components/auth/require-auth"

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <RequireAuth>{children}</RequireAuth>
}
