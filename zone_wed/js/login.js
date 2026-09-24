import { animate, stagger } from './motion.js';
import { Auth } from './auth.js';
import { UsuarioRepo } from './usuarioRepo.js';
import { Seed } from './speed.js';
import { RUTAS } from './rutas.js';

// Asegurar datos semilla (cuentas base)
Seed.aplicar();

// Migrar cuentas legacy si existen en usuario_registrado
try {
    const legacy = JSON.parse(localStorage.getItem('usuario_registrado') || '[]');
    const listaLegacy = Array.isArray(legacy) ? legacy : [legacy];
    listaLegacy.forEach((u) => {
        if (u && u.email && !UsuarioRepo.existeEmail(u.email)) {
            UsuarioRepo.crear({
                nombre: u.nombre || u.email,
                email: u.email,
                password: u.password || '123456',
                rol: u.rol || 'cliente',
                perfil: u.perfil || null,
            });
        }
    });
} catch (e) {
    // Si no hay datos válidos legacy, se ignora
}

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

// Si ya hay sesión activa, redirigir al menú
if (Auth.estaAutenticado()) {
    window.location.href = RUTAS.MENU_PRINCIPAL;
}

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const identificador = document.getElementById('usuario')?.value.trim() || '';
        const password = document.getElementById('password')?.value.trim() || '';
        const rolSeleccionado = document.getElementById('rol')?.value || '';

        resetLoginMessage();

        if (!rolSeleccionado) {
            if (mensaje) {
                mensaje.textContent = '❌ Selecciona un perfil para continuar';
                mensaje.classList.add('error');
            }
            return;
        }

        if (btn_login) {
            btn_login.disabled = true;
            btn_login.textContent = 'Verificando...';
        }

        // Autenticación con UsuarioRepo (busca por nombre o correo, valida password y rol)
        const cuenta = UsuarioRepo.autenticar(identificador, password, rolSeleccionado);

        if (cuenta) {
            Auth.iniciarSesion(cuenta);
            window.location.href = RUTAS.MENU_PRINCIPAL;
            return;
        }

        if (mensaje) {
            mensaje.textContent = '❌ Usuario, contraseña o perfil incorrectos';
            mensaje.classList.add('error');
        }

        if (btn_login) {
            btn_login.disabled = false;
            btn_login.textContent = 'Iniciar sesión';
        }
    });
}

if (btn_menu) {
    btn_menu.setAttribute('href', RUTAS.INDEX);
    btn_menu.setAttribute('data-role', 'menu');
}