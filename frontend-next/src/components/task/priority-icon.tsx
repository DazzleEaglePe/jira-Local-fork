import { ChevronDown, ChevronUp, ChevronsUp, Equal, type LucideIcon } from "lucide-react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PRIORITIES, PRIORITY_LABELS } from "@/lib/tasks"
import { cn } from "@/lib/utils"

const PRIORITY_ICONS: Record<number, { icon: LucideIcon; className: string }> = {
  [PRIORITIES.LOW]: { icon: ChevronDown, className: "text-information" },
  [PRIORITIES.MEDIUM]: { icon: Equal, className: "text-warning-foreground" },
  [PRIORITIES.HIGH]: { icon: ChevronUp, className: "text-destructive" },
  [PRIORITIES.URGENT]: { icon: ChevronsUp, className: "text-destructive" },
  [PRIORITIES.DO_NOW]: { icon: ChevronsUp, className: "text-destructive stroke-3" },
}

/** Jira-style priority glyph; the name lives in the tooltip and aria-label. */
export function PriorityIcon({ priority, className }: { priority?: number; className?: string }) {
  const config = priority ? PRIORITY_ICONS[priority] : undefined
  if (!config) return null
  const Icon = config.icon
  const label = `Prioridad: ${PRIORITY_LABELS[priority as number]}`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span role="img" aria-label={label} className="inline-flex">
          <Icon className={cn("size-4", config.className, className)} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
