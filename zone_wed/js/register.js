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

        localStorage.setItem('usuario_registrado', JSON.stringify(usuario));
        window.location.href = 'login.html';
    });
}
