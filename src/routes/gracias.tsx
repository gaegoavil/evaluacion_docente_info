import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalBanner } from "@/components/InstitutionalBanner";
import { IMG_FACHADA_VERTICAL, IMG_LOGO_CIRCULAR } from "@/lib/constants";

export const Route = createFileRoute("/gracias")({
  head: () => ({ meta: [{ title: "Gracias — Encuesta UJBM" }] }),
  component: GraciasPage,
});

function GraciasPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <InstitutionalBanner />
      <main
        className="flex-1 ujbm-bg-fade px-4 py-12"
        style={{ ["--bg-img" as never]: `url(${IMG_FACHADA_VERTICAL})` }}
      >
        <div className="mx-auto max-w-xl">
          <div className="ujbm-card p-8 text-center">
            <img src={IMG_LOGO_CIRCULAR} alt="" className="mx-auto h-14 w-14" style={{ objectFit: "contain" }} />
            <div
              className="mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "color-mix(in oklab, var(--ujbm-blue) 12%, white)" }}
            >
              <CheckCircle2 className="h-10 w-10" style={{ color: "var(--ujbm-blue)" }} />
            </div>
            <h2 className="mt-5 text-xl sm:text-2xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              Ya registraste tu respuesta.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-foreground leading-relaxed">
              Gracias por participar en esta encuesta. Tu opinión contribuye a la mejora continua
              de la calidad académica en la Facultad de Ciencias de la Comunicación Social.
            </p>
            <Link
              to="/"
              className="mt-7 inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-medium border border-border hover:bg-secondary transition"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
