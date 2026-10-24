import { useState } from 'react';
 
export function useForm(valoresIniciales, validar, onSubmit) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
 
  // Sirve para todos los inputs: el atributo "name" del input debe coincidir con la clave de valores
  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setValores({ ...valores, [name]: type === 'checkbox' ? checked : value });
  };
 
  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevosErrores = validar(valores);
    setErrores(nuevosErrores);
 
    if (Object.keys(nuevosErrores).length === 0) {
      onSubmit(valores);
    }
  };
 
  const reset = () => {
    setValores(valoresIniciales);
    setErrores({});
  };
 
  return { valores, errores, setErrores, handleChange, handleSubmit, reset };
}
 