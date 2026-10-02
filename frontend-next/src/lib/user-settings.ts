import { z } from "zod"

import type { UserGeneralSettings, UserGeneralSettingsWritable } from "@/lib/api/generated/types.gen"

/**
 * PUT /user/settings/general replaces every setting, so changes are merged onto what the
 * server holds; read-only fields are dropped since they are not part of the request body.
 */
export function settingsBody(
  current: UserGeneralSettings | undefined,
  changes: Partial<UserGeneralSettingsWritable>,
): UserGeneralSettingsWritable {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- discard read-only fields
  const { $schema, extra_settings_links, ...writable } = current ?? {}
  return { ...writable, ...changes }
}

// Same limits as the Vue app (bcrypt only uses the first 72 bytes).
export const passwordSchema = z
  .object({
    old_password: z.string().min(1, "Ingresa tu contraseña actual"),
    new_password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña no puede superar los 72 caracteres"),
    confirm: z.string(),
  })
  .refine((values) => values.new_password === values.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  })

export type PasswordValues = z.infer<typeof passwordSchema>
