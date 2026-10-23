import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fncObtenerTutoria, fncObtenerDisponibilidadDeTutor, fncSimularReserva, fncCrearReserva, fncRutaSiNoTieneRol} from "../services/api";
import type { TutoriaPublica, BloqueDisponibilidad, DiaFijo, DatosReserva, Estimacion } from "../services/api";
import { NOMBRES_DIAS, fncTextoModalidad, fncFormatearDinero, fncRangoDeClases, fncFechaDeHoy} from "../utilidades/textos";
import "../styles/estudiante.scss";

const ORDEN_DIAS: number[] = [1, 2, 3, 4, 5, 6, 0];
const OPCIONES_HORAS: string[] = ["1", "1.5", "2", "2.5", "3", "3.5", "4"];
const OPCIONES_SEMANAS: string[] = ["4", "8", "12"];

function Reservar() {
  const navegar = useNavigate();
  const parametros = useParams();
  const idTutoria = parametros.id || "";

  const [tutoria, setTutoria] = useState<TutoriaPublica | null>(null);
  const [bloques, setBloques] = useState<BloqueDisponibilidad[]>([]);
  const [datos, setDatos] = useState({ modalidad: "", fechaInicio: "", semanas: "4", horas: "1" });
  const [diasFijos, setDiasFijos] = useState<DiaFijo[]>([]);
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(function fncRevisarRol() {
    const ruta = fncRutaSiNoTieneRol("estudiante");
    if (ruta !== "") {
      navegar(ruta);
    }
  }, []);

  useEffect(function fncCargarOferta() {
    async function fncPedirOferta(): Promise<void> {
      try {
        const oferta = await fncObtenerTutoria(idTutoria);
        setTutoria(oferta);
        const lista = await fncObtenerDisponibilidadDeTutor(oferta.tutor._id);
        setBloques(lista);
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo cargar la tutoría");
      }
    }
    fncPedirOferta();
  }, [idTutoria]);

  function fncCambiarCampo(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    setDatos({ ...datos, [evento.target.name]: evento.target.value });
    setEstimacion(null);
    setError("");
  }

  function fncPosicionDia(dia: number): number {
    for (let i = 0; i < diasFijos.length; i++) {
      if (diasFijos[i].dia === dia) {
        return i;
      }
    }
    return -1;
  }

  function fncAlternarDia(evento: ChangeEvent<HTMLInputElement>): void {
    const dia = Number(evento.target.value);
    function fncEsOtroDia(elemento: DiaFijo): boolean {
      return elemento.dia !== dia;
    }
    if (fncPosicionDia(dia) >= 0) {
      setDiasFijos(diasFijos.filter(fncEsOtroDia));
    } else {
      setDiasFijos([...diasFijos, { dia: dia, horaInicio: "08:00" }]);
    }
    setEstimacion(null);
    setError("");
  }

  function fncCambiarHoraDia(evento: ChangeEvent<HTMLInputElement>): void {
    const dia = Number(evento.target.dataset.dia);
    const copia = [...diasFijos];
    copia[fncPosicionDia(dia)] = { dia: dia, horaInicio: evento.target.value };
    setDiasFijos(copia);
    setEstimacion(null);
    setError("");
  }

  function fncTextoDisponibilidad(dia: number): string {
    let texto = "";
    for (let i = 0; i < bloques.length; i++) {
      if (bloques[i].dia === dia) {
        if (texto !== "") {
          texto = texto + ", ";
        }
        texto = texto + bloques[i].horaInicio + " a " + bloques[i].horaFin;
      }
    }
    return texto === "" ? "El tutor no atiende este día" : "Tutor disponible: " + texto;
  }

  function fncValidarFormulario(): string {
    if (datos.modalidad === "") return "Elige una modalidad";
    if (datos.fechaInicio === "") return "Elige la fecha de inicio";
    if (diasFijos.length === 0) return "Elige al menos un día de la semana";
    return "";
  }

  function fncArmarDatosReserva(): DatosReserva {
    return {
      tutoria: idTutoria,
      modalidad: datos.modalidad,
      fechaInicio: datos.fechaInicio,
      semanas: Number(datos.semanas),
      horasPorSesion: Number(datos.horas),
      diasFijos: diasFijos,
    };
  }

  async function fncCalcular(): Promise<void> {
    const problema = fncValidarFormulario();
    if (problema !== "") {
      setError(problema);
      return;
    }
    setError("");
    setTrabajando(true);
    try {
      const resultado = await fncSimularReserva(fncArmarDatosReserva());
      setEstimacion(resultado);
    } catch (e) {
      setEstimacion(null);
      setError(e instanceof Error ? e.message : "No se pudo calcular el costo");
    }
    setTrabajando(false);
  }

  async function fncConfirmar(): Promise<void> {
    setTrabajando(true);
    try {
      await fncCrearReserva(fncArmarDatosReserva());
      navegar("/mis-reservas");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la reserva");
      setTrabajando(false);
    }
  }

  function fncVolver(): void {
    navegar("/tutorias");
  }

  function fncDibujarModalidad(modalidad: string) {
    return (
      <label key={modalidad} style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal', gap: '6px' }}>
        <input
          type="radio"
          name="modalidad"
          value={modalidad}
          checked={datos.modalidad === modalidad}
          onChange={fncCambiarCampo}
        />
        {fncTextoModalidad(modalidad)}
      </label>
    );
  }

  function fncDibujarOpcionHoras(valor: string) {
    return <option key={valor} value={valor}>{valor + " h"}</option>;
  }

  function fncDibujarOpcionSemanas(valor: string) {
    return (
      <option key={valor} value={valor}>
        {valor === "4" ? "4 semanas (mensual)" : valor + " semanas"}
      </option>
    );
  }

  function fncDibujarDia(dia: number) {
    const posicion = fncPosicionDia(dia);
    const elegido = posicion >= 0;
    return (
      <div key={dia} className="reserva-dia">
        <label style={{ display: 'flex', alignItems: 'center', width: '130px', margin: '0', fontWeight: 'bold' }}>
          <input type="checkbox" value={dia} checked={elegido} onChange={fncAlternarDia} />
          {NOMBRES_DIAS[dia]}
        </label>
        {elegido && (
          <input type="time" data-dia={dia} value={diasFijos[posicion].horaInicio} onChange={fncCambiarHoraDia} />
        )}
        <span>{fncTextoDisponibilidad(dia)}</span>
      </div>
    );
  }

  if (!tutoria) {
    return (
      <div className="estudiante">
        <p>{error !== "" ? error : "Cargando..."}</p>
        <button className="estudiante__secundario" onClick={fncVolver}>Volver</button>
      </div>
    );
  }

  return (
    <div className="estudiante">
      <div className="estudiante__encabezado">
        <h1>Reservar tutoría</h1>
        <button onClick={fncVolver}>Volver</button>
      </div>

      <div className="estudiante__tarjeta">
        <img src={tutoria.tutor.foto} alt="Foto del tutor" referrerPolicy="no-referrer" />
        <div className="estudiante__tarjeta-datos">
          <strong>{tutoria.titulo}</strong>
          <span>Tutor: {tutoria.tutor.nombre} | {tutoria.categoria ? tutoria.categoria.nombre : "Sin categoría"}</span>
          <span>{tutoria.descripcion}</span>
          <span>
            {fncFormatearDinero(tutoria.tarifaHora)} por hora
            {tutoria.tarifaKm > 0 ? " + " + fncFormatearDinero(tutoria.tarifaKm) + " por km de traslado (a domicilio)" : ""}
          </span>
        </div>
      </div>

      <div className="estudiante__formulario">
        <h3>1. Modalidad</h3>
        <div className="reserva-fila">
          {tutoria.modalidades.map(fncDibujarModalidad)}
        </div>
        {datos.modalidad === "domicilio" && (
          <span className="estudiante__ayuda" style={{ display: 'block', marginTop: '-10px', marginBottom: '16px', color: '#888', fontStyle: 'italic' }}>
            El traslado se cobra por clase, según la distancia entre tu ubicación y la del tutor.
          </span>
        )}

        <h3>2. Duración y horas</h3>
        <div className="reserva-fila">
          <label>
            Fecha de inicio
            <input type="date" name="fechaInicio" min={fncFechaDeHoy()} value={datos.fechaInicio} onChange={fncCambiarCampo} />
          </label>
          <label>
            Duración de la suscripción
            <select name="semanas" value={datos.semanas} onChange={fncCambiarCampo}>
              {OPCIONES_SEMANAS.map(fncDibujarOpcionSemanas)}
            </select>
          </label>
          <label>
            Horas por clase
            <select name="horas" value={datos.horas} onChange={fncCambiarCampo}>
              {OPCIONES_HORAS.map(fncDibujarOpcionHoras)}
            </select>
          </label>
        </div>

        <h3>3. Días fijos de la semana y hora de inicio</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bloques.length === 0 && (
            <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Este tutor todavía no ha definido su disponibilidad.</span>
          )}
          {ORDEN_DIAS.map(fncDibujarDia)}
        </div>

        {error && <p style={{ color: '#dc3545', marginTop: '16px', fontWeight: 'bold' }}>{error}</p>}

        {estimacion && (
          <div className="estudiante__tarjeta" style={{ background: '#f8f9fa', marginTop: '24px', border: '1px solid #e0e0e0', boxShadow: 'none' }}>
            <div className="estudiante__tarjeta-datos">
              <strong style={{ fontSize: '1.1rem', color: '#2d5bff' }}>Resumen de tu suscripción</strong>
              <span>{estimacion.totalSesiones} clases, del {fncRangoDeClases(estimacion.sesiones)}</span>
              <span>Costo por clases: {fncFormatearDinero(estimacion.costoClases)}</span>
              {estimacion.distanciaKm > 0 && (
                <span>Traslado a domicilio: {fncFormatearDinero(estimacion.costoTraslado)} ({estimacion.distanciaKm} km por clase)</span>
              )}
              <strong style={{ fontSize: '1.3rem', marginTop: '8px' }}>Total a pagar: {fncFormatearDinero(estimacion.total)}</strong>
            </div>
          </div>
        )}

        <div className="estudiante__acciones" style={{ marginTop: '24px' }}>
          <button className="estudiante__secundario" onClick={fncCalcular} disabled={trabajando}>
            Calcular costo y verificar horario
          </button>
          {estimacion && (
            <button onClick={fncConfirmar} disabled={trabajando}>
              Confirmar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reservar;