import dotenv from "dotenv";
import rutasAutenticacion from "./routes/autenticacion";
dotenv.config(); 

import express from "express";
import cors from "cors";
import { fncConectarBaseDatos } from "./config/db";

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use("/api/auth", rutasAutenticacion);

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
