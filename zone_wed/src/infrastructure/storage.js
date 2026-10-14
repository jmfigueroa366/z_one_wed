// CAPA: Infraestructura
import { ReactiveStore } from './reactiveStore.js';

const STORAGE_PREFIX = 'z_one_wed_';

function getStorage(target = 'local') {
    if (typeof window === 'undefined') {
        return null;
    }

    if (target === 'session') {
        return window.sessionStorage;
    }

    return window.localStorage;
}

function getKey(clave) {
    return `${STORAGE_PREFIX}${clave}`;
}

export const Storage = {
    guardarValor(clave, valor) {
        const storage = getStorage('local');
        if (!storage) {
            return null;
        }

        storage.setItem(getKey(clave), JSON.stringify(valor));
        ReactiveStore.notificar();
        return valor;
    },

    obtenerValor(clave, valorPorDefecto = null) {
        const storage = getStorage('local');
        if (!storage) {
            return valorPorDefecto;
        }

        const valor = storage.getItem(getKey(clave));
        if (valor === null) {
            return valorPorDefecto;
        }

        try {
            return JSON.parse(valor);
        } catch (error) {
            return valorPorDefecto;
        }
    },

    eliminarValor(clave) {
        const storage = getStorage('local');
        if (!storage) {
            return false;
        }

        storage.removeItem(getKey(clave));
        return true;
    },

    guardarValorEnSesion(clave, valor) {
        const storage = getStorage('session');
        if (!storage) {
            return null;
        }

        storage.setItem(getKey(clave), JSON.stringify(valor));
        ReactiveStore.notificar();
        return valor;
    },

    obtenerValorEnSesion(clave, valorPorDefecto = null) {
        const storage = getStorage('session');
        if (!storage) {
            return valorPorDefecto;
        }

        const valor = storage.getItem(getKey(clave));
        if (valor === null) {
            return valorPorDefecto;
        }

        try {
            return JSON.parse(valor);
        } catch (error) {
            return valorPorDefecto;
        }
    },

    eliminarValorEnSesion(clave) {
        const storage = getStorage('session');
        if (!storage) {
            return false;
        }

        storage.removeItem(getKey(clave));
        return true;
    },

    reiniciarSiVersionCambio(version) {
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
