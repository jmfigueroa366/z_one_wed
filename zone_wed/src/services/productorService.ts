// CAPA: Aplicación
import { crearProductor } from '../models/Productor.ts';
import type { EntradaProductor, Productor } from '../models/Productor.ts';
import type { Colaborador } from '../models/Colaborador.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';

export const ProductorService = {
    listar(): Colaborador[] {
        return colaboradorRepo.listar().filter((colaborador) =>
            colaborador.activo !== false
            && (colaborador.perfil === 'produccion'
                || colaborador.especialidad?.toLocaleLowerCase().includes('produ'))
        );
    },

    obtenerPorId(id: number | string): Productor | null {
        const productor = this.listar().find((item) => String(item.id) === String(id));
        return productor ? crearProductor(productor) : null;
    },

    crear(data: EntradaProductor = {}): Productor {
        const nombre = String(data?.nombre ?? '').trim();
        const especialidad = String(data?.especialidad ?? '').trim();
        const especialidadesPermitidas = ['Grabación', 'Mezcla', 'Masterización', 'Producción musical'];

        if (!nombre) {
            throw new Error('El nombre del productor es obligatorio.');
        }

        if (!especialidadesPermitidas.includes(especialidad)) {
            throw new Error('Selecciona una especialidad válida.');
        }

        const imagen = String(data?.imagen ?? '');
        if (imagen && !/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/]+=*$/i.test(imagen)) {
            throw new Error('La foto debe ser una imagen JPG, PNG o WebP válida.');
        }

        if (imagen.length > 2_100_000) {
            throw new Error('La foto debe pesar 1.5 MB o menos.');
        }

        return crearProductor(colaboradorRepo.crear({
            nombre,
            especialidad,
            perfil: 'produccion',
            ...(imagen ? { imagen } : {}),
            activo: true,
        }));
    },
};

export default ProductorService;
