/*Permite registrar y editar productos del local con validaciones, fotografía y vista previa en tiempo real.*/

import { useEffect, useState } from "react";
import { useHU2 } from "./useHU2";
import { productosService } from "../services/storageService";
import "./styles/FormularioProducto.css";

const MAX_IMAGEN = 250 * 1024;

function crearFormulario(producto, categoriaInicial) {
  if (producto) {
    return {
      nombre: producto.nombre ?? "",
      descripcion: producto.descripcion ?? "",
      categoriaId: producto.categoriaId ?? "",
      precio: String(producto.precio ?? ""),
      fotografia: producto.fotografia ?? "",
      tiempoPreparacionMin: String(
        producto.tiempoPreparacionMin ?? 5
      ),
      disponibilidad: producto.disponibilidad ?? "disponible"
    };
  }

  return {
    nombre: "",
    descripcion: "",
    categoriaId: categoriaInicial ?? "",
    precio: "",
    fotografia: "",
    tiempoPreparacionMin: "5",
    disponibilidad: "disponible"
  };
}

function leerImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onload = () => resolve(lector.result);
    lector.onerror = () =>
      reject(new Error("No se pudo cargar la fotografía."));

    lector.readAsDataURL(archivo);
  });
}

export default function FormularioProducto({
  productoId = null,
  categoriaInicial = null,
  onVolver
}) {
  const { localId, categoriasLocal, productosLocal } = useHU2();

  const productoOriginal = productoId
    ? productosLocal.find(p => p.id === productoId)
    : null;

  const esEdicion = productoId !== null;

  const [formulario, setFormulario] = useState(() =>
    crearFormulario(
      productoOriginal,
      categoriaInicial ?? categoriasLocal[0]?.id
    )
  );

  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setFormulario(
      crearFormulario(
        productoOriginal,
        categoriaInicial ?? categoriasLocal[0]?.id
      )
    );
    setErrores({});
    setMensaje("");
  }, [productoId, categoriaInicial]);

  if (esEdicion && !productoOriginal) {
    return (
      <section className="hu2-formulario-producto">
        <div className="hu2-fp-panel">
          <h1>Producto no encontrado</h1>
          <p>El producto no existe o no pertenece a este local.</p>
          <button
            className="hu2-fp-btn-primario"
            type="button"
            onClick={onVolver}
          >
            Volver a Mi carta
          </button>
        </div>
      </section>
    );
  }

  function cambiarCampo(campo, valor) {
    setFormulario(anterior => ({
      ...anterior,
      [campo]: valor
    }));

    setErrores(anterior => ({
      ...anterior,
      [campo]: ""
    }));

    setMensaje("");
  }

  async function seleccionarFoto(evento) {
    const archivo = evento.target.files?.[0];
    evento.target.value = "";

    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      setErrores(anterior => ({
        ...anterior,
        fotografia: "Selecciona una imagen válida."
      }));
      return;
    }

    if (archivo.size > MAX_IMAGEN) {
      setErrores(anterior => ({
        ...anterior,
        fotografia: "La fotografía debe pesar como máximo 250 KB."
      }));
      return;
    }

    try {
      const imagen = await leerImagen(archivo);
      cambiarCampo("fotografia", imagen);
    } catch (error) {
      setErrores(anterior => ({
        ...anterior,
        fotografia: error.message
      }));
    }
  }

  function quitarFoto() {
    if (!window.confirm("¿Quitar la fotografía del producto?")) {
      return;
    }

    cambiarCampo("fotografia", "");
  }

  function validar() {
    const nuevosErrores = {};
    const nombre = formulario.nombre.trim();
    const descripcion = formulario.descripcion.trim();
    const precio = Number(formulario.precio);
    const minutos = Number(formulario.tiempoPreparacionMin);

    if (nombre.length < 3) {
      nuevosErrores.nombre =
        "El nombre debe tener al menos 3 caracteres.";
    }

    if (!descripcion) {
      nuevosErrores.descripcion =
        "La descripción es obligatoria.";
    }

    if (
      !categoriasLocal.some(
        categoria => categoria.id === formulario.categoriaId
      )
    ) {
      nuevosErrores.categoriaId =
        "Selecciona una categoría válida.";
    }

    if (
      formulario.precio.trim() === "" ||
      !Number.isFinite(precio) ||
      precio <= 0 ||
      !Number.isInteger(precio * 100)
    ) {
      nuevosErrores.precio =
        "Ingresa un precio válido, mayor a cero, con máximo dos decimales.";
    }

    if (
      formulario.tiempoPreparacionMin.trim() === "" ||
      !Number.isInteger(minutos) ||
      minutos <= 0
    ) {
      nuevosErrores.tiempoPreparacionMin =
        "La preparación debe expresarse en minutos enteros mayores a cero.";
    }

    if (!formulario.fotografia) {
      nuevosErrores.fotografia =
        "Selecciona una fotografía del producto.";
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function guardar(evento) {
    evento.preventDefault();

    if (!validar() || guardando) return;

    setGuardando(true);
    setMensaje("");

    try {
      if (!localId) {
        throw new Error("No existe un local asociado a la sesión.");
      }

      const datos = {
        localId,
        categoriaId: formulario.categoriaId,
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion.trim(),
        precio: Number(formulario.precio),
        fotografia: formulario.fotografia,
        tiempoPreparacionMin: Number(
          formulario.tiempoPreparacionMin
        ),
        disponibilidad: formulario.disponibilidad
      };

      const productoGuardado = esEdicion
        ? {
            ...productoOriginal,
            ...datos
          }
        : {
            ...datos,
            id: `prod-${crypto.randomUUID()}`,
            gruposOpciones: []
          };

      const resultado = productosService.save(productoGuardado);

      if (!resultado) {
        throw new Error("No se pudo guardar el producto.");
      }

      onVolver(
        esEdicion
          ? "Producto actualizado correctamente."
          : "Producto registrado correctamente."
      );
    } catch (error) {
      setMensaje(error.message || "No se pudo guardar el producto.");
    } finally {
      setGuardando(false);
    }
  }

  const precioVista = Number(formulario.precio);
  const precioValido = Number.isFinite(precioVista)
    ? precioVista.toFixed(2)
    : "0.00";

  return (
    <section className="hu2-formulario-producto">
      <div className="hu2-fp-encabezado">
        <button
          type="button"
          className="hu2-fp-volver"
          onClick={() => onVolver()}
        >
          ← Volver a Mi carta
        </button>

        <h1>
          {esEdicion ? "Editar producto" : "Nuevo producto"}
        </h1>

        <p>
          {esEdicion
            ? "Modifica los datos del producto seleccionado."
            : "Completa los datos para agregar un producto a tu carta."}
        </p>
      </div>

      <div className="hu2-fp-contenedor">
        <form
          className="hu2-fp-panel hu2-fp-formulario"
          onSubmit={guardar}
          noValidate
        >
          <h2>Información del producto</h2>

          {mensaje && (
            <p className="hu2-fp-error-general" role="alert">
              {mensaje}
            </p>
          )}

          <div className="hu2-fp-campo">
            <label htmlFor="hu2-fp-nombre">
              Nombre del producto *
            </label>

            <input
              id="hu2-fp-nombre"
              type="text"
              maxLength={100}
              value={formulario.nombre}
              placeholder="Ej. Empanada de carne"
              onChange={e =>
                cambiarCampo("nombre", e.target.value)
              }
            />

            {errores.nombre && (
              <span className="hu2-fp-error">{errores.nombre}</span>
            )}
          </div>

          <div className="hu2-fp-campo">
            <label htmlFor="hu2-fp-descripcion">
              Descripción *
            </label>

            <textarea
              id="hu2-fp-descripcion"
              rows={4}
              maxLength={500}
              value={formulario.descripcion}
              placeholder="Describe los ingredientes del producto."
              onChange={e =>
                cambiarCampo("descripcion", e.target.value)
              }
            />

            {errores.descripcion && (
              <span className="hu2-fp-error">
                {errores.descripcion}
              </span>
            )}
          </div>

          <div className="hu2-fp-campo">
            <label htmlFor="hu2-fp-categoria">
              Categoría *
            </label>

            <select
              id="hu2-fp-categoria"
              value={formulario.categoriaId}
              onChange={e =>
                cambiarCampo("categoriaId", e.target.value)
              }
            >
              <option value="">Selecciona una categoría</option>

              {categoriasLocal.map(categoria => (
                <option
                  key={categoria.id}
                  value={categoria.id}
                >
                  {categoria.nombre}
                </option>
              ))}
            </select>

            {errores.categoriaId && (
              <span className="hu2-fp-error">
                {errores.categoriaId}
              </span>
            )}
          </div>

          <div className="hu2-fp-dos-columnas">
            <div className="hu2-fp-campo">
              <label htmlFor="hu2-fp-precio">
                Precio en soles *
              </label>

              <input
                id="hu2-fp-precio"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={formulario.precio}
                onChange={e =>
                  cambiarCampo("precio", e.target.value)
                }
              />

              {errores.precio && (
                <span className="hu2-fp-error">
                  {errores.precio}
                </span>
              )}
            </div>

            <div className="hu2-fp-campo">
              <label htmlFor="hu2-fp-tiempo">
                Preparación (minutos) *
              </label>

              <input
                id="hu2-fp-tiempo"
                type="number"
                min="1"
                step="1"
                value={formulario.tiempoPreparacionMin}
                onChange={e =>
                  cambiarCampo(
                    "tiempoPreparacionMin",
                    e.target.value
                  )
                }
              />

              {errores.tiempoPreparacionMin && (
                <span className="hu2-fp-error">
                  {errores.tiempoPreparacionMin}
                </span>
              )}
            </div>
          </div>

          <div className="hu2-fp-campo">
            <label htmlFor="hu2-fp-foto">
              Fotografía *
            </label>

            <input
              id="hu2-fp-foto"
              type="file"
              accept="image/*"
              onChange={seleccionarFoto}
            />

            <small>
              Máximo 250 KB. Puedes conservar la imagen existente
              al editar el producto.
            </small>

            {errores.fotografia && (
              <span className="hu2-fp-error">
                {errores.fotografia}
              </span>
            )}

            {formulario.fotografia && (
              <div className="hu2-fp-foto-cargada">
                <img
                  src={formulario.fotografia}
                  alt="Fotografía seleccionada"
                />

                <button
                  type="button"
                  className="hu2-fp-btn-secundario"
                  onClick={quitarFoto}
                >
                  Quitar fotografía
                </button>
              </div>
            )}
          </div>

          <div className="hu2-fp-campo">
            <label htmlFor="hu2-fp-disponibilidad">
              Disponibilidad
            </label>

            <select
              id="hu2-fp-disponibilidad"
              value={formulario.disponibilidad}
              onChange={e =>
                cambiarCampo("disponibilidad", e.target.value)
              }
            >
              <option value="disponible">Disponible</option>
              <option value="agotado_dia">Agotado del día</option>
              <option value="retirado">Retirado de la carta</option>
            </select>
          </div>

          <div className="hu2-fp-acciones">
            <button
              type="button"
              className="hu2-fp-btn-secundario"
              onClick={() => onVolver()}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="hu2-fp-btn-primario"
              disabled={guardando}
            >
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Registrar producto"}
            </button>
          </div>
        </form>

        <aside className="hu2-fp-preview-columna">
          <div className="hu2-fp-panel">
            <h2>Vista previa</h2>
            <p className="hu2-fp-texto-secundario">
              Así se verá el producto en tu carta.
            </p>

            <article className="hu2-fp-preview">
              {formulario.fotografia ? (
                <img
                  className="hu2-fp-preview-imagen"
                  src={formulario.fotografia}
                  alt="Vista previa del producto"
                />
              ) : (
                <div className="hu2-fp-sin-imagen">
                  Sin fotografía
                </div>
              )}

              <div className="hu2-fp-preview-contenido">
                <span className={`hu2-fp-estado ${formulario.disponibilidad}`}>
                  {formulario.disponibilidad === "disponible"
                    ? "Disponible"
                    : formulario.disponibilidad === "agotado_dia"
                      ? "Agotado del día"
                      : "Retirado"}
                </span>

                <h3>
                  {formulario.nombre || "Nombre del producto"}
                </h3>

                <p>
                  {formulario.descripcion ||
                    "Aquí aparecerá la descripción."}
                </p>

                <strong>S/ {precioValido}</strong>

                <small>
                  Preparación: {formulario.tiempoPreparacionMin || 0} min
                </small>
              </div>
            </article>
          </div>
        </aside>
      </div>
    </section>
  );
}