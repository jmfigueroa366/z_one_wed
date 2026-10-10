// CAPA: Presentación
export function iniciales(nombre) {
    return String(nombre ?? '')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0] ?? '')
        .join('')
        .toLocaleUpperCase();
}

const RETRATO = [
    'radial-gradient(circle at 30% 18%, rgba(240, 79, 166, 0.34), transparent 55%), linear-gradient(150deg, #3a2a52, #171322 82%)',
    'radial-gradient(circle at 72% 16%, rgba(79, 170, 210, 0.32), transparent 55%), linear-gradient(150deg, #25374a, #171322 82%)',
    'radial-gradient(circle at 40% 20%, rgba(211, 166, 75, 0.3), transparent 55%), linear-gradient(150deg, #463629, #171322 82%)',
    'radial-gradient(circle at 66% 18%, rgba(147, 101, 242, 0.36), transparent 55%), linear-gradient(150deg, #2e2547, #171322 82%)',
];

export default function TarjetaArtista({ artista, index, acento = '#a477ff', destacado = false }) {
    return (
        <article
            className="group relative overflow-hidden rounded-[1.75rem] border bg-[#120f1d]/80 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50"
            style={{ borderColor: destacado ? acento : 'var(--color-border, #2d2a45)' }}
        >
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -inset-px rounded-[1.75rem] opacity-0 blur-xl transition duration-500 group-hover:opacity-60"
                style={{ background: `${acento}55` }}
            />
            <div className="relative h-60 overflow-hidden" style={{ background: RETRATO[index % 4] }}>
                {artista.imagen ? (
                    <img
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                        src={artista.imagen}
                        alt={`Retrato de ${artista.nombre}`}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="grid h-full w-full place-items-center text-6xl font-black tracking-tight text-white/85" aria-hidden="true">
                        {iniciales(artista.nombre)}
                    </span>
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0b0812] via-[#0b0812]/25 to-transparent" />
                <span
                    className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold backdrop-blur"
                    style={{ borderColor: `${acento}80`, background: 'rgba(0,0,0,0.45)', color: acento }}
                >
                    <span aria-hidden="true">●</span> Activo
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em]" style={{ color: acento }}>Artista Z-ONE</p>
                    <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-texto-soft">{artista.nombre}</h3>
                    <span
                        className="mt-1 inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                        style={{ borderColor: `${acento}59`, background: `${acento}1f`, color: '#f2effb' }}
                    >
                        {artista.especialidad || 'Artista'}
                    </span>
                </div>
            </div>
            <div className="relative flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="text-xs text-sutil">
                    {artista.usuario_id ? 'Cuenta vinculada al estudio' : 'Perfil del estudio'}
                </span>
                <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition duration-300 group-hover:scale-110"
                    style={{ background: `linear-gradient(135deg, ${acento}, #e34ba6)` }}
                    aria-hidden="true"
                >
                    ♪
                </span>
            </div>
        </article>
    );
}
