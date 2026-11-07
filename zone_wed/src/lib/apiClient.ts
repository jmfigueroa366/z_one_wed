const BASE_URL = import.meta.env.VITE_API_URL;

// Debe coincidir con RequireCustomHeaderMiddleware (backend): defensa CSRF.
const CSRF_HEADER = 'X-Requested-With';
const CSRF_VALUE = 'zone-web';

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

export class ApiError extends Error {
    readonly status: number;
    readonly code?: string;
    readonly errors?: Record<string, string[]>;

    constructor(mensaje: string, status: number, code?: string, errors?: Record<string, string[]>) {
        super(mensaje);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.errors = errors;
    }
}

async function mensajeDeError(respuesta: Response): Promise<{ mensaje: string; code?: string; errors?: Record<string, string[]> }> {
    let problema: ProblemDetails | null = null;
    try {
        problema = (await respuesta.json()) as ProblemDetails;
    } catch {
        problema = null;
    }

    const campos = problema?.errors ? Object.values(problema.errors).flat() : [];
    const mensaje = campos.length > 0
        ? campos.join(' ')
        : problema?.title || problema?.detail || `Error ${respuesta.status}. Inténtalo de nuevo.`;

    return { mensaje, code: problema?.code, errors: problema?.errors };
}

async function apiFetch<T>(ruta: string, metodo: string, cuerpo?: unknown): Promise<T> {
    if (!BASE_URL) {
        throw new Error(
            'VITE_API_URL no está definida. Configúrala en .env.local (por ejemplo: VITE_API_URL=http://localhost:5102).'
        );
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    const modifica = metodo !== 'GET' && metodo !== 'HEAD';
    if (modifica) {
        headers[CSRF_HEADER] = CSRF_VALUE;
    }
    if (cuerpo !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    const respuesta = await fetch(`${BASE_URL}${ruta}`, {
        method: metodo,
        credentials: 'include',
        headers,
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });

    if (!respuesta.ok) {
        const { mensaje, code, errors } = await mensajeDeError(respuesta);
        throw new ApiError(mensaje, respuesta.status, code, errors);
    }

    if (respuesta.status === 204) {
        return undefined as T;
    }

    const texto = await respuesta.text();
    return texto ? (JSON.parse(texto) as T) : (undefined as T);
}

export function apiGet<T>(ruta: string): Promise<T> {
    return apiFetch<T>(ruta, 'GET');
}

export function apiPost<T>(ruta: string, cuerpo?: unknown): Promise<T> {
    return apiFetch<T>(ruta, 'POST', cuerpo);
}

export function apiPut<T>(ruta: string, cuerpo?: unknown): Promise<T> {
    return apiFetch<T>(ruta, 'PUT', cuerpo);
}

export function apiDelete<T>(ruta: string, cuerpo?: unknown): Promise<T> {
    return apiFetch<T>(ruta, 'DELETE', cuerpo);
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
