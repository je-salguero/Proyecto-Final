import mongoose from "mongoose";

export interface DiaFijo {
  dia: number;
  horaInicio: string;
}

export interface Sesion {
  inicio: Date;
  fin: Date;
}

export interface IReserva {
  tutoria: mongoose.Types.ObjectId;
  tutor: mongoose.Types.ObjectId;
  estudiante: mongoose.Types.ObjectId;
  modalidad: string; 
  fechaInicio: string; 
  semanas: number; 
  horasPorSesion: number;
  diasFijos: DiaFijo[]; 
  sesiones: Sesion[]; 
  tarifaHora: number;
  tarifaKm: number;
  distanciaKm: number;
  costoClases: number;
  costoTraslado: number;
  total: number;
  estado: string; 
}

const diaFijoSchema = new mongoose.Schema<DiaFijo>(
  {
    dia: { type: Number, required: true },
    horaInicio: { type: String, required: true },
  },
  { _id: false }
);

const sesionSchema = new mongoose.Schema<Sesion>(
  {
    inicio: { type: Date, required: true },
    fin: { type: Date, required: true },
  },
  { _id: false }
);

const reservaSchema = new mongoose.Schema<IReserva>(
  {
    tutoria: { type: mongoose.Schema.Types.ObjectId, ref: "Tutoria", required: true },
    tutor: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    estudiante: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    modalidad: { type: String, required: true },
    fechaInicio: { type: String, required: true },
    semanas: { type: Number, required: true },
    horasPorSesion: { type: Number, required: true },
    diasFijos: { type: [diaFijoSchema], required: true },
    sesiones: { type: [sesionSchema], required: true },
    tarifaHora: { type: Number, required: true },
    tarifaKm: { type: Number, default: 0 },
    distanciaKm: { type: Number, default: 0 },
    costoClases: { type: Number, required: true },
    costoTraslado: { type: Number, default: 0 },
    total: { type: Number, required: true },
    estado: { type: String, default: "pendiente" },
  },
  { timestamps: true }
);

export const Reserva = mongoose.model<IReserva>("Reserva", reservaSchema);