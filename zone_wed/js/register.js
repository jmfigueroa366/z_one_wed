// Registro de usuario conectado con UsuarioRepo y Seed
import { UsuarioRepo } from './usuarioRepo.js';
import { Seed } from './speed.js';

// Asegurar datos semilla si la plataforma está vacía
Seed.aplicar();

const form = document.getElementById('registerForm');
const register_message = document.getElementById('registerMessage');

function mostrarMensaje(texto, esError = false) {
    if (!register_message) return;
    register_message.textContent = texto;
    if (esError) {
        register_message.classList.add('error');
    } else {
        register_message.classList.remove('error');
    }
}

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const password = document.getElementById('password')?.value.trim() || '';
        const rol = document.getElementById('rol')?.value || 'cliente';

        if (!nombre || !email || !password) {
            mostrarMensaje('Completa todos los campos.', true);
            return;
        }

        if (!email.includes('@')) {
            mostrarMensaje('El correo electrónico no es válido.', true);
            return;
        }

        if (password.length < 6) {
            mostrarMensaje('La contraseña debe tener al menos 6 caracteres.', true);
            return;
        }

        try {
            // Crear en UsuarioRepo (persiste en z_one.usuarios)
            UsuarioRepo.crear({
                nombre,
                email,
                password,
                rol,
                perfil: rol === 'colaborador' ? 'artista' : null,
            });

            // Respaldo de compatibilidad con la clave anterior usuario_registrado
            const todos = UsuarioRepo.todosIncluyendoInactivos();
            localStorage.setItem('usuario_registrado', JSON.stringify(todos));

            // Redirigir al inicio de sesión
            window.location.href = 'login.html';
        } catch (error) {
            mostrarMensaje(error.message || 'No se puede repetir el nombre ni el usuario/correo.', true);
        }
    });
}