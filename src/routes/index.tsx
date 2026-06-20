import { createFileRoute, Link } from "@tanstack/react-router";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalBanner } from "@/components/InstitutionalBanner";
import { IMG_LOGO_CIRCULAR, IMG_FACHADA_VERTICAL } from "@/lib/constants";
import { ShieldCheck, Clock, UserX } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Encuesta de Evaluación Docente — UJBM" },
      { name: "description", content: "Encuesta de Evaluación Docente de la Facultad de Ciencias de la Comunicación Social — Universidad Jaime Bausate y Meza." },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <InstitutionalBanner />
      <main
        className="flex-1 ujbm-bg-fade px-4 py-10 sm:py-14"
        style={{ ["--bg-img" as never]: `url(${IMG_FACHADA_VERTICAL})` }}
      >
        <div className="mx-auto max-w-2xl">
          <div className="ujbm-card p-6 sm:p-10 text-center">
            <img
              src={IMG_LOGO_CIRCULAR}
              alt="Logo UJBM"
              className="mx-auto h-16 w-16 sm:h-20 sm:w-20"
              style={{ objectFit: "contain" }}
            />
            <p className="mt-5 text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--ujbm-red)" }}>
              Periodo académico 2026 - I
            </p>
            <h2 className="mt-3 text-2xl sm:text-3xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              Encuesta de Evaluación Docente
            </h2>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Facultad de Ciencias de la Comunicación Social
            </p>

            <div className="mt-6 space-y-4 text-left text-sm sm:text-[15px] text-foreground leading-relaxed">
              <p>
                La Facultad de Ciencias de la Comunicación Social de la UJBM te invita a
                participar en esta encuesta de evaluación docente.
              </p>
              <p>
                Tu opinión es importante para mejorar la calidad académica y fortalecer el
                proceso de enseñanza-aprendizaje. Te invitamos a responder esta encuesta de
                manera objetiva, seleccionando en cada afirmación la alternativa que mejor
                refleje tu percepción sobre el desarrollo del curso.
              </p>
              <p>
                La encuesta es confidencial y sus resultados serán utilizados únicamente con
                fines de mejora académica e institucional.
              </p>
              <p className="font-medium">Muchas gracias por tu participación.</p>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
              <Indicator icon={<ShieldCheck className="h-4 w-4" />} text="100% anónima" />
              <Indicator icon={<Clock className="h-4 w-4" />} text="5–7 minutos" />
              <Indicator icon={<UserX className="h-4 w-4" />} text="Sin registro" />
            </div>

            <Link
              to="/encuesta"
              className="mt-8 inline-flex h-12 px-8 items-center justify-center rounded-md font-semibold text-white shadow-md hover:opacity-95 transition"
              style={{ background: "var(--ujbm-blue)" }}
            >
              Iniciar encuesta
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function Indicator({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border bg-white/70 py-2 px-1">
      <span style={{ color: "var(--ujbm-blue)" }}>{icon}</span>
      <span className="text-muted-foreground font-medium">{text}</span>
    </div>
  );
}
