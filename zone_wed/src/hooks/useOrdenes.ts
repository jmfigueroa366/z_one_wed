// CAPA: Presentación
import { useEffect, useState } from 'react';
import { ReactiveStore } from '../infrastructure/reactiveStore.ts';
import { OrdenService } from '../services/ordenService.ts';
import { ROLES } from '../config/roles.ts';
import type { Usuario } from '../models/Usuario.ts';
import type { Orden } from '../models/Orden.ts';

const ROLES_FACTURACION = [ROLES.ADMINISTRADOR, ROLES.CLIENTE];

// Solo los roles con acceso a facturación pueden listar órdenes; para el resto
// devolvemos una lista vacía en vez de lanzar un error que rompa el render.
function listarSegunRol(usuario: Usuario | null | undefined): Orden[] {
    if (!usuario?.rol || !(ROLES_FACTURACION as string[]).includes(usuario.rol)) {
        return [];
    }
    return OrdenService.listar({ usuario, rol: usuario.rol });
}

export function useOrdenes(usuario: Usuario | null | undefined) {
    const [ordenes, setOrdenes] = useState<Orden[]>(() => listarSegunRol(usuario));

    useEffect(
        () => ReactiveStore.suscribirse(() => setOrdenes(listarSegunRol(usuario))),
        [usuario?.id, usuario?.rol]
    );

    return [ordenes, setOrdenes] as const;
}

export default useOrdenes;
