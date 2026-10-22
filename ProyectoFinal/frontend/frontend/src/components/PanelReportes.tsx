import { useEffect, useState } from "react";
import { fncObtenerRankingTutores, fncObtenerDemandaCategorias, fncObtenerReporteMensual } from "../services/api";
import type { RankingTutor, DemandaCategoria, ReporteMensual } from "../services/api";
import "../styles/admin.scss"; 

function PanelReportes() {
  const [ranking, setRanking] = useState<RankingTutor[]>([]);
  const [demanda, setDemanda] = useState<DemandaCategoria[]>([]);
  const [mensual, setMensual] = useState<ReporteMensual[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const NOMBRES_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

  useEffect(() => {
    async function fncCargarDatos() {
      try {
        const [resRanking, resDemanda, resMensual] = await Promise.all([
          fncObtenerRankingTutores(),
          fncObtenerDemandaCategorias(),
          fncObtenerReporteMensual()
        ]);
        setRanking(resRanking);
        setDemanda(resDemanda);
        setMensual(resMensual);
      } catch (e) {
        setMensaje("No se pudieron cargar los reportes. Verifica que tengas permisos de administrador.");
      }
      setCargando(false);
    }
    fncCargarDatos();
  }, []);

  if (cargando) return <p>Cargando reportes...</p>;
  if (mensaje) return <p className="admin__error">{mensaje}</p>;

  const maxDemanda = demanda.length > 0 ? Math.max(...demanda.map(d => d.totalReservas)) : 1;
  const maxMensual = mensual.length > 0 ? Math.max(...mensual.map(m => m.aceptadas + m.canceladas)) : 1;

  return (
    <div className="reportes">
      <div className="reportes__bloque">
        <h3>Ranking de Tutores</h3>
        {ranking.length === 0 ? <p>No hay reseñas todavía.</p> : (
          <table className="reportes__tabla">
            <thead>
              <tr><th>Tutor</th><th>Promedio</th><th>Reseñas</th></tr>
            </thead>
            <tbody>
              {ranking.map((tutor) => (
                <tr key={tutor._id}>
                  <td>{tutor.nombre}</td>
                  <td>⭐ {tutor.promedio}</td>
                  <td>{tutor.totalResenas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="reportes__bloque">
        <h3>Demanda por Categoría</h3>
        {demanda.length === 0 ? <p>No hay reservas todavía.</p> : (
          <div className="reportes__grafica">
            {demanda.map((cat) => (
              <div key={cat._id} className="reportes__fila-grafica">
                <span className="reportes__etiqueta">{cat._id} ({cat.totalReservas})</span>
                <div className="reportes__barra-fondo">
                  <div className="reportes__barra-llena" style={{ width: `${(cat.totalReservas / maxDemanda) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="reportes__bloque">
        <h3>Clases Impartidas vs Canceladas (Mensual)</h3>
        {mensual.length === 0 ? <p>No hay datos mensuales.</p> : (
          <div className="reportes__grafica">
            {mensual.map((mes) => {
              const total = mes.aceptadas + mes.canceladas;
              const porcAceptadas = total === 0 ? 0 : (mes.aceptadas / maxMensual) * 100;
              const porcCanceladas = total === 0 ? 0 : (mes.canceladas / maxMensual) * 100;

              return (
                <div key={`${mes._id.anio}-${mes._id.mes}`} className="reportes__fila-grafica">
                  <span className="reportes__etiqueta">{NOMBRES_MESES[mes._id.mes - 1]} {mes._id.anio}</span>
                  <div className="reportes__barra-fondo reportes__barra-doble">
                    <div className="reportes__barra-aceptada" style={{ width: `${porcAceptadas}%` }} title={`Impartidas: ${mes.aceptadas}`}></div>
                    <div className="reportes__barra-cancelada" style={{ width: `${porcCanceladas}%` }} title={`Canceladas: ${mes.canceladas}`}></div>
                  </div>
                </div>
              );
            })}
            <div className="reportes__leyenda">
              <span className="leyenda-aceptada">■ Impartidas</span>
              <span className="leyenda-cancelada">■ Canceladas/Rechazadas</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PanelReportes;