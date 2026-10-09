// CAPA: Infraestructura
const suscriptores = new Set();

export const ReactiveStore = {
    suscribirse(listener) {
        suscriptores.add(listener);
        return () => {
            suscriptores.delete(listener);
        };
    },

    notificar() {
        suscriptores.forEach((listener) => {
            try {
                listener();
            } catch (error) {
                console.warn('No se pudo actualizar un suscriptor de ReactiveStore.', error);
            }
        });
    },
};

export default ReactiveStore;