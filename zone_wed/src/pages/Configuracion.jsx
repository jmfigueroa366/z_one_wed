// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../config/roles.js';
import { Contador } from '../components/Animados.jsx';
import { CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ETIQUETA_ROL = {
    [ROLES.ADMINISTRADOR]: 'Administrador',
    [ROLES.COLABORADOR]: 'Colaborador',
    [ROLES.COORDINADOR]: 'Coordinador',
    [ROLES.CLIENTE]: 'Cliente',
};

const PREFERENCIAS_INICIALES = {
    notificacionesCorreo: true,
    alertasSesiones: true,
    resumenSemanal: false,
    idioma: 'es',
    acento: 'violeta',
};

function iniciales(nombre = '') {
    return nombre
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase() || 'ZN';
}

function Interruptor({ activo, onCambiar, etiqueta, descripcion }) {
    return (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-white/[0.02] px-4 py-3.5">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-texto">{etiqueta}</p>
                <p className="mt-0.5 text-xs text-sutil">{descripcion}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={activo}
                aria-label={etiqueta}
                onClick={() => onCambiar(!activo)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition ${
                    activo ? 'border-accent/60 bg-gradient-to-r from-[#9365f2] to-[#e34ba6]' : 'border-border bg-surface-3'
                }`}
            >
                <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${activo ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
}

export default function Configuracion() {
    const { usuario } = useAuth();
    const [preferencias, setPreferencias] = useState(PREFERENCIAS_INICIALES);
    const [seguridad, setSeguridad] = useState({ actual: '', nueva: '', confirmar: '' });
    const [aviso, setAviso] = useState('');
    const contenedorRef = useRef(null);

    const preferenciasActivas = [preferencias.notificacionesCorreo, preferencias.alertasSesiones, preferencias.resumenSemanal].filter(Boolean).length;

    useEffect(() => {
        const contenedor = contenedorRef.current;
        if (!contenedor || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tarjeta]'),
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 560,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, []);

    const cambiarPreferencia = (clave, valor) => {
        setPreferencias((actuales) => ({ ...actuales, [clave]: valor }));
        setAviso('Preferencias actualizadas.');
    };

    const manejarSeguridad = (evento) => {
        evento.preventDefault();
        setSeguridad({ actual: '', nueva: '', confirmar: '' });
        setAviso('Solicitud de cambio de contraseña registrada.');
    };

    return (
        <main className="workspace-content" data-page="configuracion">
            <header className="page-heading border-l-4 border-[#9ba8c8] pl-4">
                <p className="workspace-eyebrow">CONFIGURACIÓN</p>
                <h1>Ajustes de la cuenta</h1>
                <p>Administra tu perfil, tus preferencias y la seguridad de tu cuenta en Z-ONE.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-7"
                style={{
                    background:
                        'radial-gradient(ellipse at 90% 8%, rgba(227, 75, 166, 0.24), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/20 blur-3xl" />
                <ShieldCheck aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-white/[0.05] lg:block" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xl font-black text-white shadow-lg shadow-accent/25">
                            {iniciales(usuario?.nombre)}
                        </span>
                        <div className="min-w-0">
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> TU CUENTA
                            </p>
                            <h2 className="mt-1 truncate text-2xl font-extrabold tracking-tight text-texto-soft">{usuario?.nombre ?? 'Usuario'}</h2>
                            <p className="truncate text-sm text-sutil">{usuario?.correo ?? 'sin correo'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft"><Contador valor={preferenciasActivas} pad={2} /></strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Preferencias</span>
                        </div>
                        <span className="inline-flex w-fit rounded-full border border-accent-soft/30 bg-accent-soft/10 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-accent-soft">
                            {ETIQUETA_ROL[usuario?.rol] ?? 'Usuario'}
                        </span>
                    </div>
                </div>
            </section>

            {aviso && (
                <p className="mt-4 max-w-3xl rounded-2xl border border-exito/25 bg-exito/10 px-4 py-3 text-sm font-semibold text-exito-soft">
                    {aviso}
                </p>
            )}

            <section ref={contenedorRef} className="mt-6 grid gap-5 lg:grid-cols-2">
                <article data-tarjeta className="rounded-3xl border border-border bg-surface/70 p-6 lg:col-span-2">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-xl font-black text-white">
                            {iniciales(usuario?.nombre)}
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-texto-soft">{usuario?.nombre ?? 'Usuario'}</h2>
                            <p className="text-sm text-sutil">{usuario?.correo ?? 'sin correo'}</p>
                        </div>
                        <span className="sm:ml-auto inline-flex w-fit rounded-full border border-accent-soft/30 bg-accent-soft/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent-soft">
                            {ETIQUETA_ROL[usuario?.rol] ?? 'Usuario'}
                        </span>
                    </div>
                </article>

                <article data-tarjeta className="rounded-3xl border border-border bg-surface/70 p-6">
                    <h2 className="text-base font-bold text-texto-soft">Datos del perfil</h2>
                    <p className="mt-1 text-xs text-sutil">Información asociada a tu cuenta.</p>
                    <div className="mt-5 grid gap-4">
                        <label className={ETIQUETA}>
                            Nombre
                            <input className={`${CAMPO} mt-1.5`} type="text" defaultValue={usuario?.nombre ?? ''} readOnly />
                        </label>
                        <label className={ETIQUETA}>
                            Correo electrónico
                            <input className={`${CAMPO} mt-1.5`} type="email" defaultValue={usuario?.correo ?? ''} readOnly />
                        </label>
                    </div>
                </article>

                <article data-tarjeta className="rounded-3xl border border-border bg-surface/70 p-6">
                    <h2 className="text-base font-bold text-texto-soft">Seguridad</h2>
                    <p className="mt-1 text-xs text-sutil">Actualiza tu contraseña periódicamente.</p>
                    <form className="mt-5 grid gap-4" onSubmit={manejarSeguridad}>
                        <label className={ETIQUETA}>
                            Contraseña actual
                            <input
                                className={`${CAMPO} mt-1.5`}
                                type="password"
                                value={seguridad.actual}
                                onChange={(evento) => setSeguridad((actual) => ({ ...actual, actual: evento.target.value }))}
                                autoComplete="current-password"
                            />
                        </label>
                        <label className={ETIQUETA}>
                            Nueva contraseña
                            <input
                                className={`${CAMPO} mt-1.5`}
                                type="password"
                                value={seguridad.nueva}
                                onChange={(evento) => setSeguridad((actual) => ({ ...actual, nueva: evento.target.value }))}
                                autoComplete="new-password"
                            />
                        </label>
                        <label className={ETIQUETA}>
                            Confirmar contraseña
                            <input
                                className={`${CAMPO} mt-1.5`}
                                type="password"
                                value={seguridad.confirmar}
                                onChange={(evento) => setSeguridad((actual) => ({ ...actual, confirmar: evento.target.value }))}
                                autoComplete="new-password"
                            />
                        </label>
                        <button
                            type="submit"
                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:brightness-110"
                        >
                            Guardar cambios
                        </button>
                    </form>
                </article>

                <article data-tarjeta className="rounded-3xl border border-border bg-surface/70 p-6 lg:col-span-2">
                    <h2 className="text-base font-bold text-texto-soft">Preferencias</h2>
                    <p className="mt-1 text-xs text-sutil">Personaliza cómo Z-ONE se comunica contigo.</p>
                    <div className="mt-5 grid gap-3 lg:grid-cols-2">
                        <Interruptor
                            activo={preferencias.notificacionesCorreo}
                            onCambiar={(valor) => cambiarPreferencia('notificacionesCorreo', valor)}
                            etiqueta="Notificaciones por correo"
                            descripcion="Recibe avisos de solicitudes y sesiones."
                        />
                        <Interruptor
                            activo={preferencias.alertasSesiones}
                            onCambiar={(valor) => cambiarPreferencia('alertasSesiones', valor)}
                            etiqueta="Alertas de sesiones"
                            descripcion="Avisos antes de cada sesión programada."
                        />
                        <Interruptor
                            activo={preferencias.resumenSemanal}
                            onCambiar={(valor) => cambiarPreferencia('resumenSemanal', valor)}
                            etiqueta="Resumen semanal"
                            descripcion="Recibe un resumen de actividad cada semana."
                        />
                        <div className="grid gap-3 rounded-2xl border border-border bg-white/[0.02] px-4 py-3.5 sm:grid-cols-2">
                            <label className={`${ETIQUETA} mb-0`}>
                                Idioma
                                <select
                                    className={`${CAMPO} mt-1.5`}
                                    value={preferencias.idioma}
                                    onChange={(evento) => cambiarPreferencia('idioma', evento.target.value)}
                                >
                                    <option value="es">Español</option>
                                    <option value="en">English</option>
                                </select>
                            </label>
                            <label className={`${ETIQUETA} mb-0`}>
                                Color de acento
                                <select
                                    className={`${CAMPO} mt-1.5`}
                                    value={preferencias.acento}
                                    onChange={(evento) => cambiarPreferencia('acento', evento.target.value)}
                                >
                                    <option value="violeta">Violeta</option>
                                    <option value="magenta">Magenta</option>
                                    <option value="azul">Azul</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </article>
            </section>
        </main>
    );
}
