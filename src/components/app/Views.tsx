import { toast } from "sonner";
import { useResolveNovelty, type Novelty, type Order } from "@/lib/db";
import type { Role } from "@/lib/auth";
import { Card, Icon, StatusPill, btnGhost, btnPrimary } from "./shared";
import { CREWS, matchesQuery } from "./Monitor";

function Title({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div data-tour="view-title" className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-success-line bg-success-soft text-primary">
        <Icon name={icon} />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="font-mono text-[11px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}

const ACTIVE = ["Asignado a ruta", "En camino", "En punto de entrega"];

export function RoutesView({
  orders,
  query,
  onOpen,
}: {
  orders: Order[];
  query: string;
  onOpen: (id: string) => void;
}) {
  const rows = orders.filter((o) => ACTIVE.includes(o.status) && matchesQuery(o, query));
  return (
    <div className="flex flex-col gap-4">
      <Title icon="local_shipping" title="Rutas Activas" sub={`${rows.length} despachos en ruta`} />
      <div data-tour="view-content" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((o) => (
          <Card key={o.id} className="flex flex-col gap-3 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs font-semibold text-primary">{o.id}</div>
                <div className="font-medium">{o.item}</div>
              </div>
              <StatusPill status={o.status} />
            </div>
            <div className="text-[13px]">
              <div className="font-medium">{o.client}</div>
              <div className="font-mono text-[11px] text-muted-foreground">{o.address}</div>
            </div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {o.crew} • {o.driver} • {o.vehicle}
            </div>
            <div className="flex gap-2">
              <button onClick={() => onOpen(o.id)} className={btnPrimary}>
                Ver expediente
              </button>
              <a href={`tel:${o.phone.replace(/[^\d+]/g, "")}`} className={btnGhost}>
                <Icon name="call" className="text-[14px]" />
                Llamar
              </a>
            </div>
          </Card>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No hay rutas activas.</p>}
      </div>
    </div>
  );
}

export function CrewsView({
  orders,
  onOpenCrew,
}: {
  orders: Order[];
  onOpenCrew: (crew: string) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Title icon="group" title="Cuadrillas" sub={`${CREWS.length} cuadrillas operativas`} />
      <div data-tour="view-content" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CREWS.map((c) => {
          const mine = orders.filter((o) => o.crew === c.crew);
          const active = mine.filter((o) => ACTIVE.includes(o.status)).length;
          const done = mine.filter((o) => o.status === "Entregado conforme").length;
          const issues = mine.filter((o) => o.status === "Novedad en ruta").length;
          return (
            <Card key={c.crew} className="flex flex-col gap-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{c.crew}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {c.driver} • {c.vehicle}
                  </div>
                </div>
                <span className="rounded-full border border-border bg-surface-low px-2 py-0.5 font-mono text-[11px] font-semibold">
                  {mine.length} órdenes
                </span>
              </div>
              <div className="flex gap-2 font-mono text-[11px]">
                <span className="rounded-md border border-warning-line bg-warning-soft px-2 py-1 text-warning-ink">
                  {active} en ruta
                </span>
                <span className="rounded-md border border-success-line bg-success-soft px-2 py-1 text-success-ink">
                  {done} entregadas
                </span>
                <span className="rounded-md border border-border bg-surface-low px-2 py-1">
                  {issues} novedades
                </span>
              </div>
              <button onClick={() => onOpenCrew(c.driver)} className={btnGhost}>
                Ver despachos
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export function NoveltiesView({
  novelties,
  orders,
  role,
  focus,
  onOpen,
}: {
  novelties: Novelty[];
  orders: Order[];
  role: Role;
  focus: string | null;
  onOpen: (id: string) => void;
}) {
  const resolve = useResolveNovelty();
  const open = novelties.filter((n) => !n.resolved);
  const closed = novelties.filter((n) => n.resolved);
  const row = (n: Novelty) => {
    const o = orders.find((x) => x.id === n.order_id);
    return (
      <Card
        key={n.id}
        className={`flex flex-wrap items-center justify-between gap-3 p-4 ${focus === n.order_id ? "ring-2 ring-warning" : ""}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-warning-ink">{n.order_id}</span>
            <span className="rounded-full border border-warning-line bg-warning-soft px-2 py-0.5 font-mono text-[11px] font-bold text-warning-ink">
              {n.type}
            </span>
          </div>
          <div className="font-medium">{o?.item ?? "Orden eliminada"}</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            {n.description} • {new Date(n.created_at).toLocaleString("es-DO")}
          </div>
        </div>
        <div className="flex gap-2">
          {o && (
            <button onClick={() => onOpen(o.id)} className={btnGhost}>
              Ver orden
            </button>
          )}
          {!n.resolved && role === "admin" && (
            <button
              disabled={resolve.isPending}
              onClick={() =>
                resolve.mutate(
                  { id: n.id, order_id: n.order_id },
                  {
                    onSuccess: () => toast.success("Novedad resuelta"),
                    onError: (e) => toast.error((e as Error).message),
                  },
                )
              }
              className={btnPrimary}
            >
              <Icon name="check" className="text-[14px]" />
              Resolver
            </button>
          )}
          {n.resolved && (
            <span className="rounded-full border border-success-line bg-success-soft px-2 py-1 font-mono text-[11px] font-bold text-success-ink">
              RESUELTA
            </span>
          )}
        </div>
      </Card>
    );
  };
  return (
    <div className="flex flex-col gap-4">
      <Title
        icon="warning"
        title="Novedades"
        sub={`${open.length} abiertas • ${closed.length} resueltas`}
      />
      {role !== "admin" && (
        <p className="font-mono text-[11px] text-muted-foreground">
          Solo el administrador puede resolver novedades.
        </p>
      )}
      <div data-tour="view-content" className="flex flex-col gap-3">
        {open.map(row)}
        {open.length === 0 && <p className="text-muted-foreground">Sin novedades abiertas.</p>}
      </div>
      {closed.length > 0 && (
        <>
          <h2 className="label-caps text-muted-foreground">Resueltas</h2>
          <div className="flex flex-col gap-3">{closed.map(row)}</div>
        </>
      )}
    </div>
  );
}

export function PodListView({
  orders,
  query,
  onOpen,
}: {
  orders: Order[];
  query: string;
  onOpen: (id: string) => void;
}) {
  const rows = orders.filter((o) => o.status === "Entregado conforme" && matchesQuery(o, query));
  return (
    <div className="flex flex-col gap-4">
      <Title
        icon="fact_check"
        title="Proof of Delivery (POD)"
        sub={`${rows.length} expedientes verificados`}
      />
      <div data-tour="view-content" className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((o) => (
          <Card key={o.id} className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-primary">{o.id}</span>
              <span className="rounded-full border border-success-line bg-success-soft px-2 py-0.5 font-mono text-[10px] font-bold text-success-ink">
                VERIFICADO
              </span>
            </div>
            <div className="font-medium">{o.item}</div>
            <div className="font-mono text-[11px] text-muted-foreground">
              {o.client} • {o.delivered_at ? new Date(o.delivered_at).toLocaleString("es-DO") : ""}
            </div>
            <button onClick={() => onOpen(o.id)} className={btnPrimary}>
              Abrir expediente
            </button>
          </Card>
        ))}
        {rows.length === 0 && (
          <p className="text-muted-foreground">Aún no hay entregas verificadas.</p>
        )}
      </div>
    </div>
  );
}
