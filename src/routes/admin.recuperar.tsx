import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { IMG_LOGO_CIRCULAR } from "@/lib/constants";

// Paso 1 del acceso de administradores: pedir el enlace para crear o
// restablecer la contraseña. Supabase envía el correo y el enlace lleva
// a /admin/nueva-clave.
export const Route = createFileRoute("/admin/recuperar")({
  head: () => ({ meta: [{ title: "Crear o restablecer contraseña — UJBM" }] }),
  component: RecuperarPage,
});

function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: `${window.location.origin}/admin/nueva-clave` }
    );

    setLoading(false);

    if (error) {
      setError(
        error.status === 429
          ? "Se enviaron demasiadas solicitudes. Espera unos minutos e inténtalo de nuevo."
          : "No se pudo enviar el correo. Inténtalo más tarde o contacta al administrador del sistema."
      );
      return;
    }

    // Por seguridad no se indica si el correo está registrado o no.
    setEnviado(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="ujbm-card w-full max-w-md p-8">
          <img src={IMG_LOGO_CIRCULAR} alt="UJBM" className="mx-auto h-14 w-14" style={{ objectFit: "contain" }} />
          <h2 className="mt-4 text-center text-xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
            Crear o restablecer contraseña
          </h2>
          <p className="mt-1 text-center text-xs text-muted-foreground">Acceso de administradores</p>

          {enviado ? (
            <div className="mt-6 space-y-4 text-sm">
              <p>
                Si <strong>{email.trim().toLowerCase()}</strong> está registrado como administrador,
                recibirás un correo con un enlace para crear tu contraseña.
              </p>
              <p className="text-muted-foreground">
                El enlace vence en una hora. Revisa también la carpeta de spam o correo no deseado.
              </p>
              <Link to="/admin/login" className="block text-center font-medium" style={{ color: "var(--ujbm-blue)" }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Escribe tu correo institucional y te enviaremos un enlace para crear una contraseña nueva.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Correo</label>
                <input
                  type="email" required autoComplete="email"
                  className="w-full h-11 px-3 rounded-md border border-border bg-white outline-none focus:border-[color:var(--ujbm-blue)]"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm" style={{ color: "var(--ujbm-red)" }}>{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full h-11 rounded-md text-white font-semibold disabled:opacity-50"
                style={{ background: "var(--ujbm-blue)" }}
              >
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
              <Link to="/admin/login" className="block text-center text-sm" style={{ color: "var(--ujbm-blue)" }}>
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
