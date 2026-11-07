// CAPA: Dominio
export function esEmailValido(email: unknown): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? '').trim());
}

export function esCampoRequerido(valor: unknown): boolean {
    return String(valor ?? '').trim().length > 0;
}

export interface DatosRegistro {
    nombre?: string;
    email?: string;
    password?: string;
}

export function validarRegistro({ nombre, email, password }: DatosRegistro = {}): Record<string, string> {
    const errores: Record<string, string> = {};

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

// Mismas reglas que PasswordPolicy del backend (Auth:MinPasswordLength = 10).
export const PASSWORD_MIN_LENGTH = 10;

const PASSWORDS_COMUNES = [
    'password', 'contrasena', 'contraseña', '12345678', 'qwertyui',
    'zone1234', 'admin123', 'colab123', 'cliente123',
];

export function validarPasswordSegura(
    password: unknown,
    email?: unknown,
    nombre?: unknown,
    minLength: number = PASSWORD_MIN_LENGTH
): string[] {
    const valor = String(password ?? '');
    const errores: string[] = [];

    if (!valor) {
        return ['La contraseña es obligatoria.'];
    }

    if (valor.length < minLength) errores.push(`Debe tener al menos ${minLength} caracteres.`);
    if (valor.length > 128) errores.push('No puede superar 128 caracteres.');
    if (!/\p{L}/u.test(valor)) errores.push('Debe incluir al menos una letra.');
    if (!/\d/.test(valor)) errores.push('Debe incluir al menos un número.');
    if (new Set(valor).size < 5) errores.push('Es demasiado repetitiva.');

    const minusculas = valor.toLowerCase();
    if (PASSWORDS_COMUNES.some((comun) => minusculas.includes(comun))) {
        errores.push('Es una contraseña demasiado común.');
    }

    const local = String(email ?? '').split('@')[0];
    if (local.length >= 4 && minusculas.includes(local.toLowerCase())) {
        errores.push('No debe contener tu correo.');
    }

    const nombreCompacto = String(nombre ?? '').replace(/ /g, '').toLowerCase();
    if (nombreCompacto.length >= 5 && minusculas.includes(nombreCompacto)) {
        errores.push('No debe contener tu nombre.');
    }

    return errores;
}
