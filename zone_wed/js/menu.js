const session_key = 'zone_usuario';
 
/* ---------- Guard de sesión ---------- */
// Si no hay usuario "logueado" en localStorage, se devuelve al login.
// (Es una maqueta, así que esto es solo para que la navegación se sienta real.)
function protegerPagina() {
    const usuario = localStorage.getItem(session_key);
    if (!usuario) {
        window.location.href = 'login.html';
        return null;
    }
    return usuario;
}
 
/* ---------- Mostrar usuario actual ---------- */
function mostrarUsuarioActual(usuario) {
    if (!usuario) return;
    // welcomeUser: el "Hola, ___" del encabezado
    const saludo = document.getElementById('welcomeUser');
    if (saludo) saludo.textContent = usuario;
    // userBadge: la insignia de usuario junto al botón de cerrar sesión
    const insignia = document.getElementById('userBadge');
    if (insignia) insignia.textContent = usuario;
    // usuarioActual: por si alguna página futura usa este id en vez de los de arriba
    const etiqueta = document.getElementById('usuarioActual');
    if (etiqueta) etiqueta.textContent = usuario;
}
 
/* ---------- Cerrar sesión ---------- */
function activarLogout() {
    const btnLogout = document.getElementById('btnLogout');
    if (!btnLogout) return;
 
    btnLogout.addEventListener('click', () => {
        localStorage.removeItem(session_key);
        window.location.href = 'login.html';
    });
}
 
/* ---------- Resaltar la página actual en el menú ---------- */
// Nota: las 9 páginas ya traen la clase "active" puesta a mano en el
// enlace correspondiente, así que esto es un respaldo por si en el
// futuro se generan los enlaces dinámicamente con data-page.
function resaltarPaginaActiva() {
    const pagina_actual = window.location.pathname.split('/').pop() || 'menu_principal.html';
 
    document.querySelectorAll('[data-page]').forEach((enlace) => {
        if (enlace.dataset.page === pagina_actual) {
            enlace.classList.add('is-active');
        }
    });
}
 
/* ---------- Menú hamburguesa en pantallas pequeñas ---------- */
// Nota: solo se activa si la página tiene #navToggle y #navPrincipal.
// Ninguna de mis 9 páginas los trae todavía; no rompe nada si no existen.
function activarMenuMovil() {
    const boton = document.getElementById('navToggle');
    const nav = document.getElementById('navPrincipal');
    if (!boton || !nav) return;
 
    boton.addEventListener('click', () => {
        const abierto = nav.classList.toggle('is-open');
        boton.setAttribute('aria-expanded', String(abierto));
    });
 
    nav.querySelectorAll('a').forEach((enlace) => {
        enlace.addEventListener('click', () => {
            nav.classList.remove('is-open');
            boton.setAttribute('aria-expanded', 'false');
        });
    });
}
 
const usuario = protegerPagina();
if (usuario) {
    mostrarUsuarioActual(usuario);
    activarLogout();
    resaltarPaginaActiva();
    activarMenuMovil();
}
 