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
export function generarIdUnico<T extends { id?: number | string | null }>(items: T[]): number {
    return (
        items.reduce((max, item) => {
            const numero = typeof item?.id === 'number' ? item.id : Number(item?.id);
            return Number.isFinite(numero) ? Math.max(max, numero) : max;
        }, 0) + 1
    );
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
