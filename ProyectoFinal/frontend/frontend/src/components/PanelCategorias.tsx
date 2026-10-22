import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import {
  fncObtenerCategorias,
  fncCrearCategoria,
  fncActualizarCategoria,
  fncEliminarCategoria,
} from "../services/api";
import type { Categoria } from "../services/api";

function PanelCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [nuevo, setNuevo] = useState({ nombre: "", descripcion: "", padre: "" });

  async function fncPedirCategorias(): Promise<void> {
    try {
      const lista = await fncObtenerCategorias();
      setCategorias(lista);
    } catch (e) {
      setMensaje("No se pudieron cargar las categorías");
    }
  }

  useEffect(function fncCargarCategorias() {
    fncPedirCategorias();
  }, []);

  function fncCambiarCampoNuevo(evento: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    setNuevo({ ...nuevo, [evento.target.name]: evento.target.value });
  }

  async function fncCrearNuevaCategoria(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault(); 
    try {
      await fncCrearCategoria(nuevo);
      setNuevo({ nombre: "", descripcion: "", padre: "" }); 
      await fncPedirCategorias();
      setMensaje("Categoría creada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo crear la categoría");
    }
  }

  async function fncEditarNombre(evento: MouseEvent<HTMLButtonElement>): Promise<void> {
    const id = evento.currentTarget.value;
    const nombreActual = evento.currentTarget.dataset.nombre || "";
    const nombreNuevo = window.prompt("Nuevo nombre de la categoría:", nombreActual);
    if (nombreNuevo === null) {
      return;
    }
    try {
      await fncActualizarCategoria(id, { nombre: nombreNuevo });
      await fncPedirCategorias();
      setMensaje("Nombre actualizado");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo renombrar");
    }
  }

  async function fncAlternarActiva(evento: MouseEvent<HTMLButtonElement>): Promise<void> {
    const id = evento.currentTarget.value;
    const estaActiva = evento.currentTarget.dataset.activa === "true";
    try {
      await fncActualizarCategoria(id, { activa: !estaActiva });
      await fncPedirCategorias();
      setMensaje(estaActiva ? "Categoría desactivada" : "Categoría activada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo cambiar el estado");
    }
  }

  async function fncBorrarCategoria(evento: MouseEvent<HTMLButtonElement>): Promise<void> {
    const id = evento.currentTarget.value;
    if (!window.confirm("¿Seguro que quieres eliminar esta categoría?")) {
      return;
    }
    try {
      await fncEliminarCategoria(id);
      await fncPedirCategorias();
      setMensaje("Categoría eliminada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo eliminar");
    }
  }

  function fncEsPrincipal(categoria: Categoria): boolean {
    return categoria.padre === "";
  }

  function fncDibujarOpcionPadre(categoria: Categoria) {
    return (
      <option key={categoria._id} value={categoria._id}>
        {"Subcategoría de: " + categoria.nombre}
      </option>
    );
  }

  function fncDibujarFila(categoria: Categoria, esHija: boolean) {
    return (
      <div key={categoria._id} className={esHija ? "admin__fila admin__fila--hija" : "admin__fila"}>
        <span className={categoria.activa ? "" : "admin__inactiva"}>
          {categoria.nombre}
          {categoria.activa ? "" : " (desactivada)"}
        </span>
        <div className="admin__acciones">
          <button value={categoria._id} data-nombre={categoria.nombre} onClick={fncEditarNombre}>
            Renombrar
          </button>
          <button value={categoria._id} data-activa={String(categoria.activa)} onClick={fncAlternarActiva}>
            {categoria.activa ? "Desactivar" : "Activar"}
          </button>
          <button value={categoria._id} onClick={fncBorrarCategoria}>
            Eliminar
          </button>
        </div>
      </div>
    );
  }

  function fncDibujarGrupo(principal: Categoria) {
    function fncEsHija(categoria: Categoria): boolean {
      return categoria.padre === principal._id;
    }
    function fncDibujarHija(categoria: Categoria) {
      return fncDibujarFila(categoria, true);
    }
    const hijas = categorias.filter(fncEsHija);

    return (
      <div key={principal._id} className="admin__grupo">
        {fncDibujarFila(principal, false)}
        {hijas.map(fncDibujarHija)}
      </div>
    );
  }

  const principales = categorias.filter(fncEsPrincipal);

  return (
    <div>
      <form className="admin__formulario" onSubmit={fncCrearNuevaCategoria}>
        <input name="nombre" placeholder="Nombre" value={nuevo.nombre} onChange={fncCambiarCampoNuevo} />
        <input
          name="descripcion"
          placeholder="Descripción (opcional)"
          value={nuevo.descripcion}
          onChange={fncCambiarCampoNuevo}
        />
        <select name="padre" value={nuevo.padre} onChange={fncCambiarCampoNuevo}>
          <option value="">Es categoría principal</option>
          {principales.map(fncDibujarOpcionPadre)}
        </select>
        <button type="submit">Crear</button>
      </form>

      {mensaje && <p className="admin__mensaje">{mensaje}</p>}
      {principales.length === 0 && <p>Todavía no hay categorías.</p>}
      {principales.map(fncDibujarGrupo)}
    </div>
  );
}

export default PanelCategorias;