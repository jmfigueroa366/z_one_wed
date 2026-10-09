// CAPA: Aplicación
import { crearArtista } from '../models/Artista.js';
import { colaboradorRepo } from '../repositories/colaboradorRepo.js';

export const ArtistaService = {
    listar() {
        return colaboradorRepo.listar().filter((colaborador) =>
            colaborador.activo !== false
            && (colaborador.perfil === 'artista'
                || /canto|cantante|voz|artista/i.test(colaborador.especialidad ?? ''))
        ).map(crearArtista);
    },

    obtenerPorId(id) {
        const artista = this.listar().find((item) => String(item.id) === String(id));
        return artista ?? null;
    },

    crear(data) {
        const nombre = String(data?.nombre ?? '').trim();
        const especialidad = String(data?.especialidad ?? '').trim();
        const especialidadesPermitidas = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];
        const imagen = String(data?.imagen ?? '');

        if (!nombre) {
            throw new Error('El nombre del artista es obligatorio.');
        }

        if (!especialidadesPermitidas.includes(especialidad)) {
            throw new Error('Selecciona un género o especialidad válida.');
        }

        if (imagen && !/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/]+=*$/i.test(imagen)) {
            throw new Error('La foto debe ser una imagen JPG, PNG o WebP válida.');
        }

        if (imagen.length > 2_100_000) {
            throw new Error('La foto debe pesar 1.5 MB o menos.');
        }

        return crearArtista(colaboradorRepo.crear({
            nombre,
            especialidad,
            perfil: 'artista',
            ...(imagen ? { imagen } : {}),
            activo: true,
        }));
    },
};

export default ArtistaService;
