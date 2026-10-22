import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import MapaUbicacion from "../components/MapaUbicacion";
import {
  fncEnviarOnboarding,
  fncGuardarSesion,
  fncObtenerUsuarioGuardado,
  fncObtenerCategorias,
} from "../services/api";
import type { DatosOnboarding, Categoria } from "../services/api";
import "../styles/onboarding.scss";

interface DatosFormulario {
  rol: string;
  telefono: string;
  genero: string;
  documento: string;
  direccion: string;
  hojaDeVida: string;
  biografia: string;
  tarifaHora: string; 
}

function Onboarding() {
  const navegar = useNavigate();

  const [datos, setDatos] = useState<DatosFormulario>({
    rol: "estudiante",
    telefono: "",
    genero: "",
    documento: "",
    direccion: "",
    hojaDeVida: "",
    biografia: "",
    tarifaHora: "",
  });

  const [latitud, setLatitud] = useState<number | null>(null);
  const [longitud, setLongitud] = useState<number | null>(null);
  const [categoriasElegidas, setCategoriasElegidas] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  useEffect(function fncRevisarSesion() {
    const usuarioGuardado = fncObtenerUsuarioGuardado();
    if (!usuarioGuardado) {
      navegar("/login");
    } else if (usuarioGuardado.perfilCompleto) {
      navegar("/inicio");
    }
  }, []);

  useEffect(function fncCargarCategorias() {
    async function fncPedirCategorias(): Promise<void> {
      try {
        const lista = await fncObtenerCategorias();
        setCategoriasDisponibles(lista);
      } catch (e) {
        setError("No se pudieron cargar las categorías. Recarga la página.");
      }
      setCargandoCategorias(false);
    }
    fncPedirCategorias();
  }, []);

  function fncCambiarCampo(
    evento: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ): void {
    setDatos({ ...datos, [evento.target.name]: evento.target.value });
  }

  function fncElegirUbicacion(nuevaLatitud: number, nuevaLongitud: number): void {
    setLatitud(nuevaLatitud);
    setLongitud(nuevaLongitud);
  }

  function fncUbicacionObtenida(posicion: GeolocationPosition): void {
    fncElegirUbicacion(posicion.coords.latitude, posicion.coords.longitude);
  }

  function fncUbicacionFallida(): void {
    setError("No se pudo obtener tu ubicación. Haz clic en el mapa para fijarla.");
  }

  function fncUsarMiUbicacion(): void {
    if (!navigator.geolocation) {
      setError("Tu navegador no permite obtener la ubicación.");
      return;
    }
    navigator.geolocation.getCurrentPosition(fncUbicacionObtenida, fncUbicacionFallida);
  }

  function fncAlternarCategoria(categoria: string): void {
    function fncEsOtraCategoria(texto: string): boolean {
      return texto !== categoria;
    }
    if (categoriasElegidas.includes(categoria)) {
      setCategoriasElegidas(categoriasElegidas.filter(fncEsOtraCategoria));
    } else {
      setCategoriasElegidas([...categoriasElegidas, categoria]);
    }
  }

  function fncCambiarCategoria(evento: ChangeEvent<HTMLInputElement>): void {
    fncAlternarCategoria(evento.target.value);
  }

  function fncDibujarCategoria(categoria: Categoria) {
    return (
      <label key={categoria._id} className="onboarding__categoria">
        <input
          type="checkbox"
          value={categoria.nombre}
          checked={categoriasElegidas.includes(categoria.nombre)}
          onChange={fncCambiarCategoria}
        />
        {categoria.nombre}
      </label>
    );
  }

  function fncEsCategoriaPrincipal(categoria: Categoria): boolean {
    return categoria.padre === "";
  }

  function fncValidarFormulario(): string {
    if (datos.telefono.trim() === "") return "Ingresa tu teléfono";
    if (datos.genero === "") return "Selecciona tu género";
    if (datos.documento.trim() === "") return "Ingresa tu documento de identificación";
    if (datos.direccion.trim() === "") return "Ingresa tu dirección";
    if (latitud === null || longitud === null) return "Fija tu ubicación en el mapa";
    if (categoriasElegidas.length === 0) return "Selecciona al menos una categoría";

    if (datos.rol === "tutor") {
      if (datos.hojaDeVida.trim() === "") return "Ingresa el enlace de tu hoja de vida";
      if (datos.biografia.trim() === "") return "Escribe tu biografía";
      const tarifa = Number(datos.tarifaHora);
      if (isNaN(tarifa) || tarifa <= 0) return "La tarifa por hora debe ser mayor a 0";
    }
    return "";
  }

  async function fncEnviarFormulario(evento: FormEvent<HTMLFormElement>): Promise<void> {
    evento.preventDefault(); 
    const mensaje = fncValidarFormulario();
    if (mensaje !== "") {
      setError(mensaje);
      return;
    }
    if (latitud === null || longitud === null) {
      return;
    }

    setError("");
    setGuardando(true);

    try {
      const datosEnviar: DatosOnboarding = {
        rol: datos.rol,
        telefono: datos.telefono,
        genero: datos.genero,
        direccion: datos.direccion,
        latitud: latitud,
        longitud: longitud,
        documento: datos.documento,
        categorias: categoriasElegidas,
        hojaDeVida: datos.hojaDeVida,
        biografia: datos.biografia,
        tarifaHora: Number(datos.tarifaHora),
      };
      const respuesta = await fncEnviarOnboarding(datosEnviar);
      fncGuardarSesion(respuesta.token, respuesta.usuario);
      navegar("/inicio");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el perfil");
    }
    setGuardando(false);
  }

  const categoriasPrincipales = categoriasDisponibles.filter(fncEsCategoriaPrincipal);

  return (
    <div className="onboarding">
      <form className="onboarding__formulario" onSubmit={fncEnviarFormulario}>
        <h1>Completa tu perfil</h1>
        <p className="onboarding__ayuda">Cuéntanos un poco más para empezar.</p>

        <h2>¿Cómo vas a usar la plataforma?</h2>
        <div className="onboarding__roles">
          <label
            className={datos.rol === "estudiante" ? "onboarding__rol onboarding__rol--activo" : "onboarding__rol"}
          >
            <input
              type="radio"
              name="rol"
              value="estudiante"
              checked={datos.rol === "estudiante"}
              onChange={fncCambiarCampo}
            />
            Soy estudiante
            <span>Busco tutores para aprender</span>
          </label>
          <label
            className={datos.rol === "tutor" ? "onboarding__rol onboarding__rol--activo" : "onboarding__rol"}
          >
            <input
              type="radio"
              name="rol"
              value="tutor"
              checked={datos.rol === "tutor"}
              onChange={fncCambiarCampo}
            />
            Soy tutor
            <span>Quiero ofrecer tutorías</span>
          </label>
        </div>

        <h2>Tus datos</h2>
        <label className="onboarding__campo">
          Teléfono / WhatsApp
          <input name="telefono" type="tel" value={datos.telefono} onChange={fncCambiarCampo} placeholder="55551234" />
        </label>
        <label className="onboarding__campo">
          Género
          <select name="genero" value={datos.genero} onChange={fncCambiarCampo}>
            <option value="">Selecciona una opción</option>
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
            <option value="Otro">Otro</option>
            <option value="Prefiero no decirlo">Prefiero no decirlo</option>
          </select>
        </label>
        <label className="onboarding__campo">
          Documento de identificación
          <input name="documento" type="text" value={datos.documento} onChange={fncCambiarCampo} placeholder="Número de DPI" />
        </label>

        <h2>Ubicación</h2>
        <label className="onboarding__campo">
          Dirección
          <input name="direccion" type="text" value={datos.direccion} onChange={fncCambiarCampo} placeholder="Zona, colonia, municipio" />
        </label>
        <p className="onboarding__ayuda">Haz clic en el mapa para fijar tu ubicación exacta.</p>
        <MapaUbicacion latitud={latitud} longitud={longitud} alElegirUbicacion={fncElegirUbicacion} />
        <button type="button" className="onboarding__boton-secundario" onClick={fncUsarMiUbicacion}>
          Usar mi ubicación actual
        </button>
        {latitud !== null && longitud !== null && (
          <p className="onboarding__ayuda">
            Ubicación fijada: {latitud.toFixed(5)}, {longitud.toFixed(5)}
          </p>
        )}

        <h2>{datos.rol === "tutor" ? "Categorías que enseñas" : "Categorías de interés"}</h2>
        
        <div className="onboarding__categorias">
          {cargandoCategorias && <p className="onboarding__ayuda">Cargando categorías...</p>}
          {!cargandoCategorias && categoriasPrincipales.length === 0 && (
            <p className="onboarding__ayuda">Todavía no hay categorías disponibles.</p>
          )}
          {categoriasPrincipales.map(fncDibujarCategoria)}
        </div>

        {datos.rol === "tutor" && (
          <>
            <h2>Perfil de tutor</h2>
            <label className="onboarding__campo">
              Hoja de vida (enlace)
              <input name="hojaDeVida" type="url" value={datos.hojaDeVida} onChange={fncCambiarCampo} placeholder="https://..." />
            </label>
            <label className="onboarding__campo">
              Biografía
              <textarea name="biografia" value={datos.biografia} onChange={fncCambiarCampo} placeholder="Cuenta tu experiencia" />
            </label>
            <label className="onboarding__campo">
              Tarifa por hora (Q)
              <input name="tarifaHora" type="number" min="0" value={datos.tarifaHora} onChange={fncCambiarCampo} placeholder="50" />
            </label>
          </>
        )}

        {error && <p className="onboarding__error">{error}</p>}
        <button type="submit" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar y continuar"}
        </button>
      </form>
    </div>
  );
}

export default Onboarding;