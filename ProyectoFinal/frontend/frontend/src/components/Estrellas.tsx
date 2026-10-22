import type { MouseEvent, ReactElement } from "react";

interface PropsEstrellas {
  valor: number; 
  alCambiar?: (nuevoValor: number) => void; 
}

function Estrellas(props: PropsEstrellas): ReactElement {
  function fncElegirEstrella(evento: MouseEvent<HTMLButtonElement>): void {
    if (props.alCambiar) {
      props.alCambiar(Number(evento.currentTarget.dataset.valor));
    }
  }

  const botones: ReactElement[] = [];
  for (let numero = 1; numero <= 5; numero++) {
    const clase = numero <= Math.round(props.valor) ? "estrellas__estrella estrellas__estrella--llena" : "estrellas__estrella";
    botones.push(
      <button key={numero} type="button" className={clase} data-valor={numero}
        disabled={!props.alCambiar} onClick={fncElegirEstrella}>
        ★
      </button>
    );
  }

  return <span className="estrellas">{botones}</span>;
}

export default Estrellas;