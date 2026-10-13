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
            { titulo: 'Una Cosa Rara', archivo: 'Una Cosa Rara - LuisRa (Audio - #ElNiñoDeGarupal).mp3' },
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
    {
        artista: 'Jorge Celedón',
        carpeta: 'jorge celedon',
        imagen: '/Imagenes/artistas/jorge celedon.jpg',
        origen: 'Villanueva, La Guajira, Colombia',
        canciones: [
            { titulo: 'Distintos Destinos (En Vivo)', archivo: 'Distintos destinos - Jorge Celedon - Cantandole al amor (EN VIVO ARENA MONTERREY).mp3' },
            { titulo: 'No Merezco Tanto Silencio', archivo: 'No Merezco Tanto Silencio - Jorge Celedón l Video Oficial.mp3' },
            { titulo: 'Por Estar Adorándote (En Vivo)', archivo: 'Por estar adorandote - Jorge Celedon - Cantandole al Amor (EN VIVO ARENA MONTERREY).mp3' },
            { titulo: 'Recordarte (En Vivo)', archivo: 'Recordarte - Jorge Celedon - Cantandole al amor (EN VIVO ARENA MONTERREY).mp3' },
        ],
    },
    {
        artista: 'Samuel Morales',
        carpeta: 'samuel morales',
        imagen: '/Imagenes/artistas/samuel morales.jpg',
        origen: 'Colombia · hijo de Kaleth Morales',
        canciones: [
            { titulo: 'Ayúdame a Olvidarla (con Juan K Ricardo, en vivo)', archivo: 'AYUDAME A OLVIDARLA - @SamuelMoralesofc X @JuanKRicardoOficial (En Vivo).mp3' },
            { titulo: "Pa' Olvidarte (con Juan K Ricardo, en vivo)", archivo: 'PA` OLVIDARTE - @SamuelMoralesofc X @JuanKRicardoOficial (En Vivo).mp3' },
            { titulo: 'Qué Mal Hicimos (con Juan K Ricardo)', archivo: 'QUÉ MAL HICIMOS - @SamuelMoralesofc X @JuanKRicardoOficial.mp3' },
            { titulo: 'Tu Forma de Amar (con Juan K Ricardo y Miguel Morales)', archivo: 'TU FORMA DE AMAR - @SamuelMoralesofc X @JuanKRicardoOficial FT @MiguelMorales_LaVoz.mp3' },
        ],
    },
    {
        artista: 'Simón Figueroa',
        carpeta: 'simon figueroa',
        imagen: '/Imagenes/artistas/simon figueroa.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Juego Secreto (con Roberto Kammerer)', archivo: 'Juego Secreto - Simón Figueroa & Roberto Kammerer “RK” (DVD VOL. 3).mp3' },
            { titulo: 'Inalcanzable (con Luisda Solano, en vivo)', archivo: 'Simon Figueroa & Luisda Solano - INALCANZABLE (En Vivo).mp3' },
            { titulo: 'Perdóname la Vida (con Luisda Solano, en vivo)', archivo: 'Simon Figueroa & Luisda Solano - PERDONAME LA VIDA (En Vivo).mp3' },
            { titulo: 'Tal Vez (con Luisda)', archivo: 'TAL VEZ - Simón + Luisda (Visualizador).mp3' },
        ],
    },
    {
        artista: 'Óscar Gamarra',
        carpeta: 'oscar gamarra',
        imagen: '/Imagenes/artistas/oscar gamarra.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Eso No Es Ná (con Rolando Ochoa)', archivo: 'ESO NO ES NA - OSCAR GAMARRA & ROLANDO OCHOA.mp3' },
            { titulo: 'La Misteriosa (con Franco Argüelles)', archivo: 'LA MISTERIOSA OSCAR GAMARRA & FRANCO ARGÜELLES.mp3' },
            { titulo: "La Parranda Es Pa' Amanecer (con Sergio Luis Rodríguez)", archivo: 'LA PARRANDA ES PA´ AMANECER - OSCAR GAMARRA & SERGIO LUIS RODRIGUEZ.mp3' },
            { titulo: 'Vuélvete a Ir (con Dani Maestre)', archivo: 'VUELVETE A IR OSCAR GAMARRA & DANI MAESTRE.mp3' },
        ],
    },
    {
        artista: 'Luister La Voz',
        carpeta: 'luister la voz',
        imagen: '/Imagenes/artistas/luister la voz.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Amarte Más No Pude (En Vivo)', archivo: 'Luister La Voz - Amarte más no pude - En Vivo (Video Lyric).mp3' },
            { titulo: 'Nos Mal Acostumbramos (con Dj Jac)', archivo: 'Luister La Voz, Dj Jac - Nos Mal Acostumbramos (Video Oficial).mp3' },
            { titulo: 'Empezar de Nuevo (con Juanda Iriarte)', archivo: 'Luister La Voz, Juanda Iriarte - Empezar de Nuevo (Video Oficial).mp3' },
            { titulo: 'Las Cartas (con Maikol El Insoportable)', archivo: 'Luister La Voz, Maikol El Insoportable - Las Cartas (Video Oficial).mp3' },
        ],
    },
    {
        artista: 'Iván Ballesteros',
        carpeta: 'ivan ballestero',
        imagen: '/Imagenes/artistas/ivan ballestero.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Ceniza Fría (con David Chaar)', archivo: 'Ceniza fría - Ivan Ballesteros & David Chaar.mp3' },
            { titulo: 'Como Te Quise, Te Olvido (con Jaime Mesa, Live)', archivo: 'Como te quise, te olvido - Ivan Ballesteros & Jaime Mesa(Live).mp3' },
            { titulo: 'Se Equivocó (con Jaime Mesa, Live)', archivo: 'Se equivocò - Ivan Ballesteros & Jaime Mesa(Live).mp3' },
        ],
    },
    {
        artista: 'Haffit David',
        carpeta: 'haffit',
        imagen: '/Imagenes/artistas/haffit david.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Las Verdades De Mi Vida (Live)', archivo: '@HaffitDavid @JafidNazar - Las Verdades De Mi Vida live.mp3' },
            { titulo: 'El Forastero (Live)', archivo: 'El Forastero (Live) @HaffitDavid @JafidNazar.mp3' },
            { titulo: 'En Señal De Victoria (Live)', archivo: 'En Señal De Victoria (Live) @HaffitDavid @JafidNazar.mp3' },
            { titulo: 'No Te Detengas (Live)', archivo: 'No Te Detengas (Live) @HaffitDavid @JafidNazar.mp3' },
        ],
    },
    {
        artista: 'Camilo',
        carpeta: 'camilo echeverry',
        imagen: '/Imagenes/artistas/camilo echeverry.jpg',
        origen: 'Medellín, Colombia',
        canciones: [
            { titulo: 'El Titiritero', archivo: 'Camilo - El Titiritero (Official Video).mp3' },
            { titulo: 'El Árbol', archivo: 'Camilo - El Árbol.mp3' },
            { titulo: 'La Nieve', archivo: 'Camilo - La Nieve (Official Video).mp3' },
            { titulo: 'La Medalla (con Evaluna Montaner)', archivo: 'Camilo, Evaluna Montaner - La Medalla (Official Video).mp3' },
        ],
    },
    {
        artista: 'Ana del Castillo',
        carpeta: 'ana del castillo',
        imagen: '/Imagenes/artistas/ana del castillo.jpg',
        origen: 'Valledupar, Colombia',
        canciones: [
            { titulo: 'El Yoyó (Live)', archivo: 'El Yoyó - Ana del Castillo (Live).mp3' },
            { titulo: 'Más Allá del Cielo (Live)', archivo: 'Más Allá del Cielo - Ana del Castillo (Live).mp3' },
            { titulo: 'Quién Tiene La Culpa (Live)', archivo: 'Quién Tiene La Culpa - Ana del Castillo (Live).mp3' },
            { titulo: 'Yo Soy Así (Live)', archivo: 'Yo Soy Así - Ana del Castillo (Live).mp3' },
        ],
    },
    {
        artista: 'Alex Martínez',
        carpeta: 'alex martinex',
        imagen: '/Imagenes/artistas/alex martinez.jpg',
        origen: 'Colombia',
        canciones: [
            { titulo: 'Si Tú Estuvieras', archivo: 'Alex Martinez - Si Tú Estuvieras (Video Oficial).mp3' },
            { titulo: 'Te Quiero Igual Que Ayer (con Jania)', archivo: 'Alex Martínez, Jania - Te Quiero Igual Que Ayer (En Vivo).mp3' },
            { titulo: 'El Mensaje (con Jorge Celedón)', archivo: 'El Mensaje, Alex Martinez Y Jorge Celedón - Video Oficial.mp3' },
            { titulo: 'Mi Otra Mitad', archivo: 'Mi Otra Mitad, Alex Martinez - Video Oficial.mp3' },
        ],
    },
    {
        artista: 'Jean Carlos Centeno',
        carpeta: 'jean carlo centeno',
        imagen: '/Imagenes/artistas/jean-carlos-centeno.jpg',
        origen: 'Cabimas, Venezuela · carrera en Colombia',
        canciones: [
            { titulo: 'Ayúdame a Olvidarte', archivo: 'Ayúdame a Olvidarte.mp3' },
            { titulo: 'De Donde Amor', archivo: 'De Donde Amor.mp3' },
            { titulo: 'Nubes Negras / Todas Son Mías (con Ronal Urbina, en vivo)', archivo: 'Nubes Negras, Jean Carlos Centeno Y Ronal Urbina, Todas Son Mías - En Vivo.mp3' },
            { titulo: 'Te Volví a Encontrar', archivo: 'Te Volvi a Encontrar.mp3' },
        ],
    },
];

export default cancionesArtistas;
