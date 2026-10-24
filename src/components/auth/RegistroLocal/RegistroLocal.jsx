import { useRef, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import { useFormulario } from '../../../hooks/useFormulario';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { authService } from '../../../services/authService.js';
import { LOGO_MAX_BYTES, LOGO_TIPOS, SEDES } from '../../../utils/constants.js';
import { validateLocalRegistration } from '../../../utils/validators.js';
import Aviso from '../Aviso/Aviso.jsx';
import Boton from '../Boton/Boton.jsx';
import Casilla from '../Casilla/Casilla.jsx';
import CampoTexto from '../CampoTexto/CampoTexto.jsx';
import ImagenProvisional from '../ImagenProvisional/ImagenProvisional.jsx';
import MigasDePan from '../MigasDePan/MigasDePan.jsx';
import PantallaEstado from '../PantallaEstado/PantallaEstado.jsx';
import ResumenErrores from '../ResumenErrores/ResumenErrores.jsx';

import './RegistroLocal.css';

const leerComoDataUrl = (archivo) =>
  new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(lector.result);
    lector.onerror = () => rechazar(new Error('No se pudo leer la imagen.'));
    lector.readAsDataURL(archivo);
  });

export default function RegistroLocal() {
  usePageTitle('Registrar mi local');
  const toast = useToast();
  const inputLogo = useRef(null);
  const [logo, setLogo] = useState(null);
  const [errorLogo, setErrorLogo] = useState('');
  const [registrado, setRegistrado] = useState(null);

  const form = useFormulario(
    { businessName: '', ruc: '', sede: SEDES[0], campusLocation: '', email: '', phone: '', password: '', confirm: '', terms: false },
    validateLocalRegistration,
    async (valores) => {
      try {
        const usuario = await authService.registerLocal({ ...valores, logo });
        setRegistrado(usuario.apellidos);
        toast.success('Solicitud enviada', 'Un administrador revisará los datos de tu local.');
      } catch (err) {
        if (err.field) form.errorDeCampo(err.field, err.message);
        else toast.error('No se pudo enviar la solicitud', err.message);
      }
    }
  );

  const elegirLogo = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    if (!LOGO_TIPOS.includes(archivo.type)) return setErrorLogo('Sube una imagen PNG, JPG o WEBP.');
    if (archivo.size > LOGO_MAX_BYTES) return setErrorLogo('El logotipo no debe superar 1 MB.');
    try {
      setLogo(await leerComoDataUrl(archivo));
      setErrorLogo('');
    } catch (err) {
      setErrorLogo(err.message);
    }
  };

  if (registrado) {
    return (
      <div className="centrado">
        <div className="card tarjeta-registro--centrada">
          <PantallaEstado ok icono="✓" titulo="Solicitud enviada">
            Registramos «{registrado}». Un administrador revisará el RUC y la ubicación declarada. Ya puedes iniciar sesión
            para preparar tu carta; recibirás un correo cuando el local quede habilitado.
          </PantallaEstado>
          <Boton to="/login" bloque className="registro-local__ir">Iniciar sesión</Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="pagina">
      <MigasDePan actual="Registrar mi local" />
      <form className="card tarjeta-registro" onSubmit={form.handleSubmit} noValidate aria-labelledby="local-titulo">
        <h1 id="local-titulo" className="tarjeta__titulo">Registra tu local</h1>
        <p className="tarjeta__intro">Validaremos tus datos antes de publicar tu carta en el directorio del campus.</p>

        <div className="registro-local">
          <div>
            <div className="formulario__fila">
              <CampoTexto form={form} name="businessName" label="Nombre comercial" placeholder="Sangucheria del pabellón E" />
              <CampoTexto form={form} name="ruc" label="RUC" inputMode="numeric" maxLength={11} placeholder="20512345678" />
              <CampoTexto form={form} as="select" name="sede" label="Sede">
                <option value="">Selecciona una sede</option>
                {SEDES.map((sede) => <option key={sede} value={sede}>{sede}</option>)}
              </CampoTexto>
              <CampoTexto form={form} name="campusLocation" label="Ubicación en el campus" placeholder="Pabellón E, primer piso" />
              <CampoTexto form={form} name="email" label="Correo de contacto" type="email" autoComplete="email" placeholder="sangucheriae@ulima.edu.pe" />
              <CampoTexto form={form} name="phone" label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" placeholder="912 445 780" />
              <CampoTexto form={form} name="password" label="Contraseña" type="password" autoComplete="new-password" placeholder="••••••••" />
              <CampoTexto form={form} name="confirm" label="Confirmar contraseña" type="password" autoComplete="new-password" placeholder="••••••••" />
            </div>

            <Casilla form={form} name="terms">Declaro que cuento con la autorización de la Universidad para operar este concesionario.</Casilla>
            <ResumenErrores form={form} />

            <div className="formulario__acciones formulario__acciones--fin">
              <Boton to="/" variante="tertiary">Cancelar</Boton>
              <Boton type="submit" cargando={form.enviando} textoCargando="Enviando…">Enviar solicitud</Boton>
            </div>
          </div>

          <div className="registro-local__logo">
            <span className="form-label">Logotipo del local</span>
            <ImagenProvisional className="registro-local__vista" label="logotipo 1:1" src={logo} alt="Logotipo del local" />
            <input ref={inputLogo} type="file" accept={LOGO_TIPOS.join(',')} onChange={elegirLogo} hidden />
            <div className="registro-local__botones">
              <Boton variante="secondary" bloque disabled={form.enviando} onClick={() => inputLogo.current?.click()}>
                {logo ? 'Cambiar imagen' : 'Subir imagen'}
              </Boton>
              {logo && <Boton variante="tertiary" disabled={form.enviando} onClick={() => setLogo(null)}>Quitar</Boton>}
            </div>
            {errorLogo ? <p className="form-error" role="alert">{errorLogo}</p> : <p className="campo__ayuda">PNG, JPG o WEBP de hasta 1 MB. Es opcional.</p>}
            <Aviso variante="info" className="registro-local__nota">
              Tras el registro un administrador revisa el RUC y la ubicación declarada. Recibirás un correo cuando tu local quede
              habilitado para publicar su carta y recibir pedidos.
            </Aviso>
          </div>
        </div>
      </form>
    </div>
  );
}
