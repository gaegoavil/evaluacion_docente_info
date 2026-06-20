-- ============================================================
-- ESQUEMA COMPLETO: Encuesta de Evaluación Docente — UJBM
-- Ejecuta esto en tu Supabase SQL Editor (New Query → Run)
-- ============================================================

-- 1) PERIODOS ACADÉMICOS
CREATE TABLE IF NOT EXISTS public.periodos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  activo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.periodos TO authenticated;
GRANT SELECT ON public.periodos TO anon;
GRANT ALL ON public.periodos TO service_role;
ALTER TABLE public.periodos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Periodos visibles para todos" ON public.periodos FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.periodos (nombre, activo) VALUES
  ('2026-I', true)
ON CONFLICT DO NOTHING;

-- 2) ESCUELAS PROFESIONALES
CREATE TABLE IF NOT EXISTS public.escuelas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.escuelas TO authenticated;
GRANT SELECT ON public.escuelas TO anon;
GRANT ALL ON public.escuelas TO service_role;
ALTER TABLE public.escuelas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Escuelas visibles para todos" ON public.escuelas FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.escuelas (nombre) VALUES
  ('Periodismo'),
  ('Comunicación Audiovisual')
ON CONFLICT DO NOTHING;

-- 3) MODALIDADES DE ESTUDIO
CREATE TABLE IF NOT EXISTS public.modalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modalidades TO authenticated;
GRANT SELECT ON public.modalidades TO anon;
GRANT ALL ON public.modalidades TO service_role;
ALTER TABLE public.modalidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Modalidades visibles para todos" ON public.modalidades FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.modalidades (nombre) VALUES
  ('Presencial'),
  ('Semipresencial'),
  ('Distancia')
ON CONFLICT DO NOTHING;

-- 4) DOCENTES
CREATE TABLE IF NOT EXISTS public.docentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombres text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.docentes TO authenticated;
GRANT SELECT ON public.docentes TO anon;
GRANT ALL ON public.docentes TO service_role;
ALTER TABLE public.docentes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docentes visibles para todos" ON public.docentes FOR SELECT TO anon, authenticated USING (true);

-- 5) CURSOS
CREATE TABLE IF NOT EXISTS public.cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  escuela_id uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,
  ciclo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cursos TO authenticated;
GRANT SELECT ON public.cursos TO anon;
GRANT ALL ON public.cursos TO service_role;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cursos visibles para todos" ON public.cursos FOR SELECT TO anon, authenticated USING (true);

-- 6) RELACIÓN DOCENTE ↔ ESCUELA
CREATE TABLE IF NOT EXISTS public.docente_escuela (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_id uuid NOT NULL REFERENCES public.docentes(id) ON DELETE CASCADE,
  escuela_id uuid NOT NULL REFERENCES public.escuelas(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(docente_id, escuela_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.docente_escuela TO authenticated;
GRANT SELECT ON public.docente_escuela TO anon;
GRANT ALL ON public.docente_escuela TO service_role;
ALTER TABLE public.docente_escuela ENABLE ROW LEVEL SECURITY;
CREATE POLICY "DocenteEscuela visible para todos" ON public.docente_escuela FOR SELECT TO anon, authenticated USING (true);

-- 7) PREGUNTAS DE LA ENCUESTA
CREATE TABLE IF NOT EXISTS public.preguntas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero int NOT NULL,
  texto text NOT NULL,
  seccion text NOT NULL,
  modalidad text NOT NULL DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.preguntas TO authenticated;
GRANT SELECT ON public.preguntas TO anon;
GRANT ALL ON public.preguntas TO service_role;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Preguntas visibles para todos" ON public.preguntas FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.preguntas (numero, texto, seccion, modalidad) VALUES
  -- I. PLANIFICACIÓN Y DESARROLLO DEL CURSO
  (1, 'El docente presentó y explicó oportunamente el contenido del sílabo al inicio del curso.', 'I. PLANIFICACIÓN Y DESARROLLO DEL CURSO', 'general'),
  (2, 'El docente desarrolló los contenidos y actividades conforme a lo establecido en el sílabo.', 'I. PLANIFICACIÓN Y DESARROLLO DEL CURSO', 'general'),
  (3, 'Los objetivos, contenidos y criterios de evaluación del curso fueron comunicados claramente.', 'I. PLANIFICACIÓN Y DESARROLLO DEL CURSO', 'general'),
  (4, 'Los contenidos abordados contribuyeron al logro de las competencias de la asignatura.', 'I. PLANIFICACIÓN Y DESARROLLO DEL CURSO', 'general'),

  -- II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL
  (5, 'El docente demostró dominio de los contenidos de la asignatura.', 'II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL', 'general'),
  (6, 'El docente relacionó los contenidos con situaciones reales del ejercicio profesional.', 'II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL', 'general'),
  (7, 'El docente incorporó ejemplos, tendencias y casos actuales relacionados con el periodismo y la comunicación audiovisual.', 'II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL', 'general'),
  (8, 'El docente respondió de manera clara y precisa las consultas realizadas por los estudiantes.', 'II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL', 'general'),

  -- III. METODOLOGÍA — Presencial
  (9, 'El docente utilizó estrategias que facilitaron la comprensión de los contenidos.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'presencial'),
  (10, 'El docente promovió la participación activa de los estudiantes durante las sesiones de clase.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'presencial'),
  (11, 'El docente fomentó el análisis crítico y la reflexión sobre temas de interés profesional.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'presencial'),
  (12, 'El docente utilizó recursos y herramientas que enriquecieron el proceso de aprendizaje.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'presencial'),

  -- III. METODOLOGÍA — Semipresencial
  (9, 'El docente articuló adecuadamente las actividades presenciales y virtuales para favorecer el aprendizaje de los estudiantes.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'semipresencial'),
  (10, 'El docente utilizó estrategias de enseñanza que facilitaron la comprensión de los contenidos tanto en las sesiones presenciales como en los espacios virtuales.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'semipresencial'),
  (11, 'Los materiales, recursos y actividades de aprendizaje estuvieron disponibles oportunamente y fueron pertinentes para el desarrollo del curso en modalidad semipresencial.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'semipresencial'),
  (12, 'El docente promovió la participación activa, el aprendizaje autónomo y el trabajo colaborativo en los espacios presenciales y virtuales.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'semipresencial'),

  -- III. METODOLOGÍA — Distancia
  (9, 'El docente utilizó adecuadamente las herramientas y recursos del aula virtual.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'distancia'),
  (10, 'Los materiales de aprendizaje estuvieron disponibles oportunamente en la plataforma virtual.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'distancia'),
  (11, 'El docente promovió la participación activa de los estudiantes en los espacios virtuales de aprendizaje.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'distancia'),
  (12, 'Las actividades desarrolladas facilitaron el aprendizaje autónomo y colaborativo.', 'III. METODOLOGÍA SEGÚN MODALIDAD', 'distancia'),

  -- IV. EVALUACIÓN Y ACOMPAÑAMIENTO
  (13, 'Los procedimientos de evaluación fueron claros y comprensibles.', 'IV. EVALUACIÓN Y ACOMPAÑAMIENTO', 'general'),
  (14, 'Las evaluaciones guardaron relación con los contenidos desarrollados en el curso.', 'IV. EVALUACIÓN Y ACOMPAÑAMIENTO', 'general'),
  (15, 'El docente brindó retroalimentación clara y oportuna que me permitió identificar oportunidades de mejora en mi aprendizaje.', 'IV. EVALUACIÓN Y ACOMPAÑAMIENTO', 'general'),
  (16, 'El docente registró y publicó oportunamente las calificaciones de las actividades y evaluaciones realizadas.', 'IV. EVALUACIÓN Y ACOMPAÑAMIENTO', 'general'),

  -- V. COMPETENCIAS PROFESIONALES
  (17, 'El docente promovió el análisis crítico de los contenidos y temas abordados en el curso.', 'V. COMPETENCIAS PROFESIONALES', 'general'),
  (18, 'El docente fomentó el desarrollo de habilidades profesionales, comunicativas y de trabajo colaborativo necesarias para el desempeño laboral.', 'V. COMPETENCIAS PROFESIONALES', 'general')
ON CONFLICT DO NOTHING;

-- 8) ENCUESTAS (respuestas principales)
CREATE TABLE IF NOT EXISTS public.encuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo_id uuid NOT NULL REFERENCES public.periodos(id),
  escuela_id uuid NOT NULL REFERENCES public.escuelas(id),
  modalidad_id uuid NOT NULL REFERENCES public.modalidades(id),
  ciclo text NOT NULL,
  curso_id uuid NOT NULL REFERENCES public.cursos(id),
  docente_id uuid REFERENCES public.docentes(id) ON DELETE SET NULL,
  docente_otro text,
  correo text NOT NULL,
  correo_normalizado text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.encuestas TO authenticated;
GRANT SELECT, INSERT ON public.encuestas TO anon;
GRANT ALL ON public.encuestas TO service_role;
ALTER TABLE public.encuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Encuestas insertables por cualquiera" ON public.encuestas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Encuestas visibles para autenticados" ON public.encuestas FOR SELECT TO authenticated USING (true);

-- Evita que un mismo estudiante evalúe dos veces al mismo docente/curso en el mismo periodo
CREATE UNIQUE INDEX IF NOT EXISTS idx_encuestas_unica
  ON public.encuestas (periodo_id, escuela_id, ciclo, curso_id, correo_normalizado, COALESCE(docente_id, '00000000-0000-0000-0000-000000000000'), COALESCE(docente_otro, ''));

-- 9) RESPUESTAS INDIVIDUALES (1–5 por pregunta)
CREATE TABLE IF NOT EXISTS public.respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id uuid NOT NULL REFERENCES public.encuestas(id) ON DELETE CASCADE,
  pregunta_id uuid NOT NULL REFERENCES public.preguntas(id),
  valor int NOT NULL CHECK (valor BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.respuestas TO authenticated;
GRANT SELECT, INSERT ON public.respuestas TO anon;
GRANT ALL ON public.respuestas TO service_role;
ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Respuestas insertables por cualquiera" ON public.respuestas FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Respuestas visibles para autenticados" ON public.respuestas FOR SELECT TO authenticated USING (true);

-- 10) COMENTARIOS OPCIONALES
CREATE TABLE IF NOT EXISTS public.comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encuesta_id uuid NOT NULL REFERENCES public.encuestas(id) ON DELETE CASCADE,
  aspecto_positivo text,
  aspecto_mejora text,
  sugerencia_adicional text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comentarios TO authenticated;
GRANT SELECT, INSERT ON public.comentarios TO anon;
GRANT ALL ON public.comentarios TO service_role;
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comentarios insertables por cualquiera" ON public.comentarios FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Comentarios visibles para autenticados" ON public.comentarios FOR SELECT TO authenticated USING (true);
