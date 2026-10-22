import { DiaFijo, Sesion } from "../models/Reserva";

const ZONA_HORARIA = "-06:00";

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

export function fncEsHoraValida(hora: string): boolean {
  return FORMATO_HORA.test(hora);
}

export function fncEsFechaValida(fecha: string): boolean {
  if (!FORMATO_FECHA.test(fecha)) {
    return false;
  }
  return !isNaN(new Date(fecha + "T12:00:00Z").getTime());
}

export function fncHoraAMinutos(hora: string): number {
  const partes = hora.split(":");
  return Number(partes[0]) * 60 + Number(partes[1]);
}

export function fncRedondear(numero: number, decimales: number): number {
  const factor = Math.pow(10, decimales);
  return Math.round(numero * factor) / factor;
}

export function fncCalcularDistanciaKm(
  latitud1: number,
  longitud1: number,
  latitud2: number,
  longitud2: number
): number {
  const RADIO_TIERRA_KM = 6371;
  const aRadianes = Math.PI / 180;
  const diferenciaLatitud = (latitud2 - latitud1) * aRadianes;
  const diferenciaLongitud = (longitud2 - longitud1) * aRadianes;

  const a =
    Math.pow(Math.sin(diferenciaLatitud / 2), 2) +
    Math.cos(latitud1 * aRadianes) *
      Math.cos(latitud2 * aRadianes) *
      Math.pow(Math.sin(diferenciaLongitud / 2), 2);

  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function fncGenerarSesiones(
  fechaInicio: string,
  semanas: number,
  diasFijos: DiaFijo[],
  horasPorSesion: number
): Sesion[] {
  const sesiones: Sesion[] = [];

  const base = new Date(fechaInicio + "T12:00:00Z");
  const diaDeLaSemanaBase = base.getUTCDay();

  for (let semana = 0; semana < semanas; semana++) {
    for (let i = 0; i < diasFijos.length; i++) {
      const diaFijo = diasFijos[i];

      const desplazamiento = (diaFijo.dia - diaDeLaSemanaBase + 7) % 7;

      const fecha = new Date(base);
      fecha.setUTCDate(base.getUTCDate() + desplazamiento + semana * 7);
      const textoFecha = fecha.toISOString().slice(0, 10); 
      const inicio = new Date(textoFecha + "T" + diaFijo.horaInicio + ":00" + ZONA_HORARIA);
      const fin = new Date(inicio.getTime() + horasPorSesion * 60 * 60 * 1000);
      sesiones.push({ inicio: inicio, fin: fin });
    }
  }
  return sesiones;
}