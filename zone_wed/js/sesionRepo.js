//Reglas de negocio de las sesiones
//Una sesion es un bloque de tiempo reservado en una sala con un colaborador. 
//Se ancla a un id de sala y del colaborador, ambos deben existir

import { Storage } from './storage.js';
import { SalaRepo } from './salaRepo.js';
import { ColaboradorRepo } from './colaboradorRepo.js';

const COLECCION ='sesiones';

export const ESTADOS_SESION = {
    SOLICITADA: 'solicitada',
    CONFIRMADA: 'confirmada',
    COMPLETADA: 'completada',
    CANCELADA: 'cancelada',
};

export const SesionRepo = {

    todas() {
        return Storage.obtenerTodos(COLECCION);
    },

    //Sesiones que ocupan agenda, todas las confirmadas 
    activas() {
        return Storage.buscar(COLECCION, (s) => s.estado == ESTADOS_SESION.CONFIRMADA || s.estado === ESTADOS_SESION.COMPLETADA);
    },

    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    //Sesiones de la misma sala 
    deUnaSala(salaId) {
        return Storage.buscar(COLECCION, (s) => s.sala_id === salaId);
    },

    //Sesiones entre dos fechas por ISO
    enRango(desde, hasta) {
        return Storage.buscar(COLECCION, (s) => s.fecha >= desde && s.fecha <= hasta);
    },
    
    crear(datos) {
        const titulo = String (datos?.titulo || '').trim();
        const salaId = Number(datos?.sala_id);
        const colaboradorId = Number(datos?.colaborador_id);
        const fecha = String(datos?.fecha ||'');
        const horaInicio = String(datos?.hora_inicio ||'');
        const horaFin = String(datos?.hora_fin ||'');
        

        if (!titulo) throw new Error ('El titulo de la sesion es obligatorio');
        if (!SalaRepo.porId(salaId)) throw new Error ('La sala seleccionada no existe');
        if (!ColaboradorRepo.porId(colaboradorId)) throw new Error ('El colaborador seleccionado no existe');
        if (!fecha) throw new Error ('La fecha es obligatoria');
        if (!horaInicio || ! horaFin) throw new Error ('La hora de inicio y fin son obligatoria');
        if (horaFin <= horaInicio) throw new Error ('La hora de fin debe ser despues de la hora de inicio');

        return Storage.crear(COLECCION, {
            titulo,
            sala_id: salaId,
            colaborador_id: colaboradorId,
            fecha,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            estado: ESTADOS_SESION.CONFIRMADA,
        });
    },

    cambiarEstado(id, estado) {
        const valido = Object.values(ESTADOS_SESION).includes(estado);
        if(!valido) throw new Error(`El estado "${estado}" no es valido para una sesion`);
        if (!this.porId(id)) 
            return null;
        return Storage.actualizar(COLECCION, id, {estado});
    },

    confirmar: (id) => SesionRepo.cambiarEstado(id, ESTADOS_SESION.CONFIRMADA),
    completar: (id) => SesionRepo.cambiarEstado(id, ESTADOS_SESION.COMPLETADA),
    cancelar: (id) => SesionRepo.cambiarEstado(id, ESTADOS_SESION.CANCELADA),
};