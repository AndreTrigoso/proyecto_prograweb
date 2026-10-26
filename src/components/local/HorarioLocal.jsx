/*Permite consultar, modificar y guardar los horarios semanales del local y visualizar sus franjas de atención.*/

import { useEffect, useState } from "react";
import { useHU2 } from "./useHU2";
import "./styles/HorarioLocal.css";

const DIAS = [
  { id: "lunes", nombre: "Lunes" },
  { id: "martes", nombre: "Martes" },
  { id: "miercoles", nombre: "Miércoles" },
  { id: "jueves", nombre: "Jueves" },
  { id: "viernes", nombre: "Viernes" },
  { id: "sabado", nombre: "Sábado" },
  { id: "domingo", nombre: "Domingo" }
];

function obtenerHorario(horarioOriginal = []) {
  return DIAS.map(dia => {
    const existente = horarioOriginal.find(
      horario => horario.dia === dia.id
    );

    return {
      dia: dia.id,
      abierto: existente?.abierto ?? false,
      horaApertura: existente?.horaApertura ?? "08:00",
      horaCierre: existente?.horaCierre ?? "18:00"
    };
  });
}

function convertirMinutos(hora) {
  if (!/^\d{2}:\d{2}$/.test(hora)) {
    return NaN;
  }

  const [horas, minutos] = hora.split(":").map(Number);

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return NaN;
  }

  return horas * 60 + minutos;
}

function convertirHora(minutos) {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;

  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

function generarFranjas(horario) {
  if (!horario?.abierto) {
    return [];
  }

  const inicio = convertirMinutos(horario.horaApertura);
  const fin = convertirMinutos(horario.horaCierre);

  if (
    !Number.isFinite(inicio) ||
    !Number.isFinite(fin) ||
    inicio >= fin
  ) {
    return [];
  }

  const franjas = [];

  for (
    let minuto = inicio;
    minuto + 30 <= fin;
    minuto += 30
  ) {
    franjas.push({
      inicio: convertirHora(minuto),
      fin: convertirHora(minuto + 30)
    });
  }

  return franjas;
}

export default function HorarioLocal() {
  const { local, actualizarHorario } = useHU2();

  const [horarios, setHorarios] = useState(() =>
    obtenerHorario(local?.horarioAtencion)
  );

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");
  const [diaVistaPrevia, setDiaVistaPrevia] = useState("lunes");
  const [hayCambios, setHayCambios] = useState(false);

  useEffect(() => {
    if (!hayCambios) {
      setHorarios(obtenerHorario(local?.horarioAtencion));
    }
  }, [local, hayCambios]);

  function actualizarDia(diaId, campo, valor) {
    setHorarios(actuales =>
      actuales.map(horario =>
        horario.dia === diaId
          ? { ...horario, [campo]: valor }
          : horario
      )
    );

    setHayCambios(true);
    setMensaje("");

    setErrores(actuales => ({
      ...actuales,
      [diaId]: ""
    }));
  }

  function validarHorarios() {
    const nuevosErrores = {};

    horarios.forEach(horario => {
      if (!horario.abierto) {
        return;
      }

      const apertura = convertirMinutos(horario.horaApertura);
      const cierre = convertirMinutos(horario.horaCierre);

      if (
        !Number.isFinite(apertura) ||
        !Number.isFinite(cierre)
      ) {
        nuevosErrores[horario.dia] =
          "Debes indicar horas válidas de apertura y cierre.";
      } else if (apertura >= cierre) {
        nuevosErrores[horario.dia] =
          "La hora de cierre debe ser posterior a la apertura.";
      }
    });

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  }

  function guardarCambios() {
    if (!validarHorarios()) {
      setMensaje("Revisa los horarios señalados antes de guardar.");
      setTipoMensaje("error");
      return;
    }

    try {
      actualizarHorario(
        horarios.map(horario => ({ ...horario }))
      );

      setHayCambios(false);
      setErrores({});
      setTipoMensaje("exito");
      setMensaje("El horario se guardó correctamente.");
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(error.message || "No se pudo guardar el horario.");
    }
  }

  function cancelarCambios() {
    setHorarios(obtenerHorario(local?.horarioAtencion));
    setHayCambios(false);
    setErrores({});
    setMensaje("");
  }

  if (!local) {
    return (
      <section className="hu2-horario">
        <div className="hu2-horario-panel">
          <h1>Local no encontrado</h1>
          <p>No existe un local asociado a la sesión actual.</p>
        </div>
      </section>
    );
  }

  const horarioSeleccionado = horarios.find(
    horario => horario.dia === diaVistaPrevia
  );

  const franjas = generarFranjas(horarioSeleccionado);

  const diasAbiertos = horarios.filter(
    horario => horario.abierto
  ).length;

  return (
    <section className="hu2-horario">
      <div className="hu2-horario-encabezado">
        <div>
          <h1>Horario de atención</h1>
          <p>
            Configura los días y horarios en los que atiende
            tu cafetería.
          </p>
        </div>

        <span className="hu2-horario-resumen">
          {diasAbiertos} de 7 días abiertos
        </span>
      </div>

      <div className="hu2-horario-panel">
        <div className="hu2-horario-panel-encabezado">
          <div>
            <h2>Horario semanal</h2>
            <p>
              Activa los días de atención e indica las horas
              de apertura y cierre.
            </p>
          </div>
        </div>

        <div className="hu2-horario-tabla-contenedor">
          <table className="hu2-horario-tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Atención</th>
                <th>Apertura</th>
                <th>Cierre</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody>
              {horarios.map(horario => {
                const dia = DIAS.find(
                  item => item.id === horario.dia
                );

                return (
                  <tr key={horario.dia}>
                    <td className="hu2-horario-nombre-dia">
                      {dia?.nombre}
                    </td>

                    <td>
                      <label className="hu2-horario-interruptor">
                        <input
                          type="checkbox"
                          checked={horario.abierto}
                          onChange={e =>
                            actualizarDia(
                              horario.dia,
                              "abierto",
                              e.target.checked
                            )
                          }
                          aria-label={`Activar atención el ${dia?.nombre}`}
                        />
                        <span className="hu2-horario-slider" />
                      </label>
                    </td>

                    <td>
                      <input
                        className="hu2-horario-input"
                        type="time"
                        value={horario.horaApertura}
                        disabled={!horario.abierto}
                        onChange={e =>
                          actualizarDia(
                            horario.dia,
                            "horaApertura",
                            e.target.value
                          )
                        }
                        aria-label={`Apertura del ${dia?.nombre}`}
                      />
                    </td>

                    <td>
                      <input
                        className="hu2-horario-input"
                        type="time"
                        value={horario.horaCierre}
                        disabled={!horario.abierto}
                        onChange={e =>
                          actualizarDia(
                            horario.dia,
                            "horaCierre",
                            e.target.value
                          )
                        }
                        aria-label={`Cierre del ${dia?.nombre}`}
                      />
                    </td>

                    <td>
                      <span
                        className={
                          horario.abierto
                            ? "hu2-horario-etiqueta abierto"
                            : "hu2-horario-etiqueta cerrado"
                        }
                      >
                        {horario.abierto ? "Abierto" : "Cerrado"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {Object.keys(errores).some(Boolean) && (
          <div className="hu2-horario-errores">
            {DIAS.filter(dia => errores[dia.id]).map(dia => (
              <p key={dia.id}>
                <strong>{dia.nombre}:</strong>{" "}
                {errores[dia.id]}
              </p>
            ))}
          </div>
        )}

        <div className="hu2-horario-acciones">
          <button
            type="button"
            className="hu2-horario-btn-secundario"
            onClick={cancelarCambios}
            disabled={!hayCambios}
          >
            Cancelar cambios
          </button>

          <button
            type="button"
            className="hu2-horario-btn-primario"
            onClick={guardarCambios}
            disabled={!hayCambios}
          >
            Guardar horario
          </button>
        </div>

        {mensaje && (
          <p
            className={`hu2-horario-mensaje ${tipoMensaje}`}
            role="status"
          >
            {mensaje}
          </p>
        )}
      </div>

      <div className="hu2-horario-panel">
        <div className="hu2-horario-panel-encabezado">
          <div>
            <h2>Vista previa de franjas horarias</h2>
            <p>
              Consulta los intervalos de 30 minutos
              del día seleccionado.
            </p>
          </div>
        </div>

        <div className="hu2-horario-campo">
          <label htmlFor="hu2-dia-vista-previa">
            Seleccionar día
          </label>

          <select
            id="hu2-dia-vista-previa"
            value={diaVistaPrevia}
            onChange={e => setDiaVistaPrevia(e.target.value)}
          >
            {DIAS.map(dia => (
              <option key={dia.id} value={dia.id}>
                {dia.nombre}
              </option>
            ))}
          </select>
        </div>

        {!horarioSeleccionado?.abierto ? (
          <div className="hu2-horario-sin-franjas">
            El local no atiende durante este día.
          </div>
        ) : franjas.length === 0 ? (
          <div className="hu2-horario-sin-franjas">
            No hay intervalos completos de 30 minutos
            para mostrar.
          </div>
        ) : (
          <div className="hu2-horario-franjas">
            {franjas.map(franja => (
              <span
                key={franja.inicio}
                className="hu2-horario-franja"
              >
                {franja.inicio} - {franja.fin}
              </span>
            ))}
          </div>
        )}

        <p className="hu2-horario-nota">
          Esta vista previa es informativa. Las franjas
          definitivas de recojo de pedidos se gestionarán
          en la historia de usuario correspondiente.
        </p>
      </div>
    </section>
  );
}
