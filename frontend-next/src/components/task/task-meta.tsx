import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { Label, User } from "@/lib/api/generated/types.gen"
import { readableTextColor, toHex } from "@/lib/color"
import { initials } from "@/components/shell/user-menu"
import { cn } from "@/lib/utils"

/** Jira lozenge: small uppercase label in the label's color. */
export function LabelLozenge({ label }: { label: Label }) {
  const background = toHex(label.hex_color)
  return (
    <span
      className={cn(
        "inline-flex h-5 max-w-full items-center truncate rounded-sm px-1.5 text-[11px] font-bold tracking-wide uppercase",
        !background && "bg-secondary text-secondary-foreground"
      )}
      style={background ? { backgroundColor: background, color: readableTextColor(background) } : undefined}
    >
      {label.title}
    </span>
  )
}

/** Overlapping assignee avatars (initials), max 3 + overflow count. */
export function AssigneeStack({ users, size = "size-6" }: { users?: User[] | null; size?: string }) {
  if (!users?.length) return null
  const shown = users.slice(0, 3)
  const rest = users.length - shown.length

  return (
    <div className="flex -space-x-1.5">
      {shown.map((user) => {
        const name = user.name || user.username || "?"
        return (
          <Tooltip key={user.id}>
            <TooltipTrigger asChild>
              <Avatar className={cn(size, "border-2 border-card")}>
                <AvatarFallback className="bg-discovery text-[10px] font-semibold text-white">{initials(name)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{name}</TooltipContent>
          </Tooltip>
        )
      })}
      {rest > 0 && (
        <Avatar className={cn(size, "border-2 border-card")}>
          <AvatarFallback className="text-[10px] font-semibold">+{rest}</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
