// CAPA: Dominio
export function esEmailValido(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

export function esCampoRequerido(valor) {
    return String(valor ?? '').trim().length > 0;
}

export function validarRegistro({ nombre, email, password } = {}) {
    const errores = {};

    if (!esCampoRequerido(nombre)) {
        errores.nombre = 'El nombre es obligatorio.';
    }
    if (!esEmailValido(email)) {
        errores.email = 'Ingresa un email válido.';
    }
    if (!esCampoRequerido(password)) {
        errores.password = 'La contraseña es obligatoria.';
    }

    return errores;
}
