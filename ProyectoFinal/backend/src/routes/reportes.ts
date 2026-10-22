import { Router, Response } from "express";
import { Resena } from "../models/Resena";
import { Reserva } from "../models/Reserva";
import { Usuario } from "../models/Usuario";
import { fncValidarToken, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

async function fncValidarAdmin(req: SolicitudAutenticada, res: Response, next: Function) {
  try {
    const usuario = await Usuario.findById(req.usuarioId);
    if (!usuario || usuario.rol !== "admin") {
      return res.status(403).json({ mensaje: "Acceso denegado. Solo administradores." });
    }
    next();
  } catch (error) {
    res.status(500).json({ mensaje: "Error al validar rol" });
  }
}

router.get("/tutores", fncValidarToken, fncValidarAdmin, async (req, res) => {
  try {
    const ranking = await Resena.aggregate([
      { $group: { _id: "$tutor", promedio: { $avg: "$calificacion" }, totalResenas: { $sum: 1 } } },
      { $sort: { promedio: -1 } },
      { $lookup: { from: "usuarios", localField: "_id", foreignField: "_id", as: "datosTutor" } },
      { $unwind: "$datosTutor" },
      { $project: { nombre: "$datosTutor.nombre", promedio: { $round: ["$promedio", 1] }, totalResenas: 1 } }
    ]);
    res.json(ranking);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al generar ranking de tutores" });
  }
});

router.get("/demanda", fncValidarToken, fncValidarAdmin, async (req, res) => {
  try {
    const demanda = await Reserva.aggregate([
      { $lookup: { from: "tutorias", localField: "tutoria", foreignField: "_id", as: "datosTutoria" } },
      { $unwind: "$datosTutoria" },
      { $lookup: { from: "categorias", localField: "datosTutoria.categoria", foreignField: "_id", as: "datosCategoria" } },
      { $unwind: "$datosCategoria" },
      { $group: { _id: "$datosCategoria.nombre", totalReservas: { $sum: 1 } } },
      { $sort: { totalReservas: -1 } }
    ]);
    res.json(demanda);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al generar demanda por categoría" });
  }
});

router.get("/mensual", fncValidarToken, fncValidarAdmin, async (req, res) => {
  try {
    const mensual = await Reserva.aggregate([
      {
        $group: {
          _id: { 
            mes: { $month: "$createdAt" }, 
            anio: { $year: "$createdAt" } 
          },
          aceptadas: { 
            $sum: { $cond: [{ $eq: ["$estado", "aceptada"] }, 1, 0] } 
          },
          canceladas: { 
            $sum: { $cond: [{ $in: ["$estado", ["cancelada", "rechazada"]] }, 1, 0] } 
          }
        }
      },
      { $sort: { "_id.anio": 1, "_id.mes": 1 } }
    ]);
    res.json(mensual);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al generar reporte mensual" });
  }
});

export default router;