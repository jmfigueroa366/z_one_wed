//Reglas de negocios de los colaboradores

import { Storage } from './storage';

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