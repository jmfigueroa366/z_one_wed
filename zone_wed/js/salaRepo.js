//Reglas de negocios de las salas de grabacion. Las desactivas no aparecen en la listas de reserva

import { Storage } from './storage.js';

const COLECCION = 'salas';

export const SalaRepo = {
    //Solo salas activas
    todas() {
        return Storage.buscar(COLECCION, (s) => s.activo !== false);
    },

    todasIncluyendoInactivas() {
            return Storage.obtenerTodos(COLECCION);
        },
    
        porId(id) {
            return Storage.obtenerPorId(COLECCION, id);
        },
    
        //Valida los datos de la sala
        crear(datos) {
            const nombre = String (datos?.nombre || '').trim();
            const precio_hora = Number(datos?.precio_hora);
    
            if (!nombre) throw new Error ('El nombre es obligatorio');
            if (!(precio_hora > 0)) throw new Error ('El precio por hora debe ser mayor a 0');

            return Storage.crear(COLECCION, {
                nombre,
                precio_hora,
                activo: true,
            });
        },
    
        actualizar(id, cambios) {
            if (!this.porId(id)) return null;
            if (cambios.nombre !== undefined) {
                const nombre = String (cambios.nombre).trim();
                if (!nombre) throw new Error('El nombre de la sala no puede quedar vacio');
                cambios.nombre = nombre;
            }
            if(cambios.precio_hora !== undefined) {
                const precio = Number(cambios.precio_hora);
                if (!(precio > 0)) throw new Error('El precio por hora debe ser mayor a 0');
                cambios.precio_hora = precio;
            }
            return Storage.actualizar(COLECCION, id, cambios);
        },
        
        desactivar(id) {
            if (!this.porId(id)) return null;
            return Storage.actualizar(COLECCION, id, { activo: false });
        },
    
        activar(id) {
            if (!this.porId(id))
                return null;
            return Storage.actualizar(COLECCION, id, {activo:true});
        },


}