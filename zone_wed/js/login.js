import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');
const btn_login = document.getElementById('btnLogin');
const btn_menu = document.getElementById('btnMenu');
const session_key = 'zone_usuario';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
    animate([btn_login, btn_menu].filter(Boolean), {
        opacity: [0, 1],
        y: [18, 0],
        delay: stagger(100),
        duration: 650,
        ease: 'out(3)'
    });
}

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

if (btn_menu) {
    btn_menu.addEventListener('click', redirectToMenu);
}