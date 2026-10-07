//Peticion de una reserva, ya sea a un colaborador, sala, fecha y tiempo

import { Storage } from './storage.js';
import { SalaRepo } from './salaRepo.js';
import { ColaboradorRepo } from './colaboradorRepo.js';

const COLECCION = 'solicitudes';

export const ESTADOS_SOLICITUD = {
    SOLICITUD: 'solicitud',
    EN_NEGOCIACION: 'en_negociacion',
    CONFIRMADA: 'confirmada',
    RECHAZADA: 'rechazada',
    EXPIRADA: 'expirada',
};

export const SolicitudRepo = {

    todas() {
        return Storage.obtenerTodos(COLECCION);
    },

    porId(id) {
        return Storage.obtenerPorId(COLECCION, id);
    },

    //Las solicitudes solo se muestran en al colabarador que corresponde y admin ve todo
    pendientes() {
        return Storage.buscar(COLECCION, (s) =>
            s.estado === ESTADOS_SOLICITUD.SOLICITUD || s.estado === ESTADOS_SOLICITUD.EN_NEGOCIACION);
    },
    
    deColaborador(colaboradorId) {
        return Storage.buscar(COLECCION, (s) => s.colaborador_id === colaboradorId);
    },
    
    crear(datos) {
        const colaboradorId = Number(datos?.colaborador_id);
        const salaId = Number(datos?.sala_id);
        const fecha = String(datos?.fecha || '');
        const franja = String(datos?.franja || '');
    
        if (!ColaboradorRepo.porId(colaboradorId)) throw new Error('El colaborador seleccionado no existe.');
        if (!SalaRepo.porId(salaId)) throw new Error('La sala seleccionada no existe.');
        if (!fecha) throw new Error('La fecha es obligatoria.');
        if (!franja) throw new Error('La franja horaria es obligatoria.');
    
        return Storage.crear(COLECCION, {
            colaborador_id: colaboradorId,
            sala_id: salaId,
            fecha,
            franja,
            estado: ESTADOS_SOLICITUD.SOLICITUD,
        });
    },
    
    // Avanza (o frena) la solicitud en el embudo.
    cambiarEstado(id, estado) {
        const valido = Object.values(ESTADOS_SOLICITUD).includes(estado);
        if (!valido) throw new Error(`El estado "${estado}" no es válido para una solicitud.`);
        if (!this.porId(id)) return null;
        return Storage.actualizar(COLECCION, id, { estado });
    },
    
    confirmar: (id) => SolicitudRepo.cambiarEstado(id, ESTADOS_SOLICITUD.CONFIRMADA),
    rechazar: (id) => SolicitudRepo.cambiarEstado(id, ESTADOS_SOLICITUD.RECHAZADA),
};
