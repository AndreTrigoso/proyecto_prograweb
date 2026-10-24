export const DINER_DOMAIN = '@aloe.ulima.edu.pe';

function blank(valor) {
  if (valor === undefined || valor === null) return true;
  return String(valor).trim() === '';
}


export function digits(valor) {
  if (valor === undefined || valor === null) return '';
  return String(valor).replace(/[\s-]/g, '');
}


function agregar(errores, campo, mensaje) {
  if (mensaje) {
    errores[campo] = mensaje;
  }
}


export function emailError(valor, opciones) {
  const institutional = opciones ? opciones.institutional : false;

  if (blank(valor)) return 'Ingresa tu correo.';

  const email = valor.trim().toLowerCase();
  // algo + @ + algo + . + algo
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Ingresa un correo válido.';

  if (institutional && !email.endsWith(DINER_DOMAIN)) {
    return 'Debe terminar en ' + DINER_DOMAIN;
  }
  return null;
}

export function passwordError(valor) {
  if (!valor) return 'Ingresa una contraseña.';

  const tieneLargo = valor.length >= 8;
  const tieneMayuscula = /[A-Z]/.test(valor);
  const tieneNumero = /\d/.test(valor);

  if (!tieneLargo || !tieneMayuscula || !tieneNumero) {
    return 'Mínimo 8 caracteres, con una mayúscula y un número.';
  }
  return null;
}

export function confirmError(password, confirmacion) {
  if (!confirmacion) return 'Confirma tu contraseña.';
  if (password !== confirmacion) return 'Las contraseñas no coinciden.';
  return null;
}


export function nameError(valor, mensajeVacio) {
  if (blank(valor)) return mensajeVacio;

  const nombre = valor.trim();
  if (nombre.length < 2 || !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'.-]*$/.test(nombre)) {
    return 'Usa solo letras y espacios.';
  }
  return null;
}


export function phoneError(valor) {
  if (blank(valor)) return 'Ingresa tu teléfono.';
  if (!/^9\d{8}$/.test(digits(valor))) {
    return 'Ingresa un celular de 9 dígitos que empiece con 9.';
  }
  return null;
}


export function rucError(valor) {
  if (blank(valor)) return 'Ingresa el RUC.';
  if (!/^(10|15|17|20)\d{9}$/.test(digits(valor))) {
    return 'El RUC tiene 11 dígitos y empieza con 10, 15, 17 o 20.';
  }
  return null;
}


export function formatPhone(valor) {
  return digits(valor).replace(/^(\d{3})(\d{3})(\d{3})$/, '$1 $2 $3');
}


export function passwordStrength(valor) {
  if (!valor) return { level: -1, label: '', percent: 0 };

  let puntos = 0;
  if (valor.length >= 8) puntos++;
  if (/[A-Z]/.test(valor) && /\d/.test(valor)) puntos++;
  if (valor.length >= 12 || /[^A-Za-z0-9]/.test(valor)) puntos++;

  if (puntos <= 1) return { level: 0, label: 'Débil', percent: 33 };
  if (puntos === 2) return { level: 1, label: 'Media', percent: 66 };
  return { level: 2, label: 'Segura', percent: 100 };
}


export function validateLogin(v) {
  const errores = {};
  agregar(errores, 'email', emailError(v.email));
  agregar(errores, 'password', v.password ? null : 'Ingresa tu contraseña.');
  return errores;
}

export function validateDinerRegistration(v) {
  const errores = {};
  agregar(errores, 'firstName', nameError(v.firstName, 'Ingresa tus nombres.'));
  agregar(errores, 'lastName', nameError(v.lastName, 'Ingresa tus apellidos.'));
  agregar(errores, 'email', emailError(v.email, { institutional: true }));
  agregar(errores, 'password', passwordError(v.password));
  agregar(errores, 'confirm', confirmError(v.password, v.confirm));
  agregar(errores, 'phone', phoneError(v.phone));
  agregar(errores, 'terms', v.terms ? null : 'Debes aceptar los términos para continuar.');
  return errores;
}

export function validateLocalRegistration(v) {
  const errores = {};

  if (blank(v.businessName)) {
    errores.businessName = 'Ingresa el nombre comercial.';
  } else if (v.businessName.trim().length < 3) {
    errores.businessName = 'Usa al menos 3 caracteres.';
  }

  agregar(errores, 'ruc', rucError(v.ruc));
  agregar(errores, 'sede', blank(v.sede) ? 'Selecciona una sede.' : null);
  agregar(errores, 'campusLocation', blank(v.campusLocation) ? 'Indica dónde está tu local en el campus.' : null);
  agregar(errores, 'email', emailError(v.email));
  agregar(errores, 'phone', phoneError(v.phone));
  agregar(errores, 'password', passwordError(v.password));
  agregar(errores, 'confirm', confirmError(v.password, v.confirm));
  agregar(errores, 'terms', v.terms ? null : 'Debes declarar que cuentas con la autorización.');
  return errores;
}

export function validateNewPassword(v) {
  const errores = {};
  agregar(errores, 'password', passwordError(v.password));
  agregar(errores, 'confirm', confirmError(v.password, v.confirm));
  return errores;
}

export function validateRecoveryEmail(v) {
  const errores = {};
  agregar(errores, 'email', emailError(v.email));
  return errores;
}

// role: 'local' valida los datos del local; cualquier otro rol valida los de una persona
export function validateProfile(v, role) {
  const errores = {};

  if (role === 'local') {
    agregar(errores, 'businessName', blank(v.businessName) ? 'Ingresa el nombre comercial.' : null);
    agregar(errores, 'sede', blank(v.sede) ? 'Selecciona una sede.' : null);
    agregar(errores, 'campusLocation', blank(v.campusLocation) ? 'Indica dónde está tu local en el campus.' : null);
    agregar(errores, 'phone', phoneError(v.phone));
  } else {
    agregar(errores, 'firstName', nameError(v.firstName, 'Ingresa tus nombres.'));
    agregar(errores, 'lastName', nameError(v.lastName, 'Ingresa tus apellidos.'));
    agregar(errores, 'phone', phoneError(v.phone));
  }
  return errores;
}

export function validateChangePassword(v) {
  const errores = {};

  agregar(errores, 'current', v.current ? null : 'Ingresa tu contraseña actual.');

  const errorNueva = passwordError(v.next);
  if (errorNueva) {
    errores.next = errorNueva;
  } else if (v.next === v.current) {
    errores.next = 'La nueva contraseña debe ser distinta de la actual.';
  }

  agregar(errores, 'confirm', confirmError(v.next, v.confirm));
  return errores;
}