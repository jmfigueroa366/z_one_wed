// CAPA: Aplicación
import { Crypto } from '../infrastructure/crypto.js';
import { Session } from '../infrastructure/session.js';
import { usuarioRepo } from '../repositories/usuarioRepo.js';
import { crearUsuario } from '../models/Usuario.js';
import { validarRegistro } from '../utils/validators.js';

export const AuthService = {
    async iniciarSesion(email, password, rol = null) {
        const usuarios = usuarioRepo.listar();
        const usuario = usuarios.find((item) => String(item.email).toLowerCase() === String(email).trim().toLowerCase());

        if (!usuario || !usuario.password || (rol && usuario.rol !== rol)) {
            return null;
        }

        const passwordGuardada = String(usuario.password);
        const esPasswordHash = passwordGuardada.includes(':');
        const coincide = esPasswordHash
            ? await Crypto.verifyPassword(password, passwordGuardada)
            : password === passwordGuardada;

        if (!coincide) {
            return null;
        }

        if (!esPasswordHash && usuario.id !== null && usuario.id !== undefined) {
            const passwordHash = await Crypto.hashPassword(password);
            usuarioRepo.actualizar(usuario.id, { ...usuario, password: passwordHash });
        }

        const usuarioSesion = crearUsuario({ ...usuario, password: undefined });
        delete usuarioSesion.password;
        Session.guardar(usuarioSesion);
        return usuarioSesion;
    },

    async registrarUsuario(data) {
        const email = String(data?.email ?? '').trim();
        const password = String(data?.password ?? '');
        const nombre = String(data?.nombre ?? '').trim();
        const rol = String(data?.rol ?? 'cliente');

        const errores = validarRegistro({ nombre, email, password });
        if (Object.keys(errores).length > 0) {
            throw new Error(Object.values(errores)[0]);
        }

        if (!['cliente', 'colaborador'].includes(rol)) {
            throw new Error('El tipo de cuenta debe ser Cliente o Colaborador.');
        }

        const usuarios = usuarioRepo.listar();
        const existente = usuarios.find((usuario) => String(usuario.email).toLowerCase() === email.toLowerCase());
        if (existente) {
            throw new Error('El email ya existe en la base de datos.');
        }

        const usuarioConHash = crearUsuario({
            ...data,
            nombre,
            email,
            password: await Crypto.hashPassword(password),
            rol,
            activo: data?.activo ?? true,
        });

        return usuarioRepo.crear(usuarioConHash);
    },

    obtenerSesion() {
        return Session.obtener();
    },

    cerrarSesion() {
        Session.cerrar();
        return true;
    },
};

export default AuthService;
