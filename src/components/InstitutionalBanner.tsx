import { IMG_FACHADA } from "@/lib/constants";

export function InstitutionalBanner() {
  return (
    <>
      <section className="relative w-full overflow-hidden" style={{ height: "clamp(160px, 28vw, 280px)" }}>
        <img
          src={IMG_FACHADA}
          alt="Fachada de la Universidad Jaime Bausate y Meza"
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", objectPosition: "center center" }}
        />
        <div className="absolute inset-0 ujbm-banner-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl h-full px-4 sm:px-6 flex flex-col justify-center text-white">
          <p className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: "var(--ujbm-gold)" }}>
            Encuesta de Evaluación Docente
          </p>
          <h1 className="mt-2 text-xl sm:text-3xl md:text-4xl font-semibold text-white">
            Facultad de Ciencias de la Comunicación Social
          </h1>
        </div>
      </section>
      <div className="ujbm-gold-line" />
    </>
  );
}
