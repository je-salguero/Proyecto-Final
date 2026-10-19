import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import { fncLoginConGoogle, fncGuardarSesion } from "../services/api";
import "../styles/login.scss";

function Login() {
  const navegar = useNavigate();
  const [error, setError] = useState("");

  async function fncManejarLogin(respuestaGoogle: CredentialResponse): Promise<void> {
    try {
      if (!respuestaGoogle.credential) {
        setError("Google no envió la credencial");
        return;
      }
      const datos = await fncLoginConGoogle(respuestaGoogle.credential);
      fncGuardarSesion(datos.token, datos.usuario);
      navegar(datos.usuario.perfilCompleto ? "/inicio" : "/onboarding");
    } catch (e) {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    }
  }

  function fncManejarError(): void {
    setError("Falló el inicio de sesión con Google");
  }

  return (
    <div className="login">
      <div className="login__tarjeta">
        <h1>Tutorías</h1>
        <p>Inicia sesión para continuar</p>
        <GoogleLogin onSuccess={fncManejarLogin} onError={fncManejarError} />
        {error && <p className="login__error">{error}</p>}
      </div>
    </div>
  );
}

export default Login;