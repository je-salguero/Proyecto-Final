import { Request, Response, NextFunction } from "express";
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