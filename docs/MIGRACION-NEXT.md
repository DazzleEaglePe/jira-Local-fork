# Migración del frontend a React + Next.js

Rama: `feat/frontend-next` · Carpeta nueva: `frontend-next/`

## 1. Análisis (Sprint 0)

### Tamaño del frontend actual (Vue 3)

| Métrica | Valor |
|---|---|
| Componentes `.vue` | 317 (~46.500 líneas) |
| Archivos TS (sin tests ni cliente generado) | 281 (~19.200 líneas) |
| Rutas | 76 |
| Tests unitarios | 190 |
| Cliente API generado (OpenAPI) | ~16.100 líneas, **independiente de Vue** |

### Decisión: migración incremental (patrón *strangler*)

Una reescritura "big bang" de ~65.000 líneas congelaría el producto durante meses y es la causa más común de fracaso en migraciones. En su lugar:

1. La app Next.js nace en `frontend-next/`, **al lado** de la app Vue, contra la **misma API** de Vikunja.
2. Se migra por **módulos verticales completos** (login → shell → proyectos → kanban → detalle → …), cada uno usable de punta a punta.
3. La app Vue sigue en producción hasta que Next alcance paridad en los flujos que usa el equipo; entonces se hace el *cutover* (sprint final).
4. Los módulos de uso bajo (migradores, admin, CalDAV, etc.) pueden quedarse en Vue más tiempo o descartarse.

### Qué se reutiliza

- **Cliente API generado** (`types.gen.ts`, `sdk.gen.ts`, runtime `client/` y `core/`): se copia tal cual. Tipado completo de todos los endpoints `/api/v2`.
- **Diseño**: tokens `--ui-*` estilo Atlassian + rojo Caja Ica y los patrones de UI ya validados en las fases 0–3 de la rama `ux-ui/*`.
- **Textos**: `es-ES.json` / `en.json` como fuente de traducciones.

### Riesgos

| Riesgo | Mitigación |
|---|---|
| Paridad funcional larga (76 rutas) | Priorizar flujos del equipo; medir con checklist de paridad (sección 4) |
| Auth: cookie de refresh con `Path=/api/v1` | Renovar sesión vía `/api/v1/user/token/refresh` (la cookie sí viaja) |
| Drag & drop del Kanban | `@dnd-kit` + misma API de posiciones/buckets |
| Dos frontends a la vez | Ambos contra la misma API; Vue intacto hasta el cutover |

## 2. Arquitectura

| Capa | Elección | Motivo |
|---|---|---|
| Framework | **Next.js 16** (App Router) + **React 19** + TypeScript | Pedido del equipo; rutas por archivos, layouts anidados, rutas interceptadas para el modal de tarea |
| Render | Componentes cliente para datos (la API usa token Bearer del usuario) | Igual que el SPA actual; sin exponer tokens en el servidor |
| Proxy API | `rewrites` de Next: `/api/*` → Vikunja `:3456` | Mismo origen, sin CORS |
| Datos | **TanStack Query** | Caché, reintentos, actualizaciones optimistas |
| UI | **shadcn/ui** (React) + Tailwind v4 + lucide-react | Mismo sistema que la fase 0, ahora nativo |
| Drag & drop | **@dnd-kit** | Accesible, mantenido |
| Estado de sesión | Zustand (+ `localStorage`) | Simple, sin boilerplate |
| Notificaciones | sonner | Toasts estilo shadcn |
| Animaciones | **GSAP** + `@gsap/react` (`useGSAP`) | Entradas de modal/paneles, aparición escalonada de tarjetas, feedback al soltar en el Kanban; siempre respetando `prefers-reduced-motion` |
| Comando / búsqueda | `cmdk` (vía shadcn `Command`) | Paleta `Ctrl K` como Jira |
| Formularios | react-hook-form + zod | Validación tipada |
| Tests | Vitest + Testing Library; Playwright en el sprint de cierre | |

### Referencia de diseño

En cada sprint se contrasta la UI con la documentación pública del **Atlassian Design System** (https://atlassian.design): tokens de color, espaciado (grilla de 8px), elevación, tipografía y patrones de componentes (navegación lateral, tablero, issue view). No se copian marca, logos ni tipografía propietaria; la identidad sigue siendo Caja Ica.

Estructura:

```
frontend-next/
  src/app/            rutas (App Router): (auth)/login, (app)/..., @modal
  src/components/ui/  shadcn
  src/components/     componentes de dominio (board, task, shell)
  src/lib/api/        cliente generado + configuración (auth, refresh)
  src/lib/            utilidades, hooks, i18n
```

## 3. Sprints y checks

Cada sprint termina con **checks obligatorios**: `pnpm check` (typecheck + lint + tests + build) en verde, más una verificación funcional contra el backend real.

| Sprint | Objetivo | Entregables | Checks |
|---|---|---|---|
| 0 | Análisis y plan | Este documento | Revisión del plan |
| 1 | Fundaciones | Next 16 + TS + Tailwind v4 + shadcn + tokens + proxy API + `pnpm check` | `pnpm check` verde; página base renderiza |
| 2 | API + autenticación | Cliente generado, login, sesión persistente, renovación de token, rutas protegidas | Tests de sesión; login real contra Vikunja |
| 3 | Shell de la app | Navbar y barra lateral estilo Jira con proyectos reales; página "Resumen" con tareas | Tests de componentes; navegación real |
| 4 | Proyecto + Kanban | Encabezado del proyecto, pestañas de vista, columnas, tarjetas, mover tareas (drag & drop), crear tarea | Tests de lógica de posiciones; mover tarea persiste en la API |
| 5 | Detalle de tarea | Modal (ruta interceptada) + página; título, descripción, prioridad, etiquetas, responsables, fechas, comentarios, completar | Tests; edición persiste en la API |
| 6 | Vistas y navegación | Vista Lista/Tabla, buscador `Ctrl K`, menú Crear, etiquetas, equipos | Tests; flujos reales |
| 7 | Paridad + cutover | Ajustes de usuario, filtros, notificaciones, i18n es/en, e2e Playwright, `server.mjs` sirviendo Next | Checklist de paridad; e2e verde |

## 4. Checklist de paridad (se actualiza por sprint)

Ver `frontend-next/PARIDAD.md`.
