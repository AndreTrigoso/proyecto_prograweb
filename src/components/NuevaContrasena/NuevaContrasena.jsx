import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useFormulario } from '../../hooks/useFormulario';
import { usePageTitle } from '../../hooks/usePageTitle';
import { authService } from '../../services/authService.js';
import { validateNewPassword } from '../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import FuerzaContrasena from '../FuerzaContrasena/FuerzaContrasena.jsx';
import PantallaEstado from '../PantallaEstado/PantallaEstado.jsx';
import PasosRecuperacion from '../PasosRecuperacion/PasosRecuperacion.jsx';

// Paso 3 de la recuperación: se llega con el enlace /recuperar/nueva?token=...
export default function NuevaContrasena() {
  usePageTitle('Nueva contraseña');
  const toast = useToast();
  const navigate = useNavigate();
  const token = useSearchParams()[0].get('token');
  const [errorGeneral, setErrorGeneral] = useState(null);

  const form = useFormulario({ password: '', confirm: '' }, validateNewPassword, async (valores) => {
    setErrorGeneral(null);
    try {
      await authService.resetPassword({ token, ...valores });
      toast.success('Contraseña actualizada', 'Ya puedes iniciar sesión con tu nueva contraseña.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrorGeneral(err.message);
    }
  });

  return (
    <div className="centrado">
      <div className="estrecho">
        <PasosRecuperacion actual={3} />

        {!authService.validateResetToken(token) ? (
          <div className="card tarjeta-registro">
            <PantallaEstado icono="!" titulo="Enlace no disponible" acciones={<Boton to="/recuperar" bloque>Solicitar un enlace nuevo</Boton>}>
              El enlace expiró o ya fue usado. Solicita uno nuevo para continuar.
            </PantallaEstado>
          </div>
        ) : (
          <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="nueva-titulo">
            <h1 id="nueva-titulo" className="tarjeta__titulo tarjeta__titulo--md">Crea una contraseña nueva</h1>
            {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
            <CampoTexto form={form} name="password" label="Nueva contraseña" type="password" autoComplete="new-password" placeholder="••••••••"
              hint="Mínimo 8 caracteres, con una mayúscula y un número." />
            <CampoTexto form={form} name="confirm" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="••••••••" />
            <FuerzaContrasena value={form.valores.password} />
            <Boton type="submit" bloque cargando={form.enviando} textoCargando="Guardando…">Guardar contraseña</Boton>
          </form>
        )}
      </div>
    </div>
  );
}
