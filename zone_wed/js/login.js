import { animate, stagger } from './motion.js';

const form = document.getElementById('loginForm');
const mensaje = document.getElementById('mensaje');
const btn_login = document.getElementById('btnLogin');
const btn_menu = document.getElementById('btnMenu');
const session_key = 'zone_usuario';
const role_key = 'zone_rol_usuario';
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
function obtenerUsuariosRegistrados() {
    try {
        const dato = localStorage.getItem(registered_user_key);
        if (!dato) return [];
        const usuarios = JSON.parse(dato);
        return Array.isArray(usuarios) ? usuarios : [usuarios];
    } catch (error) {
        return [];
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
        const rolSeleccionado = document.getElementById('rol')?.value || '';

        resetLoginMessage();
        if (btn_login) {
            btn_login.disabled = true;
            btn_login.textContent = 'Verificando...';
        }

        const cuentas = obtenerUsuariosRegistrados();
        const cuenta = cuentas.find((usuarioRegistrado) =>
            (usuario === usuarioRegistrado.nombre || usuario === usuarioRegistrado.email) &&
            password === usuarioRegistrado.password &&
            rolSeleccionado === usuarioRegistrado.rol
        );
        const credenciales_validas = Boolean(cuenta && rolSeleccionado);

        if (credenciales_validas) {
            localStorage.setItem(session_key, cuenta.nombre);
            localStorage.setItem(role_key, cuenta.rol);
            redirectToMenu();
            return;
        }

        if (mensaje) {
            const detalle = rolSeleccionado ? '❌ Usuario, contraseña o perfil incorrectos' : '❌ Selecciona un perfil para continuar';
            mensaje.textContent = detalle;
            mensaje.classList.add('error');
        }

        if (btn_login) {
            btn_login.disabled = false;
            btn_login.textContent = 'Iniciar sesión';
        }
    });
}

if (btn_menu) {
    btn_menu.setAttribute('href', 'index.html');
    btn_menu.setAttribute('data-role', 'menu');
}