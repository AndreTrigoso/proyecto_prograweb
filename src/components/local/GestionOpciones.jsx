/*Permite seleccionar un producto del local para administrar sus opciones y agregados.*/

import { useState } from "react";
import { useHU2 } from "./useHU2";
import OpcionesProducto from "./OpcionesProducto";
import "./styles/GestionOpciones.css";

export default function GestionOpciones() {
  const { local, productosLocal } = useHU2();
  const [productoId, setProductoId] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  const productosFiltrados = productosLocal.filter(producto =>
    producto.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (productoId !== null) {
    return (
      <OpcionesProducto
        key={productoId}
        productoId={productoId}
        onVolver={() => setProductoId(null)}
      />
    );
  }

  if (!local) {
    return (
      <section className="hu2-gestion-opciones">
        <h1>Opciones y agregados</h1>
        <p>No existe un local asociado a la sesión actual.</p>
      </section>
    );
  }

  return (
    <section className="hu2-gestion-opciones">
      <div className="hu2-go-encabezado">
        <h1>Opciones y agregados</h1>
        <p>
          Selecciona un producto de {local.nombreComercial}
          {" "}para administrar sus opciones.
        </p>
      </div>

      <div className="hu2-go-panel">
        <label htmlFor="hu2-go-busqueda">
          Buscar producto
        </label>

        <input
          id="hu2-go-busqueda"
          type="search"
          placeholder="Escribe el nombre del producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      <div className="hu2-go-lista">
        {productosFiltrados.length === 0 ? (
          <div className="hu2-go-panel">
            <p>No se encontraron productos.</p>
          </div>
        ) : (
          productosFiltrados.map(producto => (
            <article
              className="hu2-go-producto"
              key={producto.id}
            >
              {producto.fotografia ? (
                <img
                  src={producto.fotografia}
                  alt={producto.nombre}
                />
              ) : (
                <div className="hu2-go-sin-imagen">
                  Sin fotografía
                </div>
              )}

              <div className="hu2-go-informacion">
                <h2>{producto.nombre}</h2>

                <p>
                  S/ {Number(producto.precio).toFixed(2)}
                </p>

                <span>
                  {(producto.gruposOpciones ?? []).length}
                  {" "}grupo(s) configurado(s)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setProductoId(producto.id)}
              >
                Configurar opciones
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}