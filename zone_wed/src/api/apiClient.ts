const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') ?? '';

const CSRF_HEADER = 'X-Requested-With';
const CSRF_VALUE = 'zone-web';

export const EVENTO_SESION_EXPIRADA = 'auth:expirada';

const RUTAS_SIN_REFRESH = new Set(['/auth/refresh', '/auth/login', '/auth/registro', '/auth/logout']);
const RUTAS_SIN_EVENTO = new Set(['/auth/me']);

export interface SalaApi {
    id: number;
    nombre: string;
    precioHora: number;
    activo: boolean;
}

interface ProblemDetails {
    title?: string;
    detail?: string;
    status?: number;
    code?: string;
    errors?: Record<string, string[]>;
}

export interface OpcionesSolicitud {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    reintentar?: boolean;
}

export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly errors?: Record<string, string[]>;
    readonly body?: unknown;

    constructor(
        mensaje: string,
        status: number,
        code?: string,
        errors?: Record<string, string[]>,
        body?: unknown,
    ) {
        super(mensaje);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.errors = errors;
        this.body = body;
    }
}

let refrescoEnCurso: Promise<boolean> | null = null;

function rutaSinQuery(ruta: string): string {
    return ruta.split('?')[0];
}

function rutaSinRefresco(ruta: string): boolean {
    return RUTAS_SIN_REFRESH.has(rutaSinQuery(ruta));
}

function debeEmitirEvento(ruta: string): boolean {
    return !RUTAS_SIN_EVENTO.has(rutaSinQuery(ruta));
}

function emitirSesionExpirada(): void {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
}

async function construirError(respuesta: Response): Promise<ApiError> {
    const texto = await respuesta.text().catch(() => '');
    let problema: ProblemDetails | null = null;

    if (texto) {
        try {
            problema = JSON.parse(texto) as ProblemDetails;
        } catch {
            problema = null;
        }
    }

    const campos = problema?.errors ? Object.values(problema.errors).flat() : [];
    const mensaje = campos.length > 0
        ? campos.join(' ')
        : problema?.title || problema?.detail || texto.trim() || `Error ${respuesta.status}. Inténtalo de nuevo.`;

    return new ApiError(
        mensaje,
        respuesta.status,
        problema?.code,
        problema?.errors,
        problema ?? (texto || undefined),
    );
}

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
    if (!respuesta.ok) {
        throw await construirError(respuesta);
    }

    if (respuesta.status === 204) {
        return undefined as T;
    }

    const texto = await respuesta.text();
    return texto ? (JSON.parse(texto) as T) : (undefined as T);
}

function ejecutarFetch(ruta: string, opciones: OpcionesSolicitud): Promise<Response> {
    const metodo = opciones.method ?? 'GET';
    const headers: Record<string, string> = { Accept: 'application/json' };
    const modifica = metodo !== 'GET' && metodo !== 'HEAD';

    if (modifica) {
        headers[CSRF_HEADER] = CSRF_VALUE;
    }
    if (opciones.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    return fetch(`${BASE_URL}${ruta}`, {
        method: metodo,
        credentials: 'include',
        headers,
        body: opciones.body !== undefined ? JSON.stringify(opciones.body) : undefined,
        signal: opciones.signal,
    });
}

async function solicitarRefresh(): Promise<boolean> {
    try {
        const respuesta = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                [CSRF_HEADER]: CSRF_VALUE,
            },
        });
        return respuesta.ok;
    } catch {
        return false;
    }
}

async function refrescarSesion(): Promise<boolean> {
    if (!refrescoEnCurso) {
        refrescoEnCurso = solicitarRefresh();
    }

    const actual = refrescoEnCurso;
    try {
        return await actual;
    } finally {
        if (refrescoEnCurso === actual) {
            refrescoEnCurso = null;
        }
    }
}

export async function apiRequest<T>(ruta: string, opciones: OpcionesSolicitud = {}): Promise<T> {
    if (!BASE_URL) {
        throw new Error(
            'VITE_API_URL no está definida. Configúrala en .env.local (por ejemplo: VITE_API_URL=http://localhost:5102).',
        );
    }

    const respuesta = await ejecutarFetch(ruta, opciones);

    if (respuesta.status === 401 && opciones.reintentar !== false && !rutaSinRefresco(ruta)) {
        const refrescado = await refrescarSesion();

        if (refrescado) {
            const reintento = await ejecutarFetch(ruta, opciones);

            if (reintento.status !== 401) {
                return procesarRespuesta<T>(reintento);
            }

            if (debeEmitirEvento(ruta)) {
                emitirSesionExpirada();
            }
            throw await construirError(reintento);
        }

        if (debeEmitirEvento(ruta)) {
            emitirSesionExpirada();
        }
        throw await construirError(respuesta);
    }

    return procesarRespuesta<T>(respuesta);
}

export function apiGet<T>(ruta: string, opciones: Omit<OpcionesSolicitud, 'method' | 'body'> = {}): Promise<T> {
    return apiRequest<T>(ruta, { ...opciones, method: 'GET' });
}

export function apiPost<T>(
    ruta: string,
    cuerpo?: unknown,
    opciones: Omit<OpcionesSolicitud, 'method' | 'body'> = {},
): Promise<T> {
    return apiRequest<T>(ruta, { ...opciones, method: 'POST', body: cuerpo });
}

export function apiPut<T>(
    ruta: string,
    cuerpo?: unknown,
    opciones: Omit<OpcionesSolicitud, 'method' | 'body'> = {},
): Promise<T> {
    return apiRequest<T>(ruta, { ...opciones, method: 'PUT', body: cuerpo });
}

export function apiPatch<T>(
    ruta: string,
    cuerpo?: unknown,
    opciones: Omit<OpcionesSolicitud, 'method' | 'body'> = {},
): Promise<T> {
    return apiRequest<T>(ruta, { ...opciones, method: 'PATCH', body: cuerpo });
}

export function apiDelete<T>(
    ruta: string,
    cuerpo?: unknown,
    opciones: Omit<OpcionesSolicitud, 'method' | 'body'> = {},
): Promise<T> {
    return apiRequest<T>(ruta, { ...opciones, method: 'DELETE', body: cuerpo });
}

export function obtenerSalasApi(): Promise<SalaApi[]> {
    return apiGet<SalaApi[]>('/publico/salas');
}

export function urlImagen(ruta: string | null | undefined): string {
    if (!ruta) {
        return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMxYTE5MmYiLz48L3N2Zz4=';
    }
    if (/^https?:\/\//i.test(ruta)) {
        return ruta;
    }
    if (!BASE_URL) {
        return ruta;
    }
    return `${BASE_URL}${ruta}`;
}
