import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { nextStatus, useDeleteOrder, useUpdateStatus, type Order } from "@/lib/db";
import type { Role } from "@/lib/auth";
import { Card, Icon, Modal, POD_PHOTO, StatusPill, btnGhost, btnPrimary } from "./shared";
import { NoveltyModal } from "./Monitor";

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <div className="label-caps text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium">{children}</div>
    </div>
  );
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function downloadVale(o: Order) {
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><title>Vale POD ${esc(o.id)}</title>
<body style="font-family:sans-serif;max-width:640px;margin:2rem auto"><h1>La Sirena · Vale POD</h1>
<p><b>Orden:</b> ${esc(o.id)}<br><b>Artículo:</b> ${esc(o.item)}<br><b>Estado:</b> ${esc(o.status)}<br><b>Cliente:</b> ${esc(o.client)}<br><b>Cédula:</b> ${esc(o.customer_cedula)}<br><b>Dirección:</b> ${esc(o.address)}<br><b>Teléfono:</b> ${esc(o.phone)}<br><b>Sucursal:</b> ${esc(o.branch)}<br><b>Transporte:</b> ${esc(o.crew)} · ${esc(o.driver)} · ${esc(o.vehicle)}<br><b>Entrega:</b> ${o.delivered_at ? new Date(o.delivered_at).toLocaleString("es-DO") : "Pendiente"}</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `vale-pod-${o.id.replace("#", "")}.html`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Vale POD descargado");
}

export function PodPanel({
  order,
  role,
  onDeleted,
}: {
  order: Order;
  role: Role;
  onDeleted: () => void;
}) {
  const delivered = order.status === "Entregado conforme";
  const update = useUpdateStatus();
  const del = useDeleteOrder();
  const [hd, setHd] = useState(false);
  const [reporting, setReporting] = useState(false);
  const next = nextStatus(order.status);

  const advance = () =>
    next &&
    update.mutate(
      { id: order.id, status: next },
      {
        onSuccess: () => toast.success(`${order.id} → ${next}`),
        onError: (e) => toast.error((e as Error).message),
      },
    );
  const remove = () => {
    if (!window.confirm(`¿Eliminar el despacho ${order.id}?`)) return;
    del.mutate(order.id, {
      onSuccess: () => {
        toast.success("Despacho eliminado");
        onDeleted();
      },
      onError: (e) => toast.error((e as Error).message),
    });
  };
  const when = order.delivered_at
    ? new Date(order.delivered_at).toLocaleString("es-DO")
    : "Pendiente de cierre";

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface-low p-5">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold">Expediente Digital POD</span>
          {delivered && (
            <span className="rounded-full border border-success-line bg-success-soft px-2 py-0.5 font-mono text-[10px] font-bold text-success-ink">
              VERIFICADO
            </span>
          )}
        </div>
        <div className="mt-1 font-mono text-xs font-semibold text-primary">
          Orden {order.id} • {order.item}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <StatusPill status={order.status} />
          <span className="font-mono text-[11px] text-muted-foreground">{when}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {role === "admin" && next && (
            <button onClick={advance} disabled={update.isPending} className={btnPrimary}>
              <Icon name="arrow_forward" className="text-[14px]" />
              Avanzar a «{next}»
            </button>
          )}
          {!delivered && order.status !== "Novedad en ruta" && (
            <button onClick={() => setReporting(true)} className={btnGhost}>
              <Icon name="report_problem" className="text-[14px]" />
              Reportar novedad
            </button>
          )}
          {role === "admin" && (
            <button onClick={remove} disabled={del.isPending} className={btnGhost}>
              <Icon name="delete" className="text-[14px]" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5">
        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps text-muted-foreground">
              Datos del Destinatario y Cuadrilla
            </span>
            <Icon name="person_pin" className="text-[18px] text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Field label="Cliente">{order.client}</Field>
            <Field label="Cédula Identidad">
              <span className="font-mono">{order.customer_cedula}</span>
            </Field>
            <Field label="Dirección de Entrega" wide>
              {order.address}
            </Field>
            <Field label="Teléfono de Contacto">
              <a
                href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
                className="flex items-center gap-1 font-mono hover:underline"
              >
                {order.phone}
                <Icon name="call" className="text-[14px] text-success" />
              </a>
            </Field>
            <Field label="Sucursal Despacho">
              {order.branch.replace("Sucursal ", "")}
              {order.branch.includes("Churchill") ? " (DC Central)" : ""}
            </Field>
            <div className="col-span-2 rounded-md border border-border bg-surface-low p-2.5">
              <div className="label-caps text-muted-foreground">Transportista Asignado</div>
              <div className="mt-0.5 font-medium">
                {order.crew} • Chofer: {order.driver} • Auxiliar: Miguel Vargas ({order.vehicle})
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps text-muted-foreground">
              Validación Telemática de Ubicación (GPS)
            </span>
            <span className="flex items-center gap-1 rounded-full border border-success-line bg-success-soft px-2 py-0.5 font-mono text-[10px] font-bold text-success-ink">
              <Icon name="gps_fixed" className="text-[12px]" />
              Geo-Fence Validado
            </span>
          </div>
          <div className="map-grid relative flex h-36 items-center justify-center overflow-hidden rounded-md border border-border">
            <div className="absolute inset-x-0 top-1/2 h-3 -translate-y-1/2 bg-surface-high" />
            <div className="absolute inset-y-0 left-1/3 w-3 bg-surface-high" />
            <div className="relative flex flex-col items-center">
              <Icon name="location_on" className="text-[36px] text-primary drop-shadow" />
              <span className="mt-1 rounded-md bg-surface px-2 py-0.5 font-mono text-[10px] font-semibold shadow-card">
                Punto de Entrega {delivered ? "Confirmado" : "Previsto"}
              </span>
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground">
            <a
              className="font-semibold text-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
              href="https://www.google.com/maps?q=18.4721,-69.9388"
            >
              18.4721° N, 69.9388° W
            </a>
            <span>± 4m precisión</span>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps text-muted-foreground">
              Evidencia Fotográfica de Entrega
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">Foto 1 de 2 • HD</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
            <div className="relative h-44 overflow-hidden rounded-md border border-border sm:col-span-2 sm:h-auto">
              <img
                src={POD_PHOTO}
                alt="Evidencia de entrega"
                className="h-full min-h-32 w-full object-cover"
              />
              <button
                onClick={() => setHd(true)}
                className="absolute bottom-1.5 right-1.5 rounded bg-surface/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold hover:bg-surface"
              >
                Ver HD
              </button>
            </div>
            <div className="flex flex-col gap-2 text-[13px] sm:col-span-3">
              <span className="font-semibold">Checklist de Conformidad Técnica:</span>
              {[
                "Embalaje retirado sin rayaduras",
                "Compresor y niveles verificados",
                "Garantía sellada y entregada",
              ].map((c) => (
                <span key={c} className="flex items-center gap-1.5">
                  <Icon name="check_circle" className="text-[16px] text-success" />
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-caps text-muted-foreground">Firma Digital del Receptor</span>
            <span className="rounded-full border border-success-line bg-success-soft px-2 py-0.5 font-mono text-[10px] font-bold text-success-ink">
              OTP-77421 VALIDADO
            </span>
          </div>
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-surface-low text-foreground">
            <svg
              viewBox="0 0 200 60"
              className="h-16 w-56"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
            >
              <path d="M 20 40 C 35 15, 45 10, 50 35 C 55 50, 60 52, 75 25 C 85 10, 95 45, 110 30 C 120 20, 135 22, 145 35 C 150 42, 165 18, 185 28" />
              <path
                d="M 40 48 L 170 42"
                strokeDasharray="3 3"
                strokeWidth="1.2"
                className="text-outline"
              />
            </svg>
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-1 font-mono text-[11px] text-muted-foreground">
            <span>Hash: SHA256-d7a8e1b...</span>
            <span>
              Firmante: <strong className="text-foreground">{order.client}</strong>
            </span>
            <span>Dispositivo: PDA Zebra TC57 (ID: ZEB-04)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadVale(order)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 font-mono text-xs font-semibold text-primary-foreground shadow-primary hover:bg-primary-strong sm:w-auto sm:flex-1"
          >
            <Icon name="download" className="text-[16px]" />
            Descargar Vale POD
          </button>
          <button
            title="Imprimir"
            onClick={() => window.print()}
            className="rounded-lg border border-border bg-surface-low px-3 py-2.5 hover:bg-surface-mid"
          >
            <Icon name="print" className="text-[16px]" />
          </button>
        </div>
      </div>
      {hd && (
        <Modal title="Evidencia fotográfica (HD)" onClose={() => setHd(false)}>
          <img src={POD_PHOTO} alt="Evidencia HD" className="w-full rounded-md" />
        </Modal>
      )}
      {reporting && <NoveltyModal order={order} onClose={() => setReporting(false)} />}
    </Card>
  );
}
