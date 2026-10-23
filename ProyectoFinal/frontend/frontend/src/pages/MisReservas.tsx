import { useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fncObtenerMisReservas, fncCancelarReserva, fncRutaSiNoTieneRol } from "../services/api";
import type { ReservaDetalle } from "../services/api";
import { fncTextoModalidad, fncTextoDias, fncFormatearDinero } from "../utilidades/textos";
import "../styles/estudiante.scss";
import FormularioResena from "../components/FormularioResena";
import { fncObtenerMisResenas } from "../services/api";

function MisReservas() {
  const navegar = useNavigate();
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [filtro, setFiltro] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  
  const [idsResenadas, setIdsResenadas] = useState<string[]>([]);

  useEffect(function fncRevisarRol() {
    const ruta = fncRutaSiNoTieneRol("estudiante");
    if (ruta !== "") {
      navegar(ruta);
    }
  }, []);

  async function fncCargarResenadas(): Promise<void> {
    setIdsResenadas(await fncObtenerMisResenas());
  }

  async function fncPedirReservas(): Promise<void> {
    try {
      const lista = await fncObtenerMisReservas();
      setReservas(lista);
      await fncCargarResenadas();
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudieron cargar tus reservas");
    }
    setCargando(false);
  }

  useEffect(function fncCargarReservas() {
    fncPedirReservas();
  }, []);

  function fncCambiarFiltro(evento: ChangeEvent<HTMLSelectElement>): void {
    setFiltro(evento.target.value);
  }

  async function fncCancelar(evento: MouseEvent<HTMLButtonElement>): Promise<void> {
    const id = evento.currentTarget.value;
    if (!window.confirm("¿Cancelar esta reserva? Se liberará el horario.")) {
      return;
    }
    try {
      await fncCancelarReserva(id);
      await fncPedirReservas();
      setMensaje("Reserva cancelada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo cancelar la reserva");
    }
  }

  function fncIrAExplorar(): void {
    navegar("/tutorias");
  }

  function fncIrAlInicio(): void {
    navegar("/inicio");
  }

  function fncCoincideConFiltro(reserva: ReservaDetalle): boolean {
    return filtro === "" || reserva.estado === filtro;
  }

 function fncDibujarReserva(reserva: ReservaDetalle) {
    const sePuedeCancelar = reserva.estado === "pendiente" || reserva.estado === "aceptada";
    return (
      <div key={reserva._id} className="estudiante__tarjeta">
        <img src={reserva.tutor.foto} alt="Foto del tutor" referrerPolicy="no-referrer" />
        <div className="estudiante__tarjeta-datos">
          <strong>{reserva.tutoria.titulo}</strong>
          <span>Tutor: {reserva.tutor.nombre}</span>
          <span>{fncTextoModalidad(reserva.modalidad)} | {reserva.semanas} semanas desde {reserva.fechaInicio}</span>
          <span>{fncTextoDias(reserva.diasFijos)} ({reserva.horasPorSesion} h por clase, {reserva.sesiones.length} clases)</span>
          <span>Total: {fncFormatearDinero(reserva.total)}</span>
          <span className={`estudiante__estado estudiante__estado--${reserva.estado}`}>{reserva.estado}</span>
        </div>
        
        <div className="estudiante__tarjeta-acciones">
          {sePuedeCancelar && (
            <button className="estudiante__secundario" value={reserva._id} onClick={fncCancelar}>Cancelar</button>
          )}
          <button className="estudiante__secundario" onClick={() => navegar(`/chat/${reserva._id}`)}>Abrir Chat</button>
          
          {reserva.estado === "aceptada" && reserva.sesiones.length > 0 && new Date(reserva.sesiones[0].inicio) <= new Date() &&
            (idsResenadas.includes(reserva._id) ? (
              <p className="resena-form__gracias">✔ Ya calificada</p>
            ) : (
              <FormularioResena reservaId={reserva._id} alGuardar={fncCargarResenadas} />
            ))}
        </div>
      </div>
    );
  }

  const reservasFiltradas = reservas.filter(fncCoincideConFiltro);

  return (
    <div className="estudiante">
      <div className="estudiante__encabezado">
        <h1>Mis reservas</h1>
        <div className="estudiante__acciones">
          <button className="estudiante__secundario" onClick={fncIrAExplorar}>
            Explorar tutorías
          </button>
          <button onClick={fncIrAlInicio}>Inicio</button>
        </div>
      </div>

      <div className="estudiante__filtros">
        <select value={filtro} onChange={fncCambiarFiltro}>
          <option value="">Todas</option>
          <option value="pendiente">Pendientes</option>
          <option value="aceptada">Aceptadas</option>
          <option value="rechazada">Rechazadas</option>
          <option value="cancelada">Canceladas</option>
        </select>
      </div>

      {mensaje && <p className="estudiante__mensaje">{mensaje}</p>}
      {cargando && <p>Cargando...</p>}
      {!cargando && reservasFiltradas.length === 0 && <p>No tienes reservas en esta lista.</p>}
      {reservasFiltradas.map(fncDibujarReserva)}
    </div>
  );
}

export default MisReservas;