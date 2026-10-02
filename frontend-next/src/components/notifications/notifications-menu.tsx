"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Bell, CheckCheck } from "lucide-react"

import { initials } from "@/components/shell/user-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSession } from "@/lib/auth/session-store"
import { toNotificationRows, type NotificationRow } from "@/lib/notifications"
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/lib/queries/notifications"
import { parseTaskDate } from "@/lib/tasks"
import { cn } from "@/lib/utils"

function relativeTime(value?: string) {
  const date = parseTaskDate(value)
  return date ? formatDistanceToNow(date, { addSuffix: true, locale: es }) : ""
}

function NotificationItem({ row, onOpen }: { row: NotificationRow; onOpen: (row: NotificationRow) => void }) {
  const content = (
    <>
      <Avatar className="mt-0.5 size-8 shrink-0">
        <AvatarFallback className="bg-discovery text-[11px] font-semibold text-white">
          {initials(row.doerName || "?")}
        </AvatarFallback>
      </Avatar>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">
          {row.doerName && <span className="font-semibold">{row.doerName} </span>}
          {row.text}
        </span>
        <span className="text-xs text-muted-foreground">{relativeTime(row.created)}</span>
      </span>
      <span
        aria-label={row.read ? "Leída" : "No leída"}
        className={cn("mt-2 size-2 shrink-0 rounded-full", row.read ? "bg-transparent" : "bg-selected-foreground")}
      />
    </>
  )
  const base = "flex w-full items-start gap-3 px-4 py-3 text-left"
  return row.href ? (
    <button type="button" className={cn(base, "transition-colors hover:bg-accent")} onClick={() => onOpen(row)}>
      {content}
    </button>
  ) : (
    <div className={base}>{content}</div>
  )
}

/** Jira-style bell: unread badge, popover list, "solo no leídas" filter and mark all as read. */
export function NotificationsMenu() {
  const router = useRouter()
  const me = useSession((state) => state.user)
  const [open, setOpen] = useState(false)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const query = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const rows = toNotificationRows(query.data?.pages.flatMap((page) => page.items ?? []) ?? [], me)
  const unread = rows.filter((row) => !row.read).length
  const visible = onlyUnread ? rows.filter((row) => !row.read) : rows

  function openRow(row: NotificationRow) {
    if (!row.read) markRead.mutate(row.id)
    setOpen(false)
    if (row.href) router.push(row.href)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative"
              aria-label={unread > 0 ? `Notificaciones, ${unread} sin leer` : "Notificaciones"}
            >
              <Bell />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notificaciones</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-[min(26rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
          <h2 className="text-base font-semibold">Notificaciones</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="only-unread"
                checked={onlyUnread}
                onCheckedChange={(checked) => setOnlyUnread(checked === true)}
              />
              <Label htmlFor="only-unread" className="text-xs font-normal text-muted-foreground">
                Solo no leídas
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Marcar todas como leídas"
                  disabled={unread === 0 || markAll.isPending}
                  onClick={() => markAll.mutate()}
                >
                  <CheckCheck />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Marcar todas como leídas</TooltipContent>
            </Tooltip>
          </div>
        </div>
        <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
          {query.isPending ? (
            <div className="flex flex-col gap-3 p-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
              <Bell className="size-6" />
              {onlyUnread ? "No tienes notificaciones sin leer." : "Aún no tienes notificaciones."}
            </div>
          ) : (
            <ul className="divide-y">
              {visible.map((row) => (
                <li key={row.id}>
                  <NotificationItem row={row} onOpen={openRow} />
                </li>
              ))}
            </ul>
          )}
          {query.hasNextPage && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                className="w-full"
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                Cargar más
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
