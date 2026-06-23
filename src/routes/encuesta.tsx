import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
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

type Catalogo = {
  id: string;
  nombre: string;
};

function EncuestaPage() {
  const navigate = useNavigate();

  const [periodos, setPeriodos] = useState<Catalogo[]>([]);
  const [escuelas, setEscuelas] = useState<Catalogo[]>([]);
  const [modalidades, setModalidades] = useState<Catalogo[]>([]);
  const [cursos, setCursos] = useState<Catalogo[]>([]);
  const [docentes, setDocentes] = useState<Catalogo[]>([]);

  const [loadError, setLoadError] = useState<string>("");
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [loadingDocentes, setLoadingDocentes] = useState(false);

  const [correo, setCorreo] = useState("");
  const [emailValidated, setEmailValidated] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [periodoId, setPeriodoId] = useState("");
  const [escuelaId, setEscuelaId] = useState("");
  const [ciclo, setCiclo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [docenteOtro, setDocenteOtro] = useState("");
  const [modalidadId, setModalidadId] = useState("");

  const [respuestas, setRespuestas] = useState<Record<number, number>>({});
  const [coment1, setComent1] = useState("");
  const [coment2, setComent2] = useState("");
  const [coment3, setComent3] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [{ data: per }, { data: esc }, { data: mod }] = await Promise.all([
          supabase
            .from("periodos")
            .select("id, nombre")
            .eq("activo", true)
            .order("nombre"),
          supabase.from("escuelas").select("id, nombre").order("nombre"),
          supabase.from("modalidades").select("id, nombre").order("nombre"),
        ]);

        const escuelaOrden: Record<string, number> = {
  Administración: 1,
  Contabilidad: 2,
  "Ingeniería Informática": 3,
};

        const modalidadOrden: Record<string, number> = {
          Presencial: 1,
          Semipresencial: 2,
          Distancia: 3,
        };

        setPeriodos(per ?? []);

        setEscuelas(
          [...(esc ?? [])].sort(
            (a, b) =>
              (escuelaOrden[a.nombre] ?? 99) -
              (escuelaOrden[b.nombre] ?? 99)
          )
        );

        setModalidades(
          [...(mod ?? [])].sort(
            (a, b) =>
              (modalidadOrden[a.nombre] ?? 99) -
              (modalidadOrden[b.nombre] ?? 99)
          )
        );

        const activo =
          (per ?? []).find((p) => p.nombre === "2026-I") ?? (per ?? [])[0];

        if (activo) {
          setPeriodoId(activo.id);
        }
      } catch (e: unknown) {
        setLoadError(
          "No se pudieron cargar los catálogos desde Supabase. Verifica las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY, y que las tablas existan."
        );
        console.error(e);
      }
    })();
  }, []);

  useEffect(() => {
    setCursoId("");
    setCursos([]);

    if (!escuelaId || !ciclo) return;

    (async () => {
      setLoadingCursos(true);

      try {
        const { data, error } = await supabase
          .from("cursos")
          .select("id, nombre")
          .eq("escuela_id", escuelaId)
          .eq("ciclo", ciclo)
          .order("nombre");

        if (error) throw error;

        setCursos(data ?? []);
      } catch (e) {
        console.error("Error cargando cursos:", e);
        setCursos([]);
      } finally {
        setLoadingCursos(false);
      }
    })();
  }, [escuelaId, ciclo]);

  useEffect(() => {
    setDocenteId("");
    setDocenteOtro("");
    setDocentes([]);

    if (!escuelaId) return;

    (async () => {
      setLoadingDocentes(true);

      try {
        const { data, error } = await supabase
          .from("docente_escuela")
          .select("docentes:docente_id(id, nombres)")
          .eq("escuela_id", escuelaId);

        if (error) throw error;

        const rows = (data ?? []) as unknown as Array<{
          docentes:
            | { id: string; nombres: string }
            | { id: string; nombres: string }[]
            | null;
        }>;

        const flat: { id: string; nombres: string }[] = [];

        rows.forEach((r) => {
          const d = r.docentes;
          if (!d) return;

          if (Array.isArray(d)) {
            d.forEach((x) => flat.push(x));
          } else {
            flat.push(d);
          }
        });

        flat.sort((a, b) => a.nombres.localeCompare(b.nombres));

        setDocentes(
          flat.map((d) => ({
            id: d.id,
            nombre: d.nombres,
          }))
        );
      } catch (e) {
        console.error("Error cargando docentes:", e);
        setDocentes([]);
      } finally {
        setLoadingDocentes(false);
      }
    })();
  }, [escuelaId]);

  const modalidadNombre = useMemo<Modalidad | "">(() => {
    const m = modalidades.find((m) => m.id === modalidadId);

    if (!m) return "";

    if (
      m.nombre === "Presencial" ||
      m.nombre === "Semipresencial" ||
      m.nombre === "Distancia"
    ) {
      return m.nombre;
    }

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

  const emailOk = /^[^\s@]+@bausate\.edu\.pe$/i.test(correo.trim());

  const formOk =
    !!periodoId &&
    !!escuelaId &&
    !!ciclo &&
    !!cursoId &&
    !!docenteId &&
    (docenteId !== "__otros__" || docenteOtro.trim().length > 1) &&
    !!modalidadId &&
    emailValidated &&
    todasPreguntas.length > 0 &&
    todasPreguntas.every((p) => respuestas[p.numero] != null);

  async function handleEmailCheck() {
    setEmailError("");

    const correoNorm = correo.trim().toLowerCase();

    if (!correoNorm) {
      setEmailError("Ingresa tu correo institucional.");
      return;
    }

    if (!emailOk) {
      setEmailError(
        "Solo se permite ingresar con correo institucional @bausate.edu.pe."
      );
      return;
    }

    if (!periodoId) {
      setEmailError("No se pudo identificar el periodo académico activo.");
      return;
    }

    /*
      Nueva regla:
      El correo institucional solo se valida por dominio.
      Ya no se bloquea al estudiante por haber respondido antes.
      El bloqueo de duplicado se hace recién al enviar,
      considerando periodo + curso + docente + correo.
    */

    setCheckingEmail(true);

    try {
      setEmailValidated(true);
    } catch (e: unknown) {
      console.error("Error validando correo:", e);
      setEmailError("No se pudo validar el correo. Inténtalo nuevamente.");
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleSubmit() {
    if (!formOk || submitting) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const correoNorm = correo.trim().toLowerCase();

      const isOtros = docenteId === "__otros__";
      const docenteRealId = isOtros ? null : docenteId;
      const docenteOtroVal = isOtros ? docenteOtro.trim() : null;

      /*
        Nueva regla:
        El mismo correo puede responder varios cursos.
        Pero no puede repetir el mismo curso/docente en el mismo periodo.
      */

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

      const { count, error: dupErr } = await dupQuery;

      if (dupErr) throw dupErr;

      if ((count ?? 0) > 0) {
        navigate({ to: "/gracias" });
        return;
      }

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
        if (
          encErr &&
          (encErr.code === "23505" || /duplicate|unique/i.test(encErr.message))
        ) {
          navigate({ to: "/gracias" });
          return;
        }

        throw encErr ?? new Error("No se pudo registrar la encuesta.");
      }

      const numeros = todasPreguntas.map((p) => p.numero);

      const { data: pregs, error: pregsErr } = await supabase
        .from("preguntas")
        .select("id, numero, modalidad")
        .in("numero", numeros);

      if (pregsErr) throw pregsErr;

      const map = new Map<string, string>();

      (pregs ?? []).forEach(
        (p: { id: string; numero: number; modalidad: string }) => {
          map.set(`${p.numero}|${p.modalidad}`, p.id);
        }
      );

      const modKey = modalidadNombre.toLowerCase();

      const filas = todasPreguntas
        .map((p) => {
          const isModal = p.numero >= 9 && p.numero <= 12;
          const key = isModal ? `${p.numero}|${modKey}` : `${p.numero}|general`;
          const pid = map.get(key);

          return pid
            ? {
                encuesta_id: enc.id,
                pregunta_id: pid,
                valor: respuestas[p.numero],
              }
            : null;
        })
        .filter(
          (
            r
          ): r is {
            encuesta_id: string;
            pregunta_id: string;
            valor: number;
          } => !!r
        );

      if (filas.length > 0) {
        const { error: rErr } = await supabase.from("respuestas").insert(filas);
        if (rErr) throw rErr;
      }

      if (coment1.trim() || coment2.trim() || coment3.trim()) {
        const { error: cErr } = await supabase.from("comentarios").insert({
          encuesta_id: enc.id,
          aspecto_positivo: coment1.trim() || null,
          aspecto_mejora: coment2.trim() || null,
          sugerencia_adicional: coment3.trim() || null,
        });

        if (cErr) throw cErr;
      }

      navigate({ to: "/gracias" });
    } catch (e: unknown) {
      console.error("Error al enviar encuesta:", e);

      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "object" && e !== null && "message" in e
            ? String((e as { message: unknown }).message)
            : "Ocurrió un error al enviar la encuesta.";

      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background notranslate" translate="no">
      <InstitutionalHeader />
      <InstitutionalBanner />

      <main
        className="flex-1 ujbm-bg-fade px-4 py-8 sm:py-12"
        style={{ ["--bg-img" as never]: `url(${IMG_FACHADA_VERTICAL})` }}
      >
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="text-center">
            <h2
              className="text-2xl sm:text-3xl font-semibold"
              style={{ color: "var(--ujbm-blue-dark)" }}
            >
              Encuesta de Evaluación Docente
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Completa todos los campos marcados. Tus respuestas son anónimas.
            </p>
          </header>

          {loadError && (
            <div
              className="ujbm-card p-4 text-sm"
              style={{ borderTopColor: "var(--ujbm-red)" }}
            >
              <p
                className="font-semibold"
                style={{ color: "var(--ujbm-red)" }}
              >
                Aviso
              </p>
              <p className="text-muted-foreground mt-1">{loadError}</p>
            </div>
          )}

          {!emailValidated ? (
            <EmailValidationCard
              correo={correo}
              setCorreo={setCorreo}
              emailError={emailError}
              checkingEmail={checkingEmail}
              onContinue={handleEmailCheck}
            />
          ) : (
            <>
              <section className="ujbm-card p-5 sm:p-6">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--ujbm-blue-dark)" }}
                >
                  1. Datos generales
                </h3>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Periodo académico *">
                    <Select
                      value={periodoId}
                      onChange={setPeriodoId}
                      placeholder="Selecciona el periodo"
                    >
                      {periodos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Escuela profesional *">
                    <Select
                      value={escuelaId}
                      onChange={(v) => {
                        setEscuelaId(v);
                        setCiclo("");
                      }}
                      placeholder="Selecciona la escuela"
                    >
                      {escuelas.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Ciclo académico *">
                    <Select
                      value={ciclo}
                      onChange={setCiclo}
                      placeholder="Selecciona el ciclo"
                    >
                      {CICLOS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field
                    label="Nombre del curso *"
                    hint={
                      !escuelaId || !ciclo
                        ? "Selecciona primero la escuela y el ciclo."
                        : loadingCursos
                          ? "Cargando cursos..."
                          : cursos.length === 0
                            ? "No hay cursos cargados para esta escuela y ciclo."
                            : undefined
                    }
                  >
                    <Select
                      value={cursoId}
                      onChange={setCursoId}
                      placeholder="Selecciona el curso"
                      disabled={!escuelaId || !ciclo}
                    >
                      {cursos.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </Select>

                    {escuelaId && ciclo && cursos.length === 0 && !loadingCursos && (
                      <p
                        className="mt-1 text-xs font-medium"
                        style={{ color: "var(--ujbm-red)" }}
                      >
                        No hay cursos cargados para esta escuela y ciclo.
                      </p>
                    )}
                  </Field>

                  <Field
                    label="Nombre del docente *"
                    hint={
                      !escuelaId
                        ? undefined
                        : loadingDocentes
                          ? "Cargando docentes..."
                          : docentes.length === 0
                            ? "No hay docentes cargados para esta escuela."
                            : undefined
                    }
                  >
                    <Select
                      value={docenteId}
                      onChange={setDocenteId}
                      placeholder="Selecciona el docente"
                      disabled={!escuelaId}
                    >
                      {docentes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nombre}
                        </option>
                      ))}
                      <option value="__otros__">Otros</option>
                    </Select>

                    {escuelaId && docentes.length === 0 && !loadingDocentes && (
                      <p
                        className="mt-1 text-xs font-medium"
                        style={{ color: "var(--ujbm-red)" }}
                      >
                        No hay docentes cargados para esta escuela.
                      </p>
                    )}
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
                    <Select
                      value={modalidadId}
                      onChange={setModalidadId}
                      placeholder="Selecciona la modalidad"
                    >
                      {modalidades.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nombre}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </section>

              <section className="ujbm-card p-5 sm:p-6">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "var(--ujbm-blue-dark)" }}
                >
                  2. Encuesta docente
                </h3>

                <p className="mt-2 text-sm font-medium text-foreground">
                  Escala de valoración
                </p>

                <ul
                  translate="no"
                  className="notranslate mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs text-muted-foreground"
                >
                  {ESCALA.map((e) => (
                    <li
                      key={e.v}
                      translate="no"
                      className="notranslate rounded-md border border-border bg-secondary/50 px-2 py-1.5"
                    >
                      <span
                        translate="no"
                        className="notranslate font-bold"
                        style={{ color: "var(--ujbm-blue)" }}
                      >
                        {e.v}
                      </span>{" "}
                      <span translate="no" className="notranslate">
                        {e.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <PreguntasSeccion
                seccion={SECCION_I}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
              />

              <PreguntasSeccion
                seccion={SECCION_II}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
              />

              <section className="ujbm-card p-5 sm:p-6">
                <h3
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: "var(--ujbm-blue-dark)" }}
                >
                  III. METODOLOGÍA SEGÚN MODALIDAD
                </h3>

                {!modalidadNombre ? (
                  <div className="mt-4">
                    <p className="text-sm text-foreground">
                      Selecciona una modalidad de estudio para ver estas preguntas.
                    </p>

                    <div className="mt-3 rounded-md border border-dashed border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                      Las preguntas de esta dimensión aparecerán cuando elijas la modalidad.
                    </div>
                  </div>
                ) : (
                  <>
                    <p
                      className="mt-2 text-sm font-medium"
                      style={{ color: "var(--ujbm-red)" }}
                    >
                      Modalidad seleccionada: {modalidadNombre}
                    </p>

                    <div className="mt-4 space-y-3">
                      {preguntasModalidad.map((p) => (
                        <RatingScale
                          key={p.numero}
                          numero={p.numero}
                          texto={p.texto}
                          value={respuestas[p.numero]}
                          onChange={(v) =>
                            setRespuestas((r) => ({
                              ...r,
                              [p.numero]: v,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </>
                )}
              </section>

              <PreguntasSeccion
                seccion={SECCION_IV}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
              />

              <PreguntasSeccion
                seccion={SECCION_V}
                respuestas={respuestas}
                setRespuestas={setRespuestas}
              />

              <section className="ujbm-card p-5 sm:p-6">
                <h3
                  className="text-base sm:text-lg font-semibold"
                  style={{ color: "var(--ujbm-blue-dark)" }}
                >
                  VI. COMENTARIOS Y SUGERENCIAS
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">Opcionales</p>

                <div className="mt-4 space-y-4">
                  <Field label="¿Qué aspectos positivos destacarías del desempeño del docente?">
                    <textarea
                      className="ujbm-input min-h-[90px]"
                      placeholder="Escribe aquí (opcional)"
                      value={coment1}
                      onChange={(e) => setComent1(e.target.value)}
                    />
                  </Field>

                  <Field label="¿Qué aspectos consideras que el docente podría mejorar?">
                    <textarea
                      className="ujbm-input min-h-[90px]"
                      placeholder="Escribe aquí (opcional)"
                      value={coment2}
                      onChange={(e) => setComent2(e.target.value)}
                    />
                  </Field>

                  <Field label="Comentarios o sugerencias adicionales para fortalecer el desarrollo del curso.">
                    <textarea
                      className="ujbm-input min-h-[90px]"
                      placeholder="Escribe aquí (opcional)"
                      value={coment3}
                      onChange={(e) => setComent3(e.target.value)}
                    />
                  </Field>
                </div>
              </section>

              {submitError && (
                <div
                  className="ujbm-card p-4 text-sm"
                  style={{ borderTopColor: "var(--ujbm-red)" }}
                >
                  <p
                    className="font-semibold"
                    style={{ color: "var(--ujbm-red)" }}
                  >
                    No se pudo enviar la encuesta
                  </p>
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
            </>
          )}
        </div>
      </main>

      <style>{`
        .ujbm-input {
          width: 100%;
          height: 42px;
          padding: 0 .75rem;
          background: var(--card);
          color: var(--foreground);
          border: 1px solid var(--border);
          border-radius: .5rem;
          font-size: .95rem;
          outline: none;
        }

        textarea.ujbm-input {
          height: auto;
          padding: .6rem .75rem;
          resize: vertical;
        }

        .ujbm-input:focus {
          border-color: var(--ujbm-blue);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ujbm-blue) 25%, transparent);
        }

        .ujbm-input:disabled {
          background: var(--secondary);
          cursor: not-allowed;
          opacity: .7;
        }
      `}</style>
    </div>
  );
}

function EmailValidationCard({
  correo,
  setCorreo,
  emailError,
  checkingEmail,
  onContinue,
}: {
  correo: string;
  setCorreo: (value: string) => void;
  emailError: string;
  checkingEmail: boolean;
  onContinue: () => void;
}) {
  return (
    <section className="ujbm-card relative z-10 p-6 sm:p-8 text-center">
      <h3
        className="text-2xl font-semibold"
        style={{ color: "var(--ujbm-blue-dark)" }}
      >
        Validación de correo institucional
      </h3>

      <p className="mt-2 text-sm text-muted-foreground">
        Para iniciar la encuesta, ingresa tu correo institucional de la Universidad Jaime Bausate y Meza.
      </p>

      <div className="mt-6 max-w-md mx-auto text-left">
        <label className="block text-sm font-medium mb-1.5">
          Correo institucional *
        </label>

        <input
          type="email"
          className="ujbm-input"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onContinue();
            }
          }}
          placeholder="usuario@bausate.edu.pe"
        />

        <p className="mt-2 text-xs text-muted-foreground">
          Solo se aceptan correos con dominio @bausate.edu.pe. Puedes responder una encuesta por cada curso que lleves en el periodo académico.
        </p>

        {emailError && (
          <p
            className="mt-3 text-sm font-medium"
            style={{ color: "var(--ujbm-red)" }}
          >
            {emailError}
          </p>
        )}

        <button
          type="button"
          onClick={onContinue}
          disabled={checkingEmail}
          className="mt-5 w-full h-11 rounded-md text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: "var(--ujbm-blue)" }}
        >
          {checkingEmail ? "Validando..." : "Continuar"}
        </button>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-foreground mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-muted-foreground mt-1">
          {hint}
        </span>
      )}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  disabled,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  children: ReactNode;
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
  seccion,
  respuestas,
  setRespuestas,
}: {
  seccion: {
    titulo: string;
    preguntas: Pregunta[];
  };
  respuestas: Record<number, number>;
  setRespuestas: Dispatch<SetStateAction<Record<number, number>>>;
}) {
  return (
    <section className="ujbm-card p-5 sm:p-6">
      <h3
        className="text-base sm:text-lg font-semibold"
        style={{ color: "var(--ujbm-blue-dark)" }}
      >
        {seccion.titulo}
      </h3>

      <div className="mt-4 space-y-3">
        {seccion.preguntas.map((p) => (
          <RatingScale
            key={p.numero}
            numero={p.numero}
            texto={p.texto}
            value={respuestas[p.numero]}
            onChange={(v) =>
              setRespuestas((r) => ({
                ...r,
                [p.numero]: v,
              }))
            }
          />
        ))}
      </div>
    </section>
  );
}
