# La Sirena · Control de Despachos (UCSD – Proyecto 1)

MVP web para dar seguimiento a las entregas de mercancía de la División Logística (Grupo Ramos C. por A.): indicadores, monitor de despachos en vivo, expediente digital **POD** (Proof of Delivery), novedades, cuadrillas y rutas.

- **Producción:** <https://ucsd-rutas.mario-g.com/> (alterna: <https://ucsd-rutas.vercel.app/>)
- **Manual de usuario (Word):** [`docs/Manual-de-Usuario.docx`](docs/Manual-de-Usuario.docx)

> **Es un MVP de demostración.** Los datos son ficticios y el login usa credenciales de prueba. Ver [Antes de producción](#antes-de-producción).

## Acceso de demostración

| Usuario | Contraseña | Perfil | Permisos |
|---|---|---|---|
| `admin` | `admin` | Administrador | Todo: consultar, crear despachos, avanzar estados, reportar y resolver novedades |
| `user` | `user` | Usuario | Consultar, buscar, descargar el vale POD y reportar novedades |

## Funcionalidades

- **Login** simple con dos roles (sesión recordada en el navegador).
- **Dashboard:** 4 KPIs calculados desde la base de datos y filtrados por sucursal (la puntualidad es un valor referencial), monitor con filtros (sucursal, categoría, estado), búsqueda (`Ctrl + K`) y paginación.
- **Expediente POD:** datos del destinatario y cuadrilla, ubicación, evidencia fotográfica y firma digital. La evidencia, la firma y la descarga del **vale en PDF** solo están disponibles cuando la orden está *Entregado conforme*.
- **Despachos:** creación con sugerencias de artículos por categoría (admin) y avance de estado: En preparación → Asignado a ruta → En camino → En punto de entrega → Entregado conforme.
- **Novedades:** reporte (con confirmación al cerrar el popup fuera del formulario) y resolución (admin).
- **Vistas:** Rutas Activas, Cuadrillas, Novedades y POD.
- **Notificaciones** (campana) y **tutoriales guiados** por pantalla ([Driver.js](https://driverjs.com)), cuyo estado «ya visto» se guarda en el dispositivo (`localStorage`, claves `ls_tour_*`).

## Stack

- [TanStack Start](https://tanstack.com/start) + React 19 + TypeScript, desplegado en Vercel
- Tailwind CSS 4 y componentes shadcn/ui
- [Supabase](https://supabase.com) (Postgres) con `@supabase/supabase-js`, y TanStack Query para los datos
- `jspdf` (vale POD en PDF) y `driver.js` (tutoriales)
- Vitest para pruebas

## Puesta en marcha

Requiere [Bun](https://bun.sh) (o Node.js + npm).

```sh
git clone <url-de-este-repositorio>
cd <carpeta>
bun install            # o: npm i
cp .env.example .env   # y completar las variables (ver abajo)
bun run dev            # o: npm run dev  → http://localhost:5173
```

### Variables de entorno

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave **publicable** (`sb_publishable_…`) de Supabase |

- `.env` está en `.gitignore`; solo se versiona `.env.example`.
- Todo lo que empieza con `VITE_` llega al navegador: **nunca** use aquí la clave `service_role` ni una clave secreta.
- En Vercel, defina las mismas variables en *Project Settings → Environment Variables*.

### Base de datos

Dos tablas en el esquema `public`: `dispatch_orders` (despachos, con los datos del POD) y `novelties` (incidencias, con FK a la orden). El esquema completo con RLS y políticas está en [`docs/schema.sql`](docs/schema.sql): ejecútelo en el SQL Editor de un proyecto Supabase nuevo. No incluye datos de ejemplo.

## Scripts

| Comando | Acción |
|---|---|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Compilación de producción |
| `bun run preview` | Vista previa de la compilación |
| `bun run test` | Pruebas (Vitest) |
| `bun run lint` | ESLint + Prettier |
| `bun run format` | Formatea el código con Prettier |

## Estructura

```
src/
  routes/index.tsx        # Pantalla principal: login, menú, encabezado y vistas
  components/app/         # Login, Monitor (KPIs, tabla, modales), Pod, Views, shared
  components/ui/          # Componentes shadcn/ui
  lib/
    auth.ts               # Login de demostración y sesión
    db.ts                 # Consultas y mutaciones (TanStack Query + Supabase)
    supabase.ts           # Cliente de Supabase
    pod-pdf.ts            # Generación del vale POD en PDF
    tour.ts               # Tutoriales guiados y su caché local
docs/
  Manual-de-Usuario.docx  # Manual de usuario
  schema.sql              # Esquema de la base de datos
```

## Antes de producción

Este MVP no está listo para datos reales:

- **Login:** `admin/admin` y `user/user` se validan en el navegador. Migrar a **Supabase Auth** con roles en `app_metadata`.
- **RLS:** las políticas actuales dan acceso total al rol `anon` (cualquiera con la clave pública puede leer y modificar las tablas). Reemplazarlas por políticas basadas en `auth.uid()` y roles.
- **Datos:** órdenes, clientes, teléfono (`809-220-1111`), ubicación, foto y firma son de ejemplo; el indicador de puntualidad es referencial.

## Lovable

El proyecto está conectado a [Lovable](https://lovable.dev): los commits en la rama conectada se sincronizan con el editor. Evite reescribir el historial ya publicado (force push, rebase, amend o squash).
