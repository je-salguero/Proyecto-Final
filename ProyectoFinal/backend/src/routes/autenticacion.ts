import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Usuario } from "../models/Usuario";
import { fncValidarToken, SolicitudAutenticada } from "../middlewares/auth";

const router = Router();

function fncCrearToken(id: string, rol: string): string {
  return jwt.sign({ id: id, rol: rol }, process.env.JWT_SECRETO as string, {
    expiresIn: process.env.JWT_DURACION as any, 
  });
}

async function fncLoginGoogle(req: Request, res: Response): Promise<void> {
  try {
    const credencial = req.body.credencial;
    if (!credencial) {
      res.status(400).json({ mensaje: "Falta la credencial de Google" });
      return;
    }

    const cliente = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await cliente.verifyIdToken({
      idToken: credencial,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const datosGoogle = ticket.getPayload();
    if (!datosGoogle || !datosGoogle.email) {
      res.status(401).json({ mensaje: "Credencial de Google inválida" });
      return;
    }

    let usuario = await Usuario.findOne({ correo: datosGoogle.email });
    let esNuevo = false;

    if (!usuario) {
      usuario = new Usuario({
        nombre: datosGoogle.name || "Sin nombre",
        correo: datosGoogle.email,
        foto: datosGoogle.picture || "",
      });
      await usuario.save();
      esNuevo = true;
    }

    const token = fncCrearToken(usuario._id.toString(), usuario.rol);

    res.json({ token: token, usuario: usuario, esNuevo: esNuevo });
    } catch (error) {
    console.log("Error en login con Google:", error);
    res.status(401).json({ mensaje: "No se pudo verificar con Google" });
  }
}

async function fncObtenerPerfil(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const usuario = await Usuario.findById(req.usuarioId);
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
      return;
    }
    res.json(usuario);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al obtener el perfil" });
  }
}

function fncEstaVacio(texto: string | undefined): boolean {
  return !texto || String(texto).trim() === "";
}

async function fncCompletarOnboarding(req: SolicitudAutenticada, res: Response): Promise<void> {
  try {
    const usuario = await Usuario.findById(req.usuarioId);
    if (!usuario) {
      res.status(404).json({ mensaje: "Usuario no encontrado" });
      return;
    }

    if (usuario.perfilCompleto) {
      res.status(400).json({ mensaje: "El perfil ya fue completado" });
      return;
    }

    const { rol, telefono, genero, direccion, latitud, longitud, documento, categorias } = req.body;
    const { hojaDeVida, biografia, tarifaHora } = req.body;

    if (rol !== "estudiante" && rol !== "tutor") {
      res.status(400).json({ mensaje: "El rol debe ser estudiante o tutor" });
      return;
    }

    if (fncEstaVacio(telefono) || fncEstaVacio(genero) || fncEstaVacio(direccion) || fncEstaVacio(documento)) {
      res.status(400).json({ mensaje: "Faltan datos obligatorios" });
      return;
    }

    if (
      typeof latitud !== "number" || typeof longitud !== "number" ||
      latitud < -90 || latitud > 90 || longitud < -180 || longitud > 180
    ) {
      res.status(400).json({ mensaje: "Debes fijar tu ubicación en el mapa" });
      return;
    }

    // Afinidad de categorías: al menos una
    if (!Array.isArray(categorias) || categorias.length === 0) {
      res.status(400).json({ mensaje: "Selecciona al menos una categoría" });
      return;
    }

    // Campos exclusivos de tutores
    if (rol === "tutor") {
      if (fncEstaVacio(hojaDeVida) || fncEstaVacio(biografia)) {
        res.status(400).json({ mensaje: "El tutor debe enviar hoja de vida y biografía" });
        return;
      }
      if (typeof tarifaHora !== "number" || tarifaHora <= 0) {
        res.status(400).json({ mensaje: "La tarifa por hora debe ser mayor a 0" });
        return;
      }
      usuario.hojaDeVida = hojaDeVida;
      usuario.biografia = biografia;
      usuario.tarifaHora = tarifaHora;
    }

    // Guardamos los datos comunes
    usuario.rol = rol;
    usuario.telefono = telefono;
    usuario.genero = genero;
    usuario.direccion = direccion;
    usuario.latitud = latitud;
    usuario.longitud = longitud;
    usuario.documento = documento;
    usuario.categorias = categorias;
    usuario.perfilCompleto = true;
    await usuario.save();

    const token = fncCrearToken(usuario._id.toString(), usuario.rol);
    res.json({ token: token, usuario: usuario });
  } catch (error) {
    console.log("Error en onboarding:", error);
    res.status(500).json({ mensaje: "Error al guardar el perfil" });
  }
}

router.post("/google", fncLoginGoogle);
router.get("/perfil", fncValidarToken, fncObtenerPerfil);
router.put("/onboarding", fncValidarToken, fncCompletarOnboarding);

export default router;