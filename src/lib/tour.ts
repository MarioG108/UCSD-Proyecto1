import type { DriveStep } from "driver.js";

export type TourView = "dashboard" | "routes" | "crews" | "novelties" | "pod";

type Status = "completed" | "skipped";
const key = (v: TourView) => `ls_tour_${v}`;

/** Estado guardado en este dispositivo (localStorage): null = aún no visto. */
export function getTourStatus(view: TourView): Status | null {
  try {
    const v = localStorage.getItem(key(view));
    return v === "completed" || v === "skipped" ? v : null;
  } catch {
    return null;
  }
}

function setTourStatus(view: TourView, status: Status) {
  try {
    localStorage.setItem(key(view), status);
  } catch {
    /* sin almacenamiento: el tour se mostrará de nuevo */
  }
}

export function resetTours() {
  try {
    (Object.keys(STEPS) as TourView[]).forEach((v) => localStorage.removeItem(key(v)));
  } catch {
    /* noop */
  }
}

const sel = (name: string) => `[data-tour="${name}"]`;

const STEPS: Record<TourView, DriveStep[]> = {
  dashboard: [
    {
      element: sel("nav"),
      popover: {
        title: "Menú de navegación",
        description: "Cambia entre Dashboard, Rutas Activas, Cuadrillas, Novedades y POD.",
      },
    },
    {
      element: sel("search"),
      popover: {
        title: "Búsqueda rápida",
        description: "Busca por orden, artículo, cliente o conductor. Atajo: Ctrl + K.",
      },
    },
    {
      element: sel("branch"),
      popover: {
        title: "Sucursal",
        description: "Filtra los indicadores y el monitor por sucursal.",
      },
    },
    {
      element: sel("bell"),
      popover: {
        title: "Notificaciones",
        description: "Muestra las novedades abiertas; haz clic en una para ir a ella.",
      },
    },
    {
      element: sel("profile"),
      popover: {
        title: "Tu perfil",
        description: "Consulta tu rol, vuelve a ver los tutoriales o cierra sesión.",
      },
    },
    {
      element: sel("kpis"),
      popover: {
        title: "Indicadores (KPIs)",
        description:
          "Puntualidad, éxito en primer intento, despachos en ruta y novedades abiertas.",
      },
    },
    {
      element: sel("monitor"),
      popover: {
        title: "Monitor de despachos",
        description:
          "Filtra, pagina y abre cada despacho. El administrador puede crear uno nuevo con «Nuevo».",
      },
    },
    {
      element: sel("pod"),
      popover: {
        title: "Expediente digital POD",
        description:
          "Detalle del despacho seleccionado. Evidencia, firma y PDF se habilitan al entregarse.",
      },
    },
  ],
  routes: [
    {
      element: sel("view-title"),
      popover: {
        title: "Rutas activas",
        description: "Despachos asignados, en camino o en punto de entrega.",
      },
    },
    {
      element: sel("view-content"),
      popover: {
        title: "Tarjetas de ruta",
        description: "Abre el expediente de la orden o llama al cliente directamente.",
      },
    },
  ],
  crews: [
    {
      element: sel("view-title"),
      popover: { title: "Cuadrillas", description: "Resumen del trabajo de cada cuadrilla." },
    },
    {
      element: sel("view-content"),
      popover: {
        title: "Carga por cuadrilla",
        description:
          "Ve órdenes en ruta, entregadas y con novedad. «Ver despachos» filtra el monitor.",
      },
    },
  ],
  novelties: [
    {
      element: sel("view-title"),
      popover: { title: "Novedades", description: "Incidencias abiertas y resueltas." },
    },
    {
      element: sel("view-content"),
      popover: {
        title: "Gestión de novedades",
        description: "Abre la orden afectada. El administrador puede marcarlas como resueltas.",
      },
    },
  ],
  pod: [
    {
      element: sel("view-title"),
      popover: { title: "Proof of Delivery", description: "Entregas verificadas." },
    },
    {
      element: sel("view-content"),
      popover: {
        title: "Expedientes verificados",
        description: "Abre el expediente para ver evidencia y descargar el vale en PDF.",
      },
    },
  ],
};

// Solo pasos cuyo elemento existe y está a la vista (p. ej. el menú lateral no se ve en móvil).
function isVisible(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth;
}

let active: { destroy: () => void } | null = null;

/** Lanza el tour de una pantalla. Sin `force`, solo si no se ha visto en este dispositivo. */
export async function runTour(view: TourView, opts: { force?: boolean } = {}) {
  if (!opts.force && getTourStatus(view)) return;
  const steps = STEPS[view].filter((s) => typeof s.element === "string" && isVisible(s.element));
  if (steps.length === 0) return;

  const [{ driver }] = await Promise.all([
    import("driver.js"),
    import("driver.js/dist/driver.css"),
  ]);
  active?.destroy();
  const d = driver({
    steps,
    showProgress: true,
    progressText: "{{current}} de {{total}}",
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Finalizar",
    onDestroyStarted: () => {
      // Sin siguiente paso = el usuario llegó al final; si no, lo cerró antes.
      setTourStatus(view, d.hasNextStep() ? "skipped" : "completed");
      d.destroy();
    },
    onDestroyed: () => {
      active = null;
    },
  });
  active = d;
  d.drive();
}
