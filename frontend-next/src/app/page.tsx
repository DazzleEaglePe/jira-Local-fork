import { redirect } from "next/navigation"

// The app lives under /dashboard (protected); unauthenticated users are sent to /login there.
export default function Home() {
  redirect("/dashboard")
}
