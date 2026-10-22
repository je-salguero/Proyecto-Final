import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent, MouseEvent } from "react";
import { fncObtenerMisTutorias, fncCrearTutoria, fncActualizarTutoria, fncObtenerCategorias,} from "../services/api";
import type { TutoriaPropia, DatosTutoria, Categoria } from "../services/api";
import { fncTextoModalidad, fncFormatearDinero } from "../utilidades/textos";

const MODALIDADES: string[] = ["virtual", "casa_tutor", "domicilio"];

const FORMULARIO_VACIO = { titulo: "", descripcion: "", categoria: "", tarifaHora: "", tarifaKm: "" };

function PanelOfertas() {
  const [tutorias, setTutorias] = useState<TutoriaPropia[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [datos, setDatos] = useState(FORMULARIO_VACIO);
  const [modalidades, setModalidades] = useState<string[]>([]);
  const [activa, setActiva] = useState(true);
  const [editandoId, setEditandoId] = useState("");
  const [mensaje, setMensaje] = useState("");

  async function fncPedirTutorias(): Promise<void> {
    try {
      const lista = await fncObtenerMisTutorias();
      setTutorias(lista);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudieron cargar tus tutorías");
    }
  }

  useEffect(function fncCargarDatos() {
    async function fncPedirTodo(): Promise<void> {
      await fncPedirTutorias();
      try {
        const lista = await fncObtenerCategorias();
        setCategorias(lista);
      } catch (e) {
        setMensaje("No se pudieron cargar las categorías");
      }
    }
    fncPedirTodo();
  }, []);

  function fncCambiarCampo(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void {
    setDatos({ ...datos, [evento.target.name]: evento.target.value });
  }

  function fncCambiarModalidad(evento: ChangeEvent<HTMLInputElement>): void {
    const modalidad = evento.target.value;
    function fncEsOtraModalidad(texto: string): boolean {
      return texto !== modalidad;
    }
    if (modalidades.includes(modalidad)) {
      setModalidades(modalidades.filter(fncEsOtraModalidad));
    } else {
      setModalidades([...modalidades, modalidad]);
    }
  }

  function fncCambiarActiva(evento: ChangeEvent<HTMLInputElement>): void {
    setActiva(evento.target.checked);
  }

  function fncLimpiarFormulario(): void {
    setDatos(FORMULARIO_VACIO);
    setModalidades([]);
    setActiva(true);
    setEditandoId("");
  }

  function fncEmpezarEdicion(evento: MouseEvent<HTMLButtonElement>): void {
    const tutoria = tutorias[Number(evento.currentTarget.value)];
    setEditandoId(tutoria._id);
    setDatos({
      titulo: tutoria.titulo,
      descripcion: tutoria.descripcion,
      categoria: tutoria.categoria ? tutoria.categoria._id : "",
      tarifaHora: String(tutoria.tarifaHora),
      tarifaKm: String(tutoria.tarifaKm),
    });
    setModalidades(tutoria.modalidades);
    setActiva(tutoria.activa);
    setMensaje("");
  }

  async function fncGuardarTutoria(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    const tieneDomicilio = modalidades.includes("domicilio");
    const cuerpo: DatosTutoria = {
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      categoria: datos.categoria,
      modalidades: modalidades,
      tarifaHora: Number(datos.tarifaHora),
      tarifaKm: tieneDomicilio ? Number(datos.tarifaKm) : 0,
      activa: activa,
    };

    try {
      if (editandoId === "") {
        await fncCrearTutoria(cuerpo);
      } else {
        await fncActualizarTutoria(editandoId, cuerpo);
      }
      fncLimpiarFormulario();
      await fncPedirTutorias();
      setMensaje("Tutoría guardada");
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se pudo guardar la tutoría");
    }
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
        <option value={principal._id}>{principal.nombre + " (general)"}</option>
        {hijas.map(fncDibujarOpcion)}
      </optgroup>
    );
  }

  function fncDibujarModalidad(modalidad: string) {
    return (
      <label key={modalidad} className="tutor__opcion">
        <input
          type="checkbox"
          value={modalidad}
          checked={modalidades.includes(modalidad)}
          onChange={fncCambiarModalidad}
        />
        {fncTextoModalidad(modalidad)}
      </label>
    );
  }

  function fncDibujarTutoria(tutoria: TutoriaPropia, indice: number) {
    return (
      <div key={tutoria._id} className="tutor__tarjeta">
        <div className="tutor__tarjeta-datos">
          <strong>
            {tutoria.titulo}
            {tutoria.activa ? "" : " (oculta)"}
          </strong>
          <span>Categoría: {tutoria.categoria ? tutoria.categoria.nombre : "Categoría eliminada"}</span>
          <span>{tutoria.descripcion}</span>
          <span>Modalidades: {tutoria.modalidades.map(fncTextoModalidad).join(", ")}</span>
          <span>
            Tarifa: {fncFormatearDinero(tutoria.tarifaHora)} por hora
            {tutoria.tarifaKm > 0 ? " + " + fncFormatearDinero(tutoria.tarifaKm) + " por km" : ""}
          </span>
        </div>
        <button value={indice} onClick={fncEmpezarEdicion}>
          Editar
        </button>
      </div>
    );
  }

  const categoriasPrincipales = categorias.filter(fncEsPrincipal);

  return (
    <div>
      <form className="tutor__formulario" onSubmit={fncGuardarTutoria}>
        <h3>{editandoId === "" ? "Nueva tutoría" : "Editando tutoría"}</h3>
        <input name="titulo" type="text" placeholder="Título (ej. Reforzamiento de React)" value={datos.titulo} onChange={fncCambiarCampo} />
        <textarea name="descripcion" placeholder="¿Qué aprenderá el estudiante?" value={datos.descripcion} onChange={fncCambiarCampo} />
        <select name="categoria" value={datos.categoria} onChange={fncCambiarCampo}>
          <option value="">Selecciona una categoría</option>
          {categoriasPrincipales.map(fncDibujarGrupoCategoria)}
        </select>

        <div className="tutor__opciones">
          <span>Modalidades que ofreces:</span>
          {MODALIDADES.map(fncDibujarModalidad)}
        </div>

        <input name="tarifaHora" type="number" min="0" step="any" placeholder="Tarifa por hora (Q)" value={datos.tarifaHora} onChange={fncCambiarCampo} />
        {modalidades.includes("domicilio") && (
          <input name="tarifaKm" type="number" min="0" step="any" placeholder="Tarifa por kilómetro de traslado (Q)" value={datos.tarifaKm} onChange={fncCambiarCampo} />
        )}

        {editandoId !== "" && (
          <label className="tutor__opcion">
            <input type="checkbox" checked={activa} onChange={fncCambiarActiva} />
            Visible para los estudiantes
          </label>
        )}

        <div className="tutor__acciones">
          <button type="submit">{editandoId === "" ? "Crear tutoría" : "Guardar cambios"}</button>
          {editandoId !== "" && (
            <button type="button" className="tutor__secundario" onClick={fncLimpiarFormulario}>
              Cancelar edición
            </button>
          )}
        </div>
      </form>

      {mensaje && <p className="tutor__mensaje">{mensaje}</p>}
      {tutorias.length === 0 && <p>Todavía no has creado tutorías.</p>}
      {tutorias.map(fncDibujarTutoria)}
    </div>
  );
}

export default PanelOfertas;