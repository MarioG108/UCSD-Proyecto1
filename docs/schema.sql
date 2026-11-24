-- Esquema de la base de datos (Supabase / Postgres) de Control de Despachos.
-- Ejecutar en el SQL Editor de un proyecto Supabase nuevo para recrear las tablas.
-- No incluye datos de ejemplo: cree despachos desde la app (admin) o inserte filas a mano.

create table public.dispatch_orders (
  id text primary key,
  item text not null,
  meta text not null default '',
  note text,
  client text not null,
  branch text not null,
  category text not null default 'Línea Blanca (Electro-Hogar)',
  crew text not null,
  driver text not null,
  vehicle text not null,
  status text not null check (status in (
    'Entregado conforme', 'En camino', 'En punto de entrega',
    'Asignado a ruta', 'Novedad en ruta', 'En preparación')),
  customer_cedula text not null default '001-0849201-4',
  address text not null default 'C/ Federico Geraldino #45, Apt 5-B, Ensanche Piantini, Santo Domingo D.N.',
  phone text not null default '809-220-1111',
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.novelties (
  id uuid primary key default gen_random_uuid(),
  order_id text not null references public.dispatch_orders(id) on delete cascade,
  type text not null,
  description text not null default '',
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index novelties_order_id_idx on public.novelties(order_id);

alter table public.dispatch_orders enable row level security;
alter table public.novelties enable row level security;

-- MVP DE DEMOSTRACIÓN: el login admin/user es del lado del cliente, por eso el rol
-- `anon` tiene acceso total. ANTES DE PRODUCCIÓN: migrar a Supabase Auth y reemplazar
-- estas políticas por reglas basadas en auth.uid() / roles en app_metadata.
create policy "mvp anon select orders" on public.dispatch_orders for select to anon using (true);
create policy "mvp anon insert orders" on public.dispatch_orders for insert to anon with check (true);
create policy "mvp anon update orders" on public.dispatch_orders for update to anon using (true) with check (true);
create policy "mvp anon delete orders" on public.dispatch_orders for delete to anon using (true);
create policy "mvp anon select novelties" on public.novelties for select to anon using (true);
create policy "mvp anon insert novelties" on public.novelties for insert to anon with check (true);
create policy "mvp anon update novelties" on public.novelties for update to anon using (true) with check (true);
create policy "mvp anon delete novelties" on public.novelties for delete to anon using (true);

grant select, insert, update, delete on public.dispatch_orders to anon;
grant select, insert, update, delete on public.novelties to anon;
