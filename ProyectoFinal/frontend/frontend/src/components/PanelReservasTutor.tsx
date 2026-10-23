import { useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fncObtenerMisReservas, fncResponderReserva, fncCancelarReserva } from "../services/api";
import type { ReservaDetalle } from "../services/api";
import { fncTextoModalidad, fncTextoDias, fncFormatearDinero } from "../utilidades/textos";

function PanelReservasTutor() {
  const navegar = useNavigate();
  const [reservas, setReservas] = useState<ReservaDetalle[]>([]);
  const [filtro, setFiltro] = useState("pendiente");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  async function fncPedirReservas(): Promise<void> {
    try {
      const lista = await fncObtenerMisReservas();
      setReservas(lista);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudieron cargar las reservas");
    }
    setCargando(false);
  }

  useEffect(function fncCargarReservas() {
    fncPedirReservas();
  }, []);

  function fncCambiarFiltro(evento: ChangeEvent<HTMLSelectElement>): void {
    setFiltro(evento.target.value);
  }

  async function fncResponder(id: string, aceptar: boolean): Promise<void> {
    try {
      await fncResponderReserva(id, aceptar);
      await fncPedirReservas();
      setMensaje(aceptar ? "Reserva aceptada" : "Reserva rechazada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo responder la reserva");
    }
  }

  function fncAceptar(evento: MouseEvent<HTMLButtonElement>): void {
    fncResponder(evento.currentTarget.value, true);
  }

  function fncRechazar(evento: MouseEvent<HTMLButtonElement>): void {
    fncResponder(evento.currentTarget.value, false);
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

  function fncCoincideConFiltro(reserva: ReservaDetalle): boolean {
    return filtro === "" || reserva.estado === filtro;
  }

  function fncDibujarReserva(reserva: ReservaDetalle) {
    return (
      <div key={reserva._id} className="tutor__tarjeta">
        <img src={reserva.estudiante.foto} alt="Foto" referrerPolicy="no-referrer" />
        <div className="tutor__tarjeta-datos">
          <strong>{reserva.tutoria.titulo}</strong>
          <span>Estudiante: {reserva.estudiante.nombre} | Tel: {reserva.estudiante.telefono}</span>
          <span>{fncTextoModalidad(reserva.modalidad)} | {reserva.semanas} semanas desde {reserva.fechaInicio}</span>
          <span>{fncTextoDias(reserva.diasFijos)} ({reserva.horasPorSesion} h por clase, {reserva.sesiones.length} clases)</span>
          <span>Total: {fncFormatearDinero(reserva.total)}</span>
          <span className={`estudiante__estado estudiante__estado--${reserva.estado}`}>{reserva.estado}</span>
        </div>
        <div className="tutor__acciones-columna">
          {reserva.estado === "pendiente" && (
            <>
              <button value={reserva._id} onClick={fncAceptar}>Aceptar</button>
              <button className="tutor__secundario" value={reserva._id} onClick={fncRechazar}>Rechazar</button>
            </>
          )}
          {reserva.estado === "aceptada" && (
            <button className="tutor__secundario" value={reserva._id} onClick={fncCancelar}>Cancelar</button>
          )}
          <button className="estudiante__secundario" onClick={() => navegar(`/chat/${reserva._id}`)}>Abrir Chat</button>
        </div>
      </div>
    );
  }

  const reservasFiltradas = reservas.filter(fncCoincideConFiltro);

  return (
    <div>
      <div className="estudiante__filtros" style={{ marginBottom: '20px' }}>
        <select value={filtro} onChange={fncCambiarFiltro}>
          <option value="pendiente">Mostrar: Pendientes</option>
          <option value="aceptada">Mostrar: Aceptadas</option>
          <option value="">Mostrar: Todas</option>
        </select>
      </div>
      {mensaje && <p className="tutor__mensaje">{mensaje}</p>}
      {cargando && <p>Cargando...</p>}
      {!cargando && reservasFiltradas.length === 0 && <p style={{ color: '#666' }}>No hay reservas en esta lista.</p>}
      {reservasFiltradas.map(fncDibujarReserva)}
    </div>
  );
}

export default PanelReservasTutor;