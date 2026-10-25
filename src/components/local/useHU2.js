/*Hook personalizado que conecta las pantallas de HU-2 con la sesión, los datos compartidos y los servicios de almacenamiento.*/

import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useData } from "../../context/DataContext";

import {
  localesService,
  productosService
} from "../../services/storageService";

export function useHU2() {
  const { currentUser, currentRole } = useAuth();
  const { locales, productos } = useData();

  const localId =
    currentRole === "local"
      ? currentUser?.localId ?? null
      : null;

  const local = locales.find(
    item => item.id === localId
  ) ?? null;

  const productosLocal = productos.filter(
    producto => producto.localId === localId
  );

  const [categoriasLocal, setCategoriasLocal] = useState([]);

  useEffect(() => {
    function actualizarCategorias() {
      setCategoriasLocal(
        localId
          ? productosService.getCategorias(localId)
          : []
      );
    }

    actualizarCategorias();

    window.addEventListener(
      "pw_storage_updated",
      actualizarCategorias
    );

    return () => {
      window.removeEventListener(
        "pw_storage_updated",
        actualizarCategorias
      );
    };
  }, [localId]);

  function verificarLocal() {
    if (!localId || !local) {
      throw new Error(
        "No hay un local válido asociado a la sesión."
      );
    }
  }

  function actualizarPerfil(cambios) {
    verificarLocal();

    const permitido = [
      "nombreComercial",
      "descripcion",
      "ubicacionCampus",
      "logotipo",
      "fotografias"
    ];

    const datos = Object.fromEntries(
      Object.entries(cambios).filter(
        ([campo]) => permitido.includes(campo)
      )
    );

    const resultado = localesService.update(
      localId,
      datos
    );

    if (!resultado) {
      throw new Error(
        "No se pudo actualizar el perfil del local."
      );
    }

    return resultado;
  }

  function actualizarHorario(horarioAtencion) {
    verificarLocal();

    const resultado = localesService.update(
      localId,
      { horarioAtencion }
    );

    if (!resultado) {
      throw new Error(
        "No se pudo actualizar el horario."
      );
    }

    return resultado;
  }

  function cambiarEstadoLocal(nuevoEstado, motivo = null) {
    verificarLocal();

    const estadosPermitidos = [
      "abierto",
      "suspendido",
      "cerrado"
    ];

    if (!estadosPermitidos.includes(nuevoEstado)) {
      throw new Error("Estado del local no válido.");
    }

    const resultado = localesService.updateEstado(
      localId,
      nuevoEstado,
      motivo
    );

    if (!resultado) {
      throw new Error(
        "No se pudo cambiar el estado del local."
      );
    }

    return resultado;
  }

  return {
    localId,
    local,
    categoriasLocal,
    productosLocal,
    actualizarPerfil,
    actualizarHorario,
    cambiarEstadoLocal
  };
}