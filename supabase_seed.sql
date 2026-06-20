-- ============================================================
-- SEED DE EJEMPLO: Docentes, Cursos y Asignaciones
-- Ejecuta esto DESPUÉS de supabase_schema.sql en tu SQL Editor.
-- Edita libremente nombres, ciclos y escuelas según tu realidad.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1) DOCENTES (ejemplos — reemplaza con los reales)
-- ──────────────────────────────────────────────
INSERT INTO public.docentes (nombres) VALUES
  ('Oscar Gonzales Quintana'),
  ('María Fernanda Ríos'),
  ('Luis Alberto Méndez'),
  ('Patricia Salazar Vega'),
  ('Jorge Antonio Quiñones'),
  ('Carmen Rosa Delgado'),
  ('Ricardo Núñez Palomino'),
  ('Diana Carolina Espinoza'),
  ('Fernando Castillo Aliaga'),
  ('Lucía Pérez Montenegro'),
  ('Andrés Felipe Cárdenas'),
  ('Gabriela Soto Linares')
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 2) VINCULAR DOCENTES A LAS ESCUELAS
--    (todos disponibles en ambas escuelas — ajusta a tu gusto)
-- ──────────────────────────────────────────────
INSERT INTO public.docente_escuela (docente_id, escuela_id)
SELECT d.id, e.id
FROM public.docentes d
CROSS JOIN public.escuelas e
ON CONFLICT (docente_id, escuela_id) DO NOTHING;

-- ──────────────────────────────────────────────
-- 3) CURSOS — PERIODISMO (por ciclo)
-- ──────────────────────────────────────────────
WITH esc AS (SELECT id FROM public.escuelas WHERE nombre = 'Periodismo')
INSERT INTO public.cursos (nombre, escuela_id, ciclo)
SELECT v.nombre, esc.id, v.ciclo
FROM esc, (VALUES
  ('Introducción a la Comunicación', 'I'),
  ('Lenguaje y Redacción I',          'I'),
  ('Historia del Periodismo',         'II'),
  ('Redacción Periodística I',        'II'),
  ('Géneros Periodísticos',           'III'),
  ('Fotoperiodismo',                  'III'),
  ('Periodismo Digital',              'IV'),
  ('Investigación Periodística',      'IV'),
  ('Periodismo Radial',               'V'),
  ('Periodismo Televisivo',           'V'),
  ('Ética Periodística',              'VI'),
  ('Periodismo de Datos',             'VI'),
  ('Periodismo Político',             'VII'),
  ('Periodismo Económico',            'VII'),
  ('Reportaje y Crónica',             'VIII'),
  ('Periodismo Internacional',        'VIII'),
  ('Taller de Tesis I',               'IX'),
  ('Gestión de Medios',               'IX'),
  ('Taller de Tesis II',              'X'),
  ('Práctica Profesional',            'X')
) AS v(nombre, ciclo)
ON CONFLICT DO NOTHING;

-- ──────────────────────────────────────────────
-- 4) CURSOS — COMUNICACIÓN AUDIOVISUAL (por ciclo)
-- ──────────────────────────────────────────────
WITH esc AS (SELECT id FROM public.escuelas WHERE nombre = 'Comunicación Audiovisual')
INSERT INTO public.cursos (nombre, escuela_id, ciclo)
SELECT v.nombre, esc.id, v.ciclo
FROM esc, (VALUES
  ('Introducción al Lenguaje Audiovisual', 'I'),
  ('Fotografía Básica',                    'I'),
  ('Narrativa Audiovisual',                'II'),
  ('Guion I',                              'II'),
  ('Dirección de Fotografía',              'III'),
  ('Sonido para Audiovisuales',            'III'),
  ('Edición y Postproducción I',           'IV'),
  ('Producción Audiovisual I',             'IV'),
  ('Dirección de Actores',                 'V'),
  ('Documental I',                         'V'),
  ('Cine y Estética',                      'VI'),
  ('Edición y Postproducción II',          'VI'),
  ('Publicidad Audiovisual',               'VII'),
  ('Producción Audiovisual II',            'VII'),
  ('Animación y Motion Graphics',          'VIII'),
  ('Cine Digital',                         'VIII'),
  ('Taller de Tesis I',                    'IX'),
  ('Gestión de Proyectos Audiovisuales',   'IX'),
  ('Taller de Tesis II',                   'X'),
  ('Práctica Profesional',                 'X')
) AS v(nombre, ciclo)
ON CONFLICT DO NOTHING;
