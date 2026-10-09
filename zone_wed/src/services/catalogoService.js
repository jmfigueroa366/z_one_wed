// CAPA: Aplicación
import { salaRepo } from '../repositories/salaRepo.js';

export const CatalogoService = {
    listarSalas() {
        return salaRepo.listar();
    },

    obtenerSala(id) {
        return salaRepo.obtenerPorId(id);
    },
};

export default CatalogoService;
