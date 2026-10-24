import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useData } from '../../../context/DataContext';
import { useToast } from '../../../context/ToastContext';
import { useFormulario } from '../../../hooks/useFormulario';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { SEDES } from '../../../utils/constants.js';
import { digits, validateChangePassword, validateProfile } from '../../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import MigasDePan from '../MigasDePan/MigasDePan.jsx';

import './MiCuenta.css';

// Valores guardados del formulario: el botón "Descartar" vuelve a ellos.
const valoresGuardados = (usuario, local) =>
  usuario.rol === 'local'
    ? {
        businessName: local?.nombreComercial ?? usuario.apellidos,
        sede: local?.sede ?? SEDES[0],
        campusLocation: local?.ubicacionCampus ?? '',
        phone: local?.telefono ?? usuario.telefono
      }
    : { firstName: usuario.nombres, lastName: usuario.apellidos, phone: usuario.telefono };

function DatosPersonales({ usuario, local }) {
  const { actualizarPerfil } = useAuth();
  const toast = useToast();
  const [guardado, setGuardado] = useState(false);
  const esLocal = usuario.rol === 'local';
  const guardados = valoresGuardados(usuario, local);

  const form = useFormulario(guardados, (v) => validateProfile(v, usuario.rol), async (valores) => {
    setGuardado(false);
    try {
      await actualizarPerfil(valores);
      setGuardado(true);
      toast.success('Datos guardados', 'Actualizamos los datos de tu cuenta.');
    } catch (err) {
      if (err.field) form.errorDeCampo(err.field, err.message);
      else toast.error('No se pudieron guardar los datos', err.message);
    }
  });

  const modificado = Object.keys(guardados).some((campo) =>
    campo === 'phone' ? digits(form.valores[campo]) !== digits(guardados[campo]) : form.valores[campo] !== guardados[campo]
  );

  const descartar = () => {
    form.reset();
    setGuardado(false);
  };

  return (
    <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="datos-titulo">
      <h2 id="datos-titulo" className="tarjeta__titulo tarjeta__titulo--md">{esLocal ? 'Datos del local' : 'Datos personales'}</h2>

      <div className="formulario__fila">
        {esLocal ? (
          <>
            <CampoTexto form={form} name="businessName" label="Nombre comercial" />
            <CampoTexto form={form} name="ruc" label="RUC" value={local?.ruc ?? ''} readOnly hint="No editable." />
            <CampoTexto form={form} as="select" name="sede" label="Sede">
              <option value="">Selecciona una sede</option>
              {SEDES.map((sede) => <option key={sede} value={sede}>{sede}</option>)}
            </CampoTexto>
            <CampoTexto form={form} name="campusLocation" label="Ubicación en el campus" />
          </>
        ) : (
          <>
            <CampoTexto form={form} name="firstName" label="Nombres" autoComplete="given-name" />
            <CampoTexto form={form} name="lastName" label="Apellidos" autoComplete="family-name" />
          </>
        )}
        <CampoTexto form={form} name="correo" label={esLocal ? 'Correo de contacto' : 'Correo institucional'} value={usuario.correo} readOnly hint="No editable." />
        <CampoTexto form={form} name="phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel"
          hint={esLocal ? 'Teléfono de contacto del local.' : 'Lo usamos para avisarte cuando tu pedido esté listo.'} />
      </div>

      <div className="formulario__acciones formulario__acciones--fin">
        <Boton variante="tertiary" disabled={!modificado || form.enviando} onClick={descartar}>Descartar</Boton>
        <Boton type="submit" disabled={!modificado} cargando={form.enviando} textoCargando="Guardando…">Guardar cambios</Boton>
      </div>
      {guardado && <Aviso variante="exito" className="cuenta__guardado">Guardamos tus datos. Los cambios se aplican a tus próximos pedidos.</Aviso>}
    </form>
  );
}

function CambiarContrasena() {
  const { cambiarContrasena } = useAuth();
  const toast = useToast();

  const form = useFormulario({ current: '', next: '', confirm: '' }, validateChangePassword, async (valores) => {
    try {
      await cambiarContrasena(valores);
      form.reset();
      toast.success('Contraseña actualizada', 'Cerramos las demás sesiones abiertas con tu cuenta.');
    } catch (err) {
      if (err.field) form.errorDeCampo(err.field, err.message);
      else toast.error('No se pudo actualizar la contraseña', err.message);
    }
  });

  return (
    <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="clave-titulo">
      <h2 id="clave-titulo" className="tarjeta__titulo tarjeta__titulo--md">Cambiar contraseña</h2>
      <CampoTexto form={form} name="current" label="Contraseña actual" type="password" autoComplete="current-password" placeholder="••••••••" />
      <CampoTexto form={form} name="next" label="Nueva contraseña" type="password" autoComplete="new-password" placeholder="••••••••"
        hint="Mínimo 8 caracteres, con una mayúscula y un número." />
      <CampoTexto form={form} name="confirm" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="••••••••" />
      <Boton type="submit" variante="secondary" bloque cargando={form.enviando} textoCargando="Actualizando…">Actualizar contraseña</Boton>
      <Aviso variante="info" className="cuenta__nota">Al cambiar la contraseña se cierran las demás sesiones abiertas con tu cuenta.</Aviso>
    </form>
  );
}

export default function MiCuenta() {
  usePageTitle('Mi cuenta');
  const { currentUser } = useAuth();
  const { locales } = useData();
  const local = currentUser.rol === 'local' ? locales.find((l) => l.id === currentUser.localId) : null;

  return (
    <div className="pagina">
      <MigasDePan actual="Mi cuenta" />
      <h1 className="pagina__titulo">Mi cuenta</h1>
      <div className="cuenta">
        {/* key: si cambia el usuario o su local activo, el formulario se reinicia con sus datos */}
        <DatosPersonales key={`${currentUser.id}-${local?.id ?? ''}`} usuario={currentUser} local={local} />
        <CambiarContrasena key={`clave-${currentUser.id}`} />
      </div>
    </div>
  );
}
