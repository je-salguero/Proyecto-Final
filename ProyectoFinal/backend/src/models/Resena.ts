import mongoose from "mongoose";

export interface IResena {
  reserva: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  estudiante: mongoose.Types.ObjectId;
  calificacion: number; 
  comentario: string;
}

const resenaSchema = new mongoose.Schema<IResena>(
  {
    reserva: { type: mongoose.Schema.Types.ObjectId, ref: "Reserva", required: true, unique: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    calificacion: { type: Number, required: true, min: 1, max: 5 },
    comentario: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Resena = mongoose.model<IResena>("Resena", resenaSchema);