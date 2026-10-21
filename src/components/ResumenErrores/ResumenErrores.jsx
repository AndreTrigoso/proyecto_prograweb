import Aviso from '../Aviso/Aviso.jsx';

// "Revisa N campos antes de continuar." — solo aparece cuando el formulario tiene errores.
export default function ResumenErrores({ form, accion = 'continuar' }) {
  if (!form.cantidadErrores) return null;
  return <Aviso>Revisa {form.cantidadErrores} {form.cantidadErrores === 1 ? 'campo' : 'campos'} antes de {accion}.</Aviso>;
}
