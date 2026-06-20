// Cliente Supabase del proyecto.
// Usa exclusivamente las variables del proyecto Supabase del usuario:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
// Para mantener compatibilidad con la preview se acepta también VITE_SUPABASE_PUBLISHABLE_KEY.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  "";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // No lanzamos error para no romper el render; los componentes muestran un aviso.
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Configura las variables de entorno en Vercel."
  );
}

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
