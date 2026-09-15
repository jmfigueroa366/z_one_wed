import { animate, stagger } from './motion.js';

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');
const btn_login = document.getElementById('btnLogin');
const btn_menu = document.getElementById('btnMenu');
const session_key = 'zone_usuario';
const registered_user_key = 'usuario_registrado';

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

// La cuenta registrada se compara con lo escrito en el formulario.
function obtenerUsuarioRegistrado() {
    try {
        return JSON.parse(localStorage.getItem(registered_user_key) || 'null');
    } catch (error) {
        return null;
    }
}

const usuario_en_sesion = localStorage.getItem(session_key);
if (usuario_en_sesion) {
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

        const cuenta = obtenerUsuarioRegistrado();
        const credenciales_validas = cuenta &&
            (usuario === cuenta.nombre || usuario === cuenta.email) &&
            password === cuenta.password;

        if (credenciales_validas) {
            // Solo se guarda el nombre de la cuenta activa en la sesión.
            localStorage.setItem(session_key, cuenta.nombre);
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