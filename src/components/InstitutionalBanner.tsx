import { IMG_FACHADA } from "@/lib/constants";

export function InstitutionalBanner() {
  return (
    <>
      <section
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(220px, 34vw, 360px)" }}
      >
        <img
          src={IMG_FACHADA}
          alt="Fachada de la Universidad Jaime Bausate y Meza"
          className="absolute inset-0 h-full w-full"
          style={{ objectFit: "cover", objectPosition: "center 40%" }}
        />
        <div className="absolute inset-0 ujbm-banner-overlay" />
        <div className="relative z-10 mx-auto max-w-7xl h-full px-4 sm:px-6 flex flex-col justify-end pb-6 sm:pb-8 text-white">
          <p
            className="text-[0.7rem] sm:text-xs font-semibold tracking-[0.25em] uppercase"
            style={{ color: "var(--ujbm-gold)" }}
          >
            Encuesta de Evaluación Docente
          </p>
          <h1 className="mt-2 text-xl sm:text-3xl md:text-4xl font-semibold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
            Facultad de Ciencias Empresariales e Ingeniería
          </h1>
        </div>
      </section>
      <div className="ujbm-gold-line" />
    </>
  );
}
