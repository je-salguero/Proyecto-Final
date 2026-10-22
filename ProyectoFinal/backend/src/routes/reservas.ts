import { Router, Response } from "express";
import mongoose from "mongoose";
import { Reserva, DiaFijo, Sesion } from "../models/Reserva";
import { Tutoria } from "../models/Tutoria";
import { Usuario } from "../models/Usuario";
import { Disponibilidad } from "../models/Disponibilidad";
import { fncValidarToken, SolicitudAutenticada } from "../middlewares/auth";
import { fncEsHoraValida, fncEsFechaValida, fncHoraAMinutos, fncGenerarSesiones, fncCalcularDistanciaKm, fncRedondear,} from "../utilidades/tiempo";

const router = Router();

const BLOQUES_VALIDOS = [4, 8, 12];

function fncValidarDatosReserva(datos: any): string {
  if (!mongoose.isValidObjectId(datos.tutoria)) {
    return "Selecciona una tutoría válida";
  }
  if (typeof datos.modalidad !== "string") {
    return "Elige una modalidad";
  }
  if (typeof datos.fechaInicio !== "string" || !fncEsFechaValida(datos.fechaInicio)) {
    return "La fecha de inicio no es válida (formato AAAA-MM-DD)";
  }
  if (!BLOQUES_VALIDOS.includes(datos.semanas)) {
    return "La duración debe ser de 4, 8 o 12 semanas";
  }

  const horas = datos.horasPorSesion;
  if (typeof horas !== "number" || horas < 1 || horas > 4 || !Number.isInteger(horas * 2)) {
    return "Las horas por sesión van de 1 a 4, en pasos de media hora";
  }

  if (!Array.isArray(datos.diasFijos) || datos.diasFijos.length === 0) {
    return "Elige al menos un día fijo a la semana";
  }

  const diasUsados: number[] = [];
  for (let i = 0; i < datos.diasFijos.length; i++) {
    const diaFijo = datos.diasFijos[i];
    const diaValido = Number.isInteger(diaFijo.dia) && diaFijo.dia >= 0 && diaFijo.dia <= 6;
    if (!diaValido || !fncEsHoraValida(diaFijo.horaInicio)) {
      return "Hay un día u hora inválidos";
    }
    if (diasUsados.includes(diaFijo.dia)) {
      return "No repitas el mismo día de la semana";
    }
    diasUsados.push(diaFijo.dia);

    if (fncHoraAMinutos(diaFijo.horaInicio) + horas * 60 > 24 * 60) {
      return "Una clase no puede terminar después de las 24:00";
    }
  }
  return "";
}

async function fncTutorTieneDisponibilidad(
  tutorId: string,
  diasFijos: DiaFijo[],
  horasPorSesion: number
): Promise<boolean> {
  for (let i = 0; i < diasFijos.length; i++) {
    const inicioClase = fncHoraAMinutos(diasFijos[i].horaInicio);
    const finClase = inicioClase + horasPorSesion * 60;

    const bloques = await Disponibilidad.find({ tutor: tutorId, dia: diasFijos[i].dia });
    let cabe = false;
    for (let j = 0; j < bloques.length; j++) {
      const inicioBloque = fncHoraAMinutos(bloques[j].horaInicio);
      const finBloque = fncHoraAMinutos(bloques[j].horaFin);
      if (inicioBloque <= inicioClase && finBloque >= finClase) {
        cabe = true;
      }
    }
    if (!cabe) {
      return false;
    }
  }
  return true;
}

async function fncHayTraslape(campo: string, usuarioId: string, sesiones: Sesion[]): Promise<boolean> {

  const condiciones: any[] = [];
  for (let i = 0; i < sesiones.length; i++) {
    condiciones.push({
      sesiones: { $elemMatch: { inicio: { $lt: sesiones[i].fin }, fin: { $gt: sesiones[i].inicio } } },
    });
  }

  const filtro: any = {
    estado: { $in: ["pendiente", "aceptada"] }, 
    $or: condiciones, 
  };
  filtro[campo] = usuarioId;

  const existente = await Reserva.findOne(filtro);
  return existente !== null;
}

async function fncCrearReserva(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const mensaje = fncValidarDatosReserva(req.body);
    if (mensaje !== "") {
      res.status(400).json({ mensaje: mensaje });
      return;
    }
    const fechaInicio: string = req.body.fechaInicio;
    const semanas: number = req.body.semanas;
    const horas: number = req.body.horasPorSesion;
    const diasFijos: DiaFijo[] = req.body.diasFijos;
    const modalidad: string = req.body.modalidad;

    const estudiante = await Usuario.findById(req.usuarioId);
    if (!estudiante || estudiante.rol !== "estudiante") {
      res.status(403).json({ mensaje: "Solo los estudiantes pueden reservar" });
      return;
    }
    if (estudiante.estado !== "activo") {
      res.status(403).json({ mensaje: "Tu cuenta está suspendida" });
      return;
    }
    if (!estudiante.perfilCompleto) {
      res.status(400).json({ mensaje: "Completa tu perfil antes de reservar" });
      return;
    }

    const tutoria = await Tutoria.findById(req.body.tutoria);
    if (!tutoria || !tutoria.activa) {
      res.status(404).json({ mensaje: "La tutoría no está disponible" });
      return;
    }
    const tutor = await Usuario.findById(tutoria.tutor);
    if (!tutor || !tutor.aprobado || tutor.estado !== "activo") {
      res.status(404).json({ mensaje: "El tutor no está disponible" });
      return;
    }

    if (!tutoria.modalidades.includes(modalidad)) {
      res.status(400).json({ mensaje: "El tutor no ofrece esa modalidad" });
      return;
    }

    const sesiones = fncGenerarSesiones(fechaInicio, semanas, diasFijos, horas);
    for (let i = 0; i < sesiones.length; i++) {
      if (sesiones[i].inicio.getTime() <= Date.now()) {
        res.status(400).json({ mensaje: "La fecha de inicio debe ser futura" });
        return;
      }
    }

    const tutorId = tutoria.tutor.toString();
    const hayDisponibilidad = await fncTutorTieneDisponibilidad(tutorId, diasFijos, horas);
    if (!hayDisponibilidad) {
      res.status(400).json({ mensaje: "El tutor no tiene disponibilidad en esos horarios" });
      return;
    }

    if (await fncHayTraslape("tutor", tutorId, sesiones)) {
      res.status(409).json({ mensaje: "El tutor ya tiene una tutoría en ese horario" });
      return;
    }
    if (await fncHayTraslape("estudiante", estudiante._id.toString(), sesiones)) {
      res.status(409).json({ mensaje: "Ya tienes una tutoría en ese horario" });
      return;
    }

    const totalSesiones = sesiones.length;
    const costoClases = fncRedondear(totalSesiones * horas * tutoria.tarifaHora, 2);
    let distanciaKm = 0;
    let costoTraslado = 0;
    if (modalidad === "domicilio") {
      distanciaKm = fncRedondear(
        fncCalcularDistanciaKm(tutor.latitud, tutor.longitud, estudiante.latitud, estudiante.longitud),
        1
      );
      costoTraslado = fncRedondear(distanciaKm * tutoria.tarifaKm * totalSesiones, 2);
    }
    const total = fncRedondear(costoClases + costoTraslado, 2);

    const reserva = new Reserva({
      tutoria: tutoria._id,
      tutor: tutoria.tutor,
      estudiante: estudiante._id,
      modalidad: modalidad,
      fechaInicio: fechaInicio,
      semanas: semanas,
      horasPorSesion: horas,
      diasFijos: diasFijos,
      sesiones: sesiones,
      tarifaHora: tutoria.tarifaHora,
      tarifaKm: tutoria.tarifaKm,
      distanciaKm: distanciaKm,
      costoClases: costoClases,
      costoTraslado: costoTraslado,
      total: total,
      estado: "pendiente",
    });
    await reserva.save();
    res.status(201).json(reserva);
  } catch (error) {
    console.log("Error al crear reserva:", error);
    res.status(500).json({ mensaje: "Error al crear la reserva" });
  }
}

async function fncListarMisReservas(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const reservas = await Reserva.find({
      $or: [{ estudiante: req.usuarioId }, { tutor: req.usuarioId }],
    })
      .populate("tutoria", "titulo")
      .populate("tutor", "nombre foto")
      .populate("estudiante", "nombre foto telefono")
      .sort({ createdAt: -1 });
    res.json(reservas);
  } catch (error) {
    console.log("Error al listar reservas:", error);
    res.status(500).json({ mensaje: "Error al obtener las reservas" });
  }
}

async function fncResponderReserva(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de reserva inválido" });
      return;
    }
    if (typeof req.body.aceptar !== "boolean") {
      res.status(400).json({ mensaje: "Envía aceptar: true o false" });
      return;
    }

    const reserva = await Reserva.findById(id);
    if (!reserva) {
      res.status(404).json({ mensaje: "Reserva no encontrada" });
      return;
    }
    if (reserva.tutor.toString() !== req.usuarioId) {
      res.status(403).json({ mensaje: "Solo el tutor de esta reserva puede responder" });
      return;
    }
    if (reserva.estado !== "pendiente") {
      res.status(400).json({ mensaje: "Esta reserva ya fue respondida" });
      return;
    }

    reserva.estado = req.body.aceptar ? "aceptada" : "rechazada";
    await reserva.save();
    res.json(reserva);
  } catch (error) {
    console.log("Error al responder reserva:", error);
    res.status(500).json({ mensaje: "Error al responder la reserva" });
  }
}

async function fncCancelarReserva(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de reserva inválido" });
      return;
    }

    const reserva = await Reserva.findById(id);
    if (!reserva) {
      res.status(404).json({ mensaje: "Reserva no encontrada" });
      return;
    }

    // Solo quienes participan en la reserva pueden cancelarla
    const esTutor = reserva.tutor.toString() === req.usuarioId;
    const esEstudiante = reserva.estudiante.toString() === req.usuarioId;
    if (!esTutor && !esEstudiante) {
      res.status(403).json({ mensaje: "No participas en esta reserva" });
      return;
    }
    if (reserva.estado !== "pendiente" && reserva.estado !== "aceptada") {
      res.status(400).json({ mensaje: "Esta reserva ya no se puede cancelar" });
      return;
    }

    reserva.estado = "cancelada"; // libera el horario para otras reservas
    await reserva.save();
    res.json(reserva);
  } catch (error) {
    console.log("Error al cancelar reserva:", error);
    res.status(500).json({ mensaje: "Error al cancelar la reserva" });
  }
}

router.post("/", fncValidarToken, fncCrearReserva);
router.get("/mias", fncValidarToken, fncListarMisReservas);
router.put("/:id/responder", fncValidarToken, fncResponderReserva);
router.put("/:id/cancelar", fncValidarToken, fncCancelarReserva);

export default router;