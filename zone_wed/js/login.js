const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');
const btn_login = document.getElementById('btnLogin');
const session_key = 'zone_usuario';

function redirectToMenu() {
    window.location.href = 'menu_principal.html';
}

function resetLoginMessage() {
    if (!mensaje) return;
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
}

const usuario_guardado = localStorage.getItem(session_key);
if (usuario_guardado) {
    redirectToMenu();
}

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();

        resetLoginMessage();
        if (btn_login) {
            btn_login.disabled = true;
            btn_login.textContent = 'Verificando...';
        }

        if (usuario === 'admin' && password === '1234') {
            localStorage.setItem(session_key, usuario);
            redirectToMenu();
            return;
        }

        if (mensaje) {
            mensaje.textContent = '❌ Usuario o contraseña incorrectos';
            mensaje.classList.add('error');
        }

        if (btn_login) {
            btn_login.disabled = false;
            btn_login.textContent = 'Entrar al panel →';
        }
    });
}