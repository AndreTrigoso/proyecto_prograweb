/*Administra la carta del local y permite acceder a los formularios de productos, categorías y opciones.*/

import { useState } from "react";
import { useHU2 } from "./useHU2";
import { productosService } from "../services/storageService";
import FormularioProducto from "./FormularioProducto";
import OpcionesProducto from "./OpcionesProducto";
import "./styles/MiCarta.css";

export default function MiCarta() {
  const { local, localId, categoriasLocal, productosLocal } = useHU2();

  const [vista, setVista] = useState("carta");
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [categoriaNuevo, setCategoriaNuevo] = useState(null);
  const [categoriaActiva, setCategoriaActiva] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState("todos");
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [errorCategoria, setErrorCategoria] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("exito");

  function mostrarMensaje(texto, tipo = "exito") {
    setMensaje(texto);
    setTipoMensaje(tipo);
  }

  function abrirNuevoProducto() {
    setProductoSeleccionado(null);
    setCategoriaNuevo(
      categoriaActiva === "todas" ? null : categoriaActiva
    );
    setVista("formulario");
  }

  function abrirEditarProducto(producto) {
    setProductoSeleccionado(producto.id);
    setCategoriaNuevo(null);
    setVista("formulario");
  }

  function abrirOpcionesProducto(producto) {
    setProductoSeleccionado(producto.id);
    setCategoriaNuevo(null);
    setVista("opciones");
  }

  function volverACarta(mensajeExito = "") {
    setVista("carta");
    setProductoSeleccionado(null);
    setCategoriaNuevo(null);

    if (mensajeExito) {
      mostrarMensaje(mensajeExito);
    }
  }

  function abrirNuevaCategoria() {
    setCategoriaEditando(null);
    setNombreCategoria("");
    setErrorCategoria("");
    setMensaje("");
    setFormularioAbierto(true);
  }

  function abrirEditarCategoria(categoria) {
    setCategoriaEditando(categoria);
    setNombreCategoria(categoria.nombre);
    setErrorCategoria("");
    setMensaje("");
    setFormularioAbierto(true);
  }

  function cancelarFormularioCategoria() {
    setFormularioAbierto(false);
    setCategoriaEditando(null);
    setNombreCategoria("");
    setErrorCategoria("");
  }

  function guardarCategoria(evento) {
    evento.preventDefault();
    const nombre = nombreCategoria.trim();

    if (nombre.length < 2) {
      setErrorCategoria("El nombre debe tener al menos dos caracteres.");
      return;
    }

    try {
      if (categoriaEditando) {
        productosService.editarCategoria(
          localId,
          categoriaEditando.id,
          nombre
        );
        mostrarMensaje("Categoría actualizada correctamente.");
      } else {
        productosService.crearCategoria(localId, nombre);
        mostrarMensaje("Categoría registrada correctamente.");
      }

      cancelarFormularioCategoria();
    } catch (error) {
      setErrorCategoria(error.message);
    }
  }

  function eliminarCategoria(categoria) {
    setMensaje("");

    const cantidad = productosLocal.filter(
      producto => producto.categoriaId === categoria.id
    ).length;

    if (cantidad > 0) {
      mostrarMensaje(
        `No puedes eliminar "${categoria.nombre}" porque contiene ${cantidad} producto(s).`,
        "error"
      );
      return;
    }

    if (!window.confirm(
      `¿Eliminar la categoría "${categoria.nombre}"?`
    )) {
      return;
    }

    try {
      productosService.eliminarCategoria(localId, categoria.id);

      if (categoriaActiva === categoria.id) {
        setCategoriaActiva("todas");
      }

      if (categoriaEditando?.id === categoria.id) {
        cancelarFormularioCategoria();
      }

      mostrarMensaje("Categoría eliminada correctamente.");
    } catch (error) {
      mostrarMensaje(error.message, "error");
    }
  }

  function eliminarProducto(producto) {
    if (
      !localId ||
      producto.localId !== localId ||
      !productosLocal.some(item => item.id === producto.id)
    ) {
      mostrarMensaje("No tienes permiso para eliminar este producto.", "error");
      return;
    }

    if (!window.confirm(
      `¿Eliminar definitivamente "${producto.nombre}"?`
    )) {
      return;
    }

    try {
      productosService.delete(producto.id);
      mostrarMensaje("Producto eliminado correctamente.");
    } catch (error) {
      mostrarMensaje(error.message || "No se pudo eliminar.", "error");
    }
  }

  function nombreDeCategoria(id) {
    return categoriasLocal.find(
      categoria => categoria.id === id
    )?.nombre ?? "Sin categoría";
  }

  function contarProductos(categoriaId) {
    return productosLocal.filter(
      producto => producto.categoriaId === categoriaId
    ).length;
  }

  function limpiarFiltros() {
    setBusqueda("");
    setCategoriaActiva("todas");
    setFiltroDisponibilidad("todos");
  }

  const productosFiltrados = productosLocal.filter(producto => {
    const texto = busqueda.trim().toLowerCase();

    return (
      (
        producto.nombre.toLowerCase().includes(texto) ||
        producto.descripcion.toLowerCase().includes(texto)
      ) &&
      (
        categoriaActiva === "todas" ||
        producto.categoriaId === categoriaActiva
      ) &&
      (
        filtroDisponibilidad === "todos" ||
        producto.disponibilidad === filtroDisponibilidad
      )
    );
  });

  const categoriaSeleccionada = categoriasLocal.find(
    categoria => categoria.id === categoriaActiva
  );

  if (vista === "formulario") {
    return (
      <FormularioProducto
        productoId={productoSeleccionado}
        categoriaInicial={categoriaNuevo}
        onVolver={volverACarta}
      />
    );
  }

  if (vista === "opciones") {
    return (
      <OpcionesProducto
        productoId={productoSeleccionado}
        onVolver={volverACarta}
      />
    );
  }

  if (!local) {
    return (
      <section className="hu2-carta">
        <h1>Mi carta</h1>
        <p>No existe un local asociado a la sesión actual.</p>
      </section>
    );
  }

  return (
    <section className="hu2-carta">
      <div className="hu2-carta-encabezado">
        <div>
          <h1>Mi carta</h1>
          <p>
            Administra las categorías y productos de{" "}
            {local.nombreComercial}.
          </p>
        </div>

        <button
          type="button"
          className="hu2-carta-btn-primario"
          onClick={abrirNuevoProducto}
        >
          + Nuevo producto
        </button>
      </div>

      {mensaje && (
        <div
          className={`hu2-carta-mensaje ${tipoMensaje}`}
          role="status"
        >
          {mensaje}
        </div>
      )}

      <div className="hu2-carta-distribucion">
        <aside className="hu2-carta-panel hu2-carta-categorias">
          <div className="hu2-carta-categorias-encabezado">
            <h2>Categorías</h2>

            <button
              type="button"
              className="hu2-carta-agregar"
              onClick={abrirNuevaCategoria}
              aria-label="Agregar categoría"
            >
              +
            </button>
          </div>

          <button
            type="button"
            className={
              categoriaActiva === "todas"
                ? "hu2-carta-categoria activa"
                : "hu2-carta-categoria"
            }
            onClick={() => setCategoriaActiva("todas")}
          >
            <span>Todas las categorías</span>
            <span>{productosLocal.length}</span>
          </button>

          {categoriasLocal.map(categoria => (
            <div
              className="hu2-carta-categoria-fila"
              key={categoria.id}
            >
              <button
                type="button"
                className={
                  categoriaActiva === categoria.id
                    ? "hu2-carta-categoria activa"
                    : "hu2-carta-categoria"
                }
                onClick={() => setCategoriaActiva(categoria.id)}
              >
                <span>{categoria.nombre}</span>
                <span>{contarProductos(categoria.id)}</span>
              </button>

              <button
                type="button"
                className="hu2-carta-icono"
                title={`Editar ${categoria.nombre}`}
                aria-label={`Editar ${categoria.nombre}`}
                onClick={() => abrirEditarCategoria(categoria)}
              >
                ✎
              </button>

              <button
                type="button"
                className="hu2-carta-icono peligro"
                title={`Eliminar ${categoria.nombre}`}
                aria-label={`Eliminar ${categoria.nombre}`}
                onClick={() => eliminarCategoria(categoria)}
              >
                ×
              </button>
            </div>
          ))}

          {formularioAbierto ? (
            <form
              className="hu2-carta-formulario"
              onSubmit={guardarCategoria}
              noValidate
            >
              <h3>
                {categoriaEditando
                  ? "Editar categoría"
                  : "Nueva categoría"}
              </h3>

              <label htmlFor="hu2-nombre-categoria">
                Nombre de la categoría
              </label>

              <input
                id="hu2-nombre-categoria"
                autoFocus
                type="text"
                maxLength={80}
                value={nombreCategoria}
                placeholder="Ej. Postres"
                onChange={e => {
                  setNombreCategoria(e.target.value);
                  setErrorCategoria("");
                }}
              />

              {errorCategoria && (
                <p className="hu2-carta-error" role="alert">
                  {errorCategoria}
                </p>
              )}

              <div className="hu2-carta-formulario-acciones">
                <button
                  type="button"
                  className="hu2-carta-btn-secundario"
                  onClick={cancelarFormularioCategoria}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="hu2-carta-btn-primario"
                >
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              className="hu2-carta-nueva-categoria"
              onClick={abrirNuevaCategoria}
            >
              + Agregar categoría
            </button>
          )}
        </aside>

        <div className="hu2-carta-principal">
          <div className="hu2-carta-panel hu2-carta-filtros">
            <div className="hu2-carta-campo">
              <label htmlFor="hu2-busqueda-producto">
                Buscar productos
              </label>

              <input
                id="hu2-busqueda-producto"
                type="search"
                placeholder="Nombre o descripción..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </div>

            <div className="hu2-carta-campo">
              <label htmlFor="hu2-filtro-disponibilidad">
                Disponibilidad
              </label>

              <select
                id="hu2-filtro-disponibilidad"
                value={filtroDisponibilidad}
                onChange={e =>
                  setFiltroDisponibilidad(e.target.value)
                }
              >
                <option value="todos">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="agotado_dia">Agotado del día</option>
                <option value="retirado">Retirado</option>
              </select>
            </div>
          </div>

          <div className="hu2-carta-listado-encabezado">
            <div>
              <h2>
                {categoriaSeleccionada
                  ? categoriaSeleccionada.nombre
                  : "Todos los productos"}
              </h2>
              <p>
                {productosFiltrados.length} producto(s) encontrado(s)
              </p>
            </div>

            <button
              type="button"
              className="hu2-carta-limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          </div>

          {productosFiltrados.length === 0 ? (
            <div className="hu2-carta-panel hu2-carta-vacio">
              <h3>No se encontraron productos</h3>
              <p>
                Intenta cambiar la categoría o los filtros.
              </p>
              <button
                type="button"
                className="hu2-carta-btn-primario"
                onClick={limpiarFiltros}
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="hu2-carta-productos">
              {productosFiltrados.map(producto => (
                <article
                  key={producto.id}
                  className={
                    producto.disponibilidad === "agotado_dia"
                      ? "hu2-carta-producto agotado"
                      : "hu2-carta-producto"
                  }
                >
                  {producto.fotografia ? (
                    <img
                      className="hu2-carta-producto-imagen"
                      src={producto.fotografia}
                      alt={producto.nombre}
                    />
                  ) : (
                    <div className="hu2-carta-sin-imagen">
                      Sin fotografía
                    </div>
                  )}

                  <div className="hu2-carta-producto-contenido">
                    <div className="hu2-carta-etiquetas">
                      <span
                        className={
                          `hu2-carta-estado estado-${producto.disponibilidad}`
                        }
                      >
                        {producto.disponibilidad === "disponible"
                          ? "Disponible"
                          : producto.disponibilidad === "agotado_dia"
                            ? "Agotado del día"
                            : "Retirado"}
                      </span>

                      <span className="hu2-carta-etiqueta-categoria">
                        {nombreDeCategoria(producto.categoriaId)}
                      </span>
                    </div>

                    <h3>{producto.nombre}</h3>

                    <p className="hu2-carta-descripcion">
                      {producto.descripcion}
                    </p>

                    <div className="hu2-carta-producto-detalles">
                      <strong>
                        S/ {Number(producto.precio).toFixed(2)}
                      </strong>
                      <span>
                        {producto.tiempoPreparacionMin} min
                      </span>
                    </div>

                    <div className="hu2-carta-producto-acciones">
                      <button
                        type="button"
                        className="hu2-carta-btn-secundario"
                        onClick={() => abrirEditarProducto(producto)}
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        className="hu2-carta-btn-peligro"
                        onClick={() => eliminarProducto(producto)}
                      >
                        Eliminar
                      </button>
                    </div>

                    <button
                      type="button"
                      className="hu2-carta-opciones"
                      onClick={() => abrirOpcionesProducto(producto)}
                    >
                      Opciones y agregados →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}