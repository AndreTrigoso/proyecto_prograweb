import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useCountdown } from '../../hooks/useCountdown';
import { useFormulario } from '../../hooks/useFormulario';
import { usePageTitle } from '../../hooks/usePageTitle';
import { authService } from '../../services/authService.js';
import { mmss } from '../../utils/format.js';
import { validateRecoveryEmail } from '../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import PasosRecuperacion from '../PasosRecuperacion/PasosRecuperacion.jsx';

import './RecuperarContrasena.css';

const MOSTRAR_DEMO = import.meta.env.VITE_ENABLE_MOCK_STORAGE !== 'false';

// Paso 1 (correo) y paso 2 (revisa tu correo); el paso 3 es <NuevaContrasena>.
export default function RecuperarContrasena() {
  usePageTitle('Recuperar contraseña');
  const toast = useToast();
  const espera = useCountdown(45);
  const [enviado, setEnviado] = useState(null); // { enviadoA, tokenDemo }
  const [reenviando, setReenviando] = useState(false);

  const form = useFormulario({ email: '' }, validateRecoveryEmail, async ({ email }) => {
    setEnviado(await authService.requestPasswordReset(email));
    espera.reiniciar();
  });

  const reenviar = async () => {
    setReenviando(true);
    setEnviado(await authService.requestPasswordReset(enviado.enviadoA));
    setReenviando(false);
    espera.reiniciar();
    toast.info('Enlace reenviado', `Enviamos un nuevo enlace a ${enviado.enviadoA}.`);
  };

  return (
    <div className="centrado">
      <div className="estrecho">
        <PasosRecuperacion actual={enviado ? 2 : 1} />

        {!enviado ? (
          <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="recuperar-titulo">
            <h1 id="recuperar-titulo" className="tarjeta__titulo">Recupera tu acceso</h1>
            <p className="tarjeta__intro">
              Ingresa tu correo institucional y te enviaremos un enlace para crear una contraseña nueva. El enlace expira en 60 minutos.
            </p>
            <CampoTexto form={form} name="email" label="Correo institucional" type="email" autoComplete="email" placeholder="nombre@aloe.ulima.edu.pe" />
            <Boton type="submit" bloque cargando={form.enviando} textoCargando="Enviando…">Enviar enlace</Boton>
            <p className="formulario__pie"><Link to="/login">Volver al inicio de sesión</Link></p>
          </form>
        ) : (
          <div className="card tarjeta-registro recuperar__enviado">
            <div className="recuperar__icono" aria-hidden="true">✉</div>
            <h1 className="tarjeta__titulo">Revisa tu correo</h1>
            <p className="tarjeta__intro">Enviamos el enlace a {enviado.enviadoA}. Expira en 60 minutos.</p>
            <Boton variante="tertiary" bloque cargando={reenviando} textoCargando="Reenviando…" disabled={espera.segundos > 0} onClick={reenviar}>
              Reenviar enlace
            </Boton>
            {espera.segundos > 0 && <p className="formulario__nota recuperar__espera">Podrás reenviarlo en {mmss(espera.segundos)}</p>}

            {MOSTRAR_DEMO && enviado.tokenDemo && (
              <Aviso variante="info" className="recuperar__demo">
                Modo demostración: no se envían correos reales. <Link to={`/recuperar/nueva?token=${enviado.tokenDemo}`}>Abrir el enlace del correo</Link>
              </Aviso>
            )}
            <p className="formulario__pie"><Link to="/login">Volver al inicio de sesión</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
