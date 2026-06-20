import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { InstitutionalHeader } from "@/components/InstitutionalHeader";
import { InstitutionalBanner } from "@/components/InstitutionalBanner";
import { RatingScale } from "@/components/RatingScale";
import {
  CICLOS,
  ESCALA,
  IMG_FACHADA_VERTICAL,
  SECCION_I,
  SECCION_II,
  SECCION_IV,
  SECCION_V,
  getPreguntasModalidad,
  type Modalidad,
  type Pregunta,
} from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/encuesta")({
  head: () => ({
    meta: [{ title: "Encuesta de Evaluación Docente — UJBM" }],
  }),
  component: EncuestaPage,
});

type Catalogo = { id: string; nombre: string };

function EncuestaPage() {
  const navigate = useNavigate();

  // Catálogos
  const [periodos, setPeriodos] = useState<Catalogo[]>([]);
  const [escuelas, setEscuelas] = useState<Catalogo[]>([]);
  const [modalidades, setModalidades] = useState<Catalogo[]>([]);
  const [cursos, setCursos] = useState<Catalogo[]>([]);
  const [docentes, setDocentes] = useState<Catalogo[]>([]);
  const [loadError, setLoadError] = useState<string>("");

  // Form
  const [periodoId, setPeriodoId] = useState("");
  const [escuelaId, setEscuelaId] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [docenteOtro, setDocenteOtro] = useState("");
  const [modalidadId, setModalidadId] = useState("");
  const [correo, setCorreo] = useState("");
  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [coment1, setComent1] = useState("");
  const [coment2, setComent2] = useState("");
  const [coment3, setComent3] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Carga inicial de catálogos
  useEffect(() => {
    (async () => {
      try {
        const [{ data: per }, { data: esc }, { data: mod }] = await Promise.all([
          supabase.from("periodos").select("id, nombre").eq("activo", true).order("nombre"),
          supabase.from("escuelas").select("id, nombre").order("nombre"),
          supabase.from("modalidades").select("id, nombre").order("nombre"),
        ]);
        setPeriodos(per ?? []);
        setEscuelas(esc ?? []);
        setModalidades(mod ?? []);
        const activo = (per ?? []).find((p) => p.nombre === "2026-I") ?? (per ?? [])[0];
        if (activo) setPeriodoId(activo.id);
      } catch (e: unknown) {
        setLoadError("No se pudieron cargar los catálogos desde Supabase. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, y que las tablas existan.");
        // eslint-disable-next-line no-console
        console.error(e);
      }
    })();
  }, []);

  // Cursos según escuela + ciclo
  useEffect(() => {
    setCursoId("");
    setCursos([]);
    if (!escuelaId || !ciclo) return;
    (async () => {
      const { data } = await supabase
        .from("cursos")
        .select("id, nombre")
        .eq("escuela_id", escuelaId)
        .eq("ciclo", ciclo)
        .order("nombre");
      setCursos(data ?? []);
    })();
  }, [escuelaId, ciclo]);

  // Docentes según escuela
  useEffect(() => {
    setDocenteId("");
    setDocenteOtro("");
    setDocentes([]);
    if (!escuelaId) return;
    (async () => {
      const { data } = await supabase
        .from("docente_escuela")
        .select("docentes:docente_id(id, nombres)")
        .eq("escuela_id", escuelaId);
      const list = (data ?? [])
        .map((r: { docentes: { id: string; nombres: string } | null }) => r.docentes)
        .filter((d): d is { id: string; nombres: string } => !!d)
        .map((d) => ({ id: d.id, nombres: d.nombres }))
        .sort((a, b) => a.nombres.localeCompare(b.nombres));
      setDocentes(list.map((d) => ({ id: d.id, nombre: d.nombres })));
    })();
  }, [escuelaId]);

  const modalidadNombre = useMemo<Modalidad | "">(() => {
    const m = modalidades.find((m) => m.id === modalidadId);
    if (!m) return "";
    if (m.nombre === "Presencial" || m.nombre === "Semipresencial" || m.nombre === "Distancia") return m.nombre;
    return "";
  }, [modalidadId, modalidades]);

  const preguntasModalidad = getPreguntasModalidad(modalidadNombre);
  const todasPreguntas: Pregunta[] = [
    ...SECCION_I.preguntas,
    ...SECCION_II.preguntas,
    ...preguntasModalidad,
    ...SECCION_IV.preguntas,
    ...SECCION_V.preguntas,
  ];

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
  const formOk =
    !!periodoId &&
    !!escuelaId &&
    !!ciclo &&
    !!cursoId &&
    !!docenteId &&
    (docenteId !== "__otros__" || docenteOtro.trim().length > 1) &&
    !!modalidadId &&
    emailOk &&
    todasPreguntas.length > 0 &&
    todasPreguntas.every((p) => respuestas[p.numero] != null);

  async function handleSubmit() {
    if (!formOk || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const correoNorm = correo.trim().toLowerCase();
      const isOtros = docenteId === "__otros__";
      const docenteRealId = isOtros ? null : docenteId;
      const docenteOtroVal = isOtros ? docenteOtro.trim() : null;

      // Validación previa de duplicado
      let dupQuery = supabase
        .from("encuestas")
        .select("id", { head: true, count: "exact" })
        .eq("periodo_id", periodoId)
        .eq("escuela_id", escuelaId)
        .eq("ciclo", ciclo)
        .eq("curso_id", cursoId)
        .eq("correo_normalizado", correoNorm);
      dupQuery = isOtros
        ? dupQuery.is("docente_id", null).eq("docente_otro", docenteOtroVal!)
        : dupQuery.eq("docente_id", docenteRealId!);
      const { count } = await dupQuery;
      if ((count ?? 0) > 0) {
        navigate({ to: "/gracias" });
        return;
      }

      // Insert encuesta
      const { data: enc, error: encErr } = await supabase
        .from("encuestas")
        .insert({
          periodo_id: periodoId,
          escuela_id: escuelaId,
          modalidad_id: modalidadId,
          ciclo,
          curso_id: cursoId,
          docente_id: docenteRealId,
          docente_otro: docenteOtroVal,
          correo: correo.trim(),
          correo_normalizado: correoNorm,
        })
        .select("id")
        .single();

      if (encErr || !enc) {
        // 23505 = unique violation -> ya respondió
        if (encErr && (encErr.code === "23505" || /duplicate|unique/i.test(encErr.message))) {
          navigate({ to: "/gracias" });
          return;
        }
        throw encErr ?? new Error("No se pudo registrar la encuesta.");
      }

      // Insert respuestas (resolvemos pregunta_id por (numero, modalidad))
      const numeros = todasPreguntas.map((p) => p.numero);
      const { data: pregs } = await supabase
        .from("preguntas")
        .select("id, numero, modalidad")
        .in("numero", numeros);
      const map = new Map<string, string>();
      (pregs ?? []).forEach((p: { id: string; numero: number; modalidad: string }) => {
        map.set(`${p.numero}|${p.modalidad}`, p.id);
      });
      const modKey = modalidadNombre.toLowerCase();
      const filas = todasPreguntas
        .map((p) => {
          const isModal = p.numero >= 9 && p.numero <= 12;
          const key = isModal ? `${p.numero}|${modKey}` : `${p.numero}|general`;
          const pid = map.get(key);
          return pid ? { encuesta_id: enc.id, pregunta_id: pid, valor: respuestas[p.numero] } : null;
        })
        .filter((r): r is { encuesta_id: string; pregunta_id: string; valor: number } => !!r);

      if (filas.length > 0) {
        const { error: rErr } = await supabase.from("respuestas").insert(filas);
        if (rErr) throw rErr;
      }

      // Comentarios (opcionales)
      if (coment1.trim() || coment2.trim() || coment3.trim()) {
        await supabase.from("comentarios").insert({
          encuesta_id: enc.id,
          aspecto_positivo: coment1.trim() || null,
          aspecto_mejora: coment2.trim() || null,
          sugerencia_adicional: coment3.trim() || null,
        });
      }

      navigate({ to: "/gracias" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ocurrió un error al enviar la encuesta.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <InstitutionalHeader />
      <InstitutionalBanner />
      <main
        className="flex-1 ujbm-bg-fade px-4 py-8 sm:py-12"
        style={{ ["--bg-img" as never]: `url(${IMG_FACHADA_VERTICAL})` }}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              Encuesta de Evaluación Docente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Completa todos los campos marcados. Tus respuestas son anónimas.
            </p>
          </header>

          {loadError && (
            <div className="ujbm-card p-4 text-sm" style={{ borderTopColor: "var(--ujbm-red)" }}>
              <p className="font-semibold" style={{ color: "var(--ujbm-red)" }}>Aviso</p>
              <p className="text-muted-foreground mt-1">{loadError}</p>
            </div>
          )}

          {/* Sección 1 - Datos generales */}
          <section className="ujbm-card p-5 sm:p-6">
            <h3 className="text-lg font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>1. Datos generales</h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Periodo académico *">
                <Select value={periodoId} onChange={setPeriodoId} placeholder="Selecciona el periodo">
                  {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Escuela profesional *">
                <Select value={escuelaId} onChange={(v) => { setEscuelaId(v); setCiclo(""); }} placeholder="Selecciona la escuela">
                  {escuelas.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Ciclo académico *">
                <Select value={ciclo} onChange={setCiclo} placeholder="Selecciona el ciclo">
                  {CICLOS.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Nombre del curso *" hint="Selecciona primero la escuela y el ciclo.">
                <Select
                  value={cursoId}
                  onChange={setCursoId}
                  placeholder="Selecciona el curso"
                  disabled={!escuelaId || !ciclo}
                >
                  {cursos.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Nombre del docente *">
                <Select value={docenteId} onChange={setDocenteId} placeholder="Selecciona el docente" disabled={!escuelaId}>
                  {docentes.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  <option value="__otros__">Otros</option>
                </Select>
              </Field>
              {docenteId === "__otros__" && (
                <Field label="Especifica el nombre del docente *">
                  <input
                    type="text"
                    className="ujbm-input"
                    value={docenteOtro}
                    onChange={(e) => setDocenteOtro(e.target.value)}
                    placeholder="Nombre completo del docente"
                  />
                </Field>
              )}
              <Field label="Modalidad de estudio *">
                <Select value={modalidadId} onChange={setModalidadId} placeholder="Selecciona la modalidad">
                  {modalidades.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </Select>
              </Field>
              <Field label="Correo electrónico *" hint="El correo será utilizado únicamente para validar que no exista una respuesta duplicada.">
                <input
                  type="email"
                  className="ujbm-input"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="Ingresa tu correo electrónico"
                />
              </Field>
            </div>
          </section>

          {/* Sección 2 - Encuesta docente */}
          <section className="ujbm-card p-5 sm:p-6">
            <h3 className="text-lg font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>2. Encuesta docente</h3>
            <p className="mt-2 text-sm font-medium text-foreground">Escala de valoración</p>
            <ul className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs text-muted-foreground">
              {ESCALA.map((e) => (
                <li key={e.v} className="rounded-md border border-border bg-secondary/50 px-2 py-1.5">
                  <span className="font-bold" style={{ color: "var(--ujbm-blue)" }}>{e.v}</span>{" "}
                  {e.label}
                </li>
              ))}
            </ul>
          </section>

          <PreguntasSeccion seccion={SECCION_I} respuestas={respuestas} setRespuestas={setRespuestas} />
          <PreguntasSeccion seccion={SECCION_II} respuestas={respuestas} setRespuestas={setRespuestas} />

          {/* Sección III modalidad */}
          <section className="ujbm-card p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              III. METODOLOGÍA SEGÚN MODALIDAD
            </h3>
            {!modalidadNombre ? (
              <div className="mt-4">
                <p className="text-sm text-foreground">Selecciona una modalidad de estudio para ver estas preguntas.</p>
                <div className="mt-3 rounded-md border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Las preguntas de esta dimensión aparecerán cuando elijas la modalidad.
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm font-medium" style={{ color: "var(--ujbm-red)" }}>
                  Modalidad seleccionada: {modalidadNombre}
                </p>
                <div className="mt-4 space-y-3">
                  {preguntasModalidad.map((p) => (
                    <RatingScale
                      key={p.numero}
                      numero={p.numero}
                      texto={p.texto}
                      value={respuestas[p.numero]}
                      onChange={(v) => setRespuestas((r) => ({ ...r, [p.numero]: v }))}
                    />
                  ))}
                </div>
              </>
            )}
          </section>

          <PreguntasSeccion seccion={SECCION_IV} respuestas={respuestas} setRespuestas={setRespuestas} />
          <PreguntasSeccion seccion={SECCION_V} respuestas={respuestas} setRespuestas={setRespuestas} />

          {/* Sección VI - Comentarios */}
          <section className="ujbm-card p-5 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
              VI. COMENTARIOS Y SUGERENCIAS
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">Opcionales</p>
            <div className="mt-4 space-y-4">
              <Field label="¿Qué aspectos positivos destacarías del desempeño del docente?">
                <textarea className="ujbm-input min-h-[90px]" placeholder="Escribe aquí (opcional)" value={coment1} onChange={(e) => setComent1(e.target.value)} />
              </Field>
              <Field label="¿Qué aspectos consideras que el docente podría mejorar?">
                <textarea className="ujbm-input min-h-[90px]" placeholder="Escribe aquí (opcional)" value={coment2} onChange={(e) => setComent2(e.target.value)} />
              </Field>
              <Field label="Comentarios o sugerencias adicionales para fortalecer el desarrollo del curso.">
                <textarea className="ujbm-input min-h-[90px]" placeholder="Escribe aquí (opcional)" value={coment3} onChange={(e) => setComent3(e.target.value)} />
              </Field>
            </div>
          </section>

          {submitError && (
            <div className="ujbm-card p-4 text-sm" style={{ borderTopColor: "var(--ujbm-red)" }}>
              <p className="font-semibold" style={{ color: "var(--ujbm-red)" }}>No se pudo enviar la encuesta</p>
              <p className="text-muted-foreground mt-1">{submitError}</p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pb-6">
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-6 text-sm font-medium hover:bg-secondary transition"
            >
              Cancelar
            </Link>
            <button
              type="button"
              disabled={!formOk || submitting}
              onClick={handleSubmit}
              className="inline-flex h-11 items-center justify-center rounded-md px-6 text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--ujbm-red)" }}
            >
              {submitting ? "Enviando..." : "Enviar encuesta"}
            </button>
          </div>
        </div>
      </main>
      <style>{`
        .ujbm-input{
          width:100%; height:42px; padding:0 .75rem;
          background:var(--card); color:var(--foreground);
          border:1px solid var(--border); border-radius:.5rem;
          font-size:.95rem; outline:none;
        }
        textarea.ujbm-input{ height:auto; padding:.6rem .75rem; resize:vertical; }
        .ujbm-input:focus{ border-color:var(--ujbm-blue); box-shadow:0 0 0 3px color-mix(in oklab, var(--ujbm-blue) 25%, transparent); }
        .ujbm-input:disabled{ background:var(--secondary); cursor:not-allowed; opacity:.7; }
      `}</style>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground mt-1">{hint}</span>}
    </label>
  );
}

function Select({
  value, onChange, placeholder, disabled, children,
}: {
  value: string; onChange: (v: string) => void; placeholder: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <select
      className="ujbm-input"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  );
}

function PreguntasSeccion({
  seccion, respuestas, setRespuestas,
}: {
  seccion: { titulo: string; preguntas: Pregunta[] };
  respuestas: Record<number, number>;
  setRespuestas: React.Dispatch<React.SetStateAction<Record<number, number>>>;
}) {
  return (
    <section className="ujbm-card p-5 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold" style={{ color: "var(--ujbm-blue-dark)" }}>
        {seccion.titulo}
      </h3>
      <div className="mt-4 space-y-3">
        {seccion.preguntas.map((p) => (
          <RatingScale
            key={p.numero}
            numero={p.numero}
            texto={p.texto}
            value={respuestas[p.numero]}
            onChange={(v) => setRespuestas((r) => ({ ...r, [p.numero]: v }))}
          />
        ))}
      </div>
    </section>
  );
}
