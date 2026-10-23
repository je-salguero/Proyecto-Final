import { useEffect, useState, useRef } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io, Socket } from "socket.io-client";
import { fncObtenerHistorialChat, fncObtenerUsuarioGuardado } from "../services/api";
import type { MensajeChat, Usuario } from "../services/api";
import "../styles/chat.scss";

const URL_BACKEND = import.meta.env.VITE_API_URL || "http://localhost:4000";

function Chat() {
  const { reservaId } = useParams();
  const navegar = useNavigate();
  const usuarioLocal = fncObtenerUsuarioGuardado() as Usuario;

  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [nuevoTexto, setNuevoTexto] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const finalDelChat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!usuarioLocal || !reservaId) {
      navegar("/login");
      return;
    }

    async function cargarHistorial() {
      try {
        const historial = await fncObtenerHistorialChat(reservaId as string);
        setMensajes(historial);
      } catch (error) {
        console.log("Error cargando historial");
      }
    }
    cargarHistorial();

    const nuevoSocket = io(URL_BACKEND);
    setSocket(nuevoSocket);

    nuevoSocket.emit("unirse_chat", reservaId);

    nuevoSocket.on("nuevo_mensaje", (mensaje: MensajeChat) => {
      setMensajes((previos) => [...previos, mensaje]);
    });

    return () => {
      nuevoSocket.disconnect();
    };
  }, [reservaId]);

  useEffect(() => {
    finalDelChat.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  function fncEnviarMensaje(e: FormEvent) {
    e.preventDefault();
    if (!nuevoTexto.trim() || !socket) return;

    socket.emit("enviar_mensaje", {
      reservaId: reservaId,
      emisorId: usuarioLocal._id,
      texto: nuevoTexto,
    });

    setNuevoTexto("");
  }

  return (
    <div className="chat">
      <div className="chat__encabezado">
        <h2>Sala de Chat</h2>
        <button onClick={() => navegar(-1)}>Volver</button>
      </div>

      <div className="chat__mensajes">
        {mensajes.length === 0 && <p className="chat__vacio">No hay mensajes todavía. ¡Di hola!</p>}
        
        {mensajes.map((msg) => {
          const soyYo = msg.emisor._id === usuarioLocal._id;
          return (
            <div key={msg._id} className={`chat__burbuja ${soyYo ? "chat__burbuja--mia" : "chat__burbuja--otra"}`}>
              {!soyYo && <img src={msg.emisor.foto} alt="foto" referrerPolicy="no-referrer" />}
              <div className="chat__contenido">
                <span className="chat__autor">{soyYo ? "Tú" : msg.emisor.nombre}</span>
                <p>{msg.texto}</p>
                <small>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
              </div>
            </div>
          );
        })}
        <div ref={finalDelChat} />
      </div>

      <form className="chat__input" onSubmit={fncEnviarMensaje}>
        <input 
          type="text" 
          placeholder="Escribe un mensaje..." 
          value={nuevoTexto} 
          onChange={(e) => setNuevoTexto(e.target.value)} 
          autoFocus
        />
        <button type="submit" disabled={!nuevoTexto.trim()}>Enviar</button>
      </form>
    </div>
  );
}

export default Chat;