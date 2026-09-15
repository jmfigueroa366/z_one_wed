// Clave donde se conserva la cuenta creada en este navegador.
const registered_user_key = 'usuario_registrado';
const form = document.getElementById('registerForm');
const register_message = document.getElementById('registerMessage');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!nombre || !email || !password) {
            if (register_message) {
                register_message.textContent = 'Completa todos los campos.';
            }
            return;
        }

        const usuario = {
            nombre,
            email,
            password
        };

        // JSON permite guardar varios campos dentro de una sola entrada.
        localStorage.setItem(registered_user_key, JSON.stringify(usuario));
        window.location.href = 'login.html';
    });
}
