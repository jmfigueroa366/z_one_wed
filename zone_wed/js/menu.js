import { Auth } from './auth.js';

const usuario_actual = Auth.requierePanel('operaciones');

if (usuario_actual) {
    const nombre = usuario_actual.nombre;
    const rol = Auth.etiquetaRol(usuario_actual.rol);

    const saludo = document.getElementById('welcomeUser');
    const insignia = document.getElementById('userBadge');
    const etiqueta = document.getElementById('usuarioActual');
    const espacio_rol = document.getElementById('spaceRole');

    if (saludo) saludo.textContent = nombre;
    if (insignia) insignia.textContent = `${nombre} · ${rol}`;
    if (etiqueta) etiqueta.textContent = nombre;
    if (espacio_rol) espacio_rol.textContent = `Acceso de ${rol.toLowerCase()}`;

    const boton_logout = document.getElementById('btnLogout');
    boton_logout?.addEventListener('click', () => {
        Auth.cerrarSesion();
        window.location.href = 'login.html';
    });
}
