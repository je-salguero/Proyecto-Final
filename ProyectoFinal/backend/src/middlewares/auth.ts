import { Request, Response, NextFunction } from "express";
import { Usuario } from "../models/Usuario";
import jwt from "jsonwebtoken";

export interface SolicitudAutenticada extends Request {
  usuarioId?: string;
  rol?: string;
}

interface DatosToken {
  id: string;
  rol: string;
}

export function fncValidarToken(
  req: SolicitudAutenticada,
  res: Response,
  next: NextFunction
): void {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    res.status(401).json({ mensaje: "Token no enviado" });
    return;
  }

  const token = encabezado.split(" ")[1];

  try {
    const datos = jwt.verify(token, process.env.JWT_SECRETO as string) as DatosToken;
    req.usuarioId = datos.id;
    req.rol = datos.rol;
    next(); 
  } catch (error) {
    res.status(401).json({ mensaje: "Token inválido o expirado" });
  }
}

export function fncValidarAdmin(
  req: SolicitudAutenticada,
  res: Response,
  next: NextFunction
): void {
  if (req.rol !== "admin") {
    res.status(403).json({ mensaje: "Acceso solo para administradores" });
    return;
  }
  next();
}

export async function fncValidarTutorAprobado(
  req: SolicitudAutenticada,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const usuario = await Usuario.findById(req.usuarioId);

    if (!usuario || usuario.rol !== "tutor") {
      res.status(403).json({ mensaje: "Solo los tutores pueden hacer esto" });
      return;
    }
    if (usuario.estado !== "activo") {
      res.status(403).json({ mensaje: "Tu cuenta está suspendida" });
      return;
    }
    if (!usuario.aprobado) {
      res.status(403).json({ mensaje: "Tu perfil de tutor todavía no ha sido aprobado" });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ mensaje: "Error al verificar al tutor" });
  }
}