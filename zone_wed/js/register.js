import { UsuarioRepo } from './usuarioRepo.js';

const form = document.getElementById('registerForm');
const register_message = document.getElementById('registerMessage');

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const nombre = document.getElementById('nombre')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const password = document.getElementById('password')?.value || '';
        const rol = document.getElementById('rol')?.value || 'cliente';

        if (!nombre || !email || !password) {
            if (register_message) {
                register_message.textContent = 'Completa todos los campos.';
                register_message.classList.add('error');
            }
            return;
        }

        try {
            await UsuarioRepo.crear({
                nombre,
                email,
                password,
                rol,
                perfil: rol === 'colaborador' ? 'artista' : null,
            });
            window.location.href = 'login.html';
        } catch (error) {
            if (register_message) {
                register_message.textContent = error.message || 'No se pudo crear la cuenta.';
                register_message.classList.add('error');
            }
        }
    });
}