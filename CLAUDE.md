# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
User instructions always override this file.

---

## Project context

RHCloud Web is the **administrative frontend** for the RHCloud platform. It is used exclusively by HR administrators and company managers — not by employees. The mobile app (`RHCLoud_mobile`) handles the employee-facing experience; this app handles the back-office.

Shared backend: `http://rh-cloud-51.38.33.160.traefik.me`

---

## Commands

```bash
npm run dev       # Start dev server with HMR (http://localhost:5173)
npm run build     # Production build (output: dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

There is no test suite configured yet.

---

## Stack

- **React 19** with JSX (`.jsx` files) — no TypeScript
- **Vite 7** as bundler/dev server (`@vitejs/plugin-react` using Babel)
- **React Router v7** for client-side routing
- **GSAP 3** for animations
- **TanStack React Query v5** for server state
- **Zustand** for global client state
- **Axios** for HTTP
- **react-hook-form** for forms
- **ESLint 9** with flat config (`eslint.config.js`), enforcing `react-hooks` and `react-refresh` rules

---

## Architecture

### Entry points

- `src/main.jsx` — app entry, mounts `<App />`
- `src/App.jsx` — root component, sets up routing and providers (`QueryClientProvider`, `RouterProvider`, Zustand)

### Route structure

| Route | Component | Description |
|---|---|---|
| `/login` | `src/pages/auth/Login.jsx` | Login |
| `/reset-password` | `src/pages/auth/ResetPassword.jsx` | Recuperar contraseña |
| `/dashboard` | `src/pages/admin/Dashboard.jsx` | Panel principal |
| `/empresas` | `src/pages/admin/Empresas.jsx` | Gestionar empresas |
| `/empresas/:id` | `src/pages/admin/EmpresaDetalle.jsx` | Detalle empresa |
| `/cargos` | `src/pages/admin/Cargos.jsx` | Gestionar cargos |
| `/usuarios` | `src/pages/admin/Usuarios.jsx` | Gestionar usuarios |
| `/usuarios/:id` | `src/pages/admin/UsuarioDetalle.jsx` | Detalle usuario |
| `/contratos/plantillas` | `src/pages/admin/ContratosPlantillas.jsx` | Plantillas de contratos |
| `/contratos/plantillas/:id` | `src/pages/admin/ContratosPlantillaDetalle.jsx` | Detalle plantilla |
| `/contratos/empleados` | `src/pages/admin/ContratosEmpleados.jsx` | Contratos por empleado |
| `/contratos/empleados/:id` | `src/pages/admin/ContratoEmpleadoDetalle.jsx` | Detalle contrato empleado |
| `/permisos` | `src/pages/admin/Permisos.jsx` | Solicitudes de permisos (aprobar/rechazar) |
| `/vacaciones` | `src/pages/admin/Vacaciones.jsx` | Solicitudes de vacaciones (aprobar/rechazar) |
| `/notificaciones` | `src/pages/admin/Notificaciones.jsx` | Centro de notificaciones |
| `/chatbot/terminos` | `src/pages/admin/ChatbotTerminos.jsx` | Gestionar términos del chatbot |
| `/chatbot/terminos/:id` | `src/pages/admin/ChatbotTerminoDetalle.jsx` | Detalle / edición de término |

All admin routes require an authenticated session. Wrap them in a `<ProtectedRoute />` component that reads from Zustand and redirects to `/login` if no session exists.

### File layout

```
src/
  main.jsx
  App.jsx
  App.css
  index.css
  pages/
    auth/
    admin/
  components/        # Shared UI components
  services/          # Axios service functions (one file per domain)
  stores/            # Zustand stores
  constants/         # api.js, theme.js
  hooks/             # Custom React hooks
```

### State management

Two-layer approach — do not mix these:

- **Zustand** (`stores/auth.js`) — persisted admin session (user object, role) in `localStorage` under key `rhcloud.web.auth`.
- **TanStack React Query v5** — all server state (companies, positions, users, contracts, requests, notifications, chatbot terms). Stale time: 5 min, 1 retry.

Rule: user identity/session → Zustand. API-fetched data → React Query. Never put API response data in Zustand.

### API layer

`services/http.js` — Axios instance pointing to `http://rh-cloud-51.38.33.160.traefik.me`.

Two interceptors:

1. **Request:** Attaches Bearer token from `localStorage`.
2. **Response:** On 401 → queues pending requests → attempts token refresh → on refresh failure: clears session + resets Zustand store + redirects to `/login`.

Service files (one per domain):

| File | Domain |
|---|---|
| `services/auth.js` | Login, refresh, logout, password reset |
| `services/empresas.js` | Companies (CRUD) |
| `services/cargos.js` | Positions (CRUD) |
| `services/usuarios.js` | Users (CRUD, role assignment) |
| `services/contratos.js` | Contract templates + per-employee contracts |
| `services/solicitudes.js` | Permission and vacation requests (list, approve, reject) |
| `services/notificaciones.js` | Notifications (list, mark read) |
| `services/chatbot.js` | Chatbot term management (CRUD) |

All endpoint strings live in `constants/api.js` — never hardcode URLs inside service files.

### Auth flow

```
App init → read token (localStorage) → getMe() → populate Zustand store
Logout   → clearTokens() + useAuthStore.getState().clearUser() + navigate('/login')
```

### Notifications

The admin panel receives real-time notifications for:

- New vacation requests from employees
- New permission requests from employees

Implement via **polling** (`useQuery` with `refetchInterval: 30_000`) as the default approach. Show an unread count badge in the top nav. Clicking opens `/notificaciones` or a slide-over panel.

### Chatbot term management

Administrators create, edit, and delete terms that feed the employee-facing chatbot in the mobile app. Each term has at minimum:

- `titulo` — string
- `contenido` — rich text stored as markdown
- `categoria` — string
- `activo` — boolean

Use a markdown editor component (e.g., `@uiw/react-md-editor`) for the `contenido` field.

---

## Theming

Dark-first color palette — matches the mobile app for brand consistency. Defined in `constants/theme.js` and exposed as CSS custom properties in `src/index.css`.

| Token | CSS variable | Value | Use |
|---|---|---|---|
| Background | `--color-background` | `#07101F` | Page backgrounds, containers |
| Accent | `--color-accent` | `#00E5CC` | CTAs, active states, links |
| Text | `--color-text` | `#EDF4FF` | Primary text |
| Error | `--color-error` | `#FF6B6B` | Validation, error states |
| Success | `--color-success` | `#4ADE80` | Confirmations, approved states |
| Warning | `--color-warning` | `#FBBF24` | Pending states |
| Surface | `--color-surface` | `#0D1B2E` | Cards, sidebars, table rows |

```css
/* src/index.css */
:root {
  --color-background: #07101F;
  --color-accent:     #00E5CC;
  --color-text:       #EDF4FF;
  --color-error:      #FF6B6B;
  --color-success:    #4ADE80;
  --color-warning:    #FBBF24;
  --color-surface:    #0D1B2E;
  --font-primary:     'Inter', system-ui, sans-serif;
}
```

Always use CSS variables — never hardcode hex values in `.css` files or `style` props.

Typography: **Inter** loaded via `@fontsource/inter` or a `<link>` tag. Always reference `var(--font-primary)` — never hardcode the font name.

---

## Animations

Use **GSAP 3** for all animations — never use inline `style` transitions or CSS `transition` for anything beyond simple hover states.

```jsx
import { gsap } from 'gsap'
import { useEffect, useRef } from 'react'

export function FadeInCard({ children }) {
  const ref = useRef(null)
  useEffect(() => {
    gsap.from(ref.current, { opacity: 0, y: 20, duration: 0.4 })
  }, [])
  return <div ref={ref}>{children}</div>
}
```

---

## Code conventions

### ESLint

- `no-unused-vars` is set to error, but variables matching `^[A-Z_]` are exempt — use this pattern for intentionally unused constants.
- React Hooks rules are enforced — do not conditionally call hooks.
- Do not disable ESLint rules with inline comments unless absolutely necessary; fix the root cause instead.

### Modules

- ES modules only (`"type": "module"` in `package.json`) — always `import`/`export`, never `require`.
- Use `@/` path alias (configure in `vite.config.js` and `jsconfig.json`) — never use relative `../../` imports.

### Components

- All components are `.jsx` files.
- One component per file; filename matches the component name (PascalCase).
- CSS is colocated: `MyComponent.jsx` → `MyComponent.css`. Import it at the top of the component file.
- Global styles live in `src/index.css`.
- Export components as named exports (`export function MyComponent`) — default exports only for page-level components under `src/pages/`.

### Forms

All forms use `react-hook-form`:

```jsx
import { useForm } from 'react-hook-form'

export function EmpresaForm({ onSubmit }) {
  const { register, handleSubmit, formState: { errors } } = useForm()
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('nombre', { required: 'Requerido' })} />
      {errors.nombre && <span>{errors.nombre.message}</span>}
    </form>
  )
}
```

Never build forms with raw `useState` per field.

### Tables / lists

Build a reusable `<DataTable />` component backed by **TanStack Table v8**. All admin list pages use it. Support:

- Server-side pagination (`page` / `pageSize` as query params)
- Column sorting
- A search input above the table

### Approval flow (permisos / vacaciones)

Status badges:

| Status | Color variable |
|---|---|
| `PENDIENTE` | `var(--color-warning)` |
| `APROBADO` | `var(--color-success)` |
| `RECHAZADO` | `var(--color-error)` |

Approve / reject actions use `useMutation`. On success: invalidate the requests query and show a toast notification.

---

## Common patterns

### React Query fetch

```jsx
import { useQuery } from '@tanstack/react-query'
import { getEmpresas } from '@/services/empresas'

export function EmpresasList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['empresas'],
    queryFn: getEmpresas,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })
  // ...
}
```

### Mutation with feedback

```jsx
const mutation = useMutation({
  mutationFn: ({ id, accion }) => actualizarSolicitud(id, accion),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['vacaciones'] })
    // show toast
  },
  onError: () => {
    // show error toast
  },
})
```

### API validation errors in forms

The backend returns validation errors in this shape:

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "phone"],
      "msg": "Value error, El teléfono debe contener solo números y tener 10 dígitos.",
      "input": "+57 300 111 0001"
    }
  ]
}
```

In every `useMutation` that submits a form, map these back to `react-hook-form` via `setError` so they appear inline under the offending field:

```jsx
const { register, handleSubmit, setError, formState: { errors } } = useForm()

const mutation = useMutation({
  mutationFn: submitData,
  onError: (err) => {
    const detail = err.response?.data?.detail
    if (Array.isArray(detail)) {
      detail.forEach(({ loc, msg }) => {
        const field = loc[loc.length - 1]
        if (typeof field === 'string') setError(field, { message: msg })
      })
    }
  },
})
```

Every form field **must** render its error, including optional fields that the API can still reject:

```jsx
<input
  className={`my-input${errors.phone ? ' my-input--err' : ''}`}
  {...register('phone')}
/>
{errors.phone && <span className="my-error">{errors.phone.message}</span>}
```

Never skip the error display on a field just because it has no client-side validation rule.

### Notification polling

```jsx
const { data: notificaciones } = useQuery({
  queryKey: ['notificaciones', 'unread'],
  queryFn: getNotificacionesNoLeidas,
  refetchInterval: 30_000,
})
```

### Read auth state

```jsx
import { useAuthStore } from '@/stores/auth'

const { user, clearUser } = useAuthStore()
```

### Service file structure

```js
// services/empresas.js
import { http } from '@/services/http'
import { API } from '@/constants/api'

export const getEmpresas = () => http.get(API.EMPRESAS).then(r => r.data)
export const getEmpresa = (id) => http.get(`${API.EMPRESAS}/${id}`).then(r => r.data)
export const createEmpresa = (body) => http.post(API.EMPRESAS, body).then(r => r.data)
export const updateEmpresa = (id, body) => http.put(`${API.EMPRESAS}/${id}`, body).then(r => r.data)
export const deleteEmpresa = (id) => http.delete(`${API.EMPRESAS}/${id}`)
```

---

## Module boundaries

| Module | Owns | Does NOT own |
|---|---|---|
| `services/` | HTTP calls | UI, state |
| `stores/` | Session identity | Server/API data |
| `components/` | Rendering, local UI state | Direct API calls |
| `pages/` | Page layout, data wiring | Business logic |
| `constants/` | Static config (URLs, theme tokens) | Runtime state |
| `hooks/` | Reusable stateful logic | Rendering |

---

## What NOT to do

- Don't create a new Axios instance — use `services/http.js`.
- Don't hardcode URLs — add them to `constants/api.js`.
- Don't put API response data in Zustand — use React Query.
- Don't hardcode colors or fonts — use CSS variables from `constants/theme.js` / `index.css`.
- Don't use relative `../../` imports — use `@/`.
- Don't build forms with raw `useState` per field — use `react-hook-form`.
- Don't handle 401 in service files — the HTTP interceptor owns that.
- Don't poll at intervals shorter than 30 seconds.
- Don't store chatbot term content as plain text — use the markdown editor and persist as markdown.
- Don't use CSS `transition` for complex animations — use GSAP.

---

## Compact instructions

When compacting, preserve:

- Auth flow state and any token-related changes.
- List of modified files in this session.
- Any unresolved errors or pending tasks.
- API endpoints added or modified.
- Any approval/rejection flow changes.

---

## Approach

- Read existing files before writing code — understand the pattern first.
- Prefer editing over rewriting whole files.
- Keep solutions simple and direct.
- Verify mentally that the code runs before declaring done.
- Be concise in output, thorough in reasoning.
- No sycophantic openers or closing fluff.