// CAPA: Presentación
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Bell,
    BellRing,
    CalendarClock,
    CheckCheck,
    Coins,
    Inbox,
    Music,
    Sparkles,
    Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { RUTAS } from '../config/rutas.ts';
import { esAdministrador, esColaborador, ROLES } from '../config/roles.ts';
import { useSolicitudes } from '../hooks/useSolicitudes.ts';
import { useSesiones } from '../hooks/useSesiones.ts';
import { useSalas } from '../hooks/useSalas.ts';
import { useColaboradores } from '../hooks/useColaboradores.ts';
import { formatearFecha } from '../utils/helpers.ts';
import { etiquetaEstado, etiquetaTipo } from '../utils/solicitudes.ts';
import Storage from '../infrastructure/storage.ts';
import '../styles/tailwind.css';

type TonoNotificacion = 'accent' | 'magenta' | 'aviso' | 'exito' | 'info';

interface ItemNotificacion {
    id: string;
    titulo: string;
    detalle: string;
    ruta: string;
    icono: 'solicitud' | 'agenda' | 'pago' | 'equipo';
    tono: TonoNotificacion;
    fecha: string;
}

type GrupoNotificacion = 'Hoy' | 'Esta semana' | 'Anteriores';

const ORDEN_GRUPOS: GrupoNotificacion[] = ['Hoy', 'Esta semana', 'Anteriores'];

const CLAVE_LEIDAS = 'notificaciones_leidas';
const ACENTOS: Record<TonoNotificacion, string> = {
    accent: 'from-accent/25 to-accent/0 text-accent',
    magenta: 'from-magenta/25 to-magenta/0 text-magenta',
    aviso: 'from-aviso/25 to-aviso/0 text-aviso',
    exito: 'from-exito/25 to-exito/0 text-exito',
    info: 'from-info/25 to-info/0 text-info',
};

const BARRAS: Record<TonoNotificacion, string> = {
    accent: 'from-accent to-accent/0',
    magenta: 'from-magenta to-magenta/0',
    aviso: 'from-aviso to-aviso/0',
    exito: 'from-exito to-exito/0',
    info: 'from-info to-info/0',
};

const ICONOS: Record<ItemNotificacion['icono'], typeof Music> = {
    solicitud: Sparkles,
    agenda: CalendarClock,
    pago: Coins,
    equipo: Users,
};

function fechaLocal(fecha: Date) {
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
}

function hoyISO() {
    return fechaLocal(new Date());
}

function clasificarFecha(fecha: string): GrupoNotificacion {
    const valor = String(fecha ?? '').slice(0, 10);
    if (!valor) return 'Anteriores';
    const hoy = hoyISO();
    if (valor >= hoy) return valor === hoy ? 'Hoy' : 'Esta semana';
    const limite = new Date();
    limite.setDate(limite.getDate() - 7);
    return valor >= fechaLocal(limite) ? 'Esta semana' : 'Anteriores';
}

function leerLeidas(): string[] {
    const valor = Storage.obtenerValor<unknown>(CLAVE_LEIDAS, []);
    return Array.isArray(valor) ? valor.filter((id): id is string => typeof id === 'string') : [];
}

export default function Notificaciones() {
    const { usuario } = useAuth();
    const [abierta, setAbierta] = useState(false);
    const [leidas, setLeidas] = useState<string[]>(() => leerLeidas());
    const [solicitudes] = useSolicitudes();
    const [sesiones] = useSesiones();
    const [salas] = useSalas();
    const [colaboradores] = useColaboradores();

    useEffect(() => {
        if (!abierta) return undefined;
        const cerrar = () => setAbierta(false);
        const escapar = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') setAbierta(false);
        };
        document.addEventListener('click', cerrar);
        document.addEventListener('keydown', escapar);
        return () => {
            document.removeEventListener('click', cerrar);
            document.removeEventListener('keydown', escapar);
        };
    }, [abierta]);

    const items = useMemo<ItemNotificacion[]>(() => {
        if (!usuario) return [];

        const colaborador = colaboradores.find((item) => String(item.usuario_id) === String(usuario.id));

        if (esAdministrador(usuario)) {
            const porGestionar = solicitudes
                .filter((solicitud) => solicitud.estado === 'solicitada')
                .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? '')));
            return porGestionar.slice(0, 5).map((solicitud) => ({
                id: `solicitud-${solicitud.id}`,
                titulo: `${solicitud.solicitante_nombre ?? 'Cliente'} · ${etiquetaTipo(solicitud.tipo)}`,
                detalle: `${formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || solicitud.fecha} · ${solicitud.franja || 'sin horario'}`,
                ruta: RUTAS.SOLICITUDES,
                icono: 'solicitud',
                tono: 'accent',
                fecha: String(solicitud.fecha ?? ''),
            }));
        }

        const propias = solicitudes
            .filter((solicitud) =>
                String(solicitud.usuario_id) === String(usuario.id)
                || (colaborador && (solicitud.colaboradores ?? []).some(
                    (invitacion) => String(invitacion.colaborador_id) === String(colaborador.id)
                )))
            .sort((a, b) => String(b.fecha ?? '').localeCompare(String(a.fecha ?? '')));

        const notificaciones: ItemNotificacion[] = propias.slice(0, 5).map((solicitud) => ({
            id: `solicitud-${solicitud.id}`,
            titulo: etiquetaTipo(solicitud.tipo),
            detalle: `${etiquetaEstado(solicitud.estado)} · ${formatearFecha(solicitud.fecha, { weekday: 'short', day: 'numeric' }) || solicitud.fecha} · ${solicitud.franja || 'sin horario'}`,
            ruta: RUTAS.SOLICITUDES,
            icono: solicitud.estado === 'pagada' ? 'pago' : 'solicitud',
            tono: solicitud.estado === 'pagada' ? 'exito' : solicitud.estado === 'cancelada' ? 'magenta' : 'accent',
            fecha: String(solicitud.fecha ?? ''),
        }));

        if (esColaborador(usuario)) {
            const proximas = sesiones
                .filter((sesion) =>
                    String(sesion.colaborador_id) === String(colaborador?.id)
                    && String(sesion.fecha ?? '') >= hoyISO()
                    && sesion.estado !== 'cancelada')
                .sort((a, b) => String(a.fecha ?? '').localeCompare(String(b.fecha ?? '')))
                .slice(0, 3)
                .map((sesion) => ({
                    id: `sesion-${sesion.id}`,
                    titulo: sesion.titulo,
                    detalle: `${formatearFecha(sesion.fecha, { weekday: 'short', day: 'numeric' }) || sesion.fecha} · ${sesion.hora_inicio}-${sesion.hora_fin} · ${salas.find((sala) => String(sala.id) === String(sesion.sala_id))?.nombre ?? 'Sala'}`,
                    ruta: RUTAS.AGENDA,
                    icono: 'agenda' as const,
                    tono: 'info' as const,
                    fecha: String(sesion.fecha ?? ''),
                }));
            notificaciones.push(...proximas);
        }

        return notificaciones;
    }, [usuario, solicitudes, sesiones, salas, colaboradores]);

    const noLeidas = items.filter((item) => !leidas.includes(item.id)).length;

    const grupos = useMemo(() => {
        const mapa = new Map<GrupoNotificacion, ItemNotificacion[]>();
        for (const item of items) {
            const grupo = clasificarFecha(item.fecha);
            const lista = mapa.get(grupo) ?? [];
            lista.push(item);
            mapa.set(grupo, lista);
        }
        return ORDEN_GRUPOS
            .map((nombre) => ({ nombre, items: mapa.get(nombre) ?? [] }))
            .filter((grupo) => grupo.items.length > 0);
    }, [items]);

    const marcarTodas = () => {
        const ids = items.map((item) => item.id);
        const unidas = Array.from(new Set([...leidas, ...ids]));
        setLeidas(unidas);
        Storage.guardarValor(CLAVE_LEIDAS, unidas);
    };

    const marcarUna = (id: string) => {
        if (leidas.includes(id)) return;
        const unidas = [...leidas, id];
        setLeidas(unidas);
        Storage.guardarValor(CLAVE_LEIDAS, unidas);
    };

    const rolTitulo: Record<string, string> = {
        [ROLES.ADMINISTRADOR]: 'Solicitudes por gestionar',
        [ROLES.COLABORADOR]: 'Mis solicitudes y sesiones',
        [ROLES.CLIENTE]: 'Mis solicitudes',
    };

    return (
        <div className="relative">
            <button
                className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface-2 text-texto transition hover:border-accent/60 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent/50"
                onClick={(evento) => {
                    evento.stopPropagation();
                    setAbierta((previo) => !previo);
                }}
                type="button"
                aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : 'Notificaciones'}
                aria-haspopup="true"
                aria-expanded={abierta}
            >
                {noLeidas > 0 && (
                    <span
                        className="pointer-events-none absolute inset-0 rounded-full bg-accent/40 animate-glow"
                        aria-hidden="true"
                    />
                )}
                <span className="relative transition-transform duration-300 group-hover:-rotate-12">
                    {noLeidas > 0 ? <BellRing size={18} /> : <Bell size={18} />}
                </span>
                {noLeidas > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-magenta px-1 text-[10px] font-bold text-bg shadow-[0_0_12px] shadow-magenta/70">
                        {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                )}
            </button>

            {abierta && (
                <div
                    className="animate-rise absolute right-0 top-11 z-50 w-[22rem] origin-top-right overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/60 backdrop-blur-xl"
                    onClick={(evento) => evento.stopPropagation()}
                    role="dialog"
                    aria-label="Panel de notificaciones"
                >
                    <div className="relative border-b border-border px-4 py-3.5">
                        <div
                            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-accent/15 via-magenta/10 to-transparent"
                            aria-hidden="true"
                        />
                        <div className="relative flex items-center justify-between gap-2">
                            <div>
                                <p className="text-sm font-semibold text-texto">
                                    {rolTitulo[usuario?.rol ?? ''] ?? 'Notificaciones'}
                                </p>
                                <p className="text-[11px] text-sutil">
                                    {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todo al día'}
                                </p>
                            </div>
                            {noLeidas > 0 && (
                                <button
                                    className="flex items-center gap-1 rounded-full border border-border bg-surface-2/70 px-2.5 py-1 text-[11px] font-medium text-sutil transition hover:border-accent/50 hover:text-accent"
                                    onClick={marcarTodas}
                                    type="button"
                                >
                                    <CheckCheck size={13} />
                                    Marcar todas
                                </button>
                            )}
                        </div>
                    </div>

                    {items.length ? (
                        <div className="max-h-[22rem] overflow-y-auto py-1.5">
                            {grupos.map((grupo) => (
                                <section key={grupo.nombre}>
                                    <p className="sticky top-0 z-10 flex items-center gap-2 bg-surface/95 px-4 py-1.5 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-sutil backdrop-blur">
                                        <span className="h-1 w-1 rounded-full bg-accent/70" aria-hidden="true" />
                                        {grupo.nombre}
                                        <span className="ml-auto text-[0.65rem] font-medium normal-case tracking-normal text-sutil/70">
                                            {grupo.items.length}
                                        </span>
                                    </p>
                                    <ul>
                                        {grupo.items.map((item, indice) => {
                                            const Icono = ICONOS[item.icono];
                                            const leida = leidas.includes(item.id);
                                            return (
                                                <li key={item.id}>
                                                    <Link
                                                        className="animate-rise group relative flex items-start gap-3 px-4 py-2.5 transition hover:bg-accent/10"
                                                        to={item.ruta}
                                                        onClick={() => marcarUna(item.id)}
                                                        style={{ animationDelay: `${indice * 35}ms` }}
                                                    >
                                                        <span
                                                            className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b transition-opacity ${leida ? 'opacity-0' : `${BARRAS[item.tono]} opacity-90`}`}
                                                            aria-hidden="true"
                                                        />
                                                        <span
                                                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-gradient-to-br ${ACENTOS[item.tono]} transition group-hover:scale-105`}
                                                            aria-hidden="true"
                                                        >
                                                            <Icono size={16} />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-center gap-2">
                                                                <span className={`truncate text-sm ${leida ? 'font-medium text-sutil' : 'font-semibold text-texto'}`}>
                                                                    {item.titulo}
                                                                </span>
                                                                {!leida && (
                                                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-magenta shadow-[0_0_8px] shadow-magenta/80" aria-hidden="true" />
                                                                )}
                                                            </span>
                                                            <span className="mt-0.5 block truncate text-xs text-sutil">{item.detalle}</span>
                                                        </span>
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-surface-2 text-sutil" aria-hidden="true">
                                <Inbox size={22} />
                            </span>
                            <p className="text-sm font-medium text-texto">Sin novedades por ahora</p>
                            <p className="text-xs text-sutil">Cuando pase algo, lo verás aquí.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
