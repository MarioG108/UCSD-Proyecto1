import { useState, type ReactNode } from "react";
import type { Status } from "@/lib/db";

export const LOGO =
  "https://lh3.googleusercontent.com/aida/AEtjO1WhHkUth_oVgfeK6GnGobf4GUb_cVFNDmd7-yYdkixMvmyctg2tgsXmsumyhkJQlCIoiKeOQtYViEK6kc2VKYgjl8ZayaeT7nd6XHzRgtistObOyd-zNFwRLA-qSkgEuWXVjx0wnw1hRZ4z555iakzd1YWPnEbrdOqKKe06CTQF1TUlsoQcyhUa2YwE7YfN6LsXl9tkJENA4lPXGYPD-0wpB1CBpQh4HLpDhtnuI64YaA";
export const POD_PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCH0axjgGThEnFu8kti7OJAZoOm9W_CwA2-4jKjJpnZ9CCF7Olprzhj1Ghj2eou4DtNpqyxbkAlCSFz76xMKA2pcFoJ28-2WFr0E4-Lc9n-tOJUurQPyFYPGYatqnSvepfAAijbO4hfSgGhwfhys3Q1k-rqB8VTnC4udm0jWb-F3k8esLzhhhV5AY5nYKkoS3cwCNGSbtDZQwA8QcTbu5dgajWFSME93dcsM3_kHzhn";

export function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined leading-none ${className}`}>{name}</span>;
}

export const STATUS_STYLE: Record<
  Status,
  { pill: string; dot: string; label: string; icon: string }
> = {
  "Entregado conforme": {
    pill: "bg-success-soft text-success-ink border-success-line",
    dot: "bg-success",
    label: "Entregado conforme",
    icon: "location_on",
  },
  "En camino": {
    pill: "bg-warning-soft text-warning-ink border-warning-line",
    dot: "bg-warning",
    label: "En camino",
    icon: "navigation",
  },
  "En punto de entrega": {
    pill: "bg-info-soft text-info-ink border-info-line",
    dot: "bg-info",
    label: "En punto entrega",
    icon: "pin_drop",
  },
  "Asignado a ruta": {
    pill: "bg-surface-mid text-foreground border-border",
    dot: "bg-primary",
    label: "Asignado a ruta",
    icon: "route",
  },
  "Novedad en ruta": {
    pill: "bg-warning-soft text-warning-ink border-warning-line",
    dot: "bg-warning",
    label: "Novedad en ruta",
    icon: "call",
  },
  "En preparación": {
    pill: "bg-surface-low text-muted-foreground border-border",
    dot: "bg-outline",
    label: "En preparación",
    icon: "",
  },
};

export function StatusPill({ status }: { status: Status }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold ${s.pill}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  confirmOutsideClose,
  children,
}: {
  title: string;
  onClose: () => void;
  /** Si se define, un clic fuera del popup pide confirmación antes de cerrar. */
  confirmOutsideClose?: string;
  children: ReactNode;
}) {
  const [asking, setAsking] = useState(false);
  const onBackdrop = () => (confirmOutsideClose ? setAsking(true) : onClose());
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4"
      onClick={onBackdrop}
    >
      {asking && (
        <div
          role="alertdialog"
          aria-label="Confirmar cierre"
          className="absolute z-10 w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-card"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="font-semibold">¿Cerrar sin guardar?</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{confirmOutsideClose}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" autoFocus onClick={() => setAsking(false)} className={btnGhost}>
              Seguir editando
            </button>
            <button type="button" onClick={onClose} className={btnPrimary}>
              Sí, cerrar
            </button>
          </div>
        </div>
      )}
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-border bg-card p-5 shadow-card"
        onClick={(e) => {
          e.stopPropagation();
          if (asking) setAsking(false);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            aria-label="Cerrar"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-surface-mid"
          >
            <Icon name="close" className="text-[20px]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const inputCls =
  "h-[38px] w-full rounded-lg border border-border bg-surface-low px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 font-mono text-xs font-semibold text-primary-foreground hover:bg-primary-strong disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-low px-3 py-2 font-mono text-xs font-semibold hover:bg-surface-mid disabled:opacity-50";

export function Avatar({ username, size = 36 }: { username: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const px = size * 2;
  return failed ? (
    <span
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-primary text-primary-foreground"
    >
      <Icon name="person" className="text-[20px]" />
    </span>
  ) : (
    <img
      src={`https://picsum.photos/seed/${encodeURIComponent(username)}/${px}/${px}`}
      alt={`Foto de perfil de ${username}`}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
