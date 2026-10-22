import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Inicio from "./pages/Inicio";
import Admin from "./pages/Admin";
import Tutor from "./pages/Tutor";
import Explorar from "./pages/Explorar";
import Reservar from "./pages/Reservar";
import MisReservas from "./pages/MisReservas";
import "./styles/resenas.scss";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/inicio" element={<Inicio />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/tutor" element={<Tutor />} />
      <Route path="/tutorias" element={<Explorar />} />
      <Route path="/reservar/:id" element={<Reservar />} />
      <Route path="/mis-reservas" element={<MisReservas />} />
    </Routes>
  );
}

export default App;