import { createClient } from "@supabase/supabase-js";

const url = import.meta.env["VITE_SUPABASE_URL"] as string;
const key = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

// Clave publicable (segura para el navegador). Nunca usar la service_role aquí.
export const supabase = createClient(url, key, { auth: { persistSession: false } });
