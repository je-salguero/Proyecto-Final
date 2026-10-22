import dotenv from "dotenv";
import rutasAutenticacion from "./routes/autenticacion";
import rutasCategorias from "./routes/categorias";
import rutasAdmin from "./routes/admin";
import rutasDisponibilidad from "./routes/disponibilidad";
import rutasTutorias from "./routes/tutorias";
import rutasReservas from "./routes/reservas";
import rutasResenas from "./routes/resenas";
dotenv.config(); 
import rutasReportes from "./routes/reportes";
import express from "express";
import cors from "cors";
import { fncConectarBaseDatos } from "./config/db";


const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use("/api/auth", rutasAutenticacion);
app.use("/api/categorias", rutasCategorias);
app.use("/api/admin", rutasAdmin);
app.use("/api/disponibilidad", rutasDisponibilidad);
app.use("/api/tutorias", rutasTutorias);
app.use("/api/reservas", rutasReservas);
app.use("/api/resenas", rutasResenas);
app.use("/api/reportes", rutasReportes);



app.get("/", (req, res) => {
  res.send("API del marketplace funcionando");
});

async function fncIniciarServidor(): Promise<void> {
  await fncConectarBaseDatos();
  const puerto = process.env.PORT || 4000;
  app.listen(puerto, () => {
    console.log("Servidor en puerto " + puerto);
  });
}

fncIniciarServidor();
