import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { IMG_LOGO_CIRCULAR } from "@/lib/constants";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Acceso administrador — UJBM" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email?.toLowerCase();
      if (!email) return;
      const { data: admin } = await supabase.from("admins").select("email").eq("email", email).maybeSingle();
      if (admin) navigate({ to: "/admin/dashboard" });
      else await supabase.auth.signOut();
    })();
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user?.email) {
      setLoading(false);
      setError("Contraseña incorrecta. Inténtalo nuevamente.");
      return;
    }

    const { data: admin, error: adminError } = await supabase
      .from("admins")
      .select("email")
      .eq("email", data.user.email.toLowerCase())
      .maybeSingle();

    setLoading(false);

    if (adminError || !admin) {
      await supabase.auth.signOut();
      setError("No tienes permisos de administrador.");
      return;
    }

    navigate({ to: "/admin/dashboard" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="ujbm-card w-full max-w-md p-8">
          <img src={IMG_LOGO_CIRCULAR} alt="UJBM" className="mx-auto h-14 w-14" style={{ objectFit: "contain" }} />
          <h2 className="mt-4 text-center text-xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
            Acceso administrador
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">Universidad Jaime Bausate y Meza</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Correo</label>
              <input
                type="email" required autoComplete="email"
                className="w-full h-11 px-3 rounded-md border border-border bg-white outline-none focus:border-[color:var(--ujbm-blue)]"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Contraseña</label>
              <input
                type="password" required autoComplete="current-password"
                className="w-full h-11 px-3 rounded-md border border-border bg-white outline-none focus:border-[color:var(--ujbm-blue)]"
                value={password} onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm" style={{ color: "var(--ujbm-red)" }}>{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full h-11 rounded-md text-white font-semibold disabled:opacity-50"
              style={{ background: "var(--ujbm-blue)" }}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}