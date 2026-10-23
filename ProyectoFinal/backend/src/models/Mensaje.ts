import mongoose from "mongoose";

export interface IMensaje {
  reserva: mongoose.Types.ObjectId;
  emisor: mongoose.Types.ObjectId; 
  texto: string;
}

const mensajeSchema = new mongoose.Schema<IMensaje>(
  {
    reserva: { type: mongoose.Schema.Types.ObjectId, ref: "Reserva", required: true },
    emisor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    texto: { type: String, required: true },
  },
  { timestamps: true }
);

export const Mensaje = mongoose.model<IMensaje>("Mensaje", mensajeSchema);