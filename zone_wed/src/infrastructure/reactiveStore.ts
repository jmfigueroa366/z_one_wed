// CAPA: Infraestructura
type Suscriptor = () => void;

const suscriptores = new Set<Suscriptor>();

export const ReactiveStore = {
    suscribirse(listener: Suscriptor): () => void {
        suscriptores.add(listener);
        return () => {
            suscriptores.delete(listener);
        };
    },

    notificar(): void {
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
