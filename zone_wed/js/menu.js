const session_key = 'zone_usuario';
const role_key = 'zone_rol_usuario';
const modern_session_key = 'z_one.sesion';

function obtenerSesionActual() {
    try {
        const crudo = localStorage.getItem(modern_session_key);
        if (crudo) {
            const parsed = JSON.parse(crudo);
            if (parsed && parsed.nombre) {
                return parsed;
            }
        }
    } catch (e) {
        // Fallback a almacenamiento plano
    }

    const nombre = localStorage.getItem(session_key);
    if (!nombre) return null;

    const rol = localStorage.getItem(role_key) || 'cliente';
    return {
        id: null,
        nombre: nombre,
        email: '',
        rol: rol,
        perfil: null
    };
}

function formatoRol(rol, perfil) {
    const mapa = {
        colaborador: 'Colaborador',
        cliente: 'Cliente',
        administrador: 'Administrador'
    };
    const rolTexto = mapa[rol] || rol || 'Cliente';
    if (perfil) {
        return `${rolTexto} (${perfil.charAt(0).toUpperCase() + perfil.slice(1)})`;
    }
    return rolTexto;
}

/* ---------- Guard de sesión ---------- */
function protegerPagina() {
    const sesion = obtenerSesionActual();
    if (!sesion) {
        window.location.href = 'login.html';
        return null;
    }
    return sesion;
}

/* ---------- Mostrar usuario actual ---------- */
function mostrarUsuarioActual(sesion) {
    if (!sesion) return;
    const usuario = sesion.nombre;
    const etiquetaRol = formatoRol(sesion.rol, sesion.perfil);

    // welcomeUser: el "Hola, ___" del encabezado
    const saludo = document.getElementById('welcomeUser');
    if (saludo) saludo.textContent = usuario;

    // userBadge: la insignia de usuario junto al botón de cerrar sesión
    const insignia = document.getElementById('userBadge');
    if (insignia) insignia.textContent = `${usuario} · ${etiquetaRol}`;

    // usuarioActual: respaldo por si alguna página lo utiliza
    const etiqueta = document.getElementById('usuarioActual');
    if (etiqueta) etiqueta.textContent = usuario;

    const espacioRol = document.getElementById('spaceRole');
    if (espacioRol) espacioRol.textContent = `Acceso de ${sesion.rol ? sesion.rol.toLowerCase() : 'usuario'}`;
}

/* ---------- Cerrar sesión ---------- */
function activarLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;

    btnLogout.addEventListener('click', () => {
        localStorage.removeItem(modern_session_key);
        localStorage.removeItem(session_key);
        localStorage.removeItem(role_key);
        window.location.href = 'login.html';
    });
}

const sesionActiva = protegerPagina();
if (sesionActiva) {
    mostrarUsuarioActual(sesionActiva);
    activarLogout();
}
