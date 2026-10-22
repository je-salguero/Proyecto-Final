import { Router } from "express";
import mongoose from "mongoose";
import { Resena } from "../models/Resena";
import { Reserva } from "../models/Reserva";
import { fncValidarToken, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

function fncCalcularPromedio(calificaciones: number[]): number {
  if (calificaciones.length === 0) {
    return 0;
  }
  let suma = 0;
  for (const nota of calificaciones) {
    suma = suma + nota;
  }
  return Math.round((suma / calificaciones.length) * 10) / 10;
}

async function fncArmarRespuestaDeTutor(tutorId: string) {
  const resenas = await Resena.find({ tutor: tutorId })
    .populate("estudiante", "nombre foto") 
    .sort({ createdAt: -1 }); 

  const notas: number[] = [];
  for (const resena of resenas) {
    notas.push(resena.calificacion);
  }

  return {
    promedio: fncCalcularPromedio(notas),
    total: resenas.length,
    resenas: resenas,
  };
}

router.post("/", fncValidarToken, async (req, res) => {
  const solicitud = req as SolicitudAutenticada;
  try {
    const { reservaId, calificacion, comentario } = req.body;

    const nota = Number(calificacion);
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      return res.status(400).json({ mensaje: "La calificación debe ser un número de 1 a 5" });
    }

    const texto = String(comentario || "").trim();
    if (texto.length > 500) {
      return res.status(400).json({ mensaje: "El comentario no puede pasar de 500 caracteres" });
    }

    if (!mongoose.isValidObjectId(reservaId)) {
      return res.status(400).json({ mensaje: "Reserva inválida" });
    }

    const reserva = await Reserva.findById(reservaId);
    if (!reserva) {
      return res.status(404).json({ mensaje: "La reserva no existe" });
    }

    if (String(reserva.estudiante) !== solicitud.usuarioId) {
      return res.status(403).json({ mensaje: "Esta reserva no es tuya" });
    }

    if (reserva.estado !== "aceptada") {
      return res.status(400).json({ mensaje: "Solo puedes calificar reservas aceptadas" });
    }

    const primeraSesion = reserva.sesiones[0];
    if (!primeraSesion || new Date(primeraSesion.inicio) > new Date()) {
      return res.status(400).json({ mensaje: "Podrás calificar cuando empiece la primera clase" });
    }

    const yaExiste = await Resena.findOne({ reserva: reserva._id });
    if (yaExiste) {
      return res.status(400).json({ mensaje: "Esta reserva ya fue calificada" });
    }

    const nueva = await Resena.create({
      reserva: reserva._id,
      tutor: reserva.tutor,
      estudiante: reserva.estudiante,
      calificacion: nota,
      comentario: texto,
    });

    res.status(201).json(nueva);
  } catch (error) {
    console.log(error);
    res.status(500).json({ mensaje: "No se pudo guardar la reseña" });
  }
});

router.get("/mias", fncValidarToken, async (req, res) => {
  const solicitud = req as SolicitudAutenticada;
  try {
    const resenas = await Resena.find({ estudiante: solicitud.usuarioId });
    const ids: string[] = [];
    for (const resena of resenas) {
      ids.push(String(resena.reserva));
    }
    res.json(ids);
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron cargar tus reseñas" });
  }
});

router.get("/recibidas", fncValidarToken, async (req, res) => {
  const solicitud = req as SolicitudAutenticada;
  try {
    res.json(await fncArmarRespuestaDeTutor(solicitud.usuarioId as string));
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron cargar las reseñas" });
  }
});

router.get("/tutor/:id", fncValidarToken, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ mensaje: "Tutor inválido" });
    }
    res.json(await fncArmarRespuestaDeTutor(req.params.id));
  } catch (error) {
    res.status(500).json({ mensaje: "No se pudieron cargar las reseñas" });
  }
});

export default router;