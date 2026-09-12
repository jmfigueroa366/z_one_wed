

function guardarDato(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerDato(clave) {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : [];
}

/*Confirmación reutilizable para Guardar/Eliminar*/
function confirmarAccion(mensaje) {
    return window.confirm(mensaje);
}
