import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactElement } from "react";
import Estrellas from "./Estrellas";
import { fncCrearResena } from "../services/api";

interface PropsFormulario {
  reservaId: string;
  alGuardar: () => void; 
}

function FormularioResena(props: PropsFormulario): ReactElement {
  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  function fncCambiarComentario(evento: ChangeEvent<HTMLTextAreaElement>): void {
    setComentario(evento.currentTarget.value);
  }

  async function fncEnviarResena(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault();
    if (calificacion === 0) {
      setError("Elige de 1 a 5 estrellas");
      return;
    }
    try {
      await fncCrearResena(props.reservaId, calificacion, comentario);
      props.alGuardar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <form className="resena-form" onSubmit={fncEnviarResena}>
      <strong>Califica a tu tutor</strong>
      <Estrellas valor={calificacion} alCambiar={setCalificacion} />
      <textarea className="resena-form__comentario" maxLength={500} rows={3}
        placeholder="Cuéntanos cómo fueron las clases (opcional)"
        value={comentario} onChange={fncCambiarComentario} />
      {error && <p className="resena-form__error">{error}</p>}
      <button type="submit" className="resena-form__boton">Enviar reseña</button>
    </form>
  );
}

export default FormularioResena;