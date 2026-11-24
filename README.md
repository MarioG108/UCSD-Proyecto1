# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
"# UCSD-Proyecto1" 

## MVP: login + Supabase

- Login demo (cliente): `admin / admin` (crea, avanza, elimina despachos y resuelve novedades) y `user / user` (solo consulta y reporta novedades).
- Datos en Supabase (`dispatch_orders`, `novelties`), con seed dummy. Variables en `.env` (ver `.env.example`).
- **Antes de producción**: migrar el login a Supabase Auth y restringir las políticas RLS (hoy `anon` tiene acceso total para el demo).
