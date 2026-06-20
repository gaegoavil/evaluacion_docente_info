import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { LogOut, Download } from "lucide-react";

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

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [fEscuela, setFEscuela] = useState("");
  const [fModalidad, setFModalidad] = useState("");
  const [fCiclo, setFCiclo] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/admin/login" });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  useEffect(() => {
    if (checking) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
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
      setRows((data as unknown as Row[]) ?? []);
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

    // por docente
    const byDoc: Record<string, number[]> = {};
    filtered.forEach((r) => {
      const n = r.docentes?.nombres || r.docente_otro || "—";
      byDoc[n] = byDoc[n] || [];
      r.respuestas.forEach((x) => byDoc[n].push(x.valor));
    });
    const promDoc = Object.entries(byDoc).map(([nombre, v]) => ({
      nombre, promedio: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, n: v.length,
    })).sort((a, b) => b.promedio - a.promedio);

    return {
      total, promedio,
      totalDocentes: docentes.size, totalCursos: cursos.size,
      promDoc,
    };
  }, [filtered]);

  const escuelasOpts = Array.from(new Set(rows.map((r) => r.escuelas?.nombre).filter(Boolean))) as string[];
  const modOpts = Array.from(new Set(rows.map((r) => r.modalidades?.nombre).filter(Boolean))) as string[];
  const cicloOpts = Array.from(new Set(rows.map((r) => r.ciclo).filter(Boolean))).sort();

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

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Total de respuestas" value={stats.total.toString()} />
          <Kpi label="Promedio general" value={stats.promedio ? stats.promedio.toFixed(2) : "—"} />
          <Kpi label="Docentes evaluados" value={stats.totalDocentes.toString()} />
          <Kpi label="Cursos evaluados" value={stats.totalCursos.toString()} />
        </div>

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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="ujbm-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-3xl font-bold" style={{ color: "var(--ujbm-blue-dark)" }}>{value}</p>
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
