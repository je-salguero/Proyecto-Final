import { Router, Response } from "express";
import mongoose from "mongoose";
import { Disponibilidad } from "../models/Disponibilidad";
import { fncValidarToken, fncValidarTutorAprobado, SolicitudAutenticada } from "../middlewares/auth";
import { fncEsHoraValida, fncHoraAMinutos } from "../utilidades/tiempo";

const router = Router();

async function fncObtenerMiDisponibilidad(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const bloques = await Disponibilidad.find({ tutor: req.usuarioId }).sort({ dia: 1, horaInicio: 1 });
    res.json(bloques);
  } catch (error) {
    console.log("Error al obtener disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al obtener la disponibilidad" });
  }
}

async function fncObtenerDisponibilidadDeTutor(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de tutor inválido" });
      return;
    }
    const bloques = await Disponibilidad.find({ tutor: id }).sort({ dia: 1, horaInicio: 1 });
    res.json(bloques);
  } catch (error) {
    console.log("Error al obtener disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al obtener la disponibilidad" });
  }
}

async function fncGuardarDisponibilidad(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const bloques = req.body.bloques;
    if (!Array.isArray(bloques)) {
      res.status(400).json({ mensaje: "Envía la lista de bloques" });
      return;
    }

    for (let i = 0; i < bloques.length; i++) {
      const bloque = bloques[i];
      const diaValido = Number.isInteger(bloque.dia) && bloque.dia >= 0 && bloque.dia <= 6;
      if (!diaValido || !fncEsHoraValida(bloque.horaInicio) || !fncEsHoraValida(bloque.horaFin)) {
        res.status(400).json({ mensaje: "Hay un bloque con día u hora inválidos" });
        return;
      }
      if (fncHoraAMinutos(bloque.horaInicio) >= fncHoraAMinutos(bloque.horaFin)) {
        res.status(400).json({ mensaje: "La hora de inicio debe ser menor que la de fin" });
        return;
      }
    }

    for (let i = 0; i < bloques.length; i++) {
      for (let j = i + 1; j < bloques.length; j++) {
        if (bloques[i].dia === bloques[j].dia) {
          const seCruzan =
            fncHoraAMinutos(bloques[i].horaInicio) < fncHoraAMinutos(bloques[j].horaFin) &&
            fncHoraAMinutos(bloques[j].horaInicio) < fncHoraAMinutos(bloques[i].horaFin);
          if (seCruzan) {
            res.status(400).json({ mensaje: "Hay bloques del mismo día que se cruzan" });
            return;
          }
        }
      }
    }

    await Disponibilidad.deleteMany({ tutor: req.usuarioId });
    const nuevos: any[] = [];
    for (let i = 0; i < bloques.length; i++) {
      nuevos.push({
        tutor: req.usuarioId,
        dia: bloques[i].dia,
        horaInicio: bloques[i].horaInicio,
        horaFin: bloques[i].horaFin,
      });
    }
    await Disponibilidad.insertMany(nuevos);

    const guardados = await Disponibilidad.find({ tutor: req.usuarioId }).sort({ dia: 1, horaInicio: 1 });
    res.json(guardados);
  } catch (error) {
    console.log("Error al guardar disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al guardar la disponibilidad" });
  }
}

router.get("/mia", fncValidarToken, fncValidarTutorAprobado, fncObtenerMiDisponibilidad);
router.get("/tutor/:id", fncValidarToken, fncObtenerDisponibilidadDeTutor);
router.put("/", fncValidarToken, fncValidarTutorAprobado, fncGuardarDisponibilidad);

export default router;