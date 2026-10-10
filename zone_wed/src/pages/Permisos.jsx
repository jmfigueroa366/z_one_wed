// CAPA: Presentación
import { useEffect, useRef } from 'react';
import anime from 'animejs';
import { Check, ShieldCheck, User, UserCog, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../config/roles.js';
import { PERMISOS, permisosDelRol } from '../config/permisos.js';
import { Contador } from '../components/Animados.jsx';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const ROLES_META = [
    { rol: ROLES.ADMINISTRADOR, etiqueta: 'Administrador', Icono: ShieldCheck, acento: '#f04fa6' },
    { rol: ROLES.COLABORADOR, etiqueta: 'Colaborador', Icono: UserCog, acento: '#a477ff' },
    { rol: ROLES.CLIENTE, etiqueta: 'Cliente', Icono: User, acento: '#9ecbff' },
];

const ETIQUETA_PERMISO = {
    ver_dashboard: 'Ver panel principal',
    ver_agenda: 'Ver agenda',
    ver_solicitudes: 'Ver solicitudes',
    gestionar_permisos: 'Gestionar permisos',
    gestionar_sesiones: 'Gestionar sesiones',
    ver_catalogo: 'Ver catálogo',
    ver_estadisticas: 'Ver estadísticas',
    gestionar_usuarios: 'Gestionar usuarios',
    gestionar_proyectos: 'Gestionar proyectos',
};

const PERMISOS_ORDEN = Object.values(PERMISOS);

export default function Permisos() {
    const { usuario } = useAuth();
    const rolActual = usuario?.rol ?? ROLES.CLIENTE;
    const contenedorRef = useRef(null);

    useEffect(() => {
        const contenedor = contenedorRef.current;
        if (!contenedor || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-fila]'),
            opacity: [0, 1],
            translateX: [-14, 0],
            duration: 460,
            delay: anime.stagger(45),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, []);

    const totalDelRolActual = permisosDelRol(rolActual).length;

    return (
        <main className="workspace-content" data-page="permisos">
            <header className="page-heading border-l-4 border-[#df8b61] pl-4">
                <p className="workspace-eyebrow">CONTROL DE ACCESO</p>
                <h1>Permisos</h1>
                <p>Qué puede hacer cada rol dentro de la aplicación.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-7"
                style={{
                    background:
                        'radial-gradient(ellipse at 90% 8%, rgba(223, 139, 97, 0.22), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#df8b61]/20 blur-3xl" />
                <ShieldCheck aria-hidden="true" className="pointer-events-none absolute right-8 top-1/2 hidden h-40 w-40 -translate-y-1/2 text-white/[0.05] lg:block" />
                <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-xl">
                        <p className="workspace-eyebrow">TU ACCESO</p>
                        <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                            Tu rol abre estas puertas.
                        </h2>
                        <p className="mt-3 text-sm leading-7 text-sutil">
                            Accedes como <span className="font-bold capitalize text-texto-soft">{rolActual}</span>. Cada rol ve y gestiona un conjunto distinto de secciones del estudio.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-texto-soft">
                                <Contador valor={totalDelRolActual} pad={2} />
                            </strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Tus permisos</span>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/25 px-5 py-3 text-center">
                            <strong className="block text-3xl font-black tracking-tight text-accent-soft">
                                <Contador valor={PERMISOS_ORDEN.length} pad={2} />
                            </strong>
                            <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">Permisos totales</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="Roles del sistema">
                {ROLES_META.map(({ rol, etiqueta, Icono, acento }) => {
                    const activo = rol === rolActual;
                    const total = permisosDelRol(rol).length;
                    return (
                        <article
                            key={rol}
                            className="relative overflow-hidden rounded-2xl border bg-surface/60 p-5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
                            style={{ borderColor: activo ? acento : 'var(--color-border, #2d2a45)' }}
                        >
                            <span aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl" style={{ background: `${acento}22` }} />
                            <div className="relative flex items-center justify-between">
                                <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: `linear-gradient(135deg, ${acento}, #7b3fd6)` }}>
                                    <Icono className="h-5 w-5" aria-hidden="true" />
                                </span>
                                {activo && (
                                    <span className="rounded-full border px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-wider" style={{ borderColor: `${acento}80`, background: `${acento}22`, color: acento }}>
                                        Tu rol
                                    </span>
                                )}
                            </div>
                            <h3 className="relative mt-3 text-lg font-bold capitalize text-texto-soft">{etiqueta}</h3>
                            <p className="relative mt-0.5 text-sm text-sutil">
                                {total} permiso{total === 1 ? '' : 's'} concedido{total === 1 ? '' : 's'}
                            </p>
                            <span aria-hidden="true" className="relative mt-3 block h-1 rounded-full" style={{ background: `linear-gradient(90deg, ${acento}, transparent)` }} />
                        </article>
                    );
                })}
            </section>

            <section className="mt-5 rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur sm:p-6" aria-label="Matriz de permisos por rol">
                <div className="mb-5">
                    <p className="workspace-eyebrow">MATRIZ</p>
                    <h2 className="mt-1 text-xl font-bold tracking-tight text-texto-soft">Permisos por rol</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse">
                        <thead>
                            <tr>
                                <th className="border-b border-border px-3.5 py-3 text-left text-xs font-bold uppercase tracking-wider text-sutil">Permiso</th>
                                {ROLES_META.map(({ rol, etiqueta, acento }) => {
                                    const activo = rol === rolActual;
                                    return (
                                        <th
                                            key={rol}
                                            className="border-b border-border px-3.5 py-3 text-center text-xs font-bold uppercase tracking-wider"
                                            style={{ color: activo ? acento : 'var(--color-sutil, #a69ebd)' }}
                                        >
                                            {etiqueta}
                                            {activo && <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle" style={{ background: acento }} />}
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody ref={contenedorRef}>
                            {PERMISOS_ORDEN.map((permiso) => (
                                <tr key={permiso} data-fila className="border-b border-border/60 transition hover:bg-white/[0.03] last:border-0">
                                    <td className="px-3.5 py-3 font-semibold text-texto-soft">{ETIQUETA_PERMISO[permiso] ?? permiso}</td>
                                    {ROLES_META.map(({ rol, acento }) => {
                                        const tiene = permisosDelRol(rol).includes(permiso);
                                        const activo = rol === rolActual;
                                        return (
                                            <td key={`${rol}-${permiso}`} className="px-3.5 py-3 text-center" style={activo ? { background: `${acento}0f` } : undefined}>
                                                {tiene ? (
                                                    <span className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-exito/40 bg-exito/10 text-exito" title="Permitido">
                                                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                                        <span className="sr-only">Permitido</span>
                                                    </span>
                                                ) : (
                                                    <span className="mx-auto grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-sutil/60" title="No permitido">
                                                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                                                        <span className="sr-only">No permitido</span>
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
