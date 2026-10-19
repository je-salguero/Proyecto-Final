import mongoose from "mongoose";

export async function fncConectarBaseDatos(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Base de datos conectada");
  } catch (error) {
    console.log("Error al conectar con la base de datos");
    process.exit(1);
  }
}
