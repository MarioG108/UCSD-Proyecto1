import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export const STATUSES = [
  "En preparación",
  "Asignado a ruta",
  "En camino",
  "En punto de entrega",
  "Entregado conforme",
  "Novedad en ruta",
] as const;
export type Status = (typeof STATUSES)[number];

export type Order = {
  id: string;
  item: string;
  meta: string;
  note: string | null;
  client: string;
  branch: string;
  category: string;
  crew: string;
  driver: string;
  vehicle: string;
  status: Status;
  customer_cedula: string;
  address: string;
  phone: string;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Novelty = {
  id: string;
  order_id: string;
  type: string;
  description: string;
  resolved: boolean;
  created_at: string;
};

export const NOVELTY_TYPES = ["Avería", "Cliente ausente", "Dirección errónea", "Otro"];

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dispatch_orders").select("*").order("id");
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useNovelties() {
  return useQuery({
    queryKey: ["novelties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("novelties")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Novelty[];
    },
  });
}

function useInvalidating<T>(fn: (v: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["novelties"] });
    },
  });
}

const ok = ({ error }: { error: unknown }) => {
  if (error) throw error;
};

export function useUpdateStatus() {
  return useInvalidating(async ({ id, status }: { id: string; status: Status }) =>
    ok(
      await supabase
        .from("dispatch_orders")
        .update({
          status,
          delivered_at: status === "Entregado conforme" ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id),
    ),
  );
}

export function useCreateOrder() {
  return useInvalidating(
    async (
      o: Pick<
        Order,
        "id" | "item" | "client" | "branch" | "category" | "crew" | "driver" | "vehicle"
      >,
    ) =>
      ok(
        await supabase
          .from("dispatch_orders")
          .insert({ ...o, meta: o.category.split(" (")[0]!, status: "En preparación" }),
      ),
  );
}

export function useDeleteOrder() {
  return useInvalidating(async (id: string) =>
    ok(await supabase.from("dispatch_orders").delete().eq("id", id)),
  );
}

export function useReportNovelty() {
  return useInvalidating(
    async ({
      order_id,
      type,
      description,
    }: {
      order_id: string;
      type: string;
      description: string;
    }) => {
      ok(await supabase.from("novelties").insert({ order_id, type, description }));
      ok(
        await supabase
          .from("dispatch_orders")
          .update({
            status: "Novedad en ruta",
            note: description || type,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order_id),
      );
    },
  );
}

export function useResolveNovelty() {
  return useInvalidating(async ({ id, order_id }: { id: string; order_id: string }) => {
    ok(await supabase.from("novelties").update({ resolved: true }).eq("id", id));
    ok(
      await supabase
        .from("dispatch_orders")
        .update({ status: "Asignado a ruta", note: null, updated_at: new Date().toISOString() })
        .eq("id", order_id),
    );
  });
}

export function nextStatus(s: Status): Status | null {
  const flow: Status[] = [
    "En preparación",
    "Asignado a ruta",
    "En camino",
    "En punto de entrega",
    "Entregado conforme",
  ];
  const i = flow.indexOf(s);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1]! : null;
}
