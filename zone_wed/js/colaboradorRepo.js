//Reglas de negocios de los colaboradores

import { Storage } from './storage.js';

const COLECCION = 'colaboradores';

export const ColaboradorRepo = {
    
    todas() {
        return Storage.buscar(COLECCION, (c) => c.activo !== false);
    },

    todasIncluyendoInactivas() {
        return Storage.obtenerTodos(COLECCION);
    },
    
    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    // El talento que representa a un usuario en específico.
    // (null si ese usuario no es un talento visible.)
    porUsuarioId(usuarioId) {
        return Storage.buscar(COLECCION, (c) => c.usuario_id === usuarioId && c.activo !== false)[0] || null;
    },

    porEspecialidad(especialidad) {
        return Storage.buscar(COLECCION, (c) => c.activo !== false && c.especialidad === especialidad);
    },
    
    //Valida los datos del colaborador
    crear(datos) {
        const nombre = String (datos?.nombre || '').trim();
        const especialidad = String (datos?.especialidad || '').trim();
    
        if (!nombre) throw new Error ('El nombre es obligatorio');
        if (!especialidad) throw new Error ('La especialidad es obligatoria');

        return Storage.crear(COLECCION, {
            nombre,
            especialidad,
            usuario_id: datos?.usuario_id ?? null,
            activo: true,
        });
    },
    
    actualizar(id, cambios) {
        if (!this.porId(id)) return null;
        if (cambios.nombre !== undefined && !String(cambios.nombre).trim()) 
            throw new Error('El nombreno puede quedar vacio');
        return Storage.actualizar(COLECCION, id, cambios);
    },
        
    desactivar(id) {
        if (!this.porId(id)) 
            return null;
        return Storage.actualizar(COLECCION, id, { activo: false });
    },
    
    activar(id) {
        if (!this.porId(id))
            return null;
        return Storage.actualizar(COLECCION, id, {activo:true});
    },
};