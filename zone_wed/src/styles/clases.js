// CAPA: Presentación
export const CAMPO =
    'w-full rounded-xl border border-border bg-surface-2 px-3.5 py-3 text-sm text-texto outline-none transition [color-scheme:dark] placeholder:text-sutil/70 focus:border-accent focus:ring-2 focus:ring-accent/40 [&>option]:bg-surface-3 [&>option]:text-texto';

export const ETIQUETA = 'mb-1.5 block text-xs font-bold uppercase tracking-wider text-sutil';

export const BOTON_PRIMARIO =
    'inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-4 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70';

export const BOTON_SECUNDARIO =
    'inline-flex min-h-[40px] items-center justify-center rounded-xl border border-border bg-white/[0.04] px-4 text-sm font-semibold text-texto transition hover:border-accent/60 hover:text-accent';

export const BOTON_PELIGRO =
    'inline-flex min-h-[40px] items-center justify-center rounded-xl border border-peligro/50 px-4 text-sm font-semibold text-peligro-soft transition hover:bg-peligro/10';

export const TARJETA_RESUMEN = 'flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/70 px-5 py-4';

const PILL =
    'inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent px-2.5 py-1.5 text-xs font-bold capitalize';

export function clasePillEstado(estado) {
    if (['confirmada', 'completada', 'en_proceso'].includes(estado)) {
        return `${PILL} border-exito/25 bg-exito/10 text-exito-soft`;
    }
    if (['solicitud', 'en_negociacion', 'pendiente'].includes(estado)) {
        return `${PILL} border-aviso/25 bg-aviso/10 text-aviso-soft`;
    }
    if (['cancelada', 'rechazada', 'expirada'].includes(estado)) {
        return `${PILL} border-peligro/25 bg-peligro/10 text-peligro-soft`;
    }
    return `${PILL} bg-surface-3 text-sutil`;
}
