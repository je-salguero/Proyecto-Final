import type { ReactElement } from "react";
import Estrellas from "./Estrellas";
import type { RespuestaResenas } from "../services/api";
import { fncFormatearFecha } from "../utilidades/textos";

interface PropsLista {
  datos: RespuestaResenas | null;
}

function ListaResenas(props: PropsLista): ReactElement {
  if (!props.datos) {
    return <p>Cargando reseñas...</p>;
  }
  if (props.datos.total === 0) {
    return <p className="resenas__vacio">Todavía no hay reseñas.</p>;
  }

  return (
    <div className="resenas">
      <p className="resenas__resumen">
        <strong>{props.datos.promedio}</strong> <Estrellas valor={props.datos.promedio} /> ({props.datos.total} reseñas)
      </p>
      {props.datos.resenas.map((resena) => (
        <article key={resena._id} className="resenas__item">
          <header className="resenas__cabecera">
            <strong>{resena.estudiante.nombre}</strong>
            <Estrellas valor={resena.calificacion} />
            <small>{fncFormatearFecha(resena.createdAt)}</small>
          </header>
          {resena.comentario && <p>{resena.comentario}</p>}
        </article>
      ))}
    </div>
  );
}

export default ListaResenas;