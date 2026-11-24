import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import { useSession, type Role } from "@/lib/auth";
import { useNovelties, useOrders } from "@/lib/db";
import { Avatar, Icon, LOGO } from "@/components/app/shared";
import { Login } from "@/components/app/Login";
import { ALL_BRANCHES, BRANCHES, KpiRow, Monitor } from "@/components/app/Monitor";
import { PodPanel } from "@/components/app/Pod";
import { CrewsView, NoveltiesView, PodListView, RoutesView } from "@/components/app/Views";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · La Sirena Control de Despachos" },
      {
        name: "description",
        content: "KPIs, monitor de despachos en vivo y expediente digital POD.",
      },
      { property: "og:title", content: "Dashboard · La Sirena Control de Despachos" },
      {
        property: "og:description",
        content: "KPIs, monitor de despachos en vivo y expediente digital POD.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type View = "dashboard" | "routes" | "crews" | "novelties" | "pod";
const NAV: { view: View; icon: string; label: string }[] = [
  { view: "dashboard", icon: "dashboard", label: "Dashboard (Overview)" },
  { view: "routes", icon: "local_shipping", label: "Rutas Activas" },
  { view: "crews", icon: "group", label: "Cuadrillas" },
  { view: "novelties", icon: "warning", label: "Novedades" },
  { view: "pod", icon: "fact_check", label: "Proof of Delivery (POD)" },
];

function App() {
  const { session, ready, login, logout } = useSession();
  if (!ready) return <div className="min-h-screen bg-background" />;
  return (
    <>
      <Toaster richColors position="top-right" />
      {session ? (
        <Shell username={session.username} role={session.role} onLogout={logout} />
      ) : (
        <Login onLogin={login} />
      )}
    </>
  );
}

function Shell({
  username,
  role,
  onLogout,
}: {
  username: string;
  role: Role;
  onLogout: () => void;
}) {
  const qc = useQueryClient();
  const orders = useOrders();
  const novelties = useNovelties();
  const [view, setView] = useState<View>("dashboard");
  const [menu, setMenu] = useState(false);
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState(ALL_BRANCHES);
  const [bell, setBell] = useState(false);
  const [profile, setProfile] = useState(false);
  const [focusNovelty, setFocusNovelty] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const list = orders.data ?? [];
  const nov = novelties.data ?? [];
  const openNov = nov.filter((n) => !n.resolved);
  const order = list.find((o) => o.id === selected) ?? list[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["orders"] });
    qc.invalidateQueries({ queryKey: ["novelties"] });
  };
  const go = (v: View) => {
    setView(v);
    setMenu(false);
    setBell(false);
    setProfile(false);
    window.scrollTo({ top: 0 });
  };
  const openOrder = (id: string) => {
    setSelected(id);
    setView("dashboard");
    setMenu(false);
    setTimeout(() => document.getElementById("pod")?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  const select = (id: string) => {
    setSelected(id);
    if (window.innerWidth < 1280)
      document.getElementById("pod")?.scrollIntoView({ behavior: "smooth" });
  };
  const viewNovelty = (id: string) => {
    setFocusNovelty(id);
    go("novelties");
  };

  return (
    <div className="min-h-screen bg-background">
      {menu && (
        <div
          onClick={() => setMenu(false)}
          className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col justify-between border-r border-border bg-surface shadow-card transition-transform lg:translate-x-0 ${menu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div>
          <div className="flex h-16 items-center gap-2 border-b border-border px-5">
            <img
              src={LOGO}
              alt=""
              onError={(e) => (e.currentTarget.style.display = "none")}
              className="h-8 w-auto rounded object-contain"
            />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold text-primary-strong">La Sirena</div>
              <div className="label-caps truncate text-muted-foreground">Control de Despachos</div>
            </div>
          </div>
          <div className="border-b border-border bg-surface-low px-5 py-2">
            <div className="label-caps text-muted-foreground">División Logística</div>
            <div className="truncate text-[13px] font-semibold">Grupo Ramos C. por A.</div>
          </div>
          <nav className="flex flex-col gap-1 p-3">
            {NAV.map((n) => {
              const active = view === n.view;
              const badge = n.view === "novelties" ? openNov.length : 0;
              return (
                <button
                  key={n.view}
                  onClick={() => go(n.view)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-left font-mono text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground shadow-primary" : "text-muted-foreground hover:bg-surface-mid hover:text-foreground"}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon
                      name={n.icon}
                      className={`text-[20px] ${badge && !active ? "text-warning-strong" : ""}`}
                    />
                    {n.label}
                  </span>
                  {badge > 0 && (
                    <span className="rounded-full border border-warning-line bg-warning-soft px-1.5 py-0.5 text-[11px] font-bold text-warning-ink">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex flex-col gap-2 border-t border-border p-3">
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface-low p-2">
            <span className="flex items-center gap-2 font-mono text-[11px] font-semibold">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-success" />
              Hub Santo Domingo
            </span>
            <span className="font-mono text-[11px] font-bold text-primary">ONLINE</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-sm font-semibold text-muted-foreground hover:bg-surface-mid hover:text-foreground"
          >
            <Icon name="logout" className="text-[20px]" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-3 backdrop-blur-xl sm:px-6 lg:left-72">
          <div className="flex min-w-0 max-w-2xl flex-1 items-center gap-3 sm:gap-5">
            <button
              onClick={() => setMenu(true)}
              aria-label="Abrir menú"
              className="shrink-0 rounded-lg p-2 hover:bg-surface-mid lg:hidden"
            >
              <Icon name="menu" className="text-[22px]" />
            </button>
            <label className="relative hidden shrink-0 items-center md:flex" title="Sucursal">
              <Icon
                name="store"
                className="pointer-events-none absolute left-3 text-[18px] text-primary"
              />
              <select
                value={branch}
                onChange={(e) => {
                  setBranch(e.target.value);
                  setView("dashboard");
                }}
                className="h-[38px] cursor-pointer appearance-none rounded-lg border border-border bg-surface-low pl-9 pr-8 font-mono text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {[ALL_BRANCHES, ...BRANCHES].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-2 text-[16px] text-muted-foreground"
              />
            </label>
            <div className="relative flex-1">
              <Icon
                name="search"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-muted-foreground"
              />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-[38px] w-full rounded-lg border border-border bg-surface-low pl-9 pr-12 text-[13px] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Buscar orden, guía o conductor..."
              />
              {query ? (
                <button
                  aria-label="Limpiar búsqueda"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  <Icon name="close" className="text-[16px]" />
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface-mid px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full border border-success-line bg-success-soft px-3 py-1 text-success-ink xl:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <span className="font-mono text-[11px] font-semibold">Centro de Despacho Activo</span>
            </div>
            <div className="relative">
              <button
                aria-label="Notificaciones"
                onClick={() => {
                  setBell(!bell);
                  setProfile(false);
                }}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-surface-mid hover:text-foreground"
              >
                <Icon name="notifications" className="text-[22px]" />
                {openNov.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning font-mono text-[10px] font-bold text-primary-foreground">
                    {openNov.length}
                  </span>
                )}
              </button>
              {bell && (
                <div className="absolute right-0 top-11 w-80 max-w-[90vw] rounded-xl border border-border bg-card p-2 shadow-card">
                  <div className="label-caps px-2 py-1 text-muted-foreground">
                    Novedades abiertas
                  </div>
                  {openNov.slice(0, 5).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => viewNovelty(n.order_id)}
                      className="flex w-full flex-col rounded-lg px-2 py-2 text-left hover:bg-surface-mid"
                    >
                      <span className="font-mono text-xs font-semibold text-warning-ink">
                        {n.order_id} · {n.type}
                      </span>
                      <span className="truncate text-[13px] text-muted-foreground">
                        {n.description}
                      </span>
                    </button>
                  ))}
                  {openNov.length === 0 && (
                    <p className="px-2 py-3 text-[13px] text-muted-foreground">
                      Sin notificaciones.
                    </p>
                  )}
                  <button
                    onClick={() => go("novelties")}
                    className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 font-mono text-xs font-semibold hover:bg-surface-mid"
                  >
                    Ver todas
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                aria-label="Perfil"
                onClick={() => {
                  setProfile(!profile);
                  setBell(false);
                }}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full shadow-sm ring-2 ring-primary"
              >
                <Avatar username={username} />
              </button>
              {profile && (
                <div className="absolute right-0 top-11 w-56 rounded-xl border border-border bg-card p-2 shadow-card">
                  <div className="flex items-center gap-2 px-2 py-1">
                    <Avatar username={username} size={32} />
                    <div className="min-w-0">
                      <div className="font-semibold">{username}</div>
                      <div className="label-caps text-muted-foreground">
                        {role === "admin" ? "Administrador" : "Usuario"}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onLogout}
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 font-mono text-xs font-semibold hover:bg-surface-mid"
                  >
                    <Icon name="logout" className="text-[16px]" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex flex-col gap-4 p-3 pt-20 sm:gap-5 sm:p-6 sm:pt-22">
          {orders.isError && (
            <div
              role="alert"
              className="rounded-lg border border-warning-line bg-warning-soft p-3 text-[13px] text-warning-ink"
            >
              No se pudo cargar la base de datos.{" "}
              <button className="font-semibold underline" onClick={refresh}>
                Reintentar
              </button>
            </div>
          )}
          {orders.isLoading && <p className="text-muted-foreground">Cargando despachos…</p>}
          {!orders.isLoading && view === "dashboard" && (
            <>
              <KpiRow
                orders={list}
                novelties={nov}
                onGoNovelties={() => go("novelties")}
                onGoRoutes={() => go("routes")}
              />
              <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
                <Monitor
                  orders={list}
                  selected={order?.id ?? ""}
                  onSelect={select}
                  onViewNovelty={viewNovelty}
                  role={role}
                  query={query}
                  branch={branch}
                  onBranch={setBranch}
                  refreshing={orders.isFetching}
                  onRefresh={refresh}
                />
                <div id="pod" className="scroll-mt-20 xl:col-span-5">
                  {order ? (
                    <PodPanel
                      key={order.id}
                      order={order}
                      role={role}
                      onDeleted={() => setSelected("")}
                    />
                  ) : (
                    <p className="text-muted-foreground">Selecciona un despacho.</p>
                  )}
                </div>
              </section>
            </>
          )}
          {!orders.isLoading && view === "routes" && (
            <RoutesView orders={list} query={query} onOpen={openOrder} />
          )}
          {!orders.isLoading && view === "crews" && (
            <CrewsView
              orders={list}
              onOpenCrew={(driver) => {
                setQuery(driver);
                go("dashboard");
              }}
            />
          )}
          {!orders.isLoading && view === "novelties" && (
            <NoveltiesView
              novelties={nov}
              orders={list}
              role={role}
              focus={focusNovelty}
              onOpen={openOrder}
            />
          )}
          {!orders.isLoading && view === "pod" && (
            <PodListView orders={list} query={query} onOpen={openOrder} />
          )}
        </main>
      </div>
    </div>
  );
}
