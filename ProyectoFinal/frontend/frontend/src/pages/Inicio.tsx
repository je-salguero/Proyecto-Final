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
  
  function fncIrAlPanel(): void {
    navegar("/admin");
  }

  function fncIrAExplorar(): void {
    navegar("/tutorias");
  }

  function fncIrAMisReservas(): void {
    navegar("/mis-reservas");
  }

  function fncIrAlPanelTutor(): void {
    navegar("/tutor");
  }

  if (!usuario) {
    return <p className="inicio__cargando">Cargando...</p>;
  }

  return (
    <div className="perfil-contenedor">
      <div className="perfil-tarjeta">
        <img 
          src={usuario.foto} 
          alt="Foto de perfil" 
          className="perfil-tarjeta__foto" 
          referrerPolicy="no-referrer" 
        />
        
        <h1 className="perfil-tarjeta__nombre">Hola, {usuario.nombre}</h1>
        <p className="perfil-tarjeta__email">{usuario.correo}</p>
        
        <span className={`perfil-tarjeta__rol perfil-tarjeta__rol--${usuario.rol}`}>
          Rol: {usuario.rol}
        </span>

        <div className="perfil-tarjeta__detalles">
          <div className="perfil-tarjeta__dato">
            <strong>Estado</strong>
            <span>{usuario.estado}</span>
          </div>
          
          <div className="perfil-tarjeta__dato">
            <strong>Teléfono</strong>
            <span>{usuario.telefono || "No registrado"}</span>
          </div>
          
          {usuario.direccion && (
            <div className="perfil-tarjeta__dato">
              <strong>Dirección</strong>
              <span>{usuario.direccion}</span>
            </div>
          )}

          {(usuario.latitud || usuario.longitud) && (
            <div className="perfil-tarjeta__dato">
              <strong>Ubicación</strong>
              <span>{usuario.latitud}, {usuario.longitud}</span>
            </div>
          )}

          {usuario.categorias && usuario.categorias.length > 0 && (
            <div className="perfil-tarjeta__dato">
              <strong>Categorías</strong>
              <span>{usuario.categorias.join(", ")}</span>
            </div>
          )}
        </div>

        <div className="perfil-tarjeta__acciones">
          {usuario.rol === "estudiante" && (
            <>
              <button className="btn-primario" onClick={fncIrAExplorar}>Explorar tutorías</button>
              <button className="btn-primario" onClick={fncIrAMisReservas}>Mis reservas</button>
            </>
          )}
          
          {usuario.rol === "tutor" && (
            <button className="btn-primario" onClick={fncIrAlPanelTutor}>Panel de tutor</button>
          )}
          
          {usuario.rol === "admin" && (
            <button className="btn-primario" onClick={fncIrAlPanel}>Panel de administración</button>
          )}
          
          <button className="btn-peligro" onClick={fncCerrarSesion}>Cerrar sesión</button>
        </div>
      </div>
    </div>
  );
}

export default Inicio;