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

export default function TarjetaArtista({ artista, index }) {
    return (
        <article className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-[#120f1d]/80 transition duration-300 hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-2xl hover:shadow-black/50">
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
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-exito/30 bg-black/45 px-2.5 py-1 text-xs font-bold text-exito-soft backdrop-blur">
                    <span aria-hidden="true">●</span> Activo
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-accent-soft">Artista Z-ONE</p>
                    <h3 className="mt-0.5 text-lg font-bold leading-tight tracking-tight text-texto-soft">{artista.nombre}</h3>
                    <span className="mt-1 inline-block rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-texto">
                        {artista.especialidad || 'Artista'}
                    </span>
                </div>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="text-xs text-sutil">
                    {artista.usuario_id ? 'Cuenta vinculada al estudio' : 'Perfil del estudio'}
                </span>
                <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.05] text-accent-soft transition duration-300 group-hover:bg-gradient-to-br group-hover:from-[#9365f2] group-hover:to-[#e34ba6] group-hover:text-white"
                    aria-hidden="true"
                >
                    ♪
                </span>
            </div>
        </article>
    );
}
