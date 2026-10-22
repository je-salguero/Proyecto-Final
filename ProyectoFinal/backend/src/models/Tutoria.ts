import mongoose from "mongoose";

export interface ITutoria {
  tutor: mongoose.Types.ObjectId; 
  categoria: mongoose.Types.ObjectId; 
  titulo: string;
  descripcion: string;
  modalidades: string[]; 
  tarifaHora: number; 
  tarifaKm: number; 
  activa: boolean;
}

const tutoriaSchema = new mongoose.Schema<ITutoria>(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    categoria: { type: mongoose.Schema.Types.ObjectId, ref: "Categoria", required: true },
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    modalidades: { type: [String], required: true },
    tarifaHora: { type: Number, required: true },
    tarifaKm: { type: Number, default: 0 },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Tutoria = mongoose.model<ITutoria>("Tutoria", tutoriaSchema);