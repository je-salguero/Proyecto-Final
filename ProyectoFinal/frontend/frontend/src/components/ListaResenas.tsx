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
    return <p style={{ color: '#666', marginTop: '20px' }}>Todavía no hay reseñas.</p>;
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px 24px', background: '#f8f9fa', borderRadius: '12px', border: '1px solid #e0e0e0' }}>
        <strong style={{ fontSize: '2.5rem', color: '#2d5bff', lineHeight: '1' }}>
          {props.datos.promedio}
        </strong> 
        <div style={{ fontSize: '1.2rem', marginTop: '4px' }}>
          <Estrellas valor={props.datos.promedio} /> 
        </div>
        <span style={{ color: '#666', fontWeight: '500', marginLeft: 'auto' }}>
          ({props.datos.total} {props.datos.total === 1 ? 'reseña' : 'reseñas'})
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {props.datos.resenas.map((resena) => (
          <article key={resena._id} className="tutor__tarjeta" style={{ marginBottom: 0, padding: '20px' }}>
            <div className="tutor__tarjeta-datos">
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <strong style={{ fontSize: '1.1rem', color: '#333' }}>
                    {resena.estudiante.nombre}
                  </strong>
                  <Estrellas valor={resena.calificacion} />
                </div>
                <span style={{ fontSize: '0.85rem', color: '#888' }}>
                  {fncFormatearFecha(resena.createdAt)}
                </span>
              </header>
              {resena.comentario && (
                <p style={{ margin: 0, color: '#444', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {resena.comentario}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export default ListaResenas;