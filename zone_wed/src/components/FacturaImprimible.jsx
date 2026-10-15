// CAPA: Presentación
import { useEffect } from 'react';
import { Printer, X } from 'lucide-react';
import { ETIQUETAS_METODO } from '../models/Orden.js';
import { formatearFecha, formatearMoneda } from '../utils/helpers.js';
import { BOTON_PRIMARIO, BOTON_SECUNDARIO } from '../styles/clases.js';
import '../styles/tailwind.css';

const ESTUDIO = {
    nombre: 'Z-ONE Estudio',
    detalle: ['NIT 901.245.880-3', 'Cra. 15 #84-12, Bogotá', 'Tel. (+57) 601 745 22 90', 'facturacion@z-one.com'],
};

const ESTADO_TEXTO = {
    borrador: 'Borrador',
    facturada: 'Por pagar',
    parcial: 'Pago parcial',
    pagada: 'Pagada',
    cancelada: 'Cancelada',
};

function diasVencimiento(fechaEmision, dias = 15) {
    const base = fechaEmision ? new Date(fechaEmision) : new Date();
    if (Number.isNaN(base.getTime())) return null;
    base.setDate(base.getDate() + dias);
    return base.toISOString().slice(0, 10);
}

function Celda({ etiqueta, valor, fuerte = false }) {
    return (
        <div className={`flex items-baseline justify-between gap-4 border-b border-slate-200 py-2 ${fuerte ? 'border-slate-800' : ''}`}>
            <span className={`text-xs ${fuerte ? 'font-bold text-slate-900' : 'text-slate-500'}`}>{etiqueta}</span>
            <span className={`tabular-nums ${fuerte ? 'text-base font-extrabold text-slate-900' : 'text-sm text-slate-700'}`}>
                {formatearMoneda(valor)}
            </span>
        </div>
    );
}

export default function FacturaImprimible({ orden, cliente, proyecto, cancion, onCerrar }) {
    useEffect(() => {
        const cerrarConEscape = (evento) => {
            if (evento.key === 'Escape') onCerrar();
        };
        document.addEventListener('keydown', cerrarConEscape);
        return () => document.removeEventListener('keydown', cerrarConEscape);
    }, [onCerrar]);

    if (!orden) return null;

    const detalle = orden.detalle ?? {};
    const desglose = orden.desglose ?? {};
    const vencimiento = diasVencimiento(orden.fecha_emision);
    const esReserva = orden.tipo === 'reserva';
    const conceptos = [];

    if (esReserva) {
        conceptos.push({
            descripcion: `Reserva de sesión${detalle.tipoSesion ? ` · ${detalle.tipoSesion}` : ''}`,
            detalle: [detalle.fecha ? formatearFecha(detalle.fecha) : null, detalle.franja].filter(Boolean).join(' · '),
            horas: desglose.horasProduccion ?? detalle.horasProduccion ?? null,
            valor: desglose.total ?? orden.total_estimado ?? orden.total,
        });
    } else {
        if ((desglose.horasProduccion ?? 0) > 0 || (desglose.subtotalProduccion ?? 0) > 0) {
            conceptos.push({
                descripcion: 'Producción musical',
                detalle: detalle.tarifaProduccion ? `${formatearMoneda(detalle.tarifaProduccion)} / hora` : '',
                horas: desglose.horasProduccion ?? null,
                valor: desglose.subtotalProduccion ?? 0,
            });
        }
        if ((desglose.subtotalEnsayo ?? 0) > 0) {
            conceptos.push({
                descripcion: 'Sala de ensayo',
                detalle: detalle.tarifaEnsayo ? `${formatearMoneda(detalle.tarifaEnsayo)} / hora` : '',
                horas: desglose.horasEnsayo ?? null,
                valor: desglose.subtotalEnsayo,
            });
        }
        if ((desglose.descuento ?? 0) > 0) {
            conceptos.push({
                descripcion: `Descuento proyecto (${Math.round((detalle.descuentoPorcentaje ?? 0) * 100)}%)`,
                detalle: 'Aplicado sobre producción',
                horas: null,
                valor: -desglose.descuento,
            });
        }
    }

    const totalConceptos = conceptos.reduce((suma, item) => suma + (Number(item.valor) || 0), 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Factura ${orden.numero ?? ''}`}
            onClick={(evento) => {
                if (evento.target === evento.currentTarget) onCerrar();
            }}
        >
            <div className="factura-imprimible my-4 w-full max-w-3xl">
                <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-texto-soft">Vista de factura · {orden.numero || 'Sin número'}</p>
                    <div className="flex items-center gap-2">
                        <button className={BOTON_PRIMARIO} type="button" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" aria-hidden="true" /> Imprimir / Guardar PDF
                        </button>
                        <button className={BOTON_SECUNDARIO} type="button" onClick={onCerrar} aria-label="Cerrar factura">
                            <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>

                <article className="factura-papel overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl">
                    <header className="flex flex-wrap items-start justify-between gap-4 border-b-4 border-violet-600 bg-slate-50 p-6 sm:p-8">
                        <div>
                            <div className="flex items-center gap-3">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-lg font-black text-white" aria-hidden="true">
                                    Z
                                </span>
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900">{ESTUDIO.nombre}</h2>
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-600">Estudio de grabación</p>
                                </div>
                            </div>
                            <ul className="mt-3 grid gap-0.5 text-xs text-slate-500">
                                {ESTUDIO.detalle.map((linea) => <li key={linea}>{linea}</li>)}
                            </ul>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Factura de venta</p>
                            <p className="text-2xl font-black tracking-tight text-slate-900">{orden.numero || '—'}</p>
                            <span className="mt-2 inline-block rounded-full border border-violet-300 bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
                                {ESTADO_TEXTO[orden.estado] ?? orden.estado}
                            </span>
                        </div>
                    </header>

                    <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                        <section>
                            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">Facturar a</p>
                            <p className="mt-1 text-base font-bold text-slate-900">{cliente?.nombre ?? `Cliente #${orden.usuario_id ?? '—'}`}</p>
                            {cliente?.email && <p className="text-sm text-slate-500">{cliente.email}</p>}
                            {orden.proyecto_id && proyecto && <p className="mt-1 text-sm text-slate-500">Proyecto: {proyecto}</p>}
                            {orden.cancion_id && cancion && <p className="text-sm text-slate-500">Canción: {cancion}</p>}
                        </section>
                        <section className="sm:text-right">
                            <dl className="grid gap-1.5 text-sm">
                                <div className="flex justify-between gap-4 sm:justify-end">
                                    <dt className="text-slate-500">Emisión</dt>
                                    <dd className="font-semibold text-slate-800">{formatearFecha(orden.fecha_emision) || '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4 sm:justify-end">
                                    <dt className="text-slate-500">Vencimiento</dt>
                                    <dd className="font-semibold text-slate-800">{formatearFecha(vencimiento) || '—'}</dd>
                                </div>
                                <div className="flex justify-between gap-4 sm:justify-end">
                                    <dt className="text-slate-500">Concepto</dt>
                                    <dd className="max-w-[16rem] truncate font-semibold text-slate-800">{orden.descripcion || 'Servicio de estudio'}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>

                    <div className="px-6 sm:px-8">
                        <table className="w-full border-collapse text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-800 text-left">
                                    <th className="py-2 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-slate-500">Descripción</th>
                                    <th className="py-2 text-right text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-slate-500">Horas</th>
                                    <th className="py-2 text-right text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-slate-500">Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conceptos.map((concepto, indice) => (
                                    <tr key={`${concepto.descripcion}-${indice}`} className="border-b border-slate-100 align-top">
                                        <td className="py-3 pr-4">
                                            <p className="font-semibold text-slate-800">{concepto.descripcion}</p>
                                            {concepto.detalle && <p className="text-xs text-slate-500">{concepto.detalle}</p>}
                                        </td>
                                        <td className="py-3 text-right tabular-nums text-slate-600">{concepto.horas ?? '—'}</td>
                                        <td className="py-3 text-right font-semibold tabular-nums text-slate-800">{formatearMoneda(concepto.valor)}</td>
                                    </tr>
                                ))}
                                {conceptos.length === 0 && (
                                    <tr className="border-b border-slate-100">
                                        <td className="py-3 font-semibold text-slate-800" colSpan={2}>{orden.descripcion || 'Servicio de estudio'}</td>
                                        <td className="py-3 text-right font-semibold tabular-nums text-slate-800">{formatearMoneda(orden.total)}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
                        <section className="text-xs leading-6 text-slate-500">
                            <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-slate-400">Pagos registrados</p>
                            {orden.pagos?.length ? (
                                <ul className="mt-1 grid gap-1">
                                    {orden.pagos.map((pago, indice) => (
                                        <li key={pago.id ?? indice} className="flex justify-between gap-4">
                                            <span>{formatearFecha(pago.fecha)} · {ETIQUETAS_METODO[pago.metodo] ?? pago.metodo}</span>
                                            <span className="font-semibold tabular-nums text-slate-700">{formatearMoneda(pago.monto)}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="mt-1 italic text-slate-400">Sin pagos registrados.</p>
                            )}
                        </section>
                        <section>
                            {(totalConceptos !== orden.total || orden.descuento) && <Celda etiqueta="Subtotal" valor={totalConceptos} />}
                            <Celda etiqueta="Total factura" valor={orden.total} fuerte />
                            {orden.anticipo > 0 && <Celda etiqueta="Anticipo requerido" valor={orden.anticipo} />}
                            {orden.pagado > 0 && <Celda etiqueta="Pagado" valor={orden.pagado} />}
                            {orden.saldo_favor > 0 && <Celda etiqueta="Saldo a favor" valor={orden.saldo_favor} />}
                            {orden.cargo_cancelacion > 0 && <Celda etiqueta="Cargo por cancelación" valor={orden.cargo_cancelacion} />}
                            <div className="mt-3 flex items-baseline justify-between gap-4 rounded-lg bg-violet-600 px-4 py-3 text-white">
                                <span className="text-xs font-bold uppercase tracking-[0.1em]">Saldo pendiente</span>
                                <span className="text-lg font-black tabular-nums">{formatearMoneda(Math.max(0, orden.saldo))}</span>
                            </div>
                        </section>
                    </div>

                    <footer className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-center text-[0.68rem] text-slate-500 sm:px-8">
                        Gracias por trabajar con {ESTUDIO.nombre}. Esta factura se genera electrónicamente y es válida sin firma.
                    </footer>
                </article>
            </div>
        </div>
    );
}
