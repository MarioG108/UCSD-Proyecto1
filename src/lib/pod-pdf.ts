import type { Order } from "./db";

export async function downloadPodPdf(o: Order) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const left = 20;
  let y = 24;

  doc.setFont("helvetica", "bold").setFontSize(18).text("La Sirena · Vale POD", left, y);
  y += 7;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(100);
  doc.text("Control de Despachos · Grupo Ramos C. por A.", left, y);
  doc.setDrawColor(200).line(left, y + 4, 190, y + 4);
  doc.setTextColor(0);
  y += 14;

  const delivered = o.delivered_at
    ? new Date(o.delivered_at).toLocaleString("es-DO")
    : "Pendiente de cierre";
  const rows: [string, string][] = [
    ["Orden", o.id],
    ["Artículo", o.item],
    ["Estado", o.status],
    ["Fecha de entrega", delivered],
    ["Cliente", o.client],
    ["Cédula", o.customer_cedula],
    ["Dirección", o.address],
    ["Teléfono", o.phone],
    ["Sucursal", o.branch],
    ["Cuadrilla", o.crew],
    ["Chofer", o.driver],
    ["Vehículo", o.vehicle],
  ];
  doc.setFontSize(11);
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "bold").text(`${k}:`, left, y);
    const lines = doc.splitTextToSize(v, 120) as string[];
    doc.setFont("helvetica", "normal").text(lines, left + 40, y);
    y += 7 * lines.length;
  }

  y += 10;
  doc.setDrawColor(150).line(left, y + 20, left + 70, y + 20);
  doc
    .setFontSize(9)
    .setTextColor(100)
    .text("Firma del receptor", left, y + 25);
  doc.text(`Generado: ${new Date().toLocaleString("es-DO")}`, left, 285);

  doc.save(`vale-pod-${o.id.replace("#", "")}.pdf`);
}
