// CAPA: Dominio
// Tipo de entrada genérico: la misma entidad con todos los campos opcionales
// y las listas anidadas convertidas también en entradas parciales.
export type Entrada<T> = {
    [K in keyof T]?: T[K] extends (infer U)[] ? Entrada<U>[] : T[K];
};
