import { useState } from 'react';
import { useForm } from './useForm';


export function useFormulario(valoresIniciales, validar, alEnviar) {
  const [enviando, setEnviando] = useState(false);

  const form = useForm(valoresIniciales, validar, async (valores) => {
    setEnviando(true);
    try {
      await alEnviar(valores);
    } finally {
      setEnviando(false);
    }
  });

  
  const revalidar = (valores, campos) => {
    const nuevos = validar(valores);
    form.setErrores((previos) => {
      const copia = { ...previos };
      campos.forEach((campo) => (nuevos[campo] ? (copia[campo] = nuevos[campo]) : delete copia[campo]));
      return copia;
    });
  };

  // Si el campo ya mostraba un error, se revalida mientras se corrige (y su confirmación, si existe).
  const alCambiar = (e) => {
    const { name, type, value, checked } = e.target;
    form.handleChange(e);
    const pendientes = [name, 'confirm'].filter((campo) => form.errores[campo]);
    if (pendientes.length) revalidar({ ...form.valores, [name]: type === 'checkbox' ? checked : value }, pendientes);
  };

  const alSalir = (e) => {
    if (e.target.type !== 'checkbox') revalidar(form.valores, [e.target.name]);
  };

  const errorDeCampo = (campo, mensaje) => form.setErrores((previos) => ({ ...previos, [campo]: mensaje }));

  return {
    ...form,
    enviando,
    alCambiar,
    alSalir,
    errorDeCampo,
    cantidadErrores: Object.keys(form.errores).length
  };
}
