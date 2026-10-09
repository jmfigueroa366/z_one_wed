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

export default function TarjetaArtista({ artista, index }) {
    return (
        <article className={`artist-directory-card`}>
            <div className={`artist-directory-portrait artist-directory-portrait-${index % 4}`}>
                {artista.imagen ? (
                    <img src={artista.imagen} alt={`Retrato de ${artista.nombre}`} loading="lazy" decoding="async" />
                ) : (
                    <span className="artist-directory-initials" aria-hidden="true">{iniciales(artista.nombre)}</span>
                )}
                <span className="artist-directory-status"><span aria-hidden="true">●</span> Activo</span>
            </div>
            <div className="artist-directory-body">
                <p className="workspace-eyebrow">ARTISTA Z-ONE</p>
                <h3>{artista.nombre}</h3>
                <span className="artist-directory-genre">{artista.especialidad || 'Artista'}</span>
                {artista.usuario_id && <span className="artist-directory-account">Cuenta vinculada al estudio</span>}
            </div>
        </article>
    );
}