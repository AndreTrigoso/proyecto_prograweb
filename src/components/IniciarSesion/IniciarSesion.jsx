import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useFormulario } from '../../hooks/useFormulario';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ApiError } from '../../services/ApiError.js';
import { CUENTAS_DEMO } from '../../services/authService.js';
import { CONTRASENA_DEMO } from '../../utils/security.js';
import { validateLogin } from '../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import Casilla from '../Casilla/Casilla.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import ImagenProvisional from '../ImagenProvisional/ImagenProvisional.jsx';

import './IniciarSesion.css';

const MOSTRAR_DEMO = import.meta.env.VITE_ENABLE_MOCK_STORAGE !== 'false';

export default function IniciarSesion() {
  usePageTitle('Iniciar sesión');
  const { login } = useAuth();
  const toast = useToast();
  const [errorGeneral, setErrorGeneral] = useState(null);

  // Al iniciar sesión, <SoloVisitantes> redirige a la ruta pedida o a la vista principal del rol.
  const form = useFormulario({ email: '', password: '', remember: false }, validateLogin, async (valores) => {
    setErrorGeneral(null);
    try {
      const usuario = await login(valores.email, valores.password, valores.remember);
      toast.success('Sesión iniciada', `Bienvenido/a, ${usuario.nombres.split(' ')[0]}.`);
    } catch (err) {
      if (!(err instanceof ApiError)) return setErrorGeneral('No pudimos iniciar sesión. Inténtalo de nuevo.');
      setErrorGeneral(err.message);
      if (err.code === 'INVALID_CREDENTIALS') form.errorDeCampo('password', 'Verifica tus datos e inténtalo otra vez.');
    }
  });

  return (
    <div className="dividida">
      <aside className="dividida__lado">
        <h1>Tu pedido listo a la hora que elijas</h1>
        <p>Ingresa con tu correo institucional para pedir en los locales del campus y seguir tus pedidos en curso.</p>
        <ImagenProvisional className="dividida__foto" label="foto · pedido en el mostrador" />
      </aside>

      <div className="dividida__principal">
        <form className="card tarjeta-auth" onSubmit={form.handleSubmit} noValidate aria-labelledby="login-titulo">
          <h1 id="login-titulo" className="tarjeta__titulo">Inicia sesión</h1>
          <div style={{ height: 'var(--space-4)' }} />
          {errorGeneral && <Aviso>{errorGeneral}</Aviso>}
          <CampoTexto form={form} name="email" label="Correo" type="email" autoComplete="username" placeholder="tucorreo@aloe.ulima.edu.pe" />
          <CampoTexto form={form} name="password" label="Contraseña" type="password" autoComplete="current-password" placeholder="••••••••" />
          <div className="formulario__entre">
            <Casilla form={form} name="remember">Recordarme</Casilla>
            {form.enviando ? <span className="apagado">¿Olvidaste tu contraseña?</span> : <Link to="/recuperar">¿Olvidaste tu contraseña?</Link>}
          </div>
          <Boton type="submit" bloque cargando={form.enviando} textoCargando="Ingresando…">Ingresar</Boton>
          {form.enviando ? (
            <p className="formulario__pie">Campos y enlaces deshabilitados mientras se valida.</p>
          ) : (
            <p className="formulario__pie">¿No tienes cuenta? <Link to="/registro">Crear cuenta</Link></p>
          )}
        </form>

        {MOSTRAR_DEMO && (
          <details className="demo">
            <summary>Cuentas de prueba (modo demostración)</summary>
            <ul>
              {CUENTAS_DEMO.map((c) => <li key={c.correo}>{c.rol}: <code>{c.correo}</code></li>)}
              <li>Contraseña de todas: <code>{CONTRASENA_DEMO}</code></li>
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
