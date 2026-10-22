import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import PanelReservasTutor from "../components/PanelReservasTutor";
import PanelOfertas from "../components/PanelOfertas";
import PanelDisponibilidad from "../components/PanelDisponibilidad";
import { fncObtenerUsuarioGuardado, fncPeticion } from "../services/api";
import type { Usuario } from "../services/api";
import "../styles/tutor.scss";
import PanelResenas from "../components/PanelResenas";

function Tutor() {
  const navegar = useNavigate();
  const [pestana, setPestana] = useState("reservas");
  const [aprobado, setAprobado] = useState<boolean | null>(null);

  useEffect(function fncRevisarTutor() {
    const usuarioGuardado = fncObtenerUsuarioGuardado();
    if (!usuarioGuardado) {
      navegar("/login");
      return;
    }
    if (usuarioGuardado.rol !== "tutor") {
      navegar("/inicio");
      return;
    }

    async function fncConsultarAprobacion(): Promise<void> {
      const respuesta = await fncPeticion("/api/auth/perfil");
      if (respuesta.ok) {
        const perfil: Usuario = await respuesta.json();
        setAprobado(perfil.aprobado);
      }
    }
    fncConsultarAprobacion();
  }, []);

  function fncCambiarPestana(evento: MouseEvent<HTMLButtonElement>): void {
    setPestana(evento.currentTarget.value);
  }

  function fncIrAlInicio(): void {
    navegar("/inicio");
  }

  function fncClasePestana(nombre: string): string {
    return pestana === nombre ? "tutor__pestana tutor__pestana--activa" : "tutor__pestana";
  }

  if (aprobado === null) {
    return <p className="tutor__ayuda">Cargando...</p>;
  }

  return (
    <div className="tutor">
      <div className="tutor__encabezado">
        <h1>Panel de tutor</h1>
        <button onClick={fncIrAlInicio}>Volver al inicio</button>
      </div>

      {aprobado === false ? (
        <div className="tutor__aviso">
          Tu perfil de tutor todavía está pendiente de aprobación. Cuando un administrador lo apruebe, podrás
          publicar tutorías y recibir reservas.
        </div>
      ) : (
        <>
          <div className="tutor__pestanas">
            <button value="reservas" className={fncClasePestana("reservas")} onClick={fncCambiarPestana}>
              Reservas
            </button>
            <button value="ofertas" className={fncClasePestana("ofertas")} onClick={fncCambiarPestana}>
              Mis tutorías
            </button>
            <button value="disponibilidad" className={fncClasePestana("disponibilidad")} onClick={fncCambiarPestana}>
              Disponibilidad
            </button>
            <button value="resenas" className={fncClasePestana("resenas")} onClick={fncCambiarPestana}>
              Mis reseñas
            </button>
          </div>

          <div className="tutor__panel">
            {pestana === "reservas" && <PanelReservasTutor />}
            {pestana === "ofertas" && <PanelOfertas />}
            {pestana === "disponibilidad" && <PanelDisponibilidad />}
            {pestana === "reservas" && <PanelReservasTutor />}
            {pestana === "resenas" && <PanelResenas />} 
          </div>
        </>
      )}
    </div>
  );
}

export default Tutor;