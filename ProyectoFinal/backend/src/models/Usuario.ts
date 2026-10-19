import mongoose from "mongoose";

export interface IUsuario {
  nombre: string;
  correo: string;
  foto: string;
  rol: string; 
  estado: string; // activo o suspendido
  telefono: string;
  genero: string;
  direccion: string;
  latitud: number;
  longitud: number;
  documento: string; 
  categorias: string[]; 
  perfilCompleto: boolean; 

  //solo tutores
  hojaDeVida: string; 
  biografia: string;
  tarifaHora: number;
  aprobado: boolean; 

  motivoSuspension: string;
  fechaSuspension: Date | null;
}

const usuarioSchema = new mongoose.Schema<IUsuario>(
  {
    nombre: { type: String, required: true },
    correo: { type: String, required: true, unique: true }, 
    foto: { type: String, default: "" },
    rol: { type: String, default: "estudiante" },
    estado: { type: String, default: "activo" },
    telefono: { type: String, default: "" },
    genero: { type: String, default: "" },
    direccion: { type: String, default: "" },
    latitud: { type: Number, default: 0 },
    longitud: { type: Number, default: 0 },
    documento: { type: String, default: "" },
    categorias: { type: [String], default: [] },
    perfilCompleto: { type: Boolean, default: false },

    hojaDeVida: { type: String, default: "" },
    biografia: { type: String, default: "" },
    tarifaHora: { type: Number, default: 0 },
    aprobado: { type: Boolean, default: false },

    motivoSuspension: { type: String, default: "" },
    fechaSuspension: { type: Date, default: null },
  },
  { timestamps: true } 
);

export const Usuario = mongoose.model<IUsuario>("Usuario", usuarioSchema);
