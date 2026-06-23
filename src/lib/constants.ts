export const IMG_LOGO_HORIZONTAL = "/assets/logo-horizontal.png";
export const IMG_LOGO_CIRCULAR = "/assets/logo-circular.png";
export const IMG_FACHADA = "/assets/fachada-banner.jpg";
export const IMG_FACHADA_AZUL = "/assets/fachada-fondo.png";
export const IMG_FACHADA_VERTICAL = "/assets/fachada-secundaria.jpg";

export const CICLOS = ["I","II","III","IV","V","VI","VII","VIII","IX","X"] as const;
export const ESCALA = [
  { v: 1, label: "Totalmente en desacuerdo" },
  { v: 2, label: "En desacuerdo" },
  { v: 3, label: "Ni de acuerdo ni en desacuerdo" },
  { v: 4, label: "De acuerdo" },
  { v: 5, label: "Totalmente de acuerdo" },
] as const;

export type Modalidad = "Presencial" | "Semipresencial" | "Distancia";

export type Pregunta = { numero: number; texto: string };
export type Seccion = { titulo: string; preguntas: Pregunta[] };

export const SECCION_I: Seccion = {
  titulo: "I. PLANIFICACIÓN Y DESARROLLO DEL CURSO",
  preguntas: [
    { numero: 1, texto: "El docente presentó y explicó oportunamente el contenido del sílabo al inicio del curso." },
    { numero: 2, texto: "El docente desarrolló los contenidos y actividades conforme a lo establecido en el sílabo." },
    { numero: 3, texto: "Los objetivos, contenidos y criterios de evaluación del curso fueron comunicados claramente." },
    { numero: 4, texto: "Los contenidos abordados contribuyeron al logro de las competencias de la asignatura." },
  ],
};

export const SECCION_II: Seccion = {
  titulo: "II. DOMINIO Y ACTUALIZACIÓN PROFESIONAL",
  preguntas: [
    { numero: 5, texto: "El docente demostró dominio de los contenidos de la asignatura." },
    { numero: 6, texto: "El docente relacionó los contenidos con situaciones reales del ejercicio profesional." },
    { numero: 7, texto: "El docente incorporó ejemplos, tendencias y casos actuales relacionados con la carrera profesional." },
    { numero: 8, texto: "El docente respondió de manera clara y precisa las consultas realizadas por los estudiantes." },
  ],
};

export const SECCION_III_PRESENCIAL: Pregunta[] = [
  { numero: 9, texto: "El docente utilizó estrategias que facilitaron la comprensión de los contenidos." },
  { numero: 10, texto: "El docente promovió la participación activa de los estudiantes durante las sesiones de clase." },
  { numero: 11, texto: "El docente fomentó el análisis crítico y la reflexión sobre temas de interés profesional." },
  { numero: 12, texto: "El docente utilizó recursos y herramientas que enriquecieron el proceso de aprendizaje." },
];

export const SECCION_III_SEMI: Pregunta[] = [
  { numero: 9, texto: "El docente articuló adecuadamente las actividades presenciales y virtuales para favorecer el aprendizaje de los estudiantes." },
  { numero: 10, texto: "El docente utilizó estrategias de enseñanza que facilitaron la comprensión de los contenidos tanto en las sesiones presenciales como en los espacios virtuales." },
  { numero: 11, texto: "Los materiales, recursos y actividades de aprendizaje estuvieron disponibles oportunamente y fueron pertinentes para el desarrollo del curso en modalidad semipresencial." },
  { numero: 12, texto: "El docente promovió la participación activa, el aprendizaje autónomo y el trabajo colaborativo en los espacios presenciales y virtuales." },
];

export const SECCION_III_DISTANCIA: Pregunta[] = [
  { numero: 9, texto: "El docente utilizó adecuadamente las herramientas y recursos del aula virtual." },
  { numero: 10, texto: "Los materiales de aprendizaje estuvieron disponibles oportunamente en la plataforma virtual." },
  { numero: 11, texto: "El docente promovió la participación activa de los estudiantes en los espacios virtuales de aprendizaje." },
  { numero: 12, texto: "Las actividades desarrolladas facilitaron el aprendizaje autónomo y colaborativo." },
];

export const SECCION_IV: Seccion = {
  titulo: "IV. EVALUACIÓN Y ACOMPAÑAMIENTO",
  preguntas: [
    { numero: 13, texto: "Los procedimientos de evaluación fueron claros y comprensibles." },
    { numero: 14, texto: "Las evaluaciones guardaron relación con los contenidos desarrollados en el curso." },
    { numero: 15, texto: "El docente brindó retroalimentación clara y oportuna que me permitió identificar oportunidades de mejora en mi aprendizaje." },
    { numero: 16, texto: "El docente registró y publicó oportunamente las calificaciones de las actividades y evaluaciones realizadas." },
  ],
};

export const SECCION_V: Seccion = {
  titulo: "V. COMPETENCIAS PROFESIONALES",
  preguntas: [
    { numero: 17, texto: "El docente promovió el análisis crítico de los contenidos y temas abordados en el curso." },
    { numero: 18, texto: "El docente fomentó el desarrollo de habilidades profesionales, comunicativas y de trabajo colaborativo necesarias para el desempeño laboral." },
  ],
};

export function getPreguntasModalidad(modalidad: Modalidad | ""): Pregunta[] {
  if (modalidad === "Presencial") return SECCION_III_PRESENCIAL;
  if (modalidad === "Semipresencial") return SECCION_III_SEMI;
  if (modalidad === "Distancia") return SECCION_III_DISTANCIA;
  return [];
}
