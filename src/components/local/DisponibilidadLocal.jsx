/*Controla el estado de atención del local y permite marcar, recuperar o retirar productos de su carta.*/

import { useState } from "react";
import { useHU2 } from "./useHU2";
import { productosService } from "../../services/storageService";
import "./styles/DisponibilidadLocal.css";

const ESTADOS = [
  { valor: "abierto", nombre: "Abierto", descripcion: "Recibiendo pedidos con normalidad." },
  { valor: "suspendido", nombre: "Recepción suspendida", descripcion: "Visible, pero sin recibir nuevos pedidos." },
  { valor: "cerrado", nombre: "Cerrado", descripcion: "El local no recibe pedidos." }
];

export default function DisponibilidadLocal() {
  const { local, localId, productosLocal, categoriasLocal, cambiarEstadoLocal } = useHU2();
  const [estadoElegido, setEstadoElegido] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");

  function notificar(texto, tipo = "exito") {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  if (!local) {
    return (
      <section className="hu2-disponibilidad">
        <div className="hu2-dis-panel">
          <h1>Local no encontrado</h1>
          <p>No existe un local asociado a la sesión.</p>
        </div>
      </section>
    );
  }

  const estadoActual = estadoElegido ?? local.estado;
  const agotados = productosLocal.filter(p => p.disponibilidad === "agotado_dia");
  const visibles = productosLocal.filter(p =>
    p.disponibilidad !== "retirado" &&
    p.nombre.toLowerCase().includes(busqueda.trim().toLowerCase())
  );

  function seleccionarEstado(valor) {
    setEstadoElegido(valor);
    setMotivo(valor === "suspendido" ? local.motivoSuspension ?? "" : "");
    setMensaje("");
  }

  function guardarEstado() {
    const motivoFinal = estadoActual === "suspendido"
      ? (estadoElegido === null ? local.motivoSuspension ?? "" : motivo).trim()
      : null;

    if (estadoActual === "suspendido" && motivoFinal.length < 5) {
      notificar("Escribe un motivo de suspensión de al menos 5 caracteres.", "error");
      return;
    }

    if (
      estadoActual === local.estado &&
      (estadoActual !== "suspendido" ||
        motivoFinal === (local.motivoSuspension ?? ""))
    ) {
      notificar("No hay cambios pendientes.", "error");
      return;
    }

    if (!window.confirm(`¿Cambiar el estado del local a ${estadoActual}?`)) return;

    try {
      cambiarEstadoLocal(estadoActual, motivoFinal);
      setEstadoElegido(null);
      notificar("Estado del local actualizado correctamente.");
    } catch (error) {
      notificar(error.message || "No se pudo cambiar el estado.", "error");
    }
  }

  function cambiarProducto(producto, valor) {
    if (producto.localId !== localId) {
      notificar("El producto no pertenece a tu local.", "error");
      return;
    }

    if (producto.disponibilidad === valor) return;

    try {
      const actual = productosService.getById(producto.id);
      if (!actual || actual.localId !== localId) {
        throw new Error("Producto no encontrado.");
      }

      const resultado = productosService.updateDisponibilidad(actual.id, valor);
      if (!resultado) throw new Error("No se pudo actualizar el producto.");

      notificar(
        `"${producto.nombre}" quedó ${valor === "agotado_dia" ? "agotado por hoy" : valor === "retirado" ? "retirado" : "disponible"}.`
      );
    } catch (error) {
      notificar(error.message || "No se pudo actualizar.", "error");
    }
  }

  function restablecerTodos() {
    if (agotados.length === 0) return;

    if (!window.confirm(
      `¿Volver a marcar como disponibles los ${agotados.length} productos agotados?`
    )) return;

    try {
      agotados.forEach(producto => {
        const actual = productosService.getById(producto.id);
        if (!actual || actual.localId !== localId) {
          throw new Error(`No se pudo verificar "${producto.nombre}".`);
        }

        const resultado = productosService.updateDisponibilidad(
          actual.id, "disponible"
        );
        if (!resultado) throw new Error(`No se pudo recuperar "${producto.nombre}".`);
      });
      notificar("Se restablecieron los productos agotados.");
    } catch (error) {
      notificar(error.message || "No se pudo completar la operación.", "error");
    }
  }

  function nombreCategoria(categoriaId) {
    return categoriasLocal.find(c => c.id === categoriaId)?.nombre ?? "Sin categoría";
  }

  return (
    <section className="hu2-disponibilidad">
      <div className="hu2-dis-encabezado">
        <h1>Disponibilidad y estado del local</h1>
        <p>Control rápido de la jornada y productos agotados.</p>
      </div>

      <div className="hu2-dis-panel">
        <h2>Estado del local</h2>
        <p className="hu2-dis-descripcion">
          Los cambios se reflejan en la información que consulta el comensal.
        </p>

        <div className="hu2-dis-estados">
          {ESTADOS.map(estado => (
            <label key={estado.valor}
              className={`hu2-dis-estado ${estadoActual === estado.valor ? "seleccionado" : ""}`}>
              <input type="radio" name="estado-local" value={estado.valor}
                checked={estadoActual === estado.valor}
                onChange={() => seleccionarEstado(estado.valor)} />
              <span>
                <strong>{estado.nombre}</strong>
                <small>{estado.descripcion}</small>
              </span>
            </label>
          ))}
        </div>

        {estadoActual === "suspendido" && (
          <div className="hu2-dis-campo">
            <label htmlFor="hu2-motivo">MOTIVO DE SUSPENSIÓN</label>
            <textarea id="hu2-motivo" maxLength={300}
              value={estadoElegido === null ? local.motivoSuspension ?? "" : motivo}
              onChange={e => {
                if (estadoElegido === null) setEstadoElegido("suspendido");
                setMotivo(e.target.value);
              }}
              placeholder="Ej. Mantenimiento de equipos" />
          </div>
        )}

        <div className="hu2-dis-acciones">
          <button type="button" className="hu2-dis-btn-secundario"
            onClick={() => { setEstadoElegido(null); setMotivo(""); }}>
            Cancelar
          </button>
          <button type="button" className="hu2-dis-btn-primario"
            onClick={guardarEstado}>
            Guardar estado
          </button>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 12, marginBottom: 14,
          flexWrap: "wrap"
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>Agotados del día</h2>
            <p style={{ margin: 0, color: "#7C6960", fontSize: 13 }}>
              {agotados.length} de {productosLocal.length} productos agotados
            </p>
          </div>
          <button type="button" className="hu2-dis-btn-secundario"
            onClick={restablecerTodos} disabled={agotados.length === 0}>
            Restablecer todos
          </button>
        </div>

        <div className="hu2-dis-campo" style={{ marginBottom: 12 }}>
          <label htmlFor="hu2-busqueda-agotados">BUSCAR PRODUCTO</label>
          <input id="hu2-busqueda-agotados" type="search"
            value={busqueda}
            placeholder="Buscar en la carta..."
            onChange={e => setBusqueda(e.target.value)} />
        </div>

        <div className="hu2-dis-productos">
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0, 2fr) 1fr 90px 120px",
            padding: 12, gap: 10,
            background: "#FFFBF8", color: "#7C6960",
            fontSize: 12, fontWeight: 600
          }}>
            <span>PRODUCTO</span>
            <span>CATEGORÍA</span>
            <span>PRECIO</span>
            <span>AGOTADO HOY</span>
          </div>

          {visibles.map(producto => {
            const agotado = producto.disponibilidad === "agotado_dia";

            return (
              <div key={producto.id} className="hu2-dis-producto"
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 2fr) 1fr 90px 120px",
                  gap: 10,
                  background: agotado ? "#FCEAE7" : "#FFFFFF"
                }}>
                <strong style={{ fontSize: 14, overflowWrap: "anywhere" }}>
                  {producto.nombre}
                </strong>
                <span style={{ fontSize: 13, color: "#7C6960" }}>
                  {nombreCategoria(producto.categoriaId)}
                </span>
                <strong style={{ fontSize: 14 }}>
                  S/ {Number(producto.precio).toFixed(2)}
                </strong>

                <label style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", fontSize: 13,
                  color: agotado ? "#AB3024" : "#7C6960"
                }}>
                  <input type="checkbox" checked={agotado}
                    style={{ accentColor: "#D6402F", width: 18, height: 18 }}
                    onChange={e => cambiarProducto(
                      producto,
                      e.target.checked ? "agotado_dia" : "disponible"
                    )} />
                  {agotado ? "Sí" : "No"}
                </label>
              </div>
            );
          })}

          {visibles.length === 0 && (
            <p className="hu2-dis-vacio">
              No se encontraron productos en la carta.
            </p>
          )}
        </div>

        <p className="hu2-dis-nota">
          Los productos retirados no aparecen en esta lista.
          Puedes recuperarlos desde el formulario de edición en Mi carta.
        </p>

        {mensaje && (
          <p className={`hu2-dis-mensaje ${tipoMensaje}`}
            role="status" style={{ marginTop: 14 }}>
            {mensaje}
          </p>
        )}
      </div>
    </section>
  );
}