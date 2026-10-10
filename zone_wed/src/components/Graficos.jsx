// CAPA: Presentación
import { Fragment, useEffect, useLayoutEffect, useRef } from 'react';
import anime from 'animejs';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const PALETA = ['#a477ff', '#f04fa6', '#7be0b0', '#ffd166', '#9ecbff', '#f2a4b1'];

function colorDe(estado, indice) {
    if (['completada', 'en_proceso', 'confirmada', 'pagada'].includes(estado)) return '#7be0b0';
    if (['pendiente', 'solicitud', 'en_negociacion', 'facturada'].includes(estado)) return '#ffd166';
    if (['cancelada', 'rechazada', 'expirada'].includes(estado)) return '#ff8a8a';
    return PALETA[indice % PALETA.length];
}

export function Donut({ datos, total, etiquetaCentral = 'Total', tamano = 190, grosor = 24 }) {
    const circuloRef = useRef(null);
    const suma = datos.reduce((acumulado, dato) => acumulado + dato.valor, 0) || 1;
    const radio = (tamano - grosor) / 2;
    const circunferencia = 2 * Math.PI * radio;
    const centro = tamano / 2;

    let acumulado = 0;
    const segmentos = datos.map((dato, indice) => {
        const largo = (dato.valor / suma) * circunferencia;
        const segmento = {
            ...dato,
            largo,
            offset: -acumulado,
            color: dato.color ?? colorDe(dato.estado, indice),
        };
        acumulado += largo;
        return segmento;
    });

    useLayoutEffect(() => {
        const nodos = circuloRef.current?.querySelectorAll('[data-arco]');
        if (!nodos || nodos.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        nodos.forEach((nodo) => {
            nodo.style.strokeDasharray = `0 ${circunferencia}`;
        });
        return undefined;
    }, [datos, circunferencia]);

    useEffect(() => {
        const nodos = circuloRef.current?.querySelectorAll('[data-arco]');
        if (!nodos || nodos.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: nodos,
            strokeDasharray: (_, i) => `${nodos[i].dataset.largo} ${circunferencia}`,
            duration: 1100,
            easing: 'easeOutQuart',
            delay: anime.stagger(120),
        });
        return () => animacion.pause();
    }, [datos, circunferencia]);

    return (
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-8">
            <div ref={circuloRef} className="relative" style={{ width: tamano, height: tamano }}>
                <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} role="img" aria-label={etiquetaCentral}>
                    <circle cx={centro} cy={centro} r={radio} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={grosor} />
                    <g transform={`rotate(-90 ${centro} ${centro})`}>
                        {segmentos.map((segmento, indice) => (
                            <circle
                                key={`${segmento.etiqueta}-${indice}`}
                                data-arco
                                data-largo={segmento.largo}
                                cx={centro}
                                cy={centro}
                                r={radio}
                                fill="none"
                                stroke={segmento.color}
                                strokeWidth={grosor}
                                strokeLinecap="round"
                                strokeDasharray={`${segmento.largo} ${circunferencia}`}
                                strokeDashoffset={segmento.offset}
                            />
                        ))}
                    </g>
                </svg>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                        <strong className="block text-4xl font-extrabold leading-none tracking-tight text-texto-soft">
                            {total ?? suma}
                        </strong>
                        <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.14em] text-sutil">
                            {etiquetaCentral}
                        </span>
                    </div>
                </div>
            </div>

            <ul className="grid w-full max-w-[15rem] gap-2.5">
                {segmentos.map((segmento, indice) => (
                    <li key={`${segmento.etiqueta}-leyenda-${indice}`} className="flex items-center gap-3">
                        <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: segmento.color, boxShadow: `0 0 10px ${segmento.color}` }}
                        />
                        <span className="flex-1 truncate text-sm text-sutil">{segmento.etiqueta}</span>
                        <strong className="text-sm font-bold tabular-nums text-texto-soft">{segmento.valor}</strong>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function BarrasHorizontales({ datos, sufijo = '' }) {
    const ref = useRef(null);
    const maximo = Math.max(1, ...datos.map((dato) => dato.valor));

    useEffect(() => {
        const nodos = ref.current?.querySelectorAll('[data-barra]');
        if (!nodos || nodos.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        nodos.forEach((nodo) => { nodo.style.width = '0%'; });
        const animacion = anime({
            targets: nodos,
            width: (_, i) => `${(datos[i].valor / maximo) * 100}%`,
            duration: 950,
            easing: 'easeOutQuart',
            delay: anime.stagger(90),
        });
        return () => animacion.pause();
    }, [datos, maximo]);

    return (
        <ul ref={ref} className="grid gap-3.5">
            {datos.map((dato, indice) => (
                <li key={`${dato.etiqueta}-${indice}`} className="grid gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm text-texto">{dato.etiqueta}</span>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-texto-soft">
                            {dato.valor}
                            {sufijo}
                        </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <span
                            data-barra
                            className="block h-full rounded-full"
                            style={{
                                width: `${(dato.valor / maximo) * 100}%`,
                                background: `linear-gradient(90deg, ${dato.color ?? colorDe(dato.estado, indice)}, ${dato.colorB ?? '#f04fa6'})`,
                            }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

export function ColumnasDias({ datos }) {
    const ref = useRef(null);
    const maximo = Math.max(1, ...datos.map((dato) => dato.valor));

    useEffect(() => {
        const nodos = ref.current?.querySelectorAll('[data-columna]');
        if (!nodos || nodos.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        nodos.forEach((nodo) => { nodo.style.height = '0%'; });
        const animacion = anime({
            targets: nodos,
            height: (_, i) => `${Math.max(6, (datos[i].valor / maximo) * 100)}%`,
            duration: 900,
            easing: 'easeOutQuart',
            delay: anime.stagger(70),
        });
        return () => animacion.pause();
    }, [datos, maximo]);

    return (
        <div ref={ref} className="flex h-44 items-end justify-between gap-2.5">
            {datos.map((dato, indice) => {
                const pico = dato.valor === maximo && maximo > 1;
                return (
                    <div key={dato.dia} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[0.68rem] font-bold tabular-nums text-sutil">{dato.valor}</span>
                        <div className="flex w-full flex-1 items-end">
                            <span
                                data-columna={indice}
                                className="block w-full rounded-t-xl"
                                style={{
                                    height: `${Math.max(6, (dato.valor / maximo) * 100)}%`,
                                    background: pico
                                        ? 'linear-gradient(180deg, #f04fa6, #9365f2)'
                                        : 'linear-gradient(180deg, rgba(164,119,255,0.55), rgba(164,119,255,0.12))',
                                    boxShadow: pico ? '0 0 22px rgba(240,79,166,0.45)' : 'none',
                                }}
                            />
                        </div>
                        <span className={`text-xs font-semibold ${pico ? 'text-magenta' : 'text-sutil'}`}>{dato.dia}</span>
                    </div>
                );
            })}
        </div>
    );
}

export function Anillo({ valor, etiqueta, subetiqueta, tamano = 200, grosor = 16 }) {
    const ref = useRef(null);
    const radio = (tamano - grosor) / 2;
    const circunferencia = 2 * Math.PI * radio;
    const centro = tamano / 2;
    const destino = circunferencia * (1 - Math.min(Math.max(valor, 0), 100) / 100);

    useEffect(() => {
        const nodo = ref.current?.querySelector('[data-anillo]');
        if (!nodo) return undefined;
        if (MENOS_MOVIMIENTO()) {
            nodo.setAttribute('stroke-dashoffset', destino);
            return undefined;
        }
        const animacion = anime({
            targets: nodo,
            strokeDashoffset: [circunferencia, destino],
            duration: 1400,
            easing: 'easeOutExpo',
        });
        return () => animacion.pause();
    }, [destino, circunferencia]);

    return (
        <div className="flex flex-col items-center">
            <div ref={ref} className="relative" style={{ width: tamano, height: tamano }}>
                <svg width={tamano} height={tamano} viewBox={`0 0 ${tamano} ${tamano}`} role="img" aria-label={etiqueta}>
                    <defs>
                        <linearGradient id="anillo-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#9365f2" />
                            <stop offset="100%" stopColor="#f04fa6" />
                        </linearGradient>
                    </defs>
                    <circle cx={centro} cy={centro} r={radio} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={grosor} />
                    <circle
                        data-anillo
                        cx={centro}
                        cy={centro}
                        r={radio}
                        fill="none"
                        stroke="url(#anillo-grad)"
                        strokeWidth={grosor}
                        strokeLinecap="round"
                        strokeDasharray={circunferencia}
                        strokeDashoffset={circunferencia}
                        transform={`rotate(-90 ${centro} ${centro})`}
                    />
                </svg>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                    <div className="text-center">
                        <strong className="block text-5xl font-black leading-none tracking-tighter text-texto-soft">{valor}</strong>
                        <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-sutil">{etiqueta}</span>
                    </div>
                </div>
            </div>
            {subetiqueta && <p className="mt-3 text-center text-sm text-sutil">{subetiqueta}</p>}
        </div>
    );
}

export function MapaCalor({ filas, columnas, celdas, max }) {
    const ref = useRef(null);
    const tope = Math.max(1, max || 1);

    useEffect(() => {
        const nodos = ref.current?.querySelectorAll('[data-celda]');
        if (!nodos || nodos.length === 0 || MENOS_MOVIMIENTO()) return undefined;
        const animacion = anime({
            targets: nodos,
            opacity: [0, 1],
            scale: [0.55, 1],
            duration: 520,
            delay: anime.stagger(16, { grid: [filas.length, columnas.length], from: 'first' }),
            easing: 'easeOutBack',
        });
        return () => animacion.pause();
    }, [celdas, filas.length, columnas.length]);

    return (
        <div ref={ref} className="overflow-x-auto">
            <div
                className="grid min-w-[420px] gap-1.5"
                style={{ gridTemplateColumns: `auto repeat(${columnas.length}, minmax(0, 1fr))` }}
            >
                <span aria-hidden="true" />
                {columnas.map((columna) => (
                    <span key={columna} className="text-center text-[0.62rem] font-bold uppercase tracking-wider text-sutil">
                        {columna}
                    </span>
                ))}
                {filas.map((fila, i) => (
                    <Fragment key={fila}>
                        <span className="pr-1.5 text-right text-[0.68rem] font-semibold text-sutil">{fila}</span>
                        {columnas.map((columna, j) => {
                            const valor = celdas[i]?.[j] ?? 0;
                            const intensidad = valor / tope;
                            const vacio = valor === 0;
                            return (
                                <span
                                    key={`${fila}-${columna}`}
                                    data-celda
                                    title={`${fila} ${columna} · ${valor} sesión(es)`}
                                    className="grid aspect-square place-items-center rounded-lg border text-[0.7rem] font-bold transition hover:scale-[1.08]"
                                    style={
                                        vacio
                                            ? { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: '#7c7490' }
                                            : {
                                                background: `linear-gradient(135deg, rgba(147,101,242,${0.22 + intensidad * 0.7}), rgba(240,79,166,${0.16 + intensidad * 0.74}))`,
                                                borderColor: 'rgba(192,148,255,0.4)',
                                                color: intensidad > 0.45 ? '#ffffff' : '#e8e2ff',
                                                boxShadow: intensidad > 0.6 ? '0 0 16px rgba(240,79,166,0.35)' : 'none',
                                            }
                                    }
                                >
                                    {valor || ''}
                                </span>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}

export default { Donut, BarrasHorizontales, ColumnasDias, Anillo, MapaCalor, PALETA };
