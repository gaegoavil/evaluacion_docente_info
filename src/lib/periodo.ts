// Lee el periodo académico activo (tabla public.periodos) mediante la API REST de Supabase.
// Se usa fetch en lugar del cliente supabase-js para que funcione también en el
// renderizado del servidor (SSR) sin depender de WebSocket/Realtime.
export async function fetchPeriodoActivo(): Promise<string | null> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ??
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;
  if (!url || !key) return null;

  try {
    const res = await fetch(
      `${url}/rest/v1/periodos?select=nombre&activo=eq.true&order=nombre.desc&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as { nombre: string }[];
    return rows[0]?.nombre ?? null;
  } catch {
    return null;
  }
}
