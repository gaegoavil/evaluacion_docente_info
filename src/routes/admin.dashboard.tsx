import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, Download, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Panel administrador — UJBM" }] }),
  component: AdminDashboardPage,
});

type Row = {
  id: string;
  created_at: string;
  ciclo: string;
  docente_otro: string | null;
  periodos: { nombre: string } | null;
  escuelas: { nombre: string } | null;
  modalidades: { nombre: string } | null;
  cursos: { nombre: string } | null;
  docentes: { nombres: string } | null;
  respuestas: { valor: number; preguntas: { numero: number; seccion: string } | null }[];
  comentarios: { aspecto_positivo: string | null; aspecto_mejora: string | null; sugerencia_adicional: string | null }[];
};

type CatalogCounts = {
  periodos: number;
  escuelas: number;
  modalidades: number;
  cursos: number;
  docentes: number;
  docente_escuela: number;
  preguntas: number;
  encuestas: number;
  respuestas: number;
  comentarios: number;
};

const EMPTY_COUNTS: CatalogCounts = {
  periodos: 0,
  escuelas: 0,
  modalidades: 0,
  cursos: 0,
  docentes: 0,
  docente_escuela: 0,
  preguntas: 0,
  encuestas: 0,
  respuestas: 0,
  comentarios: 0,
};

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogCounts, setCatalogCounts] = useState<CatalogCounts>(EMPTY_COUNTS);
  const [catalogError, setCatalogError] = useState("");

  // Filtros
  const [fEscuela, setFEscuela] = useState("");
  const [fModalidad, setFModalidad] = useState("");
  const [fCiclo, setFCiclo] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user?.email) {
        navigate({ to: "/admin/login" });
        return;
      }

      const { data: admin, error } = await supabase
        .from("admins")
        .select("email")
        .eq("email", session.user.email.toLowerCase())
        .maybeSingle();

      if (error || !admin) {
        await supabase.auth.signOut();
        navigate({ to: "/admin/login" });
        return;
      }

      setChecking(false);
    })();
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      setCatalogError("");

      try {
        const counts = await loadCatalogCounts();
        setCatalogCounts(counts);
      } catch (e) {
        setCatalogError("No se pudo verificar el estado de catálogos. Revisa que todas las tablas existan en Supabase.");
        // eslint-disable-next-line no-console
        console.error(e);
      }

      const { data, error } = await supabase
        .from("encuestas")
        .select(`
          id, created_at, ciclo, docente_otro,
          periodos:periodo_id(nombre),
          escuelas:escuela_id(nombre),
          modalidades:modalidad_id(nombre),
          cursos:curso_id(nombre),
          docentes:docente_id(nombres),
          respuestas(valor, preguntas:pregunta_id(numero, seccion)),
          comentarios(aspecto_positivo, aspecto_mejora, sugerencia_adicional)
        `)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) {
        // eslint-disable-next-line no-console
        console.error(error);
        setRows([]);
      } else {
        setRows((data as unknown as Row[]) ?? []);
      }

      setLoading(false);
    })();
  }, [checking]);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (!fEscuela || r.escuelas?.nombre === fEscuela) &&
      (!fModalidad || r.modalidades?.nombre === fModalidad) &&
      (!fCiclo || r.ciclo === fCiclo)
    );
  }, [rows, fEscuela, fModalidad, fCiclo]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const allVals = filtered.flatMap((r) => r.respuestas.map((x) => x.valor));
    const promedio = allVals.length ? allVals.reduce((a, b) => a + b, 0) / allVals.length : 0;
    const docentes = new Set<string>();
    const cursos = new Set<string>();
    filtered.forEach((r) => {
      docentes.add(r.docentes?.nombres || r.docente_otro || "—");
      cursos.add(r.cursos?.nombre || "—");
    });

    const byDoc: Record<string, number[]> = {};
    filtered.forEach((r) => {
      const n = r.docentes?.nombres || r.docente_otro || "—";
      byDoc[n] = byDoc[n] || [];
      r.respuestas.forEach((x) => byDoc[n].push(x.valor));
    });

    const promDoc = Object.entries(byDoc).map(([nombre, v]) => ({
      nombre,
      promedio: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0,
      n: v.length,
    })).sort((a, b) => b.promedio - a.promedio);

    return {
      total,
      promedio,
      totalDocentes: docentes.size,
      totalCursos: cursos.size,
      promDoc,
    };
  }, [filtered]);

  const escuelasOpts = Array.from(new Set(rows.map((r) => r.escuelas?.nombre).filter(Boolean))) as string[];
  const modOpts = Array.from(new Set(rows.map((r) => r.modalidades?.nombre).filter(Boolean))) as string[];
  const cicloOpts = Array.from(new Set(rows.map((r) => r.ciclo).filter(Boolean))).sort();

  const faltanCatalogos =
    catalogCounts.periodos === 0 ||
    catalogCounts.escuelas === 0 ||
    catalogCounts.modalidades === 0 ||
    catalogCounts.cursos === 0 ||
    catalogCounts.docentes === 0 ||
    catalogCounts.docente_escuela === 0 ||
    catalogCounts.preguntas === 0;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  function exportCSV() {
    const headers = ["Fecha","Periodo","Escuela","Ciclo","Curso","Docente","Modalidad","Promedio"];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      const vals = r.respuestas.map((x) => x.valor);
      const prom = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "";
      const docente = r.docentes?.nombres || r.docente_otro || "";
      const row = [
        new Date(r.created_at).toISOString(),
        r.periodos?.nombre ?? "",
        r.escuelas?.nombre ?? "",
        r.ciclo,
        r.cursos?.nombre ?? "",
        docente,
        r.modalidades?.nombre ?? "",
        prom,
      ].map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",");
      lines.push(row);
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `respuestas-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  }

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Verificando sesión...</div>;
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <InstitutionalHeader />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>Panel administrador</h2>
            <p className="text-sm text-muted-foreground">Encuesta de Evaluación Docente — Facultad de Ciencias de la Comunicación Social</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border bg-white text-sm font-medium hover:bg-secondary">
              <Download className="h-4 w-4" /> Exportar CSV
            </button>
            <button onClick={handleLogout} className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-white text-sm font-medium" style={{ background: "var(--ujbm-blue)" }}>
              <LogOut className="h-4 w-4" /> Salir
            </button>
          </div>
        </div>

        <div
          className="ujbm-card p-4 flex items-start gap-3"
          style={{ borderTopColor: faltanCatalogos ? "#d97706" : "#15803d" }}
        >
          {faltanCatalogos ? (
            <AlertTriangle className="h-5 w-5 mt-0.5 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 mt-0.5 text-green-700" />
          )}
          <div>
            <p className="font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              {faltanCatalogos ? "Faltan cursos o docentes por cargar." : "Catálogos listos."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {faltanCatalogos
                ? "La encuesta no estará completa hasta registrar estos catálogos."
                : "La encuesta está preparada para recibir respuestas."}
            </p>
            {catalogError && <p className="text-sm mt-2" style={{ color: "var(--ujbm-red)" }}>{catalogError}</p>}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Total de respuestas" value={stats.total.toString()} />
          <Kpi label="Promedio general" value={stats.promedio ? stats.promedio.toFixed(2) : "—"} />
          <Kpi label="Docentes evaluados" value={stats.totalDocentes.toString()} />
          <Kpi label="Cursos evaluados" value={stats.totalCursos.toString()} />
        </div>

        {/* Estado de catálogos */}
        <section className="ujbm-card p-5">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--ujbm-blue-dark)" }}>Estado de catálogos</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <CatalogKpi label="Periodos cargados" value={catalogCounts.periodos} required />
            <CatalogKpi label="Escuelas cargadas" value={catalogCounts.escuelas} required />
            <CatalogKpi label="Modalidades cargadas" value={catalogCounts.modalidades} required />
            <CatalogKpi label="Cursos cargados" value={catalogCounts.cursos} required />
            <CatalogKpi label="Docentes cargados" value={catalogCounts.docentes} required />
            <CatalogKpi label="Relaciones docente-escuela" value={catalogCounts.docente_escuela} required />
            <CatalogKpi label="Preguntas cargadas" value={catalogCounts.preguntas} required />
            <CatalogKpi label="Encuestas registradas" value={catalogCounts.encuestas} />
            <CatalogKpi label="Respuestas guardadas" value={catalogCounts.respuestas} />
            <CatalogKpi label="Comentarios guardados" value={catalogCounts.comentarios} />
          </div>
        </section>

        {/* Filtros */}
        <div className="ujbm-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Sel label="Escuela" value={fEscuela} onChange={setFEscuela} options={escuelasOpts} />
          <Sel label="Modalidad" value={fModalidad} onChange={setFModalidad} options={modOpts} />
          <Sel label="Ciclo" value={fCiclo} onChange={setFCiclo} options={cicloOpts} />
        </div>

        {/* Promedio por docente */}
        <section className="ujbm-card p-5">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--ujbm-blue-dark)" }}>Promedio por docente</h3>
          {stats.promDoc.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-3">Docente</th>
                    <th className="py-2 pr-3">Respuestas</th>
                    <th className="py-2">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promDoc.map((d) => (
                    <tr key={d.nombre} className="border-b border-border/60">
                      <td className="py-2 pr-3">{d.nombre}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{d.n}</td>
                      <td className="py-2 font-semibold" style={{ color: "var(--ujbm-blue)" }}>{d.promedio.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tabla de respuestas */}
        <section className="ujbm-card p-5">
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--ujbm-blue-dark)" }}>Respuestas</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay respuestas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Escuela</th>
                    <th className="py-2 pr-3">Ciclo</th>
                    <th className="py-2 pr-3">Curso</th>
                    <th className="py-2 pr-3">Docente</th>
                    <th className="py-2 pr-3">Modalidad</th>
                    <th className="py-2">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((r) => {
                    const vals = r.respuestas.map((x) => x.valor);
                    const prom = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
                    return (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">{r.escuelas?.nombre}</td>
                        <td className="py-2 pr-3">{r.ciclo}</td>
                        <td className="py-2 pr-3">{r.cursos?.nombre}</td>
                        <td className="py-2 pr-3">{r.docentes?.nombres || r.docente_otro}</td>
                        <td className="py-2 pr-3">{r.modalidades?.nombre}</td>
                        <td className="py-2 font-semibold" style={{ color: "var(--ujbm-blue)" }}>{prom.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length > 200 && <p className="text-xs text-muted-foreground mt-3">Mostrando 200 de {filtered.length}. Exporta a CSV para el detalle completo.</p>}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

async function countTable(table: string) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

async function loadCatalogCounts(): Promise<CatalogCounts> {
  const [periodos, escuelas, modalidades, cursos, docentes, docenteEscuela, preguntas, encuestas, respuestas, comentarios] = await Promise.all([
    countTable("periodos"),
    countTable("escuelas"),
    countTable("modalidades"),
    countTable("cursos"),
    countTable("docentes"),
    countTable("docente_escuela"),
    countTable("preguntas"),
    countTable("encuestas"),
    countTable("respuestas"),
    countTable("comentarios"),
  ]);

  return {
    periodos,
    escuelas,
    modalidades,
    cursos,
    docentes,
    docente_escuela: docenteEscuela,
    preguntas,
    encuestas,
    respuestas,
    comentarios,
  };
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="ujbm-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: "var(--ujbm-blue-dark)" }}>{value}</p>
    </div>
  );
}

function CatalogKpi({ label, value, required = false }: { label: string; value: number; required?: boolean }) {
  const ok = !required || value > 0;
  return (
    <div className={`rounded-lg border p-3 bg-white ${ok ? "border-border" : "border-amber-300"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: ok ? "var(--ujbm-blue-dark)" : "#b45309" }}>{value}</p>
      <p className="mt-1 text-[11px] font-medium" style={{ color: ok ? "#15803d" : "#b45309" }}>
        {ok ? "Correcto" : "Pendiente de carga"}
      </p>
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">{label}</span>
      <select className="w-full h-10 px-2 rounded-md border border-border bg-white text-sm" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Todos</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
