import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { TooltipProvider } from "@/components/ui/tooltip"
import { PriorityIcon } from "./priority-icon"

function renderIcon(priority?: number) {
  return render(
    <TooltipProvider>
      <PriorityIcon priority={priority} />
    </TooltipProvider>
  )
}

describe("PriorityIcon", () => {
  it("should expose the priority name to assistive technology", () => {
    renderIcon(3)

    expect(screen.getByRole("img", { name: "Prioridad: Alta" })).toBeInTheDocument()
  })

  it("should render nothing for unset priority", () => {
    const { container } = renderIcon(0)

    expect(container).toBeEmptyDOMElement()
  })
})
