// CAPA: Infraestructura
// Datos iniciales; la persistencia se orquesta desde la capa de aplicación.

// Incrementa este valor cuando cambie SEED para que los navegadores
// con datos antiguos se repueblen automáticamente.
export const SEED_VERSION = '2026-10-08-2';

function fechaLocalISO(fecha) {
    return (
        fecha.getFullYear() + '-' +
        String(fecha.getMonth() + 1).padStart(2, '0') + '-' +
        String(fecha.getDate()).padStart(2, '0')
    );
}

function enDias(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return fechaLocalISO(d);
}

export const SEED = {
    usuarios: [
        { nombre: 'Dirección Z-ONE', email: 'admin@z-one.com', password: 'admin123', rol: 'administrador', activo: true },
        { nombre: 'Lúa Ferreira', email: 'lua@z-one.com', password: 'colab123', rol: 'colaborador', perfil: 'artista', activo: true },
        { nombre: 'Cliente Zeta', email: 'cliente@z-one.com', password: 'cliente123', rol: 'cliente', activo: true },
        { nombre: 'Mario', email: 'mario@z-one.com', password: 'colab123', rol: 'colaborador', perfil: 'ingeniero', activo: true },
    ],

    salas: [
        { nombre: 'Cabina A', precio_hora: 40000, activo: true },
        { nombre: 'Cabina B', precio_hora: 47000, activo: true },
        { nombre: 'Sala de mezcla', precio_hora: 60000, activo: true },
    ],

    colaboradores: [
        { nombre: 'Lúa Ferreira', especialidad: 'Canto', usuario_id: 2, activo: true },
        { nombre: 'Batey Norte', especialidad: 'Producción', activo: true },
        { nombre: 'Nova Lima', especialidad: 'Canto', activo: true },
        { nombre: 'Leo Norte', especialidad: 'Producción', activo: true },
        { nombre: 'Alma Beats', especialidad: 'Composición', activo: true },
        { nombre: 'Ecos del Sur', especialidad: 'Instrumental', activo: false },
        { nombre: 'Mario', especialidad: 'Ingeniero de sonido', usuario_id: 4, activo: true },
    ],

    solicitudes: [
        { colaborador_id: 1, usuario_id: 2, sala_id: 1, fecha: enDias(0), franja: '10:00-12:00', tipo: 'grabacion', estado: 'solicitud' },
        { colaborador_id: 2, sala_id: 3, fecha: enDias(1), franja: '15:00-18:00', tipo: 'mezcla', estado: 'en_negociacion' },
        { colaborador_id: 3, sala_id: 2, fecha: enDias(2), franja: '09:00-11:00', tipo: 'grabacion', estado: 'confirmada' },
        { colaborador_id: 4, sala_id: 1, fecha: enDias(-1), franja: '14:00-16:00', tipo: 'produccion', estado: 'rechazada' },
        { colaborador_id: 5, sala_id: 2, fecha: enDias(3), franja: '18:00-20:00', tipo: 'masterizacion', estado: 'solicitud' },
        { colaborador_id: 1, usuario_id: 2, sala_id: 3, fecha: enDias(-4), franja: '11:00-13:00', tipo: 'ensayo', estado: 'confirmada' },
        { colaborador_id: 3, sala_id: 1, fecha: enDias(-6), franja: '10:00-12:00', tipo: 'grabacion', estado: 'expirada' },
        { colaborador_id: 2, sala_id: 2, fecha: enDias(5), franja: '16:00-19:00', tipo: 'mezcla', estado: 'en_negociacion' },
    ],

    sesiones: [
        { titulo: 'Grabación Lúa', sala_id: 1, colaborador_id: 1, fecha: enDias(-3), hora_inicio: '10:00', hora_fin: '12:00', estado: 'completada' },
        { titulo: 'Mezcla Batey Norte', sala_id: 3, colaborador_id: 2, fecha: enDias(-2), hora_inicio: '15:00', hora_fin: '18:00', estado: 'completada' },
        { titulo: 'Masterización Ecos', sala_id: 2, colaborador_id: 6, fecha: enDias(-1), hora_inicio: '09:00', hora_fin: '10:30', estado: 'completada' },
        { titulo: 'Sesión Nova Lima', sala_id: 2, colaborador_id: 3, fecha: enDias(1), hora_inicio: '09:00', hora_fin: '11:00', estado: 'confirmada' },
        { titulo: 'Producción Leo Norte', sala_id: 1, colaborador_id: 4, fecha: enDias(2), hora_inicio: '14:00', hora_fin: '16:00', estado: 'confirmada' },
        { titulo: 'Composición Alma Beats', sala_id: 3, colaborador_id: 5, fecha: enDias(3), hora_inicio: '18:00', hora_fin: '20:00', estado: 'confirmada' },
        { titulo: 'Grabación Lúa 2', sala_id: 1, colaborador_id: 1, fecha: enDias(-5), hora_inicio: '11:00', hora_fin: '13:00', estado: 'cancelada' },
    ],

    proyectos: [
        { nombre: 'Mi primer álbum', usuario_id: 3 },
        { nombre: 'Sencillos 2026', usuario_id: 3 },
    ],

    canciones: [
        { proyecto_id: 1, nombre: 'Amanecer', duracion: 3 },
        { proyecto_id: 1, nombre: 'Ritmo del alma', duracion: 4 },
        { proyecto_id: 1, nombre: 'Sin título', duracion: 2 },
        { proyecto_id: 2, nombre: 'Noche azul', duracion: 3 },
        { proyecto_id: 2, nombre: 'Contigo', duracion: 3 },
    ],

    ordenes_servicio: [
        { sesion_id: 1, descripcion: 'Grabación Cabina A', total: 80000, estado: 'pagada', fecha_emision: enDias(-3) },
        { sesion_id: 2, descripcion: 'Mezcla Sala de mezcla', total: 180000, estado: 'facturada', fecha_emision: enDias(-2) },
        { sesion_id: 3, descripcion: 'Masterización Cabina B', total: 47000, estado: 'facturada', fecha_emision: enDias(-1) },
        { sesion_id: 5, descripcion: 'Producción Cabina A', total: 80000, estado: 'borrador', fecha_emision: enDias(2) },
    ],
};
