// CAPA: Infraestructura
import { ReactiveStore } from './reactiveStore.ts';

const STORAGE_PREFIX = 'z_one_wed_';

type StorageTarget = 'local' | 'session';

function getStorage(target: StorageTarget = 'local'): Storage | null {
    if (typeof window === 'undefined') {
        return null;
    }

    if (target === 'session') {
        return window.sessionStorage;
    }

    return window.localStorage;
}

function getKey(clave: string): string {
    return `${STORAGE_PREFIX}${clave}`;
}

// Genera un id local unico para una entidad que aun no tiene id.
// Los ids que llegan de Supabase son UUID (texto), asi que solo se toman
// en cuenta los ids numericos (datos locales/seed) para calcular el siguiente.
// Tambien se consideran los ids remotos ya conocidos para no repetir uno
// que pertenezca a una fila de Supabase.
export function generarIdUnico<T extends { id?: number | string | null; id_remoto?: number | string | null }>(items: T[]): number {
    const mayor = items.reduce((max: number, item: T) => {
        const candidatos: Array<number | string | null | undefined> = [item?.id, item?.id_remoto];
        return candidatos.reduce((mayor: number, candidato) => {
            const numero = typeof candidato === 'number' ? candidato : Number(candidato);
            return Number.isFinite(numero) ? Math.max(mayor, numero) : mayor;
        }, max);
    }, 0);
    return mayor + 1;
}

export const Storage = {
    guardarValor<T>(clave: string, valor: T): T | null {
        const storage = getStorage('local');
        if (!storage) {
            return null;
        }

        storage.setItem(getKey(clave), JSON.stringify(valor));
        ReactiveStore.notificar();
        return valor;
    },

    obtenerValor<T>(clave: string, valorPorDefecto: T): T {
        const storage = getStorage('local');
        if (!storage) {
            return valorPorDefecto;
        }

        const valor = storage.getItem(getKey(clave));
        if (valor === null) {
            return valorPorDefecto;
        }

        try {
            return JSON.parse(valor) as T;
        } catch {
            return valorPorDefecto;
        }
    },

    // Distingue "clave nunca inicializada" de "clave con valor" (p. ej. []).
    existeValor(clave: string): boolean {
        const storage = getStorage('local');
        if (!storage) {
            return false;
        }
        return storage.getItem(getKey(clave)) !== null;
    },

    eliminarValor(clave: string): boolean {
        const storage = getStorage('local');
        if (!storage) {
            return false;
        }

        storage.removeItem(getKey(clave));
        return true;
    },

    guardarValorEnSesion<T>(clave: string, valor: T): T | null {
        const storage = getStorage('session');
        if (!storage) {
            return null;
        }

        storage.setItem(getKey(clave), JSON.stringify(valor));
        ReactiveStore.notificar();
        return valor;
    },

    obtenerValorEnSesion<T>(clave: string, valorPorDefecto: T): T {
        const storage = getStorage('session');
        if (!storage) {
            return valorPorDefecto;
        }

        const valor = storage.getItem(getKey(clave));
        if (valor === null) {
            return valorPorDefecto;
        }

        try {
            return JSON.parse(valor) as T;
        } catch {
            return valorPorDefecto;
        }
    },

    eliminarValorEnSesion(clave: string): boolean {
        const storage = getStorage('session');
        if (!storage) {
            return false;
        }

        storage.removeItem(getKey(clave));
        return true;
    },

    // Borra todas las claves locales de la app (se usa al cerrar sesion).
    limpiarTodo(): void {
        const storage = getStorage('local');
        if (!storage) {
            return;
        }
        for (let i = storage.length - 1; i >= 0; i--) {
            const claveItem = storage.key(i);
            if (claveItem && claveItem.startsWith(STORAGE_PREFIX)) {
                storage.removeItem(claveItem);
            }
        }
        ReactiveStore.notificar();
    },

    reiniciarSiVersionCambio(version: string): boolean {
        const claveVersion = getKey('seed_version');
        const storage = getStorage('local');
        if (!storage || storage.getItem(claveVersion) === version) {
            return false;
        }

        for (let i = storage.length - 1; i >= 0; i--) {
            const claveItem = storage.key(i);
            if (claveItem && claveItem.startsWith(STORAGE_PREFIX)) {
                storage.removeItem(claveItem);
            }
        }

        storage.setItem(claveVersion, version);
        return true;
    },
};

export default Storage;
