import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { fncConectarBaseDatos } from "./config/db";
import { createServer } from "http";
import { Server } from "socket.io"; 
import { Mensaje } from "./models/Mensaje";

import rutasAutenticacion from "./routes/autenticacion";
import rutasCategorias from "./routes/categorias";
import rutasAdmin from "./routes/admin";
import rutasDisponibilidad from "./routes/disponibilidad";
import rutasTutorias from "./routes/tutorias";
import rutasReservas from "./routes/reservas";
import rutasResenas from "./routes/resenas";
import rutasReportes from "./routes/reportes";
import rutasChat from "./routes/chat";

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
app.use("/api/chat", rutasChat); 

app.get("/", (req, res) => {
  res.send("API del marketplace funcionando");
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("Usuario conectado al socket:", socket.id);

  socket.on("unirse_chat", (reservaId) => {
    socket.join(reservaId);
  });

  socket.on("enviar_mensaje", async (datos) => {
    try {
      const nuevoMensaje = await Mensaje.create({
        reserva: datos.reservaId,
        emisor: datos.emisorId,
        texto: datos.texto,
      });

      await nuevoMensaje.populate("emisor", "nombre foto");

      io.to(datos.reservaId).emit("nuevo_mensaje", nuevoMensaje);
    } catch (error) {
      console.log("Error al guardar mensaje:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

async function fncIniciarServidor(): Promise<void> {
  await fncConectarBaseDatos();
  const puerto = process.env.PORT || 4000;
  
  httpServer.listen(puerto, () => {
    console.log("Servidor en puerto " + puerto);
  });
}

fncIniciarServidor();