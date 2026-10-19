import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fncPeticion, fncCerrarSesion } from "../services/api";
import type { Usuario } from "../services/api";
import "../styles/inicio.scss";

function Inicio() {
  const navegar = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(function fncRevisarPerfil() {
    async function fncCargarPerfil(): Promise<void> {
      const respuesta = await fncPeticion("/api/auth/perfil");
      if (respuesta.ok) {
        const datos: Usuario = await respuesta.json();
        if (!datos.perfilCompleto) {
          navegar("/onboarding");
          return;
        }
        setUsuario(datos);
      }
    }
    fncCargarPerfil();
  }, []);

  if (!usuario) {
    return <p className="inicio__cargando">Cargando...</p>;
  }

  return (
    <div className="inicio">
      <img src={usuario.foto} alt="Foto de perfil" referrerPolicy="no-referrer" />
      <h1>Hola, {usuario.nombre}</h1>
      <p>{usuario.correo}</p>
      <p>Rol: {usuario.rol} | Estado: {usuario.estado}</p>
      <p>Teléfono: {usuario.telefono}</p>
      <p>Dirección: {usuario.direccion}</p>
      <p>Ubicación: {usuario.latitud}, {usuario.longitud}</p>
      <p>Categorías: {usuario.categorias.join(", ")}</p>
      <button onClick={fncCerrarSesion}>Cerrar sesión</button>
    </div>
  );
}

export default Inicio;