const URL_API = import.meta.env.VITE_API_URL as string;

export interface Usuario {
  _id: string;
  nombre: string;
  correo: string;
  foto: string;
  rol: string;
  estado: string;
  perfilCompleto: boolean;
  telefono: string;
  genero: string;
  direccion: string;
  latitud: number;
  longitud: number;
  categorias: string[];
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
  esNuevo: boolean;
}

export interface RespuestaOnboarding {
  token: string;
  usuario: Usuario;
}

export interface DatosOnboarding {
  rol: string;
  telefono: string;
  genero: string;
  direccion: string;
  latitud: number;
  longitud: number;
  documento: string;
  categorias: string[];
  hojaDeVida: string;
  biografia: string;
  tarifaHora: number;
}

export function fncGuardarSesion(token: string, usuario: Usuario): void {
  localStorage.setItem("token", token);
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

export function fncObtenerUsuarioGuardado(): Usuario | null {
  const texto = localStorage.getItem("usuario");
  if (!texto) {
    return null;
  }
  return JSON.parse(texto);
}

export function fncCerrarSesion(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("usuario");
  window.location.href = "/login";
}

export async function fncLoginConGoogle(credencial: string): Promise<RespuestaLogin> {
  const respuesta = await fetch(URL_API + "/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credencial: credencial }),
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo iniciar sesión");
  }
  return await respuesta.json();
}

export async function fncPeticion(ruta: string, opciones: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("token");

  const respuesta = await fetch(URL_API + ruta, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  });

  if (respuesta.status === 401) {
    fncCerrarSesion();
  }
  return respuesta;
}

export async function fncEnviarOnboarding(datos: DatosOnboarding): Promise<RespuestaOnboarding> {
  const respuesta = await fncPeticion("/api/auth/onboarding", {
    method: "PUT",
    body: JSON.stringify(datos),
  });
  const resultado = await respuesta.json();

  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || "No se pudo guardar el perfil");
  }
  return resultado;
}