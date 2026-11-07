import { apiGet } from './apiClient';

export interface SalaLandingApi {
    id: number;
    nombre: string;
    precioHora: number;
    descripcion: string;
    imagenUrl: string | null;
}

export interface ServicioLandingApi {
    id: number;
    orden: number;
    titulo: string;
    descripcion: string;
    icono: string;
    color: string;
}

export interface PasoLandingApi {
    id: number;
    orden: number;
    titulo: string;
    descripcion: string;
    icono: string;
}

export interface TestimonioLandingApi {
    id: number;
    nombre: string;
    rol: string;
    texto: string;
    imagenUrl: string | null;
    calificacion: number;
}

export interface PreguntaLandingApi {
    id: number;
    pregunta: string;
    respuesta: string;
}

export interface MetricaLandingApi {
    id: number;
    valor: number;
    sufijo: string;
    etiqueta: string;
}

export interface ArtistaLandingApi {
    id: string;
    nombre: string;
    perfil: string | null;
    foto: string | null;
}

export interface ConfigLandingApi {
    hero_imagen: string | null;
    horario_estudio: string;
}

export interface LandingApi {
    salas: SalaLandingApi[];
    servicios: ServicioLandingApi[];
    pasos: PasoLandingApi[];
    testimonios: TestimonioLandingApi[];
    preguntas: PreguntaLandingApi[];
    metricas: MetricaLandingApi[];
    artistas: ArtistaLandingApi[];
    totalServicios: number;
    config: ConfigLandingApi;
}

export const obtenerLandingApi = (): Promise<LandingApi> => apiGet<LandingApi>('/publico/landing');
