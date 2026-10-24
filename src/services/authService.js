import { ApiError } from './ApiError.js';
import { usuariosService, localesService } from './storageService';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { intentosRepository, tokensRepository, versionesRepository } from '../repositories/securityRepository.js';
import { hashContrasena, verificarContrasena, generarToken } from '../utils/security.js';
import {
  digits,
  formatPhone,
  validateDinerRegistration,
  validateLocalRegistration,
  validateProfile,
  validateChangePassword,
  validateNewPassword
} from '../utils/validators.js';

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 5;
const VIGENCIA_TOKEN_MS = 60 * 60 * 1000;


export const CUENTAS_DEMO = [
  { rol: 'Comensal', correo: 'mateo.rojas@aloe.ulima.edu.pe' },
  { rol: 'Local', correo: 'contacto@cafeteriacentral.pe' },
  { rol: 'Administrador', correo: 'admin@ulima.edu.pe' }
];


const demora = (ms = 600) => new Promise((resolver) => setTimeout(resolver, ms));
const normalizar = (correo) => String(correo).trim().toLowerCase();
const publico = ({ contrasenaHash, ...resto }) => resto;

function exigirValido(errores) {
  const [campo] = Object.keys(errores);
  if (campo) throw new ApiError('VALIDATION', errores[campo], { field: campo, status: 422 });
}

function exigirCorreoLibre(correo) {
  if (usuariosService.getByEmail(correo)) {
    throw new ApiError('EMAIL_TAKEN', 'Ya existe una cuenta con este correo.', { field: 'email', status: 409 });
  }
}


const horarioInicial = () =>
  ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia, i) => ({
    dia,
    abierto: i < 5,
    horaApertura: '08:00',
    horaCierre: '18:00'
  }));

export const authService = {

  restoreSession() {
    const { usuario, meta, pestanaActiva } = sessionRepository.current();
    if (!usuario) return null;
    const cuenta = usuariosService.getById(usuario.id);
    const vigente =
      cuenta &&
      cuenta.estadoCuenta !== 'bloqueado' &&
      (!meta || (meta.version === versionesRepository.get(usuario.id) && (meta.recordar || pestanaActiva)));
    if (!vigente) {
      sessionRepository.clear();
      return null;
    }
    return publico(usuario);
  },

  async login({ email, password, remember }) {
    await demora();
    const correo = normalizar(email);
    const intentos = intentosRepository.get(correo);
    if (intentos.bloqueadoHasta > Date.now()) {
      const minutos = Math.ceil((intentos.bloqueadoHasta - Date.now()) / 60000);
      throw new ApiError('LOCKED', `Demasiados intentos fallidos. Vuelve a intentarlo en ${minutos} min.`, { status: 429 });
    }

    const usuario = usuariosService.getByEmail(correo);
    if (!usuario || !verificarContrasena(usuario.contrasenaHash, password)) {
      const cantidad = intentos.cantidad + 1;
      const bloqueadoHasta = cantidad >= MAX_INTENTOS ? Date.now() + MINUTOS_BLOQUEO * 60000 : 0;
      intentosRepository.set(correo, { cantidad: bloqueadoHasta ? 0 : cantidad, bloqueadoHasta });
      if (bloqueadoHasta) {
        throw new ApiError('LOCKED', `Superaste los ${MAX_INTENTOS} intentos. Espera ${MINUTOS_BLOQUEO} minutos para volver a intentar.`, { status: 429 });
      }
      const quedan = MAX_INTENTOS - cantidad;
      throw new ApiError(
        'INVALID_CREDENTIALS',
        `Correo o contraseña incorrectos. Te quedan ${quedan} ${quedan === 1 ? 'intento' : 'intentos'}.`,
        { status: 401 }
      );
    }

    intentosRepository.clear(correo);
    if (usuario.estadoCuenta === 'bloqueado') {
      const motivo = usuario.motivoBloqueo ? `: ${usuario.motivoBloqueo}` : '.';
      throw new ApiError('BLOCKED', `Tu cuenta está bloqueada${motivo} Escribe a campuspide@ulima.edu.pe.`, { status: 403 });
    }

    const sesion = publico(usuario);
    sessionRepository.start(sesion, versionesRepository.get(usuario.id), Boolean(remember));
    return sesion;
  },

  logout() {
    sessionRepository.clear();
  },

  async registerDiner(valores) {
    await demora();
    exigirValido(validateDinerRegistration(valores));
    const correo = normalizar(valores.email);
    exigirCorreoLibre(correo);
    return publico(
      usuariosService.create({
        rol: 'comensal',
        correo,
        contrasenaHash: hashContrasena(valores.password),
        telefono: formatPhone(valores.phone),
        nombres: valores.firstName.trim(),
        apellidos: valores.lastName.trim(),
        pedidosTotales: 0,
        pedidosNoRecogidos: 0,
        localId: null
      })
    );
  },

  async registerLocal(valores) {
    await demora();
    exigirValido(validateLocalRegistration(valores));
    const correo = normalizar(valores.email);
    exigirCorreoLibre(correo);
    const ruc = digits(valores.ruc);
    if (localesService.getAll().some((l) => l.ruc === ruc)) {
      throw new ApiError('RUC_TAKEN', 'Este RUC ya está registrado.', { field: 'ruc', status: 409 });
    }

  
    const nombreComercial = valores.businessName.trim();
    const local = localesService.create({
      nombreComercial,
      ruc,
      sede: valores.sede,
      ubicacionCampus: valores.campusLocation.trim(),
      correo,
      telefono: formatPhone(valores.phone),
      descripcion: '',
      logotipo: valores.logo ?? '',
      fotografias: [],
      tiempoEstimadoMin: 15,
      estado: 'cerrado',
      motivoSuspension: null,
      horarioAtencion: horarioInicial()
    });
    return publico(
      usuariosService.create({
        rol: 'local',
        correo,
        contrasenaHash: hashContrasena(valores.password),
        telefono: formatPhone(valores.phone),
        nombres: 'Encargado',
        apellidos: nombreComercial,
        localId: local.id
      })
    );
  },

  async resendVerification() {
    await demora(500);
    return { ok: true }; // no hay envío real de correos en la Entrega 1
  },


  async requestPasswordReset(email) {
    await demora();
    const correo = normalizar(email);
    const usuario = usuariosService.getByEmail(correo);
    if (!usuario) return { enviadoA: correo, tokenDemo: null };
    const token = { valor: generarToken(), usuarioId: usuario.id, expiraEn: Date.now() + VIGENCIA_TOKEN_MS };
    tokensRepository.create(token);

    return { enviadoA: correo, tokenDemo: token.valor };
  },

  validateResetToken(valor) {
    const token = valor ? tokensRepository.find(valor) : null;
    return Boolean(token && token.expiraEn > Date.now());
  },

  async resetPassword({ token, password, confirm }) {
    await demora();
    exigirValido(validateNewPassword({ password, confirm }));
    const registro = token ? tokensRepository.find(token) : null;
    if (!registro || registro.expiraEn <= Date.now()) {
      throw new ApiError('TOKEN_INVALID', 'El enlace expiró o ya fue usado. Solicita uno nuevo.', { status: 410 });
    }
    usuariosService.update(registro.usuarioId, { contrasenaHash: hashContrasena(password) });
    versionesRepository.bump(registro.usuarioId);
    tokensRepository.remove(token);
    return { ok: true };
  },

  async updateProfile(usuarioId, valores) {
    await demora(500);
    const actual = usuariosService.getById(usuarioId);
    exigirValido(validateProfile(valores, actual.rol));

    let cambios;
    if (actual.rol === 'local') {
      const nombreComercial = valores.businessName.trim();
      localesService.update(actual.localId, {
        nombreComercial,
        sede: valores.sede,
        ubicacionCampus: valores.campusLocation.trim(),
        telefono: formatPhone(valores.phone)
      });
      cambios = { apellidos: nombreComercial, telefono: formatPhone(valores.phone) };
    } else {
      cambios = {
        nombres: valores.firstName.trim(),
        apellidos: valores.lastName.trim(),
        telefono: formatPhone(valores.phone)
      };
    }
    const sesion = publico(usuariosService.update(usuarioId, cambios));
    sessionRepository.updateUser(sesion);
    return sesion;
  },

  async changePassword(usuarioId, { current, next, confirm }) {
    await demora(500);
    exigirValido(validateChangePassword({ current, next, confirm }));
    const usuario = usuariosService.getById(usuarioId);
    if (!verificarContrasena(usuario.contrasenaHash, current)) {
      throw new ApiError('WRONG_PASSWORD', 'La contraseña actual no es correcta.', { field: 'current', status: 401 });
    }
    const actualizado = usuariosService.update(usuarioId, { contrasenaHash: hashContrasena(next) });
    // Subir la versión cierra las demás sesiones abiertas; la actual se mantiene.
    sessionRepository.setVersion(versionesRepository.bump(usuarioId));
    return publico(actualizado);
  }
};
