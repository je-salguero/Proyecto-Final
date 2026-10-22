import { useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { fncObtenerTutores, fncCambiarAprobacionTutor } from "../services/api";
import type { Usuario } from "../services/api";

function PanelTutores() {
  const [tutores, setTutores] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("false");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  async function fncPedirTutores(): Promise<void> {
    try {
      const lista = await fncObtenerTutores(filtro);
      setTutores(lista);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo cargar la lista");
    }
    setCargando(false);
  }

  useEffect(function fncCargarTutores() {
    fncPedirTutores();
  }, [filtro]);

  function fncCambiarFiltro(evento: ChangeEvent<HTMLSelectElement>): void {
    setMensaje("");
    setFiltro(evento.target.value);
  }

  async function fncCambiarAprobacion(evento: MouseEvent<HTMLButtonElement>): Promise<void> {
    const id = evento.currentTarget.value;
    const nuevoValor = filtro === "false";
    try {
      await fncCambiarAprobacionTutor(id, nuevoValor);
      await fncPedirTutores(); 
      setMensaje(nuevoValor ? "Tutor aprobado" : "Aprobación revocada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo actualizar el tutor");
    }
  }

  function fncEsEnlaceSeguro(texto: string): boolean {
    return texto.startsWith("http://") || texto.startsWith("https://");
  }

  function fncDibujarTutor(tutor: Usuario) {
    return (
      <div key={tutor._id} className="admin__tarjeta">
        <img src={tutor.foto} alt="Foto" referrerPolicy="no-referrer" />
        <div className="admin__tarjeta-datos">
          <strong>{tutor.nombre}</strong>
          <span>{tutor.correo} | Tel: {tutor.telefono}</span>
          <span>Tarifa: Q{tutor.tarifaHora} por hora</span>
          <span>Categorías: {tutor.categorias.join(", ")}</span>
          <span>{tutor.biografia}</span>
          {fncEsEnlaceSeguro(tutor.hojaDeVida) ? (
            <a href={tutor.hojaDeVida} target="_blank" rel="noreferrer">Ver hoja de vida</a>
          ) : (
            <span>Hoja de vida: enlace no válido</span>
          )}
        </div>
        <button value={tutor._id} onClick={fncCambiarAprobacion}>
          {filtro === "false" ? "Aprobar" : "Revocar"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <label>
        Mostrar:{" "}
        <select value={filtro} onChange={fncCambiarFiltro}>
          <option value="false">Pendientes de aprobación</option>
          <option value="true">Ya aprobados</option>
        </select>
      </label>
      {mensaje && <p className="admin__mensaje">{mensaje}</p>}
      {cargando && <p>Cargando...</p>}
      {!cargando && tutores.length === 0 && <p>No hay tutores en esta lista.</p>}
      {tutores.map(fncDibujarTutor)}
    </div>
  );
}

export default PanelTutores;