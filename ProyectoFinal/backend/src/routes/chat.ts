import { Router } from "express";
import { Mensaje } from "../models/Mensaje";
import { fncValidarToken } from "../middlewares/auth";

const router = Router();

router.get("/:reservaId", fncValidarToken, async (req, res) => {
  try {
    const mensajes = await Mensaje.find({ reserva: req.params.reservaId })
      .populate("emisor", "nombre foto")
      .sort({ createdAt: 1 }); 
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al cargar el historial del chat" });
  }
});

export default router;