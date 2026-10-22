export const NOMBRES_DIAS: string[] = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function fncTextoModalidad(modalidad: string): string {
  if (modalidad === "virtual") {
    return "Virtual";
  }
  if (modalidad === "casa_tutor") {
    return "Presencial en casa del tutor";
  }
  if (modalidad === "domicilio") {
    return "Presencial a domicilio del estudiante";
  }
  return modalidad;
}

export function fncTextoDias(diasFijos: { dia: number; horaInicio: string }[]): string {
  let texto = "";
  for (let i = 0; i < diasFijos.length; i++) {
    if (i > 0) {
      texto = texto + ", ";
    }
    texto = texto + NOMBRES_DIAS[diasFijos[i].dia] + " " + diasFijos[i].horaInicio;
  }
  return texto;
}

export function fncFormatearDinero(cantidad: number): string {
  return "Q" + cantidad.toFixed(2);
}

export function fncFormatearFecha(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString("es-GT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Guatemala",
  });
}

export function fncRangoDeClases(sesiones: { inicio: string; fin: string }[]): string {
  let primera = new Date(sesiones[0].inicio).getTime();
  let ultima = primera;
  for (let i = 1; i < sesiones.length; i++) {
    const momento = new Date(sesiones[i].inicio).getTime();
    if (momento < primera) {
      primera = momento;
    }
    if (momento > ultima) {
      ultima = momento;
    }
  }
  return (
    fncFormatearFecha(new Date(primera).toISOString()) +
    " al " +
    fncFormatearFecha(new Date(ultima).toISOString())
  );
}

export function fncFechaDeHoy(): string {
  return new Date().toLocaleDateString("en-CA");
}