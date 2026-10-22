import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import PanelTutores from "../components/PanelTutores";
import PanelCategorias from "../components/PanelCategorias";
import { fncObtenerUsuarioGuardado } from "../services/api";
import "../styles/admin.scss";

function Admin() {
  const navegar = useNavigate();
  const [pestana, setPestana] = useState("tutores");

  useEffect(function fncRevisarAdmin() {
    const usuarioGuardado = fncObtenerUsuarioGuardado();
    if (!usuarioGuardado) {
      navegar("/login");
    } else if (usuarioGuardado.rol !== "admin") {
      navegar("/inicio");
    }
  }, []);

  function fncCambiarPestana(evento: MouseEvent<HTMLButtonElement>): void {
    setPestana(evento.currentTarget.value);
  }

  function fncIrAlInicio(): void {
    navegar("/inicio");
  }

  return (
    <div className="admin">
      <div className="admin__encabezado">
        <h1>Panel de administración</h1>
        <button onClick={fncIrAlInicio}>Volver al inicio</button>
      </div>

      <div className="admin__pestanas">
        <button
          value="tutores"
          className={pestana === "tutores" ? "admin__pestana admin__pestana--activa" : "admin__pestana"}
          onClick={fncCambiarPestana}
        >
          Tutores
        </button>
        <button
          value="categorias"
          className={pestana === "categorias" ? "admin__pestana admin__pestana--activa" : "admin__pestana"}
          onClick={fncCambiarPestana}
        >
          Categorías
        </button>
      </div>

      <div className="admin__panel">
        {pestana === "tutores" ? <PanelTutores /> : <PanelCategorias />}
      </div>
    </div>
  );
}

export default Admin;