import { Router, Response } from "express";
import mongoose from "mongoose";
import { Tutoria } from "../models/Tutoria";
import { Categoria } from "../models/Categoria";
import { Usuario } from "../models/Usuario";
import { fncValidarToken, fncValidarTutorAprobado, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

const MODALIDADES_VALIDAS = ["virtual", "casa_tutor", "domicilio"];

async function fncValidarDatosTutoria(datos: any): Promise<string> {
  if (!datos.titulo || String(datos.titulo).trim() === "") {
    return "El título es obligatorio";
  }
  if (!datos.descripcion || String(datos.descripcion).trim() === "") {
    return "La descripción es obligatoria";
  }

  if (!mongoose.isValidObjectId(datos.categoria)) {
    return "Selecciona una categoría válida";
  }
  const categoria = await Categoria.findById(datos.categoria);
  if (!categoria || !categoria.activa) {
    return "La categoría no existe o está desactivada";
  }

  if (!Array.isArray(datos.modalidades) || datos.modalidades.length === 0) {
    return "Elige al menos una modalidad";
  }
  for (let i = 0; i < datos.modalidades.length; i++) {
    if (!MODALIDADES_VALIDAS.includes(datos.modalidades[i])) {
      return "Alguna modalidad no es válida";
    }
  }

  if (typeof datos.tarifaHora !== "number" || datos.tarifaHora <= 0) {
    return "La tarifa por hora debe ser mayor a 0";
  }
  if (datos.modalidades.includes("domicilio")) {
    if (typeof datos.tarifaKm !== "number" || datos.tarifaKm <= 0) {
      return "Indica la tarifa por kilómetro para las clases a domicilio";
    }
  }
  return "";
}

async function fncListarTutorias(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const idsTutores = await Usuario.distinct("_id", { rol: "tutor", aprobado: true, estado: "activo" });
    const filtro: any = { activa: true, tutor: { $in: idsTutores } };

    if (req.query.categoria) {
      const categoriaId = String(req.query.categoria);
      if (!mongoose.isValidObjectId(categoriaId)) {
        res.status(400).json({ mensaje: "Categoría inválida" });
        return;
      }
      const idsCategorias = await Categoria.distinct("_id", {
        $or: [{ _id: categoriaId }, { padre: categoriaId }],
      });
      filtro.categoria = { $in: idsCategorias };
    }

    if (req.query.modalidad) {
      filtro.modalidades = String(req.query.modalidad);
    }

    const tutorias = await Tutoria.find(filtro)
      .populate("tutor", "nombre foto biografia")
      .populate("categoria", "nombre")
      .sort({ createdAt: -1 });
    res.json(tutorias);
  } catch (error) {
    console.log("Error al listar tutorías:", error);
    res.status(500).json({ mensaje: "Error al obtener las tutorías" });
  }
}

async function fncListarMisTutorias(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const tutorias = await Tutoria.find({ tutor: req.usuarioId })
      .populate("categoria", "nombre")
      .sort({ createdAt: -1 });
    res.json(tutorias);
  } catch (error) {
    console.log("Error al listar mis tutorías:", error);
    res.status(500).json({ mensaje: "Error al obtener tus tutorías" });
  }
}

async function fncCrearTutoria(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const mensaje = await fncValidarDatosTutoria(req.body);
    if (mensaje !== "") {
      res.status(400).json({ mensaje: mensaje });
      return;
    }

    const tieneDomicilio = req.body.modalidades.includes("domicilio");
    const tutoria = new Tutoria({
      tutor: req.usuarioId, // sale del token, no del body
      categoria: req.body.categoria,
      titulo: String(req.body.titulo).trim(),
      descripcion: String(req.body.descripcion).trim(),
      modalidades: req.body.modalidades,
      tarifaHora: req.body.tarifaHora,
      tarifaKm: tieneDomicilio ? req.body.tarifaKm : 0,
    });
    await tutoria.save();
    res.status(201).json(tutoria);
  } catch (error) {
    console.log("Error al crear tutoría:", error);
    res.status(500).json({ mensaje: "Error al crear la tutoría" });
  }
}

async function fncActualizarTutoria(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de tutoría inválido" });
      return;
    }

    const tutoria = await Tutoria.findById(id);
    if (!tutoria) {
      res.status(404).json({ mensaje: "Tutoría no encontrada" });
      return;
    }
    if (tutoria.tutor.toString() !== req.usuarioId) {
      res.status(403).json({ mensaje: "Esta tutoría no es tuya" });
      return;
    }

    const mensaje = await fncValidarDatosTutoria(req.body);
    if (mensaje !== "") {
      res.status(400).json({ mensaje: mensaje });
      return;
    }

    const tieneDomicilio = req.body.modalidades.includes("domicilio");
    tutoria.categoria = req.body.categoria;
    tutoria.titulo = String(req.body.titulo).trim();
    tutoria.descripcion = String(req.body.descripcion).trim();
    tutoria.modalidades = req.body.modalidades;
    tutoria.tarifaHora = req.body.tarifaHora;
    tutoria.tarifaKm = tieneDomicilio ? req.body.tarifaKm : 0;
    if (typeof req.body.activa === "boolean") {
      tutoria.activa = req.body.activa;
    }
    await tutoria.save();
    res.json(tutoria);
  } catch (error) {
    console.log("Error al actualizar tutoría:", error);
    res.status(500).json({ mensaje: "Error al actualizar la tutoría" });
  }
}

router.get("/", fncValidarToken, fncListarTutorias);
router.get("/mias", fncValidarToken, fncValidarTutorAprobado, fncListarMisTutorias);
router.post("/", fncValidarToken, fncValidarTutorAprobado, fncCrearTutoria);
router.put("/:id", fncValidarToken, fncValidarTutorAprobado, fncActualizarTutoria);

export default router;