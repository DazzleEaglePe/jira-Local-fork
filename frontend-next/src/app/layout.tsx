import type { Metadata } from "next"

import { Providers } from "./providers"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Jira-Local · Caja Ica",
    template: "%s · Jira-Local",
  },
  description: "Gestión de proyectos y tareas de Caja Ica",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // next-themes sets the theme class on <html> before hydration
    <html lang="es" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
