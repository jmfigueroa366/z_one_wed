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
    'radial-gradient(circle at 30% 20%, rgba(240, 79, 166, 0.32), transparent 55%), linear-gradient(150deg, #3a2a52, #171322 82%)',
    'radial-gradient(circle at 72% 18%, rgba(79, 170, 210, 0.3), transparent 55%), linear-gradient(150deg, #25374a, #171322 82%)',
    'radial-gradient(circle at 40% 22%, rgba(211, 166, 75, 0.28), transparent 55%), linear-gradient(150deg, #463629, #171322 82%)',
    'radial-gradient(circle at 66% 20%, rgba(147, 101, 242, 0.34), transparent 55%), linear-gradient(150deg, #2e2547, #171322 82%)',
];

export default function TarjetaArtista({ artista, index }) {
    return (
        <article className="overflow-hidden rounded-2xl border border-border bg-[#120f1d]/80 transition hover:-translate-y-1 hover:border-accent/40">
            <div
                className="relative grid h-44 place-items-center overflow-hidden"
                style={{ background: RETRATO[index % 4] }}
            >
                {artista.imagen ? (
                    <img
                        className="h-full w-full object-cover"
                        src={artista.imagen}
                        alt={`Retrato de ${artista.nombre}`}
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <span className="text-5xl font-black tracking-tight text-white/85" aria-hidden="true">
                        {iniciales(artista.nombre)}
                    </span>
                )}
                <span className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-xs font-bold text-exito-soft backdrop-blur">
                    <span aria-hidden="true">●</span> Activo
                </span>
            </div>
            <div className="grid gap-1 p-5">
                <p className="workspace-eyebrow">ARTISTA Z-ONE</p>
                <h3 className="text-lg font-bold tracking-tight text-texto-soft">{artista.nombre}</h3>
                <span className="text-sm font-semibold text-accent-soft">{artista.especialidad || 'Artista'}</span>
                {artista.usuario_id && <span className="text-xs text-sutil">Cuenta vinculada al estudio</span>}
            </div>
        </article>
    );
}
