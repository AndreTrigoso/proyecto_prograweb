/*Permite consultar y editar la información comercial, el logotipo y las fotografías del local.*/

import { useEffect, useState } from "react";
import { useHU2 } from "./useHU2";
import "./styles/PerfilLocal.css";

const MAX_IMAGEN = 250 * 1024;
const MAX_FOTOGRAFIAS = 5;

function datosDelLocal(local) {
  return {
    nombreComercial: local?.nombreComercial ?? "",
    descripcion: local?.descripcion ?? "",
    ubicacionCampus: local?.ubicacionCampus ?? "",
    logotipo: local?.logotipo ?? "",
    fotografias: [...(local?.fotografias ?? [])]
  };
}

function leerArchivo(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer la imagen."));
    lector.readAsDataURL(archivo);
  });
}

function validarArchivo(archivo) {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("Selecciona un archivo de imagen válido.");
  }

  if (archivo.size > MAX_IMAGEN) {
    throw new Error("Cada imagen debe pesar como máximo 250 KB.");
  }
}

export default function PerfilLocal() {
  const { local, actualizarPerfil } = useHU2();
  const [editando, setEditando] = useState(false);
  const [formulario, setFormulario] = useState(() => datosDelLocal(local));
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!editando) setFormulario(datosDelLocal(local));
  }, [local, editando]);

  if (!local) {
    return (
      <section className="hu2-perfil">
        <div className="hu2-perfil-panel">
          <h1>Local no encontrado</h1>
          <p>No hay un local asociado a la sesión actual.</p>
        </div>
      </section>
    );
  }

  function cambiar(campo, valor) {
    setFormulario(prev => ({ ...prev, [campo]: valor }));
    setErrores(prev => ({ ...prev, [campo]: "" }));
    setMensaje("");
  }

  function comenzar() {
    setFormulario(datosDelLocal(local));
    setErrores({});
    setMensaje("");
    setEditando(true);
  }

  function cancelar() {
    setFormulario(datosDelLocal(local));
    setErrores({});
    setMensaje("");
    setEditando(false);
  }

  async function subirLogotipo(e) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    try {
      validarArchivo(archivo);
      cambiar("logotipo", await leerArchivo(archivo));
    } catch (error) {
      setErrores(prev => ({ ...prev, logotipo: error.message }));
    }
  }

  async function subirFotografias(e) {
    const archivos = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!archivos.length) return;

    try {
      if (formulario.fotografias.length + archivos.length > MAX_FOTOGRAFIAS) {
        throw new Error(`Solo se permiten ${MAX_FOTOGRAFIAS} fotografías.`);
      }

      archivos.forEach(validarArchivo);
      const nuevas = await Promise.all(archivos.map(leerArchivo));

      setFormulario(prev => ({
        ...prev,
        fotografias: [...prev.fotografias, ...nuevas].slice(0, MAX_FOTOGRAFIAS)
      }));
      setErrores(prev => ({ ...prev, fotografias: "" }));
      setMensaje("");
    } catch (error) {
      setErrores(prev => ({ ...prev, fotografias: error.message }));
    }
  }

  function quitarFotografia(indice) {
    if (!window.confirm("¿Quitar esta fotografía?")) return;
    cambiar(
      "fotografias",
      formulario.fotografias.filter((_, i) => i !== indice)
    );
  }

  function guardar(e) {
    e.preventDefault();
    const nuevosErrores = {};

    if (formulario.nombreComercial.trim().length < 3) {
      nuevosErrores.nombreComercial = "Ingresa al menos 3 caracteres.";
    }
    if (!formulario.descripcion.trim()) {
      nuevosErrores.descripcion = "La descripción es obligatoria.";
    }
    if (!formulario.ubicacionCampus.trim()) {
      nuevosErrores.ubicacionCampus = "Indica la ubicación del local.";
    }
    if (!formulario.logotipo) {
      nuevosErrores.logotipo = "El logotipo es obligatorio.";
    }
    if (formulario.fotografias.length === 0) {
      nuevosErrores.fotografias = "Agrega al menos una fotografía.";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length) return;

    setGuardando(true);

    try {
      actualizarPerfil({
        ...formulario,
        nombreComercial: formulario.nombreComercial.trim(),
        descripcion: formulario.descripcion.trim(),
        ubicacionCampus: formulario.ubicacionCampus.trim()
      });
      setEditando(false);
      setMensaje("Perfil actualizado correctamente.");
    } catch (error) {
      setMensaje(error.message || "No se pudo guardar el perfil.");
    } finally {
      setGuardando(false);
    }
  }

  const datos = editando ? formulario : local;
  const portada = datos.fotografias?.[0];

  return (
    <section className="hu2-perfil">
      <div className="hu2-perfil-encabezado">
        <div>
          <h1>Perfil del local</h1>
          <p>Información comercial y fotografías de tu cafetería.</p>
        </div>
        {!editando && (
          <button className="hu2-perfil-btn-primario" onClick={comenzar}>
            Editar perfil
          </button>
        )}
      </div>

      {mensaje && <p className="hu2-perfil-mensaje" role="status">{mensaje}</p>}

      {!editando ? (
        <div className="hu2-perfil-contenido">
          <div className="hu2-perfil-panel" style={{ padding: 0, overflow: "hidden" }}>
            {portada && (
              <img
                src={portada}
                alt={`Portada de ${local.nombreComercial}`}
                style={{
                  display: "block", width: "100%", height: 190,
                  objectFit: "cover"
                }}
              />
            )}

            <div style={{ padding: 24 }}>
              <div className="hu2-perfil-identidad">
                {local.logotipo && (
                  <img
                    className="hu2-perfil-logo"
                    src={local.logotipo}
                    alt={`Logotipo de ${local.nombreComercial}`}
                  />
                )}
                <div>
                  <h2>{local.nombreComercial}</h2>
                  <span className="hu2-perfil-ubicacion">
                    {local.ubicacionCampus}
                  </span>
                </div>
              </div>

              <h3>Descripción</h3>
              <p className="hu2-perfil-descripcion">{local.descripcion}</p>

              <div className="hu2-perfil-detalles">
                <div><span>Sede</span><strong>{local.sede}</strong></div>
                <div><span>RUC</span><strong>{local.ruc}</strong></div>
                <div><span>Correo</span><strong>{local.correo}</strong></div>
                <div><span>Teléfono</span><strong>{local.telefono}</strong></div>
              </div>
            </div>
          </div>

          <div className="hu2-perfil-panel">
            <h2>Fotografías del local</h2>
            <p className="hu2-perfil-texto-secundario">
              Imágenes que muestran las instalaciones de la cafetería.
            </p>
            <div className="hu2-perfil-galeria">
              {(local.fotografias ?? []).map((foto, i) => (
                <img src={foto} alt={`Fotografía ${i + 1}`} key={i} />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form className="hu2-perfil-panel hu2-perfil-formulario"
          onSubmit={guardar} noValidate>
          <h2>Editar perfil del local</h2>

          <div className="hu2-perfil-campo">
            <label htmlFor="perfil-nombre">NOMBRE COMERCIAL</label>
            <input id="perfil-nombre" maxLength={100}
              value={formulario.nombreComercial}
              onChange={e => cambiar("nombreComercial", e.target.value)} />
            {errores.nombreComercial && <span className="hu2-perfil-error">{errores.nombreComercial}</span>}
          </div>

          <div className="hu2-perfil-campo">
            <label htmlFor="perfil-descripcion">DESCRIPCIÓN</label>
            <textarea id="perfil-descripcion" rows={4} maxLength={500}
              value={formulario.descripcion}
              onChange={e => cambiar("descripcion", e.target.value)} />
            {errores.descripcion && <span className="hu2-perfil-error">{errores.descripcion}</span>}
          </div>

          <div className="hu2-perfil-campo">
            <label htmlFor="perfil-ubicacion">UBICACIÓN EN EL CAMPUS</label>
            <input id="perfil-ubicacion" maxLength={150}
              value={formulario.ubicacionCampus}
              onChange={e => cambiar("ubicacionCampus", e.target.value)} />
            {errores.ubicacionCampus && <span className="hu2-perfil-error">{errores.ubicacionCampus}</span>}
          </div>

          <div className="hu2-perfil-campo">
            <label htmlFor="perfil-logo">LOGOTIPO</label>
            {formulario.logotipo && (
              <img className="hu2-perfil-logo" src={formulario.logotipo} alt="Vista previa del logotipo" />
            )}
            <input id="perfil-logo" type="file" accept="image/*" onChange={subirLogotipo} />
            <small>Imagen de máximo 250 KB.</small>
            {errores.logotipo && <span className="hu2-perfil-error">{errores.logotipo}</span>}
          </div>

          <div className="hu2-perfil-campo">
            <label htmlFor="perfil-fotos">FOTOGRAFÍAS</label>
            <div className="hu2-perfil-galeria" style={{ width: "100%" }}>
              {formulario.fotografias.map((foto, i) => (
                <div className="hu2-perfil-foto-editable" key={i}>
                  <img src={foto} alt={`Fotografía ${i + 1}`} />
                  <button type="button" onClick={() => quitarFotografia(i)}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>
            <input id="perfil-fotos" type="file" multiple accept="image/*"
              disabled={formulario.fotografias.length >= MAX_FOTOGRAFIAS}
              onChange={subirFotografias} />
            <small>Máximo 5 fotografías, de hasta 250 KB cada una. La primera será la portada.</small>
            {errores.fotografias && <span className="hu2-perfil-error">{errores.fotografias}</span>}
          </div>

          <div className="hu2-perfil-acciones">
            <button type="button" className="hu2-perfil-btn-secundario" onClick={cancelar}>
              Cancelar
            </button>
            <button type="submit" className="hu2-perfil-btn-primario" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}