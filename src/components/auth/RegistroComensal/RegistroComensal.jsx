import { useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useCountdown } from '../../../hooks/useCountdown';
import { useFormulario } from '../../../hooks/useFormulario';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { authService } from '../../../services/authService.js';
import { validateDinerRegistration } from '../../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import Casilla from '../Casilla/Casilla.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import MigasDePan from '../MigasDePan/MigasDePan.jsx';
import PantallaEstado from '../PantallaEstado/PantallaEstado.jsx';
import ResumenErrores from '../ResumenErrores/ResumenErrores.jsx';

import './RegistroComensal.css';

const BENEFICIOS = [
  'Pedir con anticipación en los cinco locales del campus.',
  'Elegir la hora de recojo y seguir el avance de tu pedido.',
  'Repetir pedidos anteriores en un paso.',
  'Calificar los locales y los productos que consumes.'
];

function CuentaCreada({ correo }) {
  const toast = useToast();
  const [reenviando, setReenviando] = useState(false);

  const reenviar = async () => {
    setReenviando(true);
    await authService.resendVerification();
    setReenviando(false);
    toast.info('Correo reenviado', `Enviamos de nuevo el enlace a ${correo}.`);
  };

  return (
    <div className="centrado">
      <div className="card tarjeta-registro--centrada">
        <PantallaEstado ok icono="✓" titulo="Cuenta creada" acciones={null}>
          Enviamos un enlace de verificación a {correo}. Válido por 24 horas.
        </PantallaEstado>
        <div className="registro__acciones">
          <Boton to="/locales" bloque>Ver locales abiertos</Boton>
          <Boton variante="tertiary" bloque cargando={reenviando} textoCargando="Reenviando…" onClick={reenviar}>Reenviar correo</Boton>
          <Boton to="/login" variante="texto">Ir a iniciar sesión</Boton>
        </div>
      </div>
    </div>
  );
}

export default function RegistroComensal() {
  usePageTitle('Crear cuenta');
  const toast = useToast();
  const [creada, setCreada] = useState(null);

  const form = useFormulario(
    { firstName: '', lastName: '', email: '', password: '', confirm: '', phone: '', terms: false },
    validateDinerRegistration,
    async (valores) => {
      try {
        const usuario = await authService.registerDiner(valores);
        setCreada(usuario.correo);
        toast.success('Cuenta creada', 'Revisa tu correo institucional para verificarla.');
      } catch (err) {
        if (err.field) form.errorDeCampo(err.field, err.message);
        else toast.error('No se pudo crear la cuenta', err.message);
      }
    }
  );

  if (creada) return <CuentaCreada correo={creada} />;

  return (
    <div className="pagina">
      <MigasDePan actual="Crear cuenta" />
      <div className="registro">
        <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="registro-titulo">
          <h1 id="registro-titulo" className="tarjeta__titulo">Crea tu cuenta</h1>
          <p className="tarjeta__intro">Solo se admiten correos de la Universidad de Lima.</p>

          <div className="formulario__fila">
            <CampoTexto form={form} name="firstName" label="Nombres" autoComplete="given-name" placeholder="Mateo Alonso" />
            <CampoTexto form={form} name="lastName" label="Apellidos" autoComplete="family-name" placeholder="Rojas Ibáñez" />
            <CampoTexto form={form} className="formulario__completo" name="email" label="Correo institucional" type="email" autoComplete="email"
              placeholder="nombre@aloe.ulima.edu.pe" hint="Te enviaremos un enlace de verificación a este correo." />
            <CampoTexto form={form} name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="••••••••"
              hint="Mínimo 8 caracteres, con una mayúscula y un número." />
            <CampoTexto form={form} name="confirm" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="••••••••" />
            <CampoTexto form={form} name="phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" placeholder="987 654 321"
              hint="Lo usamos para avisarte cuando tu pedido esté listo." />
          </div>

          <Casilla form={form} name="terms">Acepto los términos del servicio y el tratamiento de mis datos personales.</Casilla>
          <ResumenErrores form={form} />

          <div className="formulario__acciones">
            <Boton type="submit" cargando={form.enviando} textoCargando="Creando…">Crear cuenta</Boton>
            <Boton to="/login" variante="tertiary">Ya tengo cuenta</Boton>
          </div>
        </form>

        <aside className="registro__lateral">
          <h2>Con tu cuenta puedes</h2>
          <ul>{BENEFICIOS.map((b) => <li key={b}>{b}</li>)}</ul>
          <Aviso variante="blanco">El pago siempre se realiza en el punto de recojo. La plataforma no guarda datos de tarjetas.</Aviso>
        </aside>
      </div>
    </div>
  );
}
