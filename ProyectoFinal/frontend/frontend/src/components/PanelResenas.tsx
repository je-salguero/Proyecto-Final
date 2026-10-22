import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import ListaResenas from "./ListaResenas";
import { fncObtenerResenasRecibidas } from "../services/api";
import type { RespuestaResenas } from "../services/api";

function PanelResenas(): ReactElement {
  const [datos, setDatos] = useState<RespuestaResenas | null>(null);

  useEffect(() => {
    async function fncCargarResenas(): Promise<void> {
      setDatos(await fncObtenerResenasRecibidas());
    }
    fncCargarResenas();
  }, []);

  return (
    <section>
      <h2>Mis reseñas</h2>
      <ListaResenas datos={datos} />
    </section>
  );
}

export default PanelResenas;