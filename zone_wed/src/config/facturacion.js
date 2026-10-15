// CAPA: Dominio
// Configuración única de facturación. Ningún valor monetario debe
// escribirse en componentes ni en el seed: todo sale de aquí.
export const FACTURACION = Object.freeze({
    tarifaProduccionHora: 40000,
    tarifaEnsayoHora: 50000,
    umbralAlbumDescuento: 15,
    descuentoAlbum: 0.3,
    bloqueRedondeoMin: 30,
    anticipoPorcentaje: 0.5,
    cancelacionHorasGratis: 24,
    cancelacionPorcentaje: 0.5,
});

export const TIPOS_PROYECTO = Object.freeze({
    SENCILLO: 'sencillo',
    EP: 'ep',
    ALBUM: 'album',
});

export const TIPOS_ORDEN = Object.freeze({
    CANCION: 'cancion',
    ALBUM: 'album',
    RESERVA: 'reserva',
});

export const ETIQUETAS_PROYECTO = Object.freeze({
    [TIPOS_PROYECTO.SENCILLO]: 'Sencillo',
    [TIPOS_PROYECTO.EP]: 'EP',
    [TIPOS_PROYECTO.ALBUM]: 'Álbum',
});

export default FACTURACION;
