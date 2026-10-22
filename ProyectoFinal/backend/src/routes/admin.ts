import { Router, Response } from "express";
import mongoose from "mongoose";
import { Usuario } from "../models/Usuario";
import { fncValidarToken, fncValidarAdmin, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

router.use(fncValidarToken, fncValidarAdmin);

async function fncListarTutores(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const filtro: any = { rol: "tutor", perfilCompleto: true };

    if (req.query.aprobado === "true") {
      filtro.aprobado = true;
    }
    if (req.query.aprobado === "false") {
      filtro.aprobado = false;
    }

    const tutores = await Usuario.find(filtro).sort({ createdAt: -1 });
    res.json(tutores);
  } catch (error) {
    console.log("Error al listar tutores:", error);
    res.status(500).json({ mensaje: "Error al obtener los tutores" });
  }
}

async function fncCambiarAprobacionTutor(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de usuario inválido" });
      return;
    }
    if (typeof req.body.aprobado !== "boolean") {
      res.status(400).json({ mensaje: "Envía aprobado: true o false" });
      return;
    }

    const tutor = await Usuario.findById(id);
    if (!tutor || tutor.rol !== "tutor") {
      res.status(404).json({ mensaje: "Tutor no encontrado" });
      return;
    }

    tutor.aprobado = req.body.aprobado;
    await tutor.save();
    res.json(tutor);
  } catch (error) {
    console.log("Error al cambiar aprobación:", error);
    res.status(500).json({ mensaje: "Error al actualizar el tutor" });
  }
}

router.get("/tutores", fncListarTutores);
router.put("/tutores/:id/aprobacion", fncCambiarAprobacionTutor);

export default router;