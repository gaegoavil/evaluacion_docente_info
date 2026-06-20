import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { supabase } from "@/lib/supabase";
import { Download, Eye, LogOut, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  respuestas: {
    valor: number;
    preguntas: {
      numero: number;
      texto: string;
      seccion: string;
      modalidad: string;
    } | null;
  }[];
  comentarios: {
    aspecto_positivo: string | null;
    aspecto_mejora: string | null;
    sugerencia_adicional: string | null;
  }[];
};

const CHART_COLORS = ["#003B7A", "#D71920", "#CDA349", "#0F766E", "#7C3AED"];

const CICLO_ORDER = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

function AdminDashboardPage() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState<Row | null>(null);

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

      const email = session.user.email.toLowerCase();

      const { data: admin, error } = await supabase
        .from("admins")
        .select("email")
        .eq("email", email)
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

      const { data, error } = await supabase
        .from("encuestas")
        .select(`
          id,
          created_at,
          ciclo,
          docente_otro,
          periodos:periodo_id(nombre),
          escuelas:escuela_id(nombre),
          modalidades:modalidad_id(nombre),
          cursos:curso_id(nombre),
          docentes:docente_id(nombres),
          respuestas(
            valor,
            preguntas:pregunta_id(
              numero,
              texto,
              seccion,
              modalidad
            )
          ),
          comentarios(
            aspecto_positivo,
            aspecto_mejora,
            sugerencia_adicional
          )
        `)
        .order("created_at", { ascending: false })
        .limit(2000);

      if (error) {
        console.error("Error cargando dashboard:", error);
        setRows([]);
      } else {
        setRows((data as unknown as Row[]) ?? []);
      }

      setLoading(false);
    })();
  }, [checking]);

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (!fEscuela || r.escuelas?.nombre === fEscuela) &&
        (!fModalidad || r.modalidades?.nombre === fModalidad) &&
        (!fCiclo || r.ciclo === fCiclo)
    );
  }, [rows, fEscuela, fModalidad, fCiclo]);

  const stats = useMemo(() => {
    const total = filtered.length;

    const allVals = filtered.flatMap((r) => r.respuestas.map((x) => x.valor));

    const promedio = allVals.length
      ? allVals.reduce((a, b) => a + b, 0) / allVals.length
      : 0;

    const docentes = new Set<string>();
    const cursos = new Set<string>();

    filtered.forEach((r) => {
      docentes.add(r.docentes?.nombres || r.docente_otro || "—");
      cursos.add(r.cursos?.nombre || "—");
    });

    const byDoc: Record<string, number[]> = {};
    const byCurso: Record<string, number[]> = {};
    const byModalidad: Record<string, number> = {};
    const byCiclo: Record<string, number> = {};
    const distribucion: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const byDimension: Record<string, number[]> = {};

    filtered.forEach((r) => {
      const docente = r.docentes?.nombres || r.docente_otro || "—";
      const curso = r.cursos?.nombre || "—";
      const modalidad = r.modalidades?.nombre || "Sin modalidad";
      const ciclo = r.ciclo || "Sin ciclo";

      byDoc[docente] = byDoc[docente] || [];
      byCurso[curso] = byCurso[curso] || [];
      byModalidad[modalidad] = (byModalidad[modalidad] || 0) + 1;
      byCiclo[ciclo] = (byCiclo[ciclo] || 0) + 1;

      r.respuestas.forEach((resp) => {
        byDoc[docente].push(resp.valor);
        byCurso[curso].push(resp.valor);

        distribucion[resp.valor] = (distribucion[resp.valor] || 0) + 1;

        const seccion = resp.preguntas?.seccion || "Sin sección";
        byDimension[seccion] = byDimension[seccion] || [];
        byDimension[seccion].push(resp.valor);
      });
    });

    const promDoc = Object.entries(byDoc)
      .map(([nombre, valores]) => ({
        nombre,
        promedio: valores.length
          ? valores.reduce((a, b) => a + b, 0) / valores.length
          : 0,
        n: valores.length,
      }))
      .sort((a, b) => b.promedio - a.promedio);

    const promCurso = Object.entries(byCurso)
      .map(([nombre, valores]) => ({
        nombre,
        promedio: valores.length
          ? valores.reduce((a, b) => a + b, 0) / valores.length
          : 0,
        n: valores.length,
      }))
      .sort((a, b) => b.promedio - a.promedio);

    const modalidadChart = Object.entries(byModalidad).map(([name, value]) => ({
      name,
      value,
    }));

    const cicloChart = Object.entries(byCiclo)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => CICLO_ORDER.indexOf(a.name) - CICLO_ORDER.indexOf(b.name));

    const distribucionChart = Object.entries(distribucion).map(([name, value]) => ({
      name: `Valor ${name}`,
      value,
    }));

    const dimensionChart = Object.entries(byDimension).map(([name, valores]) => ({
      name: cleanSectionName(name),
      promedio: valores.length
        ? Number((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2))
        : 0,
    }));

    return {
      total,
      promedio,
      totalDocentes: docentes.size,
      totalCursos: cursos.size,
      promDoc,
      promCurso,
      modalidadChart,
      cicloChart,
      distribucionChart,
      dimensionChart,
    };
  }, [filtered]);

  const escuelasOpts = Array.from(
    new Set(rows.map((r) => r.escuelas?.nombre).filter(Boolean))
  ) as string[];

  const modOpts = Array.from(
    new Set(rows.map((r) => r.modalidades?.nombre).filter(Boolean))
  ) as string[];

  const cicloOpts = Array.from(
    new Set(rows.map((r) => r.ciclo).filter(Boolean))
  ).sort((a, b) => CICLO_ORDER.indexOf(a) - CICLO_ORDER.indexOf(b));

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/admin/login" });
  }

  function exportCSV() {
    const headers = [
      "Fecha",
      "Periodo",
      "Escuela",
      "Ciclo",
      "Curso",
      "Docente",
      "Modalidad",
      "Promedio",
    ];

    const lines = [headers.join(",")];

    filtered.forEach((r) => {
      const vals = r.respuestas.map((x) => x.valor);
      const prom = vals.length
        ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
        : "";

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
      ]
        .map((c) => `"${String(c).replaceAll('"', '""')}"`)
        .join(",");

      lines.push(row);
    });

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `respuestas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <InstitutionalHeader />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--ujbm-blue-dark)" }}
            >
              Panel administrador
            </h2>
            <p className="text-sm text-muted-foreground">
              Encuesta de Evaluación Docente — Facultad de Ciencias de la Comunicación Social
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-border bg-white text-sm font-medium hover:bg-secondary"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-md text-white text-sm font-medium"
              style={{ background: "var(--ujbm-blue)" }}
            >
              <LogOut className="h-4 w-4" />
              Salir
            </button>
          </div>
        </div>

        <div className="ujbm-card p-4 border-l-4" style={{ borderLeftColor: "#15803d" }}>
          <p className="text-sm font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
            Catálogos listos.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            La encuesta está preparada para recibir respuestas.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Total de respuestas" value={stats.total.toString()} />
          <Kpi
            label="Promedio general"
            value={stats.promedio ? stats.promedio.toFixed(2) : "—"}
          />
          <Kpi label="Docentes evaluados" value={stats.totalDocentes.toString()} />
          <Kpi label="Cursos evaluados" value={stats.totalCursos.toString()} />
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Respuestas por modalidad">
            {stats.modalidadChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={stats.modalidadChart}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={85}
                    label
                  >
                    {stats.modalidadChart.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Respuestas por ciclo">
            {stats.cicloChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.cicloChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#003B7A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Distribución de respuestas 1 al 5">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={stats.distribucionChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#D71920" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Promedio por dimensión">
            {stats.dimensionChart.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.dimensionChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="promedio" fill="#CDA349" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Filtros */}
        <div className="ujbm-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Sel label="Escuela" value={fEscuela} onChange={setFEscuela} options={escuelasOpts} />
          <Sel
            label="Modalidad"
            value={fModalidad}
            onChange={setFModalidad}
            options={modOpts}
          />
          <Sel label="Ciclo" value={fCiclo} onChange={setFCiclo} options={cicloOpts} />
        </div>

        {/* Promedio por docente */}
        <section className="ujbm-card p-5">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            Promedio por docente
          </h3>

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
                      <td
                        className="py-2 font-semibold"
                        style={{ color: "var(--ujbm-blue)" }}
                      >
                        {d.promedio.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Promedio por curso */}
        <section className="ujbm-card p-5">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            Promedio por curso
          </h3>

          {stats.promCurso.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="py-2 pr-3">Curso</th>
                    <th className="py-2 pr-3">Respuestas</th>
                    <th className="py-2">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.promCurso.map((d) => (
                    <tr key={d.nombre} className="border-b border-border/60">
                      <td className="py-2 pr-3">{d.nombre}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{d.n}</td>
                      <td
                        className="py-2 font-semibold"
                        style={{ color: "var(--ujbm-blue)" }}
                      >
                        {d.promedio.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Tabla de respuestas */}
        <section className="ujbm-card p-5">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            Respuestas
          </h3>

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
                    <th className="py-2 pr-3">Promedio</th>
                    <th className="py-2">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 200).map((r) => {
                    const vals = r.respuestas.map((x) => x.valor);
                    const prom = vals.length
                      ? vals.reduce((a, b) => a + b, 0) / vals.length
                      : 0;

                    return (
                      <tr key={r.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 text-muted-foreground">
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2 pr-3">{r.escuelas?.nombre}</td>
                        <td className="py-2 pr-3">{r.ciclo}</td>
                        <td className="py-2 pr-3">{r.cursos?.nombre}</td>
                        <td className="py-2 pr-3">
                          {r.docentes?.nombres || r.docente_otro}
                        </td>
                        <td className="py-2 pr-3">{r.modalidades?.nombre}</td>
                        <td
                          className="py-2 pr-3 font-semibold"
                          style={{ color: "var(--ujbm-blue)" }}
                        >
                          {prom.toFixed(2)}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => setSelectedRow(r)}
                            className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length > 200 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Mostrando 200 de {filtered.length}. Exporta a CSV para el detalle completo.
                </p>
              )}
            </div>
          )}
        </section>

        {selectedRow && (
          <DetalleRespuestaModal row={selectedRow} onClose={() => setSelectedRow(null)} />
        )}
      </main>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="ujbm-card p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p
        className="mt-2 text-3xl font-bold"
        style={{ color: "var(--ujbm-blue-dark)" }}
      >
        {value}
      </p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="ujbm-card p-5">
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: "var(--ujbm-blue-dark)" }}
      >
        {title}
      </h3>
      {children}
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">
      Sin datos para mostrar.
    </div>
  );
}

function Sel({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
      </span>
      <select
        className="w-full h-10 px-2 rounded-md border border-border bg-white text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetalleRespuestaModal({
  row,
  onClose,
}: {
  row: Row;
  onClose: () => void;
}) {
  const respuestasOrdenadas = [...row.respuestas].sort((a, b) => {
    const na = a.preguntas?.numero ?? 0;
    const nb = b.preguntas?.numero ?? 0;
    return na - nb;
  });

  const porSeccion = respuestasOrdenadas.reduce<Record<string, typeof respuestasOrdenadas>>(
    (acc, resp) => {
      const seccion = resp.preguntas?.seccion || "Sin sección";
      acc[seccion] = acc[seccion] || [];
      acc[seccion].push(resp);
      return acc;
    },
    {}
  );

  const comentario = row.comentarios?.[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 px-4 py-6 overflow-y-auto">
      <div className="mx-auto max-w-5xl ujbm-card p-5 sm:p-7 bg-white">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2
              className="text-2xl font-semibold"
              style={{ color: "var(--ujbm-blue-dark)" }}
            >
              Detalle completo de la encuesta
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Respuestas marcadas por el estudiante desde el inicio hasta el final.
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-md border border-border p-2 hover:bg-secondary"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <section className="mt-5">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            1. Datos generales
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <DetailItem label="Fecha" value={new Date(row.created_at).toLocaleString()} />
            <DetailItem label="Periodo" value={row.periodos?.nombre || "—"} />
            <DetailItem label="Escuela" value={row.escuelas?.nombre || "—"} />
            <DetailItem label="Ciclo" value={row.ciclo || "—"} />
            <DetailItem label="Curso" value={row.cursos?.nombre || "—"} />
            <DetailItem
              label="Docente"
              value={row.docentes?.nombres || row.docente_otro || "—"}
            />
            <DetailItem label="Modalidad" value={row.modalidades?.nombre || "—"} />
          </div>
        </section>

        <section className="mt-7">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            2. Encuesta docente
          </h3>

          <div className="space-y-6">
            {Object.entries(porSeccion).map(([seccion, respuestas]) => (
              <div key={seccion}>
                <h4
                  className="font-semibold border-l-4 pl-3 mb-3"
                  style={{
                    borderColor: "var(--ujbm-red)",
                    color: "var(--ujbm-blue-dark)",
                  }}
                >
                  {seccion}
                </h4>

                <div className="space-y-3">
                  {respuestas.map((resp) => (
                    <div
                      key={`${resp.preguntas?.numero}-${resp.preguntas?.texto}`}
                      className="rounded-lg border border-border bg-white p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                          style={{ background: "var(--ujbm-blue)" }}
                        >
                          {resp.preguntas?.numero}
                        </span>

                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {resp.preguntas?.texto || "Pregunta no encontrada"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((v) => (
                              <span
                                key={v}
                                className={`inline-flex min-w-10 items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold ${
                                  resp.valor === v ? "text-white" : "bg-white text-muted-foreground"
                                }`}
                                style={{
                                  background:
                                    resp.valor === v ? "var(--ujbm-blue)" : undefined,
                                  borderColor:
                                    resp.valor === v ? "var(--ujbm-blue)" : "var(--border)",
                                }}
                              >
                                {v}
                              </span>
                            ))}
                          </div>

                          <p className="mt-2 text-xs text-muted-foreground">
                            Marcó: <strong>{resp.valor}</strong> —{" "}
                            {getValorLabel(resp.valor)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-7">
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: "var(--ujbm-blue-dark)" }}
          >
            VI. COMENTARIOS Y SUGERENCIAS
          </h3>

          <div className="space-y-3">
            <CommentBox
              label="¿Qué aspectos positivos destacarías del desempeño del docente?"
              value={comentario?.aspecto_positivo}
            />
            <CommentBox
              label="¿Qué aspectos consideras que el docente podría mejorar?"
              value={comentario?.aspecto_mejora}
            />
            <CommentBox
              label="Comentarios o sugerencias adicionales para fortalecer el desarrollo del curso."
              value={comentario?.sugerencia_adicional}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function CommentBox({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
        {value?.trim() ? value : "Sin comentario."}
      </p>
    </div>
  );
}

function getValorLabel(valor: number) {
  if (valor === 1) return "Totalmente en desacuerdo";
  if (valor === 2) return "En desacuerdo";
  if (valor === 3) return "Ni de acuerdo ni en desacuerdo";
  if (valor === 4) return "De acuerdo";
  if (valor === 5) return "Totalmente de acuerdo";
  return "";
}

function cleanSectionName(name: string) {
  return name
    .replace("I. ", "")
    .replace("II. ", "")
    .replace("III. ", "")
    .replace("IV. ", "")
    .replace("V. ", "")
    .replace("VI. ", "")
    .replace("PLANIFICACIÓN Y DESARROLLO DEL CURSO", "Planificación")
    .replace("DOMINIO Y ACTUALIZACIÓN PROFESIONAL", "Dominio")
    .replace("METODOLOGÍA SEGÚN MODALIDAD", "Metodología")
    .replace("EVALUACIÓN Y ACOMPAÑAMIENTO", "Evaluación")
    .replace("COMPETENCIAS PROFESIONALES", "Competencias");
}
