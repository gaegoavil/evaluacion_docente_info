import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { IMG_LOGO_CIRCULAR } from "@/lib/constants";

// Paso 2: el enlace del correo (invitación o recuperación) abre esta página con
// una sesión temporal; aquí el administrador define su contraseña.
export const Route = createFileRoute("/admin/nueva-clave")({
  head: () => ({ meta: [{ title: "Nueva contraseña — UJBM" }] }),
  component: NuevaClavePage,
});

type Estado = "cargando" | "listo" | "invalido" | "sin-permiso";

function NuevaClavePage() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let activo = true;

    // supabase-js lee el token del enlace al iniciar; getSession espera a que termine.
    supabase.auth.getSession().then(({ data }) => {
      if (!activo) return;
      const correo = data.session?.user?.email;
      if (correo) {
        setEmail(correo);
        setEstado("listo");
      } else {
        setEstado("invalido");
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (activo && session?.user?.email) {
        setEmail(session.user.email);
        setEstado("listo");
      }
    });

    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (clave.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (clave !== clave2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: updError } = await supabase.auth.updateUser({ password: clave });

    if (updError) {
      setLoading(false);
      setError(
        /different from the old/i.test(updError.message)
          ? "La nueva contraseña debe ser distinta de la anterior."
          : "No se pudo guardar la contraseña. Solicita un nuevo enlace e inténtalo otra vez."
      );
      return;
    }

    const { data: admin } = await supabase
      .from("admins")
      .select("email")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    setLoading(false);

    if (admin) {
      navigate({ to: "/admin/dashboard" });
    } else {
      await supabase.auth.signOut();
      setEstado("sin-permiso");
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="ujbm-card w-full max-w-md p-8">
          <img src={IMG_LOGO_CIRCULAR} alt="UJBM" className="mx-auto h-14 w-14" style={{ objectFit: "contain" }} />
          <h2 className="mt-4 text-center text-xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
            Nueva contraseña
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">Acceso de administradores</p>

          {estado === "cargando" && (
            <p className="mt-6 text-center text-sm text-muted-foreground">Verificando el enlace...</p>
          )}

          {estado === "invalido" && (
            <div className="mt-6 space-y-4 text-center text-sm">
              <p>El enlace no es válido o ya venció.</p>
              <Link to="/admin/recuperar" className="font-medium" style={{ color: "var(--ujbm-blue)" }}>
                Solicitar un enlace nuevo
              </Link>
            </div>
          )}

          {estado === "sin-permiso" && (
            <div className="mt-6 space-y-4 text-center text-sm">
              <p>Tu contraseña se guardó, pero este correo no tiene permisos de administrador.</p>
              <Link to="/admin/login" className="font-medium" style={{ color: "var(--ujbm-blue)" }}>
                Volver al inicio de sesión
              </Link>
            </div>
          )}

          {estado === "listo" && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Crea la contraseña para <strong className="text-foreground">{email}</strong>.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
                <input
                  type="password" required autoComplete="new-password" minLength={8}
                  className="w-full h-11 px-3 rounded-md border border-border bg-white outline-none focus:border-[color:var(--ujbm-blue)]"
                  value={clave} onChange={(e) => setClave(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Repite la contraseña</label>
                <input
                  type="password" required autoComplete="new-password" minLength={8}
                  className="w-full h-11 px-3 rounded-md border border-border bg-white outline-none focus:border-[color:var(--ujbm-blue)]"
                  value={clave2} onChange={(e) => setClave2(e.target.value)}
                />
              </div>
              {error && <p className="text-sm" style={{ color: "var(--ujbm-red)" }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full h-11 rounded-md text-white font-semibold disabled:opacity-50"
                style={{ background: "var(--ujbm-blue)" }}
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
