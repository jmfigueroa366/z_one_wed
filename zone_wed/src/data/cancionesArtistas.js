// CAPA: Datos
const CARPETA_BASE = '/canciones';

export function urlCancion(carpeta, archivo) {
    return `${CARPETA_BASE}/${encodeURIComponent(carpeta)}/${encodeURIComponent(archivo)}`;
}

export const cancionesArtistas = [
    {
        artista: 'Shakira',
        carpeta: 'shakira',
        imagen: '/Imagenes/artistas/shakira.jpg',
        origen: 'Barranquilla, Colombia',
        canciones: [
            { titulo: 'Acróstico', archivo: 'Shakira - Acróstico (Official Video).mp3' },
            { titulo: 'Ciega, Sordomuda', archivo: 'Shakira - Ciega Sordomuda (Official HD Video).mp3' },
            { titulo: 'Dai Dai (con Burna Boy)', archivo: 'Shakira - Dai Dai (Official Video).mp3' },
            {
                titulo: 'Waka Waka (Esto es África)',
                archivo: 'Waka Waka (Esto es Africa) (Cancion Oficial de la Copa Mundial de la FIFA Sudafrica 2010).mp3',
            },
        ],
    },
    {
        artista: 'Luisra',
        carpeta: 'luisra',
        imagen: '/Imagenes/artistas/luisra.jpg',
        origen: 'Artista destacado',
        canciones: [
            { titulo: 'Princesa', archivo: 'PRINCESA - LuisRa.mp3' },
            { titulo: 'Eso Va', archivo: 'Eso Va - LuisRa.mp3' },
            { titulo: 'Habla Claro', archivo: 'Habla Claro - LuisRa.mp3' },
            { titulo: 'Por Que Las Paredes Hablan', archivo: 'Por Que Las Paredes Hablan - LuisRa.mp3' },
        ],
    },
    {
        artista: 'Carlos Vives',
        carpeta: 'carlos vives',
        imagen: '/Imagenes/artistas/carlos-vives.jpg',
        origen: 'Santa Marta, Colombia',
        canciones: [
            { titulo: 'Bailar Contigo', archivo: 'Carlos Vives - Bailar Contigo.mp3' },
            {
                titulo: 'Cuando Nos Volvamos a Encontrar (ft. Marc Anthony)',
                archivo: 'Carlos Vives - Cuando Nos Volvamos a Encontrar ft. Marc Anthony.mp3',
            },
            { titulo: 'La Foto de los Dos', archivo: 'Carlos Vives - La Foto de los Dos.mp3' },
        ],
    },
    {
        artista: 'Andrés Cepeda',
        carpeta: 'andres cepeda',
        imagen: '/Imagenes/artistas/andres-cepeda.jpg',
        origen: 'Bogotá, Colombia',
        canciones: [
            { titulo: 'Desesperado', archivo: 'Andrés Cepeda - Desesperado (Official Video).mp3' },
            { titulo: 'Por El Resto De Mi Vida', archivo: 'Andrés Cepeda - Por El Resto De Mi Vida (Video Oficial).mp3' },
            { titulo: 'Te Voy a Amar (ft. Cali Y El Dandee)', archivo: 'Andrés Cepeda - Te Voy a Amar.mp3' },
            { titulo: 'Día Tras Día', archivo: 'Día Tras Día.mp3' },
        ],
    },
    {
        artista: 'Dua Lipa',
        carpeta: 'dualipa',
        imagen: '/Imagenes/artistas/dualipa.jpeg',
        origen: 'Londres, Reino Unido',
        canciones: [
            { titulo: 'Break My Heart', archivo: 'Dua Lipa - Break My Heart (Official Video).mp3' },
            { titulo: 'New Rules', archivo: 'Dua Lipa - New Rules (Official Music Video).mp3' },
            {
                titulo: 'Training Season (Live)',
                archivo: 'Dua Lipa - Training Season (Live from the Royal Albert Hall) [Official Performance Video].mp3',
            },
            { titulo: 'Antología (en vivo con Shakira)', archivo: 'Shakira - Antologia en vivo con Dua Lipa.mp3' },
        ],
    },
    {
        artista: 'Sebastián Yatra',
        carpeta: 'sebastian yatra',
        imagen: '/Imagenes/artistas/images.jpg',
        origen: 'Medellín, Colombia',
        canciones: [
            { titulo: 'Como Mirarte', archivo: 'Sebastián Yatra - Como Mirarte (Letra Lyrics).mp3' },
            { titulo: 'Quiero Decirte', archivo: 'Sebastián Yatra - Quiero Decirte.mp3' },
            { titulo: 'Vuelve (con Beret)', archivo: 'Sebastián Yatra - Vuelve.mp3' },
            { titulo: 'Oye (con TINI)', archivo: 'TINI - Oye.mp3' },
        ],
    },
];

export default cancionesArtistas;
