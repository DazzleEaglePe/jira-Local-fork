import { describe, expect, it } from "vitest"

import { passwordSchema, settingsBody } from "./user-settings"

describe("settingsBody", () => {
  it("should keep the stored settings, apply the changes and drop read-only fields", () => {
    const body = settingsBody(
      { $schema: "x", extra_settings_links: {}, name: "Ana", timezone: "America/Lima", week_start: 1 },
      { name: "Ana María" },
    )
    expect(body).toEqual({ name: "Ana María", timezone: "America/Lima", week_start: 1 })
  })

  it("should work before the settings are loaded", () => {
    expect(settingsBody(undefined, { week_start: 0 })).toEqual({ week_start: 0 })
  })
})

describe("passwordSchema", () => {
  it("should accept a valid change", () => {
    expect(passwordSchema.safeParse({ old_password: "a", new_password: "12345678", confirm: "12345678" }).success).toBe(
      true,
    )
  })

  it("should reject short passwords and mismatched confirmations", () => {
    const short = passwordSchema.safeParse({ old_password: "a", new_password: "123", confirm: "123" })
    expect(short.success).toBe(false)
    const mismatch = passwordSchema.safeParse({ old_password: "a", new_password: "12345678", confirm: "87654321" })
    expect(mismatch.error?.issues[0].path).toEqual(["confirm"])
  })
})
