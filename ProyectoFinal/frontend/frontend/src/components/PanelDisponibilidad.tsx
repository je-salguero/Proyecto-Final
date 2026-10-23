import { useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent, ReactElement } from "react";
import { fncObtenerMiDisponibilidad, fncGuardarDisponibilidad } from "../services/api";
import type { BloqueDisponibilidad } from "../services/api";
import { NOMBRES_DIAS } from "../utilidades/textos";

const ORDEN_DIAS: number[] = [1, 2, 3, 4, 5, 6, 0];

function PanelDisponibilidad() {
  const [bloques, setBloques] = useState<BloqueDisponibilidad[]>([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(function fncCargarCuadricula() {
    async function fncPedirBloques(): Promise<void> {
      try {
        const lista = await fncObtenerMiDisponibilidad();
        setBloques(lista);
      } catch (e) {
        setMensaje(e instanceof Error ? e.message : "No se pudo cargar la disponibilidad");
      }
    }
    fncPedirBloques();
  }, []);

  function fncAgregarBloque(evento: MouseEvent<HTMLButtonElement>): void {
    const dia = Number(evento.currentTarget.value);
    setBloques([...bloques, { dia: dia, horaInicio: "08:00", horaFin: "12:00" }]);
  }

  function fncQuitarBloque(evento: MouseEvent<HTMLButtonElement>): void {
    const posicionQuitar = Number(evento.currentTarget.value);
    function fncConservar(_bloque: BloqueDisponibilidad, posicion: number): boolean {
      return posicion !== posicionQuitar;
    }
    setBloques(bloques.filter(fncConservar));
  }

  function fncCambiarHora(evento: ChangeEvent<HTMLInputElement>): void {
    const indice = Number(evento.target.dataset.indice);
    const bloque = bloques[indice];
    const bloqueNuevo = { dia: bloque.dia, horaInicio: bloque.horaInicio, horaFin: bloque.horaFin };
    if (evento.target.name === "horaInicio") {
      bloqueNuevo.horaInicio = evento.target.value;
    } else {
      bloqueNuevo.horaFin = evento.target.value;
    }
    const copia = [...bloques];
    copia[indice] = bloqueNuevo;
    setBloques(copia);
  }

  async function fncGuardarCuadricula(): Promise<void> {
    try {
      const guardados = await fncGuardarDisponibilidad(bloques);
      setBloques(guardados);
      setMensaje("Disponibilidad guardada correctamente");
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setMensaje(""), 3000);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo guardar");
    }
  }

  function fncDibujarBloque(bloque: BloqueDisponibilidad, indice: number) {
    return (
      <div key={indice} className="bloque-horario">
        <input type="time" name="horaInicio" data-indice={indice} value={bloque.horaInicio} onChange={fncCambiarHora} />
        <span>a</span>
        <input type="time" name="horaFin" data-indice={indice} value={bloque.horaFin} onChange={fncCambiarHora} />
        <button 
          type="button" 
          value={indice} 
          onClick={fncQuitarBloque}
          style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' }}
        >
          Quitar
        </button>
      </div>
    );
  }

  function fncDibujarDia(dia: number) {
    const filas: ReactElement[] = [];
    for (let i = 0; i < bloques.length; i++) {
      if (bloques[i].dia === dia) {
        filas.push(fncDibujarBloque(bloques[i], i));
      }
    }
    return (
      <div key={dia} className="disponibilidad-dia">
        <h4>{NOMBRES_DIAS[dia]}</h4>
        {filas}
        <button type="button" className="btn-agregar" value={dia} onClick={fncAgregarBloque}>
          + Agregar horario
        </button>
      </div>
    );
  }

  return (
    <div className="tutor__formulario">
      <p style={{ margin: '0 0 16px 0', color: '#666' }}>
        Define en qué horarios das clases cada semana. Los estudiantes solo podrán reservar dentro de estos bloques.
      </p>
      
      {ORDEN_DIAS.map(fncDibujarDia)}
      
      {mensaje && (
        <p style={{ color: mensaje.includes("error") ? '#dc3545' : '#28a745', fontWeight: 'bold', margin: '0' }}>
          {mensaje}
        </p>
      )}
      
      <button 
        onClick={fncGuardarCuadricula}
        style={{ background: '#2d5bff', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px' }}
      >
        Guardar disponibilidad
      </button>
    </div>
  );
}

export default PanelDisponibilidad;