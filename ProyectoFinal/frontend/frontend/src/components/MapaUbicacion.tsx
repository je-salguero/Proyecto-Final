import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import iconoMarcador from "leaflet/dist/images/marker-icon.png";
import iconoMarcador2x from "leaflet/dist/images/marker-icon-2x.png";
import sombraMarcador from "leaflet/dist/images/marker-shadow.png";

const iconoPersonalizado = L.icon({
  iconUrl: iconoMarcador,
  iconRetinaUrl: iconoMarcador2x,
  shadowUrl: sombraMarcador,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

interface PropiedadesMapa {
  latitud: number | null;
  longitud: number | null;
  alElegirUbicacion: (latitud: number, longitud: number) => void;
}

function MapaUbicacion(props: PropiedadesMapa) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const mapa = useRef<L.Map | null>(null);
  const marcador = useRef<L.Marker | null>(null);

  useEffect(function fncCrearMapa() {
    const nuevoMapa = L.map(contenedor.current as HTMLDivElement).setView([14.6349, -90.5069], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(nuevoMapa);

    function fncAlHacerClic(evento: L.LeafletMouseEvent): void {
      props.alElegirUbicacion(evento.latlng.lat, evento.latlng.lng);
    }
    nuevoMapa.on("click", fncAlHacerClic);

    mapa.current = nuevoMapa;

    return function fncDestruirMapa() {
      nuevoMapa.remove();
      mapa.current = null;
      marcador.current = null;
    };
  }, []);

  useEffect(function fncMoverMarcador() {
    if (!mapa.current || props.latitud === null || props.longitud === null) {
      return;
    }
    const posicion: L.LatLngExpression = [props.latitud, props.longitud];

    if (marcador.current) {
      marcador.current.setLatLng(posicion);
    } else {
      marcador.current = L.marker(posicion, { icon: iconoPersonalizado }).addTo(mapa.current);
    }
    mapa.current.setView(posicion, 15);
  }, [props.latitud, props.longitud]);

  return <div ref={contenedor} className="mapa-ubicacion"></div>;
}

export default MapaUbicacion;