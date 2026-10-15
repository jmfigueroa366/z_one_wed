// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { BadgeCheck, CheckCircle2, Clock, Coins, FileText, Receipt, Sparkles, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useOrdenes } from '../hooks/useOrdenes.js';
import { useSpotlight } from '../hooks/useSpotlight.js';
import { Contador, FondoHero } from '../components/Animados.jsx';
import FacturaImprimible from '../components/FacturaImprimible.jsx';
import { OrdenService } from '../services/ordenService.js';
import { ProyectoService } from '../services/proyectoService.js';
import { CancionService } from '../services/cancionService.js';
import { ConfiguracionService } from '../services/configuracionService.js';
import { usuarioRepo } from '../repositories/usuarioRepo.js';
import { METODOS_PAGO, ETIQUETAS_METODO } from '../models/Orden.js';
import { ROLES } from '../config/roles.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO, BOTON_PELIGRO, CAMPO, ETIQUETA } from '../styles/clases.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TARJETA = 'tarjeta-brillo relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-6 backdrop-blur transition duration-300 hover:border-accent/40';

const PILL =
    'inline-flex items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-bold capitalize';

const ESTADO_META = {
    borrador: { etiqueta: 'Borrador', clase: 'border-border bg-surface-3 text-sutil', acento: '#8b849c', Icono: Receipt },
    facturada: { etiqueta: 'Por pagar', clase: 'border-aviso/25 bg-aviso/10 text-aviso-soft', acento: '#f0b24f', Icono: Clock },
    parcial: { etiqueta: 'Pago parcial', clase: 'border-aviso/25 bg-aviso/10 text-aviso-soft', acento: '#f0b24f', Icono: Clock },
    pagada: { etiqueta: 'Pagada', clase: 'border-exito/25 bg-exito/10 text-exito-soft', acento: '#5fce9c', Icono: CheckCircle2 },
    cancelada: { etiqueta: 'Cancelada', clase: 'border-peligro/25 bg-peligro/10 text-peligro-soft', acento: '#e2687d', Icono: X },
};

const metaEstado = (estado) => ESTADO_META[estado] ?? ESTADO_META.borrador;

const ESTADOS_FILTRO = ['borrador', 'facturada', 'parcial', 'pagada', 'cancelada'];

function MonedaContador({ valor }) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const objetivo = Number(valor) || 0;
        if (MENOS_MOVIMIENTO()) {
            el.textContent = formatearMoneda(objetivo);
            return undefined;
        }
        const estado = { actual: 0 };
        const animacion = anime({
            targets: estado,
            actual: objetivo,
            round: 1,
            duration: 1200,
            easing: 'easeOutExpo',
            update() {
                el.textContent = formatearMoneda(estado.actual);
            },
        });
        return () => animacion.pause();
    }, [valor]);

    return <span ref={ref}>{formatearMoneda(valor)}</span>;
}

function Fila({ etiqueta, valor, negativo = false, fuerte = false }) {
    return (
        <div className={`flex items-center justify-between gap-4 ${fuerte ? 'border-t border-border/50 pt-2' : ''}`}>
            <span className={`text-xs ${fuerte ? 'font-bold text-texto-soft' : 'text-sutil'}`}>{etiqueta}</span>
            <span className={`tabular-nums ${fuerte ? 'text-sm font-bold text-texto-soft' : 'text-xs text-texto'}`}>
                {negativo && valor > 0 ? '-' : ''}{formatearMoneda(valor)}
            </span>
        </div>
    );
}

function Desglose({ orden }) {
    const d = orden.desglose ?? {};
    const det = orden.detalle ?? {};
    const filas = [];

    filas.push(
        <Fila
            key="produccion"
            etiqueta={`Producción${d.horasProduccion ? ` · ${d.horasProduccion} h` : ''}${det.tarifaProduccion ? ` × ${formatearMoneda(det.tarifaProduccion)}` : ''}`}
            valor={d.subtotalProduccion ?? 0}
        />
    );
    if ((d.descuento ?? 0) > 0) {
        filas.push(
            <Fila
                key="descuento"
                etiqueta={`Descuento álbum (${Math.round((det.descuentoPorcentaje ?? 0) * 100)}%)`}
                valor={d.descuento}
                negativo
            />
        );
    }
    if ((d.subtotalEnsayo ?? 0) > 0) {
        filas.push(
            <Fila key="ensayo" etiqueta={`Sala de ensayo${d.horasEnsayo ? ` · ${d.horasEnsayo} h` : ''}`} valor={d.subtotalEnsayo} />
        );
    }
    filas.push(<Fila key="total" etiqueta="Total" valor={orden.total} fuerte />);

    return (
        <div className="rounded-2xl border border-border/60 bg-black/20 p-4">
            <p className="mb-3 flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-sutil">
                <Receipt className="h-3.5 w-3.5" aria-hidden="true" /> Desglose
            </p>
            <div className="grid gap-2">{filas}</div>
        </div>
    );
}

const TONO_TOTALES = {
    anticipo: 'border-accent/25 bg-accent/[0.07] text-accent-soft',
    pagado: 'border-exito/25 bg-exito/[0.07] text-exito-soft',
    saldo: 'border-aviso/25 bg-aviso/[0.07] text-aviso-soft',
    favor: 'border-accent/25 bg-accent/[0.07] text-accent-soft',
    cargo: 'border-peligro/25 bg-peligro/[0.07] text-peligro-soft',
};

function TotalesOrden({ orden }) {
    const celdas = [
        orden.anticipo > 0 && { clave: 'anticipo', etiqueta: 'Anticipo requerido', valor: orden.anticipo },
        orden.pagado > 0 && { clave: 'pagado', etiqueta: 'Pagado', valor: orden.pagado },
        { clave: 'saldo', etiqueta: 'Saldo pendiente', valor: Math.max(0, orden.saldo) },
        orden.saldo_favor > 0 && { clave: 'favor', etiqueta: 'Saldo a favor', valor: orden.saldo_favor },
        orden.cargo_cancelacion > 0 && { clave: 'cargo', etiqueta: 'Cargo por cancelación', valor: orden.cargo_cancelacion },
    ].filter(Boolean);

    return (
        <div className="rounded-2xl border border-border/60 bg-black/20 p-4">
            <p className="mb-3 flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-sutil">
                <Wallet className="h-3.5 w-3.5" aria-hidden="true" /> Resumen de cuenta
            </p>
            <div className="grid gap-2">
                {celdas.map((celda) => (
                    <div key={celda.clave} className="flex items-center justify-between gap-4">
                        <span className="text-xs text-sutil">{celda.etiqueta}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums ${TONO_TOTALES[celda.clave]}`}>
                            {formatearMoneda(celda.valor)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HistorialPagos({ orden }) {
    if (!orden.pagos?.length) return null;
    return (
        <div className="rounded-2xl border border-exito/20 bg-exito/[0.04] p-4">
            <p className="mb-3 flex items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-exito-soft">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Pagos registrados
            </p>
            <div className="flex flex-wrap gap-2">
                {orden.pagos.map((pago, indice) => (
                    <span
                        key={pago.id ?? indice}
                        className="inline-flex items-center gap-1.5 rounded-full border border-exito/25 bg-exito/10 px-2.5 py-1 text-[0.68rem] font-semibold text-exito-soft"
                    >
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                        {formatearMoneda(pago.monto)} · {ETIQUETAS_METODO[pago.metodo] ?? pago.metodo} · {formatearFecha(pago.fecha)}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function Pagos() {
    const { usuario } = useAuth();
    const esAdmin = usuario?.rol === ROLES.ADMINISTRADOR;
    const [ordenes] = useOrdenes(usuario);

    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');
    const listaRef = useRef(null);
    const contenedorRef = useRef(null);
    const [heroRef, seguirSpotlight] = useSpotlight();

    const [pagoAbierto, setPagoAbierto] = useState(null);
    const [montoPago, setMontoPago] = useState('');
    const [metodoPago, setMetodoPago] = useState(METODOS_PAGO.EFECTIVO);

    const [cancelarAbierto, setCancelarAbierto] = useState(null);
    const [horasAnticipacion, setHorasAnticipacion] = useState('');

    const [filtroEstado, setFiltroEstado] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');

    const [proyectoEmision, setProyectoEmision] = useState('');
    const [cancionEmision, setCancionEmision] = useState('');

    const [facturaAbierta, setFacturaAbierta] = useState(null);

    const proyectos = useMemo(() => ProyectoService.listar(), [ordenes]);
    const canciones = useMemo(() => CancionService.listar(), [ordenes]);
    const usuarios = useMemo(() => (esAdmin ? usuarioRepo.listar() : []), [esAdmin]);
    const configuracion = useMemo(() => ConfiguracionService.obtener(), []);

    const nombreCliente = (id) => usuarios.find((u) => String(u.id) === String(id))?.nombre ?? `Cliente #${id}`;
    const proyectoDe = (id) => proyectos.find((p) => String(p.id) === String(id))?.nombre ?? '';
    const clienteDe = (id) => usuarioRepo.obtenerPorId(id) ?? usuario;
    const cancionDe = (id) => canciones.find((c) => String(c.id) === String(id))?.nombre ?? '';

    const cancionesDelProyecto = useMemo(
        () => canciones.filter((c) => String(c.proyecto_id) === String(proyectoEmision)),
        [canciones, proyectoEmision]
    );

    const resumen = useMemo(
        () => ordenes.reduce(
            (acc, orden) => {
                if (orden.estado === 'cancelada') return acc;
                acc.facturado += orden.total;
                acc.pagado += orden.pagado;
                acc.porPagar += Math.max(0, orden.saldo);
                acc.saldoFavor += orden.saldo_favor;
                acc.total += 1;
                if (['facturada', 'parcial'].includes(orden.estado)) acc.pendientes += 1;
                if (orden.estado === 'pagada') acc.pagadas += 1;
                return acc;
            },
            { facturado: 0, pagado: 0, porPagar: 0, saldoFavor: 0, total: 0, pendientes: 0, pagadas: 0 }
        ),
        [ordenes]
    );

    const filtradas = useMemo(
        () => ordenes.filter((orden) => {
            if (filtroEstado && orden.estado !== filtroEstado) return false;
            if (filtroCliente && String(orden.usuario_id) !== String(filtroCliente)) return false;
            return true;
        }),
        [ordenes, filtroEstado, filtroCliente]
    );

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = contenedorRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-tile]'),
            opacity: [0, 1],
            translateY: [26, 0],
            duration: 640,
            delay: anime.stagger(80),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [resumen]);

    useEffect(() => {
        if (MENOS_MOVIMIENTO()) return undefined;
        const contenedor = listaRef.current;
        if (!contenedor) return undefined;
        const animacion = anime({
            targets: contenedor.querySelectorAll('[data-orden]'),
            opacity: [0, 1],
            translateY: [18, 0],
            duration: 420,
            delay: anime.stagger(55),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [filtradas]);

    const avisar = (ok, no) => {
        setMensaje(ok || '');
        setError(no || '');
    };

    const abrirPago = (orden) => {
        avisar('', '');
        setCancelarAbierto(null);
        setPagoAbierto(orden.id);
        setMontoPago(String(Math.max(0, orden.saldo)));
        setMetodoPago(METODOS_PAGO.EFECTIVO);
    };

    const confirmarPago = (orden) => {
        avisar('', '');
        try {
            OrdenService.pagar(orden.id, { usuario, rol: usuario?.rol, monto: Number(montoPago), metodo: metodoPago });
            setPagoAbierto(null);
            setMensaje('Pago registrado correctamente.');
        } catch (errorPago) {
            setError(errorPago instanceof Error ? errorPago.message : 'No se pudo registrar el pago.');
        }
    };

    const confirmarCancelacion = (orden) => {
        avisar('', '');
        try {
            OrdenService.cancelar(orden.id, {
                usuario,
                rol: usuario?.rol,
                horasAnticipacion: Number(horasAnticipacion) || 0,
            });
            setCancelarAbierto(null);
            setMensaje('Factura cancelada.');
        } catch (errorCancelar) {
            setError(errorCancelar instanceof Error ? errorCancelar.message : 'No se pudo cancelar.');
        }
    };

    const emitir = () => {
        avisar('', '');
        try {
            if (!cancionEmision && !proyectoEmision) {
                setError('Selecciona un proyecto o una canción.');
                return;
            }
            const data = cancionEmision ? { cancion_id: Number(cancionEmision) } : { proyecto_id: Number(proyectoEmision) };
            OrdenService.emitir(data, { rol: usuario?.rol });
            setMensaje('Factura emitida.');
            setCancionEmision('');
        } catch (errorEmitir) {
            setError(errorEmitir instanceof Error ? errorEmitir.message : 'No se pudo emitir la factura.');
        }
    };

    const metricasHero = [
        { etiqueta: 'Facturas', valor: resumen.total },
        { etiqueta: 'Pendientes', valor: resumen.pendientes },
        { etiqueta: 'Pagadas', valor: resumen.pagadas },
    ];

    const tarjetas = [
        { etiqueta: 'Total facturado', valor: resumen.facturado, nota: 'Servicios del estudio', Icono: Receipt, tono: 'from-[#9365f2] to-[#6f4bbb]' },
        { etiqueta: 'Por pagar', valor: resumen.porPagar, nota: 'Saldo pendiente', Icono: Clock, tono: 'from-[#f0b24f] to-[#c98a2f]' },
        { etiqueta: 'Pagado', valor: resumen.pagado, nota: 'Recaudado', Icono: Wallet, tono: 'from-[#7be0b0] to-[#3fae82]' },
        { etiqueta: 'Saldo a favor', valor: resumen.saldoFavor, nota: 'Crédito disponible', Icono: Coins, tono: 'from-[#f04fa6] to-[#b1306f]' },
    ];

    return (
        <main className="workspace-content" data-page="pagos">
            <header className="page-heading relative border-l-4 border-accent pl-4">
                <div aria-hidden="true" className="pointer-events-none absolute -top-20 right-24 h-52 w-52 animate-aurora rounded-full bg-[#e34ba6]/15 blur-3xl" />
                <p className="workspace-eyebrow">FACTURACIÓN · ESTUDIO</p>
                <h1>{esAdmin ? 'Facturación' : 'Mis pagos'}</h1>
                <p>{esAdmin ? 'Emite, controla y registra los pagos de todos los clientes del estudio.' : 'Revisa el desglose de tus sesiones y registra tus pagos.'}</p>
            </header>

            {mensaje && <p className="mt-5 rounded-xl border border-exito/30 bg-exito/10 px-4 py-3 text-sm text-exito-soft" role="status">{mensaje}</p>}
            {error && <p className="mt-5 rounded-xl border border-peligro/30 bg-peligro/10 px-4 py-3 text-sm text-peligro-soft" role="alert">{error}</p>}

            <div ref={contenedorRef} className="mt-6 grid gap-5">
                <section
                    data-tile
                    ref={heroRef}
                    onMouseMove={seguirSpotlight}
                    className="group/hero relative overflow-hidden rounded-[2.25rem] border border-accent/25 p-6 sm:p-8"
                    style={{
                        background:
                            'radial-gradient(ellipse at 88% 4%, rgba(240, 79, 166, 0.3), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.36), rgba(23, 19, 34, 0.97) 72%)',
                    }}
                >
                    <FondoHero acento="#e34ba6" />
                    <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-24 h-64 w-64 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                    <div aria-hidden="true" className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none text-[11rem] font-black leading-none tracking-tighter text-white/[0.04] lg:block">
                        $
                    </div>
                    <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 rounded-full border border-accent-soft/40 bg-accent/10 px-3 py-1 text-xs font-bold text-accent-soft">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                                {esAdmin ? 'Panel de cobro' : 'Estado de cuenta'}
                            </span>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-texto-soft sm:text-4xl">
                                {esAdmin ? 'El dinero, ' : 'Tus pagos, '}<span className="texto-degradado">{esAdmin ? 'bajo control.' : 'en orden.'}</span>
                            </h2>
                            <p className="mt-3 text-sm leading-7 text-sutil">
                                {esAdmin
                                    ? 'Anticipos, saldos y cancelaciones de cada cliente en una sola lectura.'
                                    : 'Anticipos, saldos y el desglose de cada sesión, claros y siempre a mano.'}
                            </p>
                            <div className="mt-5 inline-flex items-baseline gap-3 rounded-2xl border border-white/10 bg-black/25 px-5 py-3">
                                <span className="text-xs font-bold uppercase tracking-[0.12em] text-sutil">Facturado</span>
                                <strong className="text-3xl font-black tracking-tight text-texto-soft">
                                    <MonedaContador valor={resumen.facturado} />
                                </strong>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {metricasHero.map((metrica) => (
                                <div key={metrica.etiqueta} className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
                                    <strong className="block text-2xl font-black tracking-tight text-texto-soft">
                                        <Contador valor={metrica.valor} pad={2} />
                                    </strong>
                                    <span className="mt-1 block text-[0.62rem] font-bold uppercase tracking-[0.12em] text-sutil">{metrica.etiqueta}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Resumen de facturación">
                    {tarjetas.map((item) => {
                        const Icono = item.Icono;
                        return (
                            <article key={item.etiqueta} data-tile className={`${TARJETA} group hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40`}>
                                <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#9365f2]/20 blur-2xl transition duration-300 group-hover:bg-[#e34ba6]/30" />
                                <div className="relative flex items-center justify-between">
                                    <span className="text-sm text-sutil">{item.etiqueta}</span>
                                    <span className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${item.tono} text-white shadow-lg`}>
                                        <Icono className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                </div>
                                <strong className="relative mt-3 block text-2xl font-extrabold tracking-tight text-texto-soft sm:text-3xl">
                                    <MonedaContador valor={item.valor} />
                                </strong>
                                <span className="relative mt-1 block text-xs text-sutil/80">{item.nota}</span>
                                <span aria-hidden="true" className="relative mt-3 block h-1 rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] opacity-70" />
                            </article>
                        );
                    })}
                </section>

                {esAdmin && (
                    <section data-tile className={TARJETA} aria-label="Emitir factura">
                        <div className="mb-4">
                            <p className="workspace-eyebrow">NUEVA FACTURA</p>
                            <h2 className="mt-1 text-lg font-bold tracking-tight text-texto-soft">Emitir desde proyecto o canción</h2>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Proyecto</span>
                                <select className={CAMPO} value={proyectoEmision} onChange={(e) => { setProyectoEmision(e.target.value); setCancionEmision(''); }}>
                                    <option value="">Selecciona un proyecto</option>
                                    {proyectos.map((p) => (
                                        <option key={p.id} value={p.id}>{p.nombre} · {nombreCliente(p.usuario_id)}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Canción (opcional)</span>
                                <select className={CAMPO} value={cancionEmision} onChange={(e) => setCancionEmision(e.target.value)} disabled={!proyectoEmision}>
                                    <option value="">Todo el proyecto</option>
                                    {cancionesDelProyecto.map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </label>
                            <div className="flex items-end">
                                <button className={BOTON_PRIMARIO} type="button" onClick={emitir}>Emitir</button>
                            </div>
                        </div>
                    </section>
                )}

                <section aria-labelledby="facturas-title">
                    <div data-tile className="mb-5 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="workspace-eyebrow">HISTORIAL</p>
                            <h2 id="facturas-title" className="mt-1 text-2xl font-bold tracking-tight text-texto-soft">{esAdmin ? 'Facturas emitidas' : 'Tus facturas'}</h2>
                        </div>
                        <span className="rounded-full border border-accent-soft/30 px-3 py-1.5 text-[0.68rem] font-extrabold tracking-[0.1em] text-accent-soft">
                            {String(filtradas.length).padStart(2, '0')} REGISTRADAS
                        </span>
                    </div>

                    {esAdmin && (
                        <div data-tile className="mb-5 grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Filtrar por estado</span>
                                <select className={CAMPO} value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                                    <option value="">Todos los estados</option>
                                    {ESTADOS_FILTRO.map((estado) => (
                                        <option key={estado} value={estado}>{metaEstado(estado).etiqueta}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="flex flex-col">
                                <span className={ETIQUETA}>Filtrar por cliente</span>
                                <select className={CAMPO} value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)}>
                                    <option value="">Todos los clientes</option>
                                    {usuarios.filter((u) => u.rol === ROLES.CLIENTE).map((u) => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    )}

                    {filtradas.length ? (
                        <div ref={listaRef} className="grid gap-4">
                            {filtradas.map((orden) => {
                                const meta = metaEstado(orden.estado);
                                const Icono = meta.Icono;
                                const puedePagar = ['facturada', 'parcial'].includes(orden.estado);
                                return (
                                    <article
                                        key={orden.id}
                                        data-orden
                                        className="tarjeta-brillo group relative overflow-hidden rounded-[2rem] border border-border bg-surface/60 p-5 backdrop-blur transition duration-300 hover:border-accent/40 sm:p-6"
                                    >
                                        <span
                                            aria-hidden="true"
                                            className="pointer-events-none absolute inset-0"
                                            style={{ background: `radial-gradient(220px circle at 100% 0%, ${meta.acento}26, transparent 68%)` }}
                                        />
                                        <div className="relative flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex min-w-0 items-start gap-4">
                                                <span
                                                    className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg"
                                                    style={{ background: `linear-gradient(135deg, ${meta.acento}, #e34ba6)` }}
                                                    aria-hidden="true"
                                                >
                                                    <Icono className="h-5 w-5" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[0.64rem] font-bold uppercase tracking-[0.14em] text-sutil">
                                                        {orden.numero || 'Sin número'} · {formatearFecha(orden.fecha_emision) || 'Sin fecha'}
                                                    </p>
                                                    <h3 className="mt-1 truncate text-lg font-bold tracking-tight text-texto-soft">{orden.descripcion || 'Servicio de estudio'}</h3>
                                                    {esAdmin && (
                                                        <p className="mt-0.5 truncate text-xs text-sutil">
                                                            {nombreCliente(orden.usuario_id)}{orden.proyecto_id ? ` · ${proyectoDe(orden.proyecto_id)}` : ''}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <span className={`${PILL} ${meta.clase}`}>{meta.etiqueta}</span>
                                                <strong className="text-2xl font-black tracking-tight text-texto-soft">{formatearMoneda(orden.total)}</strong>
                                                {puedePagar && <span className="text-xs text-sutil">Saldo {formatearMoneda(Math.max(0, orden.saldo))}</span>}
                                            </div>
                                        </div>

                                        <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                                            <Desglose orden={orden} />
                                            <div className="grid content-start gap-3">
                                                <TotalesOrden orden={orden} />
                                                <HistorialPagos orden={orden} />
                                            </div>
                                        </div>

                                        <div className="relative mt-5 flex flex-wrap items-center justify-end gap-2 border-t border-border/40 pt-4">
                                            <button className={BOTON_SECUNDARIO} type="button" onClick={() => setFacturaAbierta(orden)}>
                                                <FileText className="mr-2 h-4 w-4" aria-hidden="true" /> Ver factura
                                            </button>
                                            {puedePagar && pagoAbierto !== orden.id && (
                                                <button className={BOTON_PRIMARIO} type="button" onClick={() => abrirPago(orden)}>
                                                    <Wallet className="mr-2 h-4 w-4" aria-hidden="true" /> {esAdmin ? 'Registrar pago' : 'Pagar'}
                                                </button>
                                            )}
                                            {esAdmin && puedePagar && cancelarAbierto !== orden.id && (
                                                <button className={BOTON_PELIGRO} type="button" onClick={() => { avisar('', ''); setPagoAbierto(null); setCancelarAbierto(orden.id); setHorasAnticipacion(String(configuracion.cancelacionHorasGratis)); }}>
                                                    Cancelar
                                                </button>
                                            )}
                                            {orden.estado === 'cancelada' && (
                                                <span className="text-xs text-sutil">Cancelada el {formatearFecha(orden.fecha_cancelacion) || '—'}</span>
                                            )}
                                        </div>

                                        {pagoAbierto === orden.id && (
                                            <div className="relative mt-4 grid gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:grid-cols-[140px_1fr_auto_auto]">
                                                <label className="flex flex-col">
                                                    <span className={ETIQUETA}>Monto</span>
                                                    <input className={CAMPO} type="number" min="1" max={orden.saldo} value={montoPago} onChange={(e) => setMontoPago(e.target.value)} />
                                                </label>
                                                <label className="flex flex-col">
                                                    <span className={ETIQUETA}>Método</span>
                                                    <select className={CAMPO} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                                                        {Object.values(METODOS_PAGO).map((m) => (
                                                            <option key={m} value={m}>{ETIQUETAS_METODO[m]}</option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <div className="flex items-end">
                                                    <button className={BOTON_PRIMARIO} type="button" onClick={() => confirmarPago(orden)}>Confirmar</button>
                                                </div>
                                                <div className="flex items-end">
                                                    <button className={BOTON_SECUNDARIO} type="button" onClick={() => setPagoAbierto(null)} aria-label="Cerrar">
                                                        <X className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {cancelarAbierto === orden.id && (
                                            <div className="relative mt-4 grid gap-3 rounded-2xl border border-peligro/30 bg-peligro/5 p-4 sm:grid-cols-[180px_auto_auto]">
                                                <label className="flex flex-col">
                                                    <span className={ETIQUETA}>Horas de anticipación</span>
                                                    <input className={CAMPO} type="number" min="0" value={horasAnticipacion} onChange={(e) => setHorasAnticipacion(e.target.value)} />
                                                </label>
                                                <div className="flex items-end">
                                                    <button className={BOTON_PELIGRO} type="button" onClick={() => confirmarCancelacion(orden)}>Cancelar factura</button>
                                                </div>
                                                <div className="flex items-end">
                                                    <button className={BOTON_SECUNDARIO} type="button" onClick={() => setCancelarAbierto(null)} aria-label="Cerrar">
                                                        <X className="h-4 w-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-sutil sm:col-span-3">
                                                    Con {configuracion.cancelacionHorasGratis} h o más no hay cargo; con menos, se aplica el {Math.round(configuracion.cancelacionPorcentaje * 100)}% del estimado.
                                                </p>
                                            </div>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="rounded-2xl border border-dashed border-border bg-surface/40 px-4 py-10 text-center text-sm text-sutil">
                            {esAdmin ? 'No hay facturas que coincidan con el filtro.' : 'Aún no tienes facturas. Cuando reserves una sesión aparecerán aquí.'}
                        </p>
                    )}
                </section>
            </div>

            {facturaAbierta && (
                <FacturaImprimible
                    orden={facturaAbierta}
                    cliente={clienteDe(facturaAbierta.usuario_id)}
                    proyecto={proyectoDe(facturaAbierta.proyecto_id)}
                    cancion={cancionDe(facturaAbierta.cancion_id)}
                    onCerrar={() => setFacturaAbierta(null)}
                />
            )}
        </main>
    );
}
