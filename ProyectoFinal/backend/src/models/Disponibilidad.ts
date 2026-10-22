import mongoose from "mongoose";

export interface IDisponibilidad {
  tutor: mongoose.Types.ObjectId;
  dia: number; 
  horaInicio: string; 
  horaFin: string; 
}

const disponibilidadSchema = new mongoose.Schema<IDisponibilidad>(
  {
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    dia: { type: Number, required: true },
    horaInicio: { type: String, required: true },
    horaFin: { type: String, required: true },
  },
  { collection: "disponibilidades" } 
);

export const Disponibilidad = mongoose.model<IDisponibilidad>("Disponibilidad", disponibilidadSchema);