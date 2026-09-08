const form = document.getElementById('registerForm');

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!nombre || !email || !password) {
            alert('Completa todos los campos');
            return;
        }

        const usuario = {
            nombre,
            email,
            password
        };

        localStorage.setItem('usuario_registrado', JSON.stringify(usuario));
        alert('Usuario registrado correctamente');
        window.location.href = 'index.html';
    });
}
