# Checklist de paridad Vue → Next

Estado de cada módulo del frontend Vue (76 rutas) en la app Next. Se actualiza al cerrar cada sprint.

Leyenda: ✅ migrado · 🟡 parcial · ⬜ pendiente · ➖ fuera de alcance (queda en Vue o se descarta)

## Autenticación (Sprint 2)

| Función | Estado | Notas |
|---|---|---|
| Login usuario/contraseña | ✅ | "Mantener sesión iniciada" = token largo |
| Restaurar sesión (cookie de refresh) | ✅ | vía `/api/v1/user/token/refresh` |
| Renovar token ante 401 y reintentar | ✅ | |
| Logout | ✅ | bandera `justLoggedOut` como en Vue |
| Registro de cuenta | ⬜ | |
| Recuperar contraseña | ⬜ | |
| TOTP (2FA) en login | ⬜ | mensaje de error ya traducido |
| OpenID / LDAP | ➖ | no se usa en Caja Ica |

## Shell (Sprint 3)

| Función | Estado | Notas |
|---|---|---|
| Barra superior estilo Jira (buscador + Crear) | ✅ | |
| Barra lateral con árbol de proyectos | ✅ | favoritos, recientes, filtros guardados |
| Paleta `Ctrl K` | ✅ | tareas (búsqueda en servidor), proyectos, páginas y acciones |
| Tema claro/oscuro/sistema | ✅ | tokens Atlassian 2025 |
| "Para ti" (resumen) | ✅ | proyectos recientes + trabajo pendiente |
| Directorio de proyectos | ✅ | |
| Crear proyecto | ✅ | nombre + color |
| Notificaciones | ✅ | 7 · campana con contador, "Solo no leídas", marcar leídas; sondeo cada 10 s (sin websocket) |

## Proyectos y tareas

| Función | Estado | Sprint |
|---|---|---|
| Vista Kanban (columnas, mover tareas) | ✅ | 4 · dnd-kit, mouse y teclado (←/→ entre columnas, ↑/↓ dentro) |
| Crear tarea en columna | ✅ | 4 · Enter crea, Esc cancela, sigue abierto para crear varias |
| "Mostrar más" en columnas con más de 25 tareas | ✅ | 4 |
| Límite WIP visible / columna Hecho ✓ | ✅ | 4 |
| Buscar en el tablero | ✅ | 4 · filtro local por título (arrastre desactivado mientras filtras) |
| Crear / renombrar / eliminar columnas, límite WIP | ✅ | 6 |
| Filtros del tablero (responsable, "Sin asignar", etiqueta) | ✅ | 7 · avatares estilo Jira; O dentro de un grupo, Y entre grupos |
| Detalle de tarea (modal + página) | ✅ | 5 · ruta interceptada `@modal/(.)tasks/[id]`; enlace directo abre la página |
| Editar título, descripción, prioridad, fechas, progreso | ✅ | 5 · JSON Patch como Vue, actualización optimista |
| Estado (columna) y marcar como hecha | ✅ | 5 |
| Etiquetas (asignar, crear) y responsables (buscar, "Asignarme a mí") | ✅ | 5 |
| Comentarios (crear, eliminar propios) | ✅ | 5 · Tiptap + DOMPurify |
| Favorito, copiar enlace, eliminar tarea | ✅ | 5 |
| Adjuntos | ⬜ | backlog |
| Tareas relacionadas / subtareas | ⬜ | backlog |
| Recordatorios y repetición | ⬜ | backlog |
| Seguimiento de tiempo | ➖ | función Pro de Vikunja |
| Vista Lista / Tabla | ✅ | 6 · TanStack Table v9, orden en servidor, columnas visibles, crear tarea, "Cargar más" |
| Vista Cronograma (Gantt) | 🟡 | 7 · solo lectura: barras por fechas, hoy, navegar periodos; arrastrar fechas pendiente |
| Ajustes de proyecto (editar, archivar, compartir) | ⬜ | backlog |
| Etiquetas (crear, editar, eliminar) | ✅ | 6 |
| Equipos (crear, miembros, eliminar) | ✅ | 6 |
| Filtros guardados (crear/editar) | ⬜ | backlog |
| Ajustes de usuario | 🟡 | 7 · nombre, proyecto predeterminado, inicio de semana, contraseña; el resto (avatar, TOTP, tokens, CalDAV…) sigue en Vue |
| Migradores (Trello, Todoist…) | ➖ | quedan en Vue |
| Panel de administración | ➖ | queda en Vue |

## Calidad

| Check | Estado |
|---|---|
| `pnpm check` (typecheck + lint + unit + build) | ✅ |
| e2e Playwright (`pnpm test:e2e`, Chrome instalado) | ✅ 3 pruebas de humo |
| Idiomas | 🟡 solo español |
