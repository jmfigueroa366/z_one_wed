// CAPA: Aplicación
import { crearArtista } from '../models/Artista.ts';
import type { Artista, EntradaArtista } from '../models/Artista.ts';
import { colaboradorRepo } from '../repositories/colaboradorRepo.ts';

export const ArtistaService = {
    listar(): Artista[] {
        return colaboradorRepo.listar().filter((colaborador) =>
            colaborador.activo !== false
            && (colaborador.perfil === 'artista'
                || /canto|cantante|voz|artista/i.test(colaborador.especialidad ?? ''))
        ).map((colaborador) => crearArtista(colaborador));
    },

    obtenerPorId(id: number | string): Artista | null {
        const artista = this.listar().find((item) => String(item.id) === String(id));
        return artista ?? null;
    },

    async crear(data: EntradaArtista = {}): Promise<Artista> {
        const nombre = String(data?.nombre ?? '').trim();
        const especialidad = String(data?.especialidad ?? '').trim();
        const especialidadesPermitidas = ['Pop', 'Vallenato', 'Urbano', 'Rock', 'Salsa', 'Canto', 'Otro'];
        const imagen = String(data?.imagen ?? '');
        const email = String(data?.email ?? '').trim().toLowerCase();
        const password = String(data?.password ?? '');

        if (!nombre) {
            throw new Error('El nombre del artista es obligatorio.');
        }

        if (!email) {
            throw new Error('El correo electrónico es obligatorio para crear la cuenta.');
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error('Ingresa un correo electrónico válido.');
        }

        if (password.length < 6) {
            throw new Error('La contraseña debe tener al menos 6 caracteres.');
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

        const colaborador = await colaboradorRepo.crear({
            nombre,
            especialidad,
            perfil: 'artista',
            ...(imagen ? { imagen } : {}),
            activo: true,
            email,
            password,
        });
        return crearArtista(colaborador);
    },
};

export default ArtistaService;
