import { ESCALA } from "@/lib/constants";

export function RatingScale({
  numero,
  texto,
  value,
  onChange,
}: {
  numero: number;
  texto: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ujbm-card p-4 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <span
          aria-hidden
          className="flex-shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
          style={{ background: "var(--ujbm-blue)" }}
        >
          {numero}
        </span>
        <p className="text-sm sm:text-base text-foreground leading-relaxed">{texto}</p>
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2 sm:flex sm:gap-2 sm:justify-start sm:ml-11">
        {ESCALA.map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className="scale-btn"
            data-selected={value === opt.v}
            title={opt.label}
          >
            {opt.v}
          </button>
        ))}
      </div>
    </div>
  );
}
