import { useEffect, useState } from "react";
import type { ChangeEvent, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { fncObtenerTutorias, fncObtenerCategorias, fncRutaSiNoTieneRol } from "../services/api";
import type { TutoriaPublica, Categoria } from "../services/api";
import { fncTextoModalidad, fncFormatearDinero } from "../utilidades/textos";
import "../styles/estudiante.scss";

const MODALIDADES: string[] = ["virtual", "casa_tutor", "domicilio"];

function Explorar() {
  const navegar = useNavigate();
  const [tutorias, setTutorias] = useState<TutoriaPublica[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroModalidad, setFiltroModalidad] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  useEffect(function fncRevisarRol() {
    const ruta = fncRutaSiNoTieneRol("estudiante");
    if (ruta !== "") {
      navegar(ruta);
    }
  }, []);

  useEffect(function fncCargarCategorias() {
    async function fncPedirCategorias(): Promise<void> {
      try {
        const lista = await fncObtenerCategorias();
        setCategorias(lista);
      } catch (e) {
        setMensaje("No se pudieron cargar las categorías");
      }
    }
    fncPedirCategorias();
  }, []);

  useEffect(function fncCargarTutorias() {
    async function fncPedirTutorias(): Promise<void> {
      try {
        const lista = await fncObtenerTutorias(filtroCategoria, filtroModalidad);
        setTutorias(lista);
        setMensaje("");
      } catch (e) {
        setMensaje(e instanceof Error ? e.message : "No se pudieron cargar las tutorías");
      }
      setCargando(false);
    }
    fncPedirTutorias();
  }, [filtroCategoria, filtroModalidad]);

  function fncCambiarCategoria(evento: ChangeEvent<HTMLSelectElement>): void {
    setFiltroCategoria(evento.target.value);
  }

  function fncCambiarModalidad(evento: ChangeEvent<HTMLSelectElement>): void {
    setFiltroModalidad(evento.target.value);
  }

  function fncIrAReservar(evento: MouseEvent<HTMLButtonElement>): void {
    navegar("/reservar/" + evento.currentTarget.value);
  }

  function fncIrAMisReservas(): void {
    navegar("/mis-reservas");
  }

  function fncIrAlInicio(): void {
    navegar("/inicio");
  }

  function fncEsPrincipal(categoria: Categoria): boolean {
    return categoria.padre === "";
  }

  function fncDibujarGrupoCategoria(principal: Categoria) {
    function fncEsHija(categoria: Categoria): boolean {
      return categoria.padre === principal._id;
    }
    function fncDibujarOpcion(categoria: Categoria) {
      return (
        <option key={categoria._id} value={categoria._id}>
          {categoria.nombre}
        </option>
      );
    }
    const hijas = categorias.filter(fncEsHija);
    return (
      <optgroup key={principal._id} label={principal.nombre}>
        <option value={principal._id}>{principal.nombre + " (todas)"}</option>
        {hijas.map(fncDibujarOpcion)}
      </optgroup>
    );
  }

  function fncDibujarOpcionModalidad(modalidad: string) {
    return (
      <option key={modalidad} value={modalidad}>
        {fncTextoModalidad(modalidad)}
      </option>
    );
  }

  function fncDibujarTutoria(tutoria: TutoriaPublica) {
    return (
      <div key={tutoria._id} className="estudiante__tarjeta">
        <img src={tutoria.tutor.foto} alt="Foto del tutor" referrerPolicy="no-referrer" />
        <div className="estudiante__tarjeta-datos">
          <strong>{tutoria.titulo}</strong>
          <span>Tutor: {tutoria.tutor.nombre} | {tutoria.categoria ? tutoria.categoria.nombre : "Sin categoría"}</span>
          <span>{tutoria.descripcion}</span>
          <span className="estudiante__ayuda">{tutoria.tutor.biografia}</span>
          <span>Modalidades: {tutoria.modalidades.map(fncTextoModalidad).join(", ")}</span>
          <span>
            {fncFormatearDinero(tutoria.tarifaHora)} por hora
            {tutoria.tarifaKm > 0 ? " + " + fncFormatearDinero(tutoria.tarifaKm) + " por km" : ""}
          </span>
        </div>
        <div className="estudiante__tarjeta-acciones">
          <button value={tutoria._id} onClick={fncIrAReservar}>Reservar</button>
        </div>
      </div>
    );
  }

  const categoriasPrincipales = categorias.filter(fncEsPrincipal);

  return (
    <div className="estudiante">
      <div className="estudiante__encabezado">
        <h1>Explorar tutorías</h1>
        <div className="estudiante__acciones">
          <button className="estudiante__secundario" onClick={fncIrAMisReservas}>
            Mis reservas
          </button>
          <button onClick={fncIrAlInicio}>Inicio</button>
        </div>
      </div>

      <div className="estudiante__filtros">
        <select value={filtroCategoria} onChange={fncCambiarCategoria}>
          <option value="">Todas las categorías</option>
          {categoriasPrincipales.map(fncDibujarGrupoCategoria)}
        </select>
        <select value={filtroModalidad} onChange={fncCambiarModalidad}>
          <option value="">Todas las modalidades</option>
          {MODALIDADES.map(fncDibujarOpcionModalidad)}
        </select>
      </div>

      {mensaje && <p className="estudiante__error">{mensaje}</p>}
      {cargando && <p>Cargando...</p>}
      {!cargando && tutorias.length === 0 && <p>No hay tutorías con esos filtros.</p>}
      {tutorias.map(fncDibujarTutoria)}
    </div>
  );
}

export default Explorar;