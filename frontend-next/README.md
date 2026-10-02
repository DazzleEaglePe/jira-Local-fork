# Jira-Local · interfaz Next.js

Nueva interfaz de Jira-Local (Vikunja 2.5) con estilo Atlassian Jira, construida con Next.js 16 (App Router) y React 19. Reemplaza de forma gradual a la interfaz Vue de `frontend-src/frontend`, contra la misma API.

Plan, decisiones y estado de los sprints: [`../docs/MIGRACION-NEXT.md`](../docs/MIGRACION-NEXT.md) · paridad con Vue: [`PARIDAD.md`](PARIDAD.md).

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) con tokens del Atlassian Design System · TanStack Query 5 y TanStack Table 9 · Zustand · dnd-kit · GSAP (`@gsap/react`, respeta "reducir movimiento") · react-hook-form + zod · Tiptap + DOMPurify · date-fns (es) · cmdk · sonner · Vitest + Testing Library · Playwright.

## Uso diario

Desde la raíz del repositorio, `iniciar_jira_next.bat` levanta el backend (si no está activo), compila la interfaz la primera vez y la sirve en `http://localhost:5173` y en la red local. `detener_vikunja.bat` detiene todo. La interfaz Vue sigue disponible con `iniciar_vikunja.bat`.

## Desarrollo

Requiere Node 24 y pnpm, y el backend en `http://127.0.0.1:3456` (`vikunja.exe web`). Para otra URL de backend, define `VIKUNJA_API_URL`.

```bash
pnpm install
```

```bash
pnpm dev
```

Abre `http://localhost:3000`. `/api/*` se redirige al backend mediante `rewrites` en `next.config.ts`.

| Script | Qué hace |
|---|---|
| `pnpm check` | typecheck + lint + pruebas unitarias + build (obligatorio al cerrar cada cambio) |
| `pnpm test` | pruebas unitarias (Vitest) |
| `pnpm test:e2e` | pruebas de humo con Playwright contra la app en `:3000` y el backend |
| `pnpm sync:api` | copia el cliente OpenAPI generado de la app Vue a `src/lib/api/generated` |

Las pruebas e2e usan el Chrome instalado (no descargan navegadores) y una cuenta de pruebas local por variables de entorno `E2E_USER` y `E2E_PASSWORD`; sin ellas solo corre la prueba anónima. Para otra URL, `E2E_BASE_URL`.

## Estructura

- `src/app` — rutas: `(auth)/login`, `(app)/…` (dashboard, proyectos y vistas, tareas, etiquetas, equipos, ajustes) y el modal `@modal/(.)tasks/[id]`.
- `src/components` — `ui/` (shadcn), `shell/` (barra superior, lateral, `Ctrl K`), `board/`, `task/`, `views/` (Lista/Tabla, Cronograma), `notifications/`, `settings/`…
- `src/lib` — lógica pura con pruebas (`board`, `board-filter`, `timeline`, `notifications`, `task-patch`…), `queries/` (TanStack Query), `auth/` y `api/`.
