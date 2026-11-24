import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  NOVELTY_TYPES,
  STATUSES,
  useCreateOrder,
  useReportNovelty,
  type Novelty,
  type Order,
} from "@/lib/db";
import type { Role } from "@/lib/auth";
import {
  Card,
  Icon,
  Modal,
  STATUS_STYLE,
  StatusPill,
  btnGhost,
  btnPrimary,
  inputCls,
} from "./shared";

/* ---------- KPIs (calculados desde la DB) ---------- */
function Kpi({
  title,
  value,
  icon,
  tone = "success",
  children,
  extra,
  titleTone,
}: {
  title: string;
  value: string;
  icon: string;
  tone?: "success" | "warning";
  children: ReactNode;
  extra?: ReactNode;
  titleTone?: string;
}) {
  const iconBox =
    tone === "success"
      ? "bg-success-soft border-success-line text-primary"
      : "bg-warning-soft border-warning-line text-warning-strong";
  return (
    <Card className="flex flex-col justify-between p-5 transition-shadow hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <div className={`label-caps ${titleTone ?? "text-muted-foreground"}`}>{title}</div>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={`text-[32px] font-bold leading-10 tracking-tight ${tone === "warning" && titleTone ? "text-warning-ink" : ""}`}
            >
              {value}
            </span>
            {extra}
          </div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${iconBox}`}>
          <Icon name={icon} />
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </Card>
  );
}

function Delta({ icon, v }: { icon: string; v: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-success-line bg-success-soft px-2 py-0.5 font-mono text-[11px] font-bold text-success-ink">
      <Icon name={icon} className="text-[14px]" />
      {v}
    </span>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-mid">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function KpiRow({
  orders,
  novelties,
  otd,
  branch,
  onGoNovelties,
  onGoRoutes,
}: {
  orders: Order[];
  novelties: Novelty[];
  otd: number;
  branch: string;
  onGoNovelties: () => void;
  onGoRoutes: () => void;
}) {
  const delivered = orders.filter((o) => o.status === "Entregado conforme").length;
  const closed = orders.filter(
    (o) => o.status === "Entregado conforme" || o.status === "Novedad en ruta",
  ).length;
  const firstTry = closed ? Math.round((delivered / closed) * 1000) / 10 : 0;
  const inRoute = orders.filter((o) =>
    ["En camino", "En punto de entrega", "Asignado a ruta"].includes(o.status),
  );
  const enCamino = orders.filter((o) => o.status === "En camino").length;
  const enEntrega = orders.filter((o) => o.status === "En punto de entrega").length;
  const open = novelties.filter((n) => !n.resolved);
  const count = (t: string) => open.filter((n) => n.type === t).length;
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <p className="label-caps col-span-full text-muted-foreground">Indicadores · {branch}</p>
      <Kpi
        title="Tasa de Puntualidad (OTD)"
        value={`${otd}%`}
        icon="schedule"
        extra={<Delta icon="arrow_upward" v="+2.4%" />}
      >
        <div className="mb-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>Meta Operativa: 92.0%</span>
          <span className="font-semibold text-foreground">vs sem. anterior</span>
        </div>
        <Bar pct={otd} color="bg-primary" />
      </Kpi>
      <Kpi
        title="Éxito en Primer Intento"
        value={`${firstTry}%`}
        icon="verified"
        extra={<Delta icon="trending_up" v="+1.1%" />}
      >
        <div className="mb-1.5 flex justify-between font-mono text-[11px] text-muted-foreground">
          <span>Meta Mensual: 85.0%</span>
          <span className="font-semibold text-success-ink">
            {firstTry >= 85 ? "Superado" : "Bajo la meta"}
          </span>
        </div>
        <Bar pct={firstTry} color="bg-success" />
      </Kpi>
      <Kpi
        title="Despachos en Ruta Activa"
        value={String(inRoute.length)}
        icon="local_shipping"
        tone="warning"
        extra={<span className="text-base text-muted-foreground">órdenes</span>}
      >
        <button onClick={onGoRoutes} className="flex items-center gap-2" title="Ver rutas activas">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning-line bg-warning-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-warning-ink">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {enCamino} en camino
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success-line bg-success-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-success-ink">
            <span className="h-2 w-2 rounded-full bg-success" />
            {enEntrega} en entrega
          </span>
        </button>
      </Kpi>
      <Kpi
        title="Novedades Abiertas"
        value={String(open.length)}
        icon="error"
        tone="warning"
        titleTone="text-warning-strong"
        extra={
          <button
            onClick={onGoNovelties}
            className="rounded-full border border-warning-line bg-warning-soft px-2 py-0.5 font-mono text-[11px] font-bold text-warning-ink hover:brightness-95"
          >
            Atención Operativa
          </button>
        }
      >
        <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
          <span className="text-warning-strong">{count("Avería")} avería</span>
          <span>{count("Cliente ausente")} ausente</span>
          <span>{count("Dirección errónea")} dir. errónea</span>
        </div>
      </Kpi>
    </section>
  );
}

/* ---------- Monitor ---------- */
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-caps text-muted-foreground">{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-[38px] w-full cursor-pointer appearance-none rounded-lg border border-border bg-surface-low px-3 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <Icon
          name="expand_more"
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
        />
      </div>
    </label>
  );
}

export const ALL_BRANCHES = "Todas las Sucursales";
const ALL_STATUS = "Todos los Estados (6)";
const ALL_CATS = "Todas las categorías";
export const BRANCHES = [
  "Sucursal Churchill",
  "Sucursal Luperón",
  "Sucursal San Isidro",
  "Sucursal Villa Mella",
];
export const CATEGORIES = [
  "Línea Blanca (Electro-Hogar)",
  "Electrónica Menor",
  "Muebles & Terraza",
  "Supermercado Seco",
];
const PAGE = 6;

export const CREWS: { crew: string; driver: string; vehicle: string }[] = [
  { crew: "Cuadrilla 01", driver: "Danilo Cruz", vehicle: "Camión F-15" },
  { crew: "Cuadrilla 02", driver: "José Batista", vehicle: "Van V-08" },
  { crew: "Cuadrilla 04", driver: "Ramón Peña", vehicle: "Camión F-12" },
  { crew: "Cuadrilla 06", driver: "Héctor Morales", vehicle: "Camión F-07" },
  { crew: "Cuadrilla 09", driver: "Marcos Díaz", vehicle: "Camión F-03" },
];

export function matchesQuery(o: Order, query: string) {
  const q = query.trim().toLowerCase();
  return (
    !q ||
    [o.id, o.item, o.client, o.driver, o.crew, o.vehicle].some((v) => v.toLowerCase().includes(q))
  );
}

export function Monitor({
  orders,
  selected,
  onSelect,
  onViewNovelty,
  role,
  query,
  branch,
  onBranch,
  refreshing,
  onRefresh,
}: {
  orders: Order[];
  selected: string;
  onSelect: (id: string) => void;
  onViewNovelty: (id: string) => void;
  role: Role;
  query: string;
  branch: string;
  onBranch: (b: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const [cat, setCat] = useState(ALL_CATS);
  const [status, setStatus] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [updated, setUpdated] = useState(() => Date.now());
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!refreshing) setUpdated(Date.now());
  }, [refreshing]);
  useEffect(() => setPage(1), [branch, cat, status, query]);

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (branch === ALL_BRANCHES || o.branch === branch) &&
          (cat === ALL_CATS || o.category === cat) &&
          (status === ALL_STATUS || o.status === status) &&
          matchesQuery(o, query),
      ),
    [orders, branch, cat, status, query],
  );

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const secs = Math.max(0, Math.round((Date.now() - updated) / 1000));

  const iconAction = (o: Order) => {
    if (o.status === "Novedad en ruta")
      window.location.href = `tel:${o.phone.replace(/[^\d+]/g, "")}`;
    else
      toast.success(`${o.driver} · ${o.vehicle}`, {
        description: `${o.id}: ubicación actualizada (${STATUS_STYLE[o.status].label}).`,
      });
  };

  const actionBtn = (o: Order) =>
    o.status === "Entregado conforme" ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(o.id);
        }}
        className="flex items-center gap-1 whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 font-mono text-[11px] font-semibold text-primary-foreground hover:bg-primary-strong"
      >
        <Icon name="fact_check" className="text-[14px]" />
        POD Activo
      </button>
    ) : o.status === "Novedad en ruta" ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onViewNovelty(o.id);
        }}
        className="whitespace-nowrap rounded-lg bg-warning-strong px-2.5 py-1.5 font-mono text-[11px] font-semibold text-primary-foreground hover:bg-warning-ink"
      >
        Ver Novedad
      </button>
    ) : (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(o.id);
        }}
        className="whitespace-nowrap rounded-lg border border-border bg-surface-low px-2.5 py-1.5 font-mono text-[11px] font-semibold hover:bg-surface-mid"
      >
        {o.status === "En preparación" ? "Ver Detalle" : "Ver POD"}
      </button>
    );

  return (
    <Card className="flex flex-col overflow-hidden xl:col-span-7">
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              Monitor de Despachos en Vivo
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground">
              <Icon name="sync" className="text-[14px]" />
              Actualizado hace {secs}s
            </span>
            {role === "admin" && (
              <button onClick={() => setCreating(true)} className={btnPrimary}>
                <Icon name="add" className="text-[16px]" />
                Nuevo
              </button>
            )}
            <button
              title="Actualizar lista"
              onClick={onRefresh}
              className="rounded-lg border border-border bg-surface-mid p-1.5 hover:bg-surface-high"
            >
              <Icon name="refresh" className={`text-[18px] ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 pt-1 sm:grid-cols-3">
          <FilterSelect
            label="Sucursal Despacho"
            value={branch}
            onChange={onBranch}
            options={[ALL_BRANCHES, ...BRANCHES]}
          />
          <FilterSelect
            label="Categoría Carga"
            value={cat}
            onChange={setCat}
            options={[ALL_CATS, ...CATEGORIES]}
          />
          <FilterSelect
            label="Estado de Despacho"
            value={status}
            onChange={setStatus}
            options={[ALL_STATUS, ...STATUSES]}
          />
        </div>
      </div>

      <ul className="divide-y divide-border md:hidden">
        {rows.map((o) => {
          const isSel = o.id === selected;
          const isIssue = o.status === "Novedad en ruta";
          return (
            <li
              key={o.id}
              onClick={() => onSelect(o.id)}
              className={`flex cursor-pointer flex-col gap-2 p-4 ${isSel ? "bg-success-soft" : isIssue ? "bg-warning-soft/70" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div
                    className={`flex items-center gap-1 font-mono text-xs font-semibold ${isIssue ? "text-warning-ink" : isSel ? "text-primary" : ""}`}
                  >
                    {o.id}
                    {isIssue && <Icon name="report_problem" className="text-[14px] text-warning" />}
                  </div>
                  <div className="font-medium">{o.item}</div>
                  <div
                    className={`font-mono text-[11px] ${isIssue ? "text-warning-strong" : "text-muted-foreground"}`}
                  >
                    {o.note ?? o.meta}
                  </div>
                </div>
                <StatusPill status={o.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div className="min-w-0">
                  <div className="font-medium">{o.client}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{o.branch}</div>
                </div>
                <div className="min-w-0">
                  <div className="font-mono text-xs font-semibold">{o.crew}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {o.driver} • {o.vehicle}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">{actionBtn(o)}</div>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="p-8 text-center text-muted-foreground">
            No hay despachos con esos filtros.
          </li>
        )}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <thead className="label-caps border-b border-border bg-surface-low text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Orden / Artículo</th>
              <th className="px-3 py-3">Cliente / Origen</th>
              <th className="px-3 py-3">Cuadrilla / Vehículo</th>
              <th className="px-3 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acción Operativa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-[13px]">
            {rows.map((o) => {
              const isSel = o.id === selected;
              const isIssue = o.status === "Novedad en ruta";
              const rowBg = isSel
                ? "bg-success-soft"
                : isIssue
                  ? "bg-warning-soft/70 hover:bg-warning-soft"
                  : "hover:bg-surface-low";
              const icon = STATUS_STYLE[o.status].icon;
              return (
                <tr
                  key={o.id}
                  onClick={() => onSelect(o.id)}
                  className={`cursor-pointer transition-colors ${rowBg}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={`flex items-center gap-1 font-mono text-xs font-semibold ${isIssue ? "text-warning-ink" : isSel ? "text-primary" : ""}`}
                      >
                        {o.id}
                        {isIssue && (
                          <Icon name="report_problem" className="text-[14px] text-warning" />
                        )}
                      </span>
                      <span className="font-medium">{o.item}</span>
                      <span
                        className={`font-mono text-[11px] ${isIssue ? "text-warning-strong" : "text-muted-foreground"}`}
                      >
                        {o.note ?? o.meta}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{o.client}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {o.branch}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-mono text-xs font-semibold">{o.crew}</span>
                      <span className="font-mono text-[11px] text-muted-foreground">
                        {o.driver} • {o.vehicle}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={o.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {actionBtn(o)}
                      {icon && (
                        <button
                          title={o.status === "Novedad en ruta" ? "Llamar al cliente" : "Rastrear"}
                          onClick={(e) => {
                            e.stopPropagation();
                            iconAction(o);
                          }}
                          className="rounded-lg border border-border bg-surface-mid p-1.5 hover:bg-surface-high"
                        >
                          <Icon name={icon} className="text-[16px]" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  No hay despachos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-low px-5 py-3 font-mono text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>
            Mostrando {rows.length} de {filtered.length} despachos
          </span>
          <span>•</span>
          <span>Capacidad de Flota Winston Churchill: 88% ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-foreground hover:bg-surface-mid disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="font-semibold text-foreground">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-border bg-surface px-2.5 py-1 text-foreground hover:bg-surface-mid disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
      {creating && (
        <NewOrderModal orders={orders} onClose={() => setCreating(false)} onCreated={onSelect} />
      )}
    </Card>
  );
}

/* ---------- Nuevo despacho (admin) ---------- */
// Artículos de ejemplo por categoría, sugeridos al crear un despacho
export const ARTICLE_SUGGESTIONS: Record<string, string[]> = {
  "Línea Blanca (Electro-Hogar)": [
    "Nevera Samsung French Door 28ft³",
    "Nevera Frigidaire 18ft³ Top Mount",
    "Nevera Whirlpool 20ft³",
    "Lavadora LG TurboWash 22kg Inverter",
    "Lavadora Samsung 18kg",
    "Secadora Eléctrica Frigidaire 20kg",
    "Secadora LG 17kg",
    "Estufa Whirpool 6 Quemadores Acero",
    "Estufa Mabe 5 Quemadores",
    'Cocina Empotrable Mabe 30"',
    "Congelador Horizontal Nedoca 15ft³",
    "Congelador Vertical 14ft³",
    "Lavavajillas Bosch Serie 4",
    "Aire Acondicionado Inverter 18000 BTU",
    "Aire Acondicionado 12000 BTU",
    "Microondas Panasonic 1.2ft³ Inox",
    "Dispensador de Agua Frío/Caliente",
    'Horno Empotrable Eléctrico 30"',
    'Campana Extractora Inox 30"',
    "Mini Nevera Frigobar 3.2ft³",
    "Nevera Side by Side LG 26ft³",
    "Lavadora-Secadora Combo LG 4.5ft³",
    "Aire Acondicionado Portátil 14000 BTU",
    "Aire Acondicionado Split 24000 BTU",
    "Calentador de Agua a Gas 6L",
    "Cocina a Gas 4 Hornillas Mabe",
    "Tope de Cocina Vitrocerámico",
  ],
  "Electrónica Menor": [
    'Smart TV Samsung 65" 4K',
    'Smart TV LG 55" 4K',
    'Smart TV TCL 43" Full HD',
    "Barra de Sonido Sony 2.1",
    "Microondas Samsung 1.1ft³",
    "Licuadora Oster 600W",
    "Freidora de Aire Ninja 5.5L",
    "Aspiradora Robot Xiaomi",
    'Laptop HP 15" Core i5',
    "Tablet Samsung Galaxy Tab A9",
    "Cafetera Oster 12 Tazas",
    "Tostadora Black+Decker 2 Rebanadas",
    "Batidora de Mano Oster",
    "Batidora de Pedestal KitchenAid",
    "Arrocera Oster 10 Tazas",
    "Olla de Presión Eléctrica Instant Pot 6qt",
    "Hervidor Eléctrico 1.7L",
    "Plancha de Vapor Black+Decker",
    "Sandwichera Eléctrica",
    "Horno Tostador Oster 6 Rebanadas",
    "Extractor de Jugos Philips",
    "Procesador de Alimentos Cuisinart",
    'Abanico de Pedestal 18"',
    "Ventilador de Torre Lasko",
    "Calentador de Agua Eléctrico 40 gal",
    "Purificador de Aire Xiaomi",
    "Deshumidificador 35 pintas",
    "Plancha de Cabello Remington",
    "Secador de Pelo Conair 2000W",
  ],
  "Muebles & Terraza": [
    "Juego de Sala Modular 3 piezas",
    "Sofá Cama 3 Puestos",
    "Comedor 6 Sillas Madera",
    "Cama King con Cabecera",
    "Colchón Ortopédico Queen",
    "Escritorio Ejecutivo en L",
    "Juego de Terraza 4 Piezas",
    "Gabinete Multiusos 5 Niveles",
    "Mecedora de Mimbre",
  ],
  "Supermercado Seco": [
    "Paleta Arroz Selecto 50 lb (20 sacos)",
    "Caja Aceite Vegetal 12 uds",
    "Paleta Agua Embotellada 5 gal",
    "Caja Pasta Espagueti 20 uds",
    "Caja Habichuelas Rojas 24 uds",
    "Paleta Azúcar Crema 25 lb",
    "Caja Detergente en Polvo 12 uds",
    "Caja Papel Higiénico 48 rollos",
  ],
};

function L({ t, children }: { t: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label-caps text-muted-foreground">{t}</span>
      {children}
    </label>
  );
}

export function NewOrderModal({
  orders,
  onClose,
  onCreated,
}: {
  orders: Order[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const create = useCreateOrder();
  const [f, setF] = useState({
    item: "",
    client: "",
    branch: BRANCHES[0]!,
    category: CATEGORIES[0]!,
    crew: CREWS[0]!.crew,
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = CREWS.find((x) => x.crew === f.crew)!;
    const id = `#LS-${Math.max(98000, ...orders.map((o) => Number(o.id.replace(/\D/g, "")))) + 1}`;
    create.mutate(
      {
        id,
        item: f.item,
        client: f.client,
        branch: f.branch,
        category: f.category,
        crew: c.crew,
        driver: c.driver,
        vehicle: c.vehicle,
      },
      {
        onSuccess: () => {
          toast.success(`Despacho ${id} creado`);
          onCreated(id);
          onClose();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };
  const suggestions = ARTICLE_SUGGESTIONS[f.category] ?? [];
  const typed = f.item.trim().toLowerCase();
  const chips = suggestions
    .filter((s) => s.toLowerCase().includes(typed) && s !== f.item)
    .slice(0, 6);
  return (
    <Modal title="Nuevo despacho" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <L t="Artículo">
            <input
              required
              list="article-suggestions"
              placeholder="Escribe o elige una sugerencia…"
              className={inputCls}
              value={f.item}
              onChange={set("item")}
            />
          </L>
          <datalist id="article-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5" aria-label="Sugerencias de artículos">
              {chips.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setF({ ...f, item: s })}
                  className="rounded-full border border-border bg-surface-low px-2.5 py-1 font-mono text-[11px] hover:bg-surface-mid"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <L t="Cliente">
          <input required className={inputCls} value={f.client} onChange={set("client")} />
        </L>
        <div className="grid grid-cols-2 gap-3">
          <L t="Sucursal">
            <select className={inputCls} value={f.branch} onChange={set("branch")}>
              {BRANCHES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </L>
          <L t="Categoría">
            <select className={inputCls} value={f.category} onChange={set("category")}>
              {CATEGORIES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </L>
        </div>
        <L t="Cuadrilla">
          <select className={inputCls} value={f.crew} onChange={set("crew")}>
            {CREWS.map((c) => (
              <option key={c.crew}>{c.crew}</option>
            ))}
          </select>
        </L>
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button type="submit" disabled={create.isPending} className={btnPrimary}>
            Crear despacho
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ---------- Reportar novedad ---------- */
export function NoveltyModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const report = useReportNovelty();
  const [type, setType] = useState(NOVELTY_TYPES[0]!);
  const [description, setDescription] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    report.mutate(
      { order_id: order.id, type, description },
      {
        onSuccess: () => {
          toast.success(`Novedad registrada en ${order.id}`);
          onClose();
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  };
  return (
    <Modal
      title={`Reportar novedad · ${order.id}`}
      onClose={onClose}
      confirmOutsideClose="Se perderá la novedad que estás escribiendo."
    >
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">Tipo</span>
          <select className={inputCls} value={type} onChange={(e) => setType(e.target.value)}>
            {NOVELTY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">Descripción</span>
          <textarea
            className="min-h-20 rounded-lg border border-border bg-surface-low p-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>
            Cancelar
          </button>
          <button type="submit" disabled={report.isPending} className={btnPrimary}>
            Registrar
          </button>
        </div>
      </form>
    </Modal>
  );
}
