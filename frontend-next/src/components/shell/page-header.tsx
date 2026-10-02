import Link from "next/link"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type Crumb = { label: string; href: string }

/** Jira page header: small breadcrumb trail, large title and optional actions. */
export function PageHeader({
  crumbs = [],
  title,
  leading,
  actions,
  children,
}: {
  crumbs?: Crumb[]
  title: React.ReactNode
  leading?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="flex flex-col gap-1 px-6 pt-5 pb-3">
      {crumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <BreadcrumbItem key={crumb.href}>
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbLink asChild>
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex min-h-9 items-center gap-2">
        {leading}
        <h1 className="truncate text-2xl font-semibold">{title}</h1>
        {actions && <div className="ml-auto flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </header>
  )
}
