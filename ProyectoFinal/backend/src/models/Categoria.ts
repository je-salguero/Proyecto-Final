import mongoose from "mongoose";

export interface ICategoria {
  nombre: string;
  descripcion: string;
  padre: string; 
  activa: boolean;
}

const categoriaSchema = new mongoose.Schema<ICategoria>(
  {
    nombre: { type: String, required: true, trim: true }, 
    descripcion: { type: String, default: "", trim: true },
    padre: { type: String, default: "" },
    activa: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Categoria = mongoose.model<ICategoria>("Categoria", categoriaSchema);