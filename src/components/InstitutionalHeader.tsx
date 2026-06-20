import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { IMG_LOGO_HORIZONTAL } from "@/lib/constants";

export function InstitutionalHeader() {
  return (
    <header className="w-full bg-white border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center min-w-0">
          <img
            src={IMG_LOGO_HORIZONTAL}
            alt="Universidad Jaime Bausate y Meza"
            className="h-10 sm:h-12 w-auto object-contain"
            style={{ objectFit: "contain" }}
          />
        </Link>
        <Link
          to="/admin/login"
          aria-label="Acceso administrador"
          className="group inline-flex h-9 w-9 items-center justify-center rounded-full text-[color:var(--ujbm-blue)] opacity-40 hover:opacity-100 transition-opacity"
          title="Acceso administrador"
        >
          <ShieldCheck className="h-[22px] w-[22px]" />
        </Link>
      </div>
    </header>
  );
}
