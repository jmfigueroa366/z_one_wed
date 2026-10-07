import { Auth } from './auth.js';
import { UsuarioRepo } from './usuarioRepo.js';
import { Seed } from './seed.js';
import { animate, stagger } from './motion.js';

Seed.aplicar();

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');
const btn_login = document.getElementById('btnLogin');
const btn_menu = document.getElementById('btnMenu');

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

function resetLoginMessage() {
    if (!mensaje) return;
    mensaje.textContent = '';
    mensaje.className = 'mensaje';
}

//Redirige segun su rol
function redirectSegunRol(rol) {
    window.location.href = Auth.panelDeRol(rol);
}

//Si ya hay alguien dentro, que vaya directo a su panel
if (Auth.estaAutenticado()) {
    redirectSegunRol(Auth.usuarioActual().rol);
}

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const usuario = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value.trim();

        resetLoginMessage();
        if (btn_login) {
            btn_login.disabled = true;
            btn_login.textContent = 'Verificando...';
        }

        const usuarioValido = await UsuarioRepo.autenticar(usuario, password);

        if (usuarioValido) {
            Auth.iniciarSesion(usuarioValido);
            redirectSegunRol(usuarioValido.rol);
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
    btn_menu.setAttribute('href', 'index.html');
    btn_menu.setAttribute('data-role', 'menu');
}