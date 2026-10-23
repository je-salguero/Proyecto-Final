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
  hojaDeVida: string;
  biografia: string;
  tarifaHora: number;
  aprobado: boolean;
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

export interface Categoria {
  _id: string;
  nombre: string;
  descripcion: string;
  padre: string; 
  activa: boolean;
}

export async function fncObtenerCategorias(): Promise<Categoria[]> {
  const respuesta = await fncPeticion("/api/categorias");
  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar las categorías");
  }
  return await respuesta.json();
}

async function fncPeticionJson(ruta: string, opciones: RequestInit = {}): Promise<any> {
  const respuesta = await fncPeticion(ruta, opciones);
  const resultado = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(resultado.mensaje || "Ocurrió un error");
  }
  return resultado;
}

export async function fncObtenerTutores(aprobado: string): Promise<Usuario[]> {
  return await fncPeticionJson("/api/admin/tutores?aprobado=" + aprobado);
}

export async function fncCambiarAprobacionTutor(id: string, aprobado: boolean): Promise<Usuario> {
  return await fncPeticionJson("/api/admin/tutores/" + id + "/aprobacion", {
    method: "PUT",
    body: JSON.stringify({ aprobado: aprobado }),
  });
}

export interface DatosCategoria {
  nombre: string;
  descripcion: string;
  padre: string;
}

export async function fncCrearCategoria(datos: DatosCategoria): Promise<Categoria> {
  return await fncPeticionJson("/api/categorias", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function fncActualizarCategoria(
  id: string,
  cambios: { nombre?: string; activa?: boolean }
): Promise<Categoria> {
  return await fncPeticionJson("/api/categorias/" + id, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

export async function fncEliminarCategoria(id: string): Promise<void> {
  await fncPeticionJson("/api/categorias/" + id, { method: "DELETE" });
}

export interface BloqueDisponibilidad {
  dia: number;
  horaInicio: string;
  horaFin: string;
}

export async function fncObtenerMiDisponibilidad(): Promise<BloqueDisponibilidad[]> {
  return await fncPeticionJson("/api/disponibilidad/mia");
}

export async function fncGuardarDisponibilidad(
  bloques: BloqueDisponibilidad[]
): Promise<BloqueDisponibilidad[]> {
  return await fncPeticionJson("/api/disponibilidad", {
    method: "PUT",
    body: JSON.stringify({ bloques: bloques }),
  });
}

export interface TutoriaPropia {
  _id: string;
  categoria: { _id: string; nombre: string } | null;
  titulo: string;
  descripcion: string;
  modalidades: string[];
  tarifaHora: number;
  tarifaKm: number;
  activa: boolean;
}

export interface DatosTutoria {
  titulo: string;
  descripcion: string;
  categoria: string; 
  modalidades: string[];
  tarifaHora: number;
  tarifaKm: number;
  activa: boolean;
}

export async function fncObtenerMisTutorias(): Promise<TutoriaPropia[]> {
  return await fncPeticionJson("/api/tutorias/mias");
}

export async function fncCrearTutoria(datos: DatosTutoria): Promise<void> {
  await fncPeticionJson("/api/tutorias", { method: "POST", body: JSON.stringify(datos) });
}

export async function fncActualizarTutoria(id: string, datos: DatosTutoria): Promise<void> {
  await fncPeticionJson("/api/tutorias/" + id, { method: "PUT", body: JSON.stringify(datos) });
}

export interface ReservaDetalle {
  _id: string;
  tutoria: { _id: string; titulo: string };
  tutor: { _id: string; nombre: string; foto: string };
  estudiante: { _id: string; nombre: string; foto: string; telefono: string };
  modalidad: string;
  fechaInicio: string;
  semanas: number;
  horasPorSesion: number;
  diasFijos: { dia: number; horaInicio: string }[];
  sesiones: { inicio: string; fin: string }[];
  distanciaKm: number;
  costoClases: number;
  costoTraslado: number;
  total: number;
  estado: string; 
}

export async function fncObtenerMisReservas(): Promise<ReservaDetalle[]> {
  return await fncPeticionJson("/api/reservas/mias");
}

export async function fncResponderReserva(id: string, aceptar: boolean): Promise<void> {
  await fncPeticionJson("/api/reservas/" + id + "/responder", {
    method: "PUT",
    body: JSON.stringify({ aceptar: aceptar }),
  });
}

export async function fncCancelarReserva(id: string): Promise<void> {
  await fncPeticionJson("/api/reservas/" + id + "/cancelar", { method: "PUT" });
}

export function fncRutaSiNoTieneRol(rol: string): string {
  const usuario = fncObtenerUsuarioGuardado();
  if (!usuario) {
    return "/login";
  }
  if (usuario.rol !== rol) {
    return "/inicio";
  }
  return "";
}

export interface TutoriaPublica {
  _id: string;
  tutor: { _id: string; nombre: string; foto: string; biografia: string };
  categoria: { _id: string; nombre: string } | null;
  titulo: string;
  descripcion: string;
  modalidades: string[];
  tarifaHora: number;
  tarifaKm: number;
}

export async function fncObtenerTutorias(categoria: string, modalidad: string): Promise<TutoriaPublica[]> {
  let ruta = "/api/tutorias?";
  if (categoria !== "") {
    ruta = ruta + "categoria=" + categoria + "&";
  }
  if (modalidad !== "") {
    ruta = ruta + "modalidad=" + modalidad + "&";
  }
  return await fncPeticionJson(ruta);
}

export async function fncObtenerTutoria(id: string): Promise<TutoriaPublica> {
  return await fncPeticionJson("/api/tutorias/" + id);
}

export async function fncObtenerDisponibilidadDeTutor(idTutor: string): Promise<BloqueDisponibilidad[]> {
  return await fncPeticionJson("/api/disponibilidad/tutor/" + idTutor);
}

export interface DiaFijo {
  dia: number;
  horaInicio: string;
}

export interface DatosReserva {
  tutoria: string;
  modalidad: string;
  fechaInicio: string; 
  semanas: number;
  horasPorSesion: number;
  diasFijos: DiaFijo[];
}

export interface Estimacion {
  totalSesiones: number;
  distanciaKm: number;
  costoClases: number;
  costoTraslado: number;
  total: number;
  sesiones: { inicio: string; fin: string }[];
}

export async function fncSimularReserva(datos: DatosReserva): Promise<Estimacion> {
  return await fncPeticionJson("/api/reservas?simular=true", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function fncCrearReserva(datos: DatosReserva): Promise<void> {
  await fncPeticionJson("/api/reservas", { method: "POST", body: JSON.stringify(datos) });
}

export interface Resena {
  _id: string;
  estudiante: { _id: string; nombre: string; foto: string };
  calificacion: number;
  comentario: string;
  createdAt: string;
}

export interface RespuestaResenas {
  promedio: number;
  total: number;
  resenas: Resena[];
}

export async function fncCrearResena(reservaId: string, calificacion: number, comentario: string): Promise<void> {
  await fncPeticionJson("/api/resenas", {
    method: "POST",
    body: JSON.stringify({ reservaId: reservaId, calificacion: calificacion, comentario: comentario }),
  });
}

export async function fncObtenerMisResenas(): Promise<string[]> {
  return await fncPeticionJson("/api/resenas/mias");
}

export async function fncObtenerResenasRecibidas(): Promise<RespuestaResenas> {
  return await fncPeticionJson("/api/resenas/recibidas");
}

export async function fncObtenerResenasDeTutor(tutorId: string): Promise<RespuestaResenas> {
  return await fncPeticionJson("/api/resenas/tutor/" + tutorId);
}

export interface RankingTutor {
  _id: string;
  nombre: string;
  promedio: number;
  totalResenas: number;
}

export interface DemandaCategoria {
  _id: string; 
  totalReservas: number;
}

export interface ReporteMensual {
  _id: { mes: number; anio: number };
  aceptadas: number;
  canceladas: number;
}

export async function fncObtenerRankingTutores(): Promise<RankingTutor[]> {
  return await fncPeticionJson("/api/reportes/tutores");
}

export async function fncObtenerDemandaCategorias(): Promise<DemandaCategoria[]> {
  return await fncPeticionJson("/api/reportes/demanda");
}

export async function fncObtenerReporteMensual(): Promise<ReporteMensual[]> {
  return await fncPeticionJson("/api/reportes/mensual");
}

export interface MensajeChat {
  _id: string;
  reserva: string;
  emisor: { _id: string; nombre: string; foto: string };
  texto: string;
  createdAt: string;
}

export async function fncObtenerHistorialChat(reservaId: string): Promise<MensajeChat[]> {
  return await fncPeticionJson("/api/chat/" + reservaId);
}