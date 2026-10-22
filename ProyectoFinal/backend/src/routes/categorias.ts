import { Router, Response } from "express";
import mongoose from "mongoose";
import { Categoria } from "../models/Categoria";
import { fncValidarToken, fncValidarAdmin, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

async function fncListarCategorias(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const filtro = req.rol === "admin" ? {} : { activa: true };
    const categorias = await Categoria.find(filtro).sort({ nombre: 1 }); 
    res.json(categorias);
  } catch (error) {
    console.log("Error al listar categorías:", error);
    res.status(500).json({ mensaje: "Error al obtener las categorías" });
  }
}

async function fncCrearCategoria(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const nombre = String(req.body.nombre || "").trim();
    const descripcion = String(req.body.descripcion || "").trim();
    const padre = String(req.body.padre || "");

    if (nombre === "") {
      res.status(400).json({ mensaje: "El nombre es obligatorio" });
      return;
    }

    if (padre !== "") {
      if (!mongoose.isValidObjectId(padre)) {
        res.status(400).json({ mensaje: "La categoría principal no es válida" });
        return;
      }
      const categoriaPadre = await Categoria.findById(padre);
      if (!categoriaPadre) {
        res.status(404).json({ mensaje: "La categoría principal no existe" });
        return;
      }
      if (categoriaPadre.padre !== "") {
        res.status(400).json({ mensaje: "Solo se permiten categorías y subcategorías" });
        return;
      }
    }

    const repetida = await Categoria.findOne({ nombre: nombre, padre: padre });
    if (repetida) {
      res.status(400).json({ mensaje: "Ya existe una categoría con ese nombre" });
      return;
    }

    const categoria = new Categoria({ nombre: nombre, descripcion: descripcion, padre: padre });
    await categoria.save();
    res.status(201).json(categoria);
  } catch (error) {
    console.log("Error al crear categoría:", error);
    res.status(500).json({ mensaje: "Error al crear la categoría" });
  }
}

async function fncActualizarCategoria(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de categoría inválido" });
      return;
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      res.status(404).json({ mensaje: "Categoría no encontrada" });
      return;
    }

    if (req.body.nombre !== undefined) {
      const nombre = String(req.body.nombre).trim();
      if (nombre === "") {
        res.status(400).json({ mensaje: "El nombre no puede quedar vacío" });
        return;
      }
      const repetida = await Categoria.findOne({
        nombre: nombre,
        padre: categoria.padre,
        _id: { $ne: categoria._id },
      });
      if (repetida) {
        res.status(400).json({ mensaje: "Ya existe una categoría con ese nombre" });
        return;
      }
      categoria.nombre = nombre;
    }
    if (req.body.descripcion !== undefined) {
      categoria.descripcion = String(req.body.descripcion).trim();
    }
    if (typeof req.body.activa === "boolean") {
      categoria.activa = req.body.activa;
    }

    await categoria.save();
    res.json(categoria);
  } catch (error) {
    console.log("Error al actualizar categoría:", error);
    res.status(500).json({ mensaje: "Error al actualizar la categoría" });
  }
}

async function fncEliminarCategoria(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) {
      res.status(400).json({ mensaje: "Id de categoría inválido" });
      return;
    }

    const categoria = await Categoria.findById(id);
    if (!categoria) {
      res.status(404).json({ mensaje: "Categoría no encontrada" });
      return;
    }

    // No dejamos subcategorías huérfanas: primero hay que eliminarlas
    const cantidadHijas = await Categoria.countDocuments({ padre: id });
    if (cantidadHijas > 0) {
      res.status(400).json({ mensaje: "Elimina primero sus subcategorías" });
      return;
    }

    await categoria.deleteOne();
    res.json({ mensaje: "Categoría eliminada" });
  } catch (error) {
    console.log("Error al eliminar categoría:", error);
    res.status(500).json({ mensaje: "Error al eliminar la categoría" });
  }
}

router.get("/", fncValidarToken, fncListarCategorias);
router.post("/", fncValidarToken, fncValidarAdmin, fncCrearCategoria);
router.put("/:id", fncValidarToken, fncValidarAdmin, fncActualizarCategoria);
router.delete("/:id", fncValidarToken, fncValidarAdmin, fncEliminarCategoria);

export default router;