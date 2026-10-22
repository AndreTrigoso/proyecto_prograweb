/*Permite administrar grupos de opciones mediante un listado y un panel de edición del producto seleccionado.*/

import { useState } from "react";
import { useHU2 } from "./useHU2";
import { productosService } from "../services/storageService";
import "./styles/OpcionesProducto.css";

const crearGrupo = () => ({
  id: `grp-${crypto.randomUUID()}`,
  nombre: "",
  tipo: "unica",
  obligatorio: false,
  maxSeleccion: 1,
  opciones: []
});

const crearOpcion = () => ({
  id: `opt-${crypto.randomUUID()}`,
  nombre: "",
  precioAdicional: 0
});

export default function OpcionesProducto({ productoId, onVolver }) {
  const { localId, productosLocal } = useHU2();
  const producto = productosLocal.find(p => p.id === productoId);

  const [grupos, setGrupos] = useState(
    () => structuredClone(producto?.gruposOpciones ?? [])
  );
  const [activo, setActivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");
  const [hayCambios, setHayCambios] = useState(false);

  function modificar(nuevos) {
    setGrupos(nuevos);
    setHayCambios(true);
    setErrores({});
    setMensaje("");
  }

  function cambiarGrupo(indice, cambios) {
    modificar(grupos.map((grupo, i) =>
      i === indice ? { ...grupo, ...cambios } : grupo
    ));
  }

  function cambiarOpcion(gi, oi, cambios) {
    modificar(grupos.map((grupo, i) =>
      i === gi
        ? {
            ...grupo,
            opciones: grupo.opciones.map((opcion, j) =>
              j === oi ? { ...opcion, ...cambios } : opcion
            )
          }
        : grupo
    ));
  }

  function agregarGrupo() {
    const nuevo = crearGrupo();
    modificar([...grupos, nuevo]);
    setActivo(nuevo.id);
  }

  function eliminarGrupo(indice) {
    if (!window.confirm("¿Eliminar este grupo y todas sus opciones?")) return;

    const id = grupos[indice].id;
    modificar(grupos.filter((_, i) => i !== indice));

    if (activo === id) setActivo(null);
  }

  function agregarOpcion(indice) {
    cambiarGrupo(indice, {
      opciones: [...grupos[indice].opciones, crearOpcion()]
    });
  }

  function eliminarOpcion(gi, oi) {
    if (!window.confirm("¿Eliminar esta opción?")) return;
    cambiarGrupo(gi, {
      opciones: grupos[gi].opciones.filter((_, i) => i !== oi)
    });
  }

  function validar() {
    const nuevos = {};
    const nombresGrupos = new Set();

    grupos.forEach((grupo, i) => {
      const nombreGrupo = grupo.nombre.trim().toLowerCase();

      if (nombreGrupo.length < 2 || nombresGrupos.has(nombreGrupo)) {
        nuevos[`g${i}`] = "El nombre debe tener al menos 2 caracteres y no repetirse.";
      }
      nombresGrupos.add(nombreGrupo);

      if (grupo.opciones.length === 0) {
        nuevos[`v${i}`] = "Agrega al menos una alternativa.";
      }

      const maximo = Number(grupo.maxSeleccion);
      if (
        !Number.isInteger(maximo) ||
        maximo < 1 ||
        maximo > grupo.opciones.length ||
        (grupo.tipo === "unica" && maximo !== 1)
      ) {
        nuevos[`m${i}`] = "El máximo de selecciones no es válido.";
      }

      const nombresOpciones = new Set();

      grupo.opciones.forEach((opcion, j) => {
        const nombre = opcion.nombre.trim().toLowerCase();
        const precioTexto = String(opcion.precioAdicional);
        const precio = Number(precioTexto);

        if (nombre.length < 2 || nombresOpciones.has(nombre)) {
          nuevos[`o${i}-${j}`] = "Nombre muy corto o repetido.";
        }
        nombresOpciones.add(nombre);

        if (
          !/^\d+(\.\d{1,2})?$/.test(precioTexto) ||
          !Number.isFinite(precio) ||
          precio < 0
        ) {
          nuevos[`p${i}-${j}`] = "Precio inválido. Máximo dos decimales.";
        }
      });
    });

    setErrores(nuevos);

    if (Object.keys(nuevos).length > 0) {
      const primerIndice = Number(Object.keys(nuevos)[0].match(/\d+/)?.[0] ?? 0);
      setActivo(grupos[primerIndice]?.id ?? null);
      setMensaje("Corrige los campos señalados.");
      setTipoMensaje("error");
      return false;
    }

    return true;
  }

  function guardar() {
    if (!validar()) return;

    try {
      const actual = productosService.getById(productoId);

      if (!actual || actual.localId !== localId) {
        throw new Error("El producto no pertenece al local.");
      }

      const normalizados = grupos.map(grupo => ({
        ...grupo,
        nombre: grupo.nombre.trim(),
        maxSeleccion: grupo.tipo === "unica"
          ? 1 : Number(grupo.maxSeleccion),
        opciones: grupo.opciones.map(opcion => ({
          ...opcion,
          nombre: opcion.nombre.trim(),
          precioAdicional: Number(opcion.precioAdicional)
        }))
      }));

      const resultado = productosService.save({
        ...actual,
        gruposOpciones: normalizados
      });

      if (!resultado) throw new Error("No se pudieron guardar las opciones.");

      setGrupos(normalizados);
      setHayCambios(false);
      setTipoMensaje("exito");
      setMensaje("Opciones y agregados guardados correctamente.");
    } catch (error) {
      setTipoMensaje("error");
      setMensaje(error.message || "No se pudo guardar.");
    }
  }

  function volver() {
    if (
      hayCambios &&
      !window.confirm("Tienes cambios sin guardar. ¿Deseas salir?")
    ) return;

    onVolver();
  }

  if (!producto || !localId) {
    return (
      <section className="hu2-opciones">
        <div className="hu2-op-panel">
          <h1>Producto no encontrado</h1>
          <button className="hu2-op-btn-secundario" onClick={onVolver}>
            Volver a Mi carta
          </button>
        </div>
      </section>
    );
  }

  const indiceActivo = grupos.findIndex(grupo => grupo.id === activo);
  const grupoActivo = grupos[indiceActivo];
  const alternativas = grupos.reduce(
    (total, grupo) => total + grupo.opciones.length, 0
  );

  return (
    <section className="hu2-opciones">
      <div className="hu2-op-encabezado">
        <button className="hu2-op-volver" onClick={volver}>
          ← Mi carta
        </button>

        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", flexWrap: "wrap", gap: 16
        }}>
          <div>
            <h1>Opciones de «{producto.nombre}»</h1>
            <p>{grupos.length} grupos · {alternativas} alternativas</p>
          </div>
          <button className="hu2-op-btn-primario" onClick={agregarGrupo}>
            + Nuevo grupo
          </button>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        gap: 20, alignItems: "start"
      }}>
        <div>
          {grupos.length === 0 && (
            <div className="hu2-op-panel hu2-op-vacio">
              <h2>Sin grupos configurados</h2>
              <p>Agrega un grupo para personalizar este producto.</p>
              <button className="hu2-op-btn-primario" onClick={agregarGrupo}>
                Crear primer grupo
              </button>
            </div>
          )}

          {grupos.map((grupo, i) => (
            <div className="hu2-op-panel" key={grupo.id}
              style={{ padding: 0, overflow: "hidden" }}>
              <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 10,
                padding: "14px 16px", background: "#FFFBF8"
              }}>
                <strong>{grupo.nombre || `Grupo ${i + 1}`}</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="hu2-op-subtitulo" style={{ margin: 0 }}>
                    {grupo.tipo === "unica" ? "Única" : "Múltiple"}
                  </span>
                  <button type="button" className="hu2-op-volver"
                    onClick={() => setActivo(grupo.id)}>
                    Editar
                  </button>
                </div>
              </div>

              {grupo.opciones.map(opcion => (
                <div key={opcion.id} style={{
                  display: "flex", justifyContent: "space-between",
                  gap: 12, padding: "10px 16px",
                  borderTop: "1px solid #EFE2DC"
                }}>
                  <span>{opcion.nombre || "Nueva alternativa"}</span>
                  <strong>
                    {Number(opcion.precioAdicional) === 0
                      ? "Sin costo"
                      : `+ S/ ${Number(opcion.precioAdicional).toFixed(2)}`}
                  </strong>
                </div>
              ))}
              {errores[`g${i}`] && (
                <p className="hu2-op-error" style={{ padding: 12 }}>
                  {errores[`g${i}`]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="hu2-op-panel" style={{ marginBottom: 0 }}>
          {!grupoActivo ? (
            <div className="hu2-op-vacio">
              <h2>Editor de grupo</h2>
              <p>Selecciona «Editar» en un grupo o crea uno nuevo.</p>
            </div>
          ) : (
            <>
              <span className="hu2-op-subtitulo">CONFIGURAR GRUPO</span>

              <div className="hu2-op-campo">
                <label htmlFor="op-nombre-grupo">NOMBRE DEL GRUPO</label>
                <input id="op-nombre-grupo"
                  value={grupoActivo.nombre}
                  maxLength={80}
                  onChange={e => cambiarGrupo(indiceActivo, {
                    nombre: e.target.value
                  })} />
                {errores[`g${indiceActivo}`] && (
                  <span className="hu2-op-error">{errores[`g${indiceActivo}`]}</span>
                )}
              </div>

              <div className="hu2-op-campo" style={{ marginTop: 16 }}>
                <label htmlFor="op-tipo">TIPO DE SELECCIÓN</label>
                <select id="op-tipo" value={grupoActivo.tipo}
                  onChange={e => cambiarGrupo(indiceActivo, {
                    tipo: e.target.value,
                    maxSeleccion: e.target.value === "unica"
                      ? 1 : grupoActivo.maxSeleccion
                  })}>
                  <option value="unica">Selección única</option>
                  <option value="multiple">Selección múltiple</option>
                </select>
              </div>

              {grupoActivo.tipo === "multiple" && (
                <div className="hu2-op-campo" style={{ marginTop: 16 }}>
                  <label htmlFor="op-maximo">MÁXIMO DE SELECCIONES</label>
                  <input id="op-maximo" type="number" min="1"
                    value={grupoActivo.maxSeleccion}
                    onChange={e => cambiarGrupo(indiceActivo, {
                      maxSeleccion: e.target.value
                    })} />
                  {errores[`m${indiceActivo}`] && (
                    <span className="hu2-op-error">{errores[`m${indiceActivo}`]}</span>
                  )}
                </div>
              )}

              <label className="hu2-op-obligatorio">
                <input type="checkbox" checked={grupoActivo.obligatorio}
                  onChange={e => cambiarGrupo(indiceActivo, {
                    obligatorio: e.target.checked
                  })} />
                Obligatorio para el comensal
              </label>

              <div className="hu2-op-opciones-encabezado">
                <h3>Alternativas</h3>
              </div>

              {grupoActivo.opciones.map((opcion, j) => (
                <div key={opcion.id} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(90px, .6fr) 44px",
                  gap: 8, marginBottom: 12, alignItems: "end"
                }}>
                  <div className="hu2-op-campo">
                    <label>NOMBRE</label>
                    <input value={opcion.nombre} maxLength={80}
                      onChange={e => cambiarOpcion(indiceActivo, j, {
                        nombre: e.target.value
                      })} />
                    {errores[`o${indiceActivo}-${j}`] && (
                      <span className="hu2-op-error">
                        {errores[`o${indiceActivo}-${j}`]}
                      </span>
                    )}
                  </div>

                  <div className="hu2-op-campo">
                    <label>PRECIO S/</label>
                    <input type="number" min="0" step="0.01"
                      value={opcion.precioAdicional}
                      onChange={e => cambiarOpcion(indiceActivo, j, {
                        precioAdicional: e.target.value
                      })} />
                    {errores[`p${indiceActivo}-${j}`] && (
                      <span className="hu2-op-error">
                        {errores[`p${indiceActivo}-${j}`]}
                      </span>
                    )}
                  </div>

                  <button type="button" className="hu2-op-btn-quitar"
                    style={{ marginTop: 0 }}
                    aria-label={`Eliminar alternativa ${j + 1}`}
                    onClick={() => eliminarOpcion(indiceActivo, j)}>
                    ×
                  </button>
                </div>
              ))}

              {errores[`v${indiceActivo}`] && (
                <p className="hu2-op-error">{errores[`v${indiceActivo}`]}</p>
              )}

              <button type="button" className="hu2-op-btn-agregar"
                onClick={() => agregarOpcion(indiceActivo)}>
                + Agregar alternativa
              </button>

              <div className="hu2-op-acciones" style={{ marginTop: 20, paddingBottom: 0 }}>
                <button className="hu2-op-btn-peligro"
                  onClick={() => eliminarGrupo(indiceActivo)}>
                  Eliminar grupo
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {mensaje && (
        <div className={`hu2-op-mensaje ${tipoMensaje}`} role="status"
          style={{ marginTop: 20 }}>
          {mensaje}
        </div>
      )}

      <div className="hu2-op-acciones" style={{ marginTop: 20 }}>
        <button className="hu2-op-btn-secundario" onClick={volver}>
          Volver a Mi carta
        </button>
        <button className="hu2-op-btn-primario"
          disabled={!hayCambios} onClick={guardar}>
          Guardar opciones
        </button>
      </div>
    </section>
  );
}