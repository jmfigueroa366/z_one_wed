import { Auth } from './auth.js';
import { NAVEGACION_POR_ROL, RUTA_INICIO_POR_ROL } from './navegacionRoles.js';
import { ROLES } from './roles.js';

const CONTENIDO_POR_ROL = {
    [ROLES.ADMINISTRADOR]: {
        panel: 'PANEL DE ADMINISTRACIÓN',
        etiqueta: 'CONTROL DE OPERACIÓN',
        titular: 'Gestiona el equipo, la producción y el catálogo.',
        descripcion: 'Accede a las herramientas de talento, sesiones, agenda y seguimiento de Z-ONE.',
        informacion: 'Operación centralizada',
        tarjetas: [
            ['Equipo creativo', 'Artistas y productores', 'Talento de la plataforma'],
            ['Producción', 'Catálogo y sesiones', 'Recursos del estudio'],
            ['Seguimiento', 'Agenda y estadísticas', 'Control operativo'],
        ],
        detalles: [
            ['Equipo', 'Consulta las áreas de artistas y productores.'],
            ['Producción', 'Organiza el catálogo, las sesiones y la agenda.'],
            ['Control', 'Revisa las estadísticas y la configuración disponibles.'],
        ],
    },
    [ROLES.CLIENTE]: {
        panel: 'ESPACIO DEL CLIENTE',
        etiqueta: 'MIS PROYECTOS',
        titular: 'Sigue la actividad de producción musical.',
        descripcion: 'Consulta el catálogo, las sesiones y la agenda del estudio desde un solo espacio.',
        informacion: 'Tu espacio de producción',
        tarjetas: [
            ['Mi espacio', 'Proyectos musicales', 'Catálogo de producción'],
            ['Seguimiento', 'Sesiones y agenda', 'Actividad del estudio'],
            ['Comunicación', 'Asistente Z-ONE', 'Orientación general'],
        ],
        detalles: [
            ['Proyectos', 'Explora el catálogo musical disponible.'],
            ['Producción', 'Consulta las sesiones y la agenda del estudio.'],
            ['Comunicación', 'Abre el asistente, disponible como demostración.'],
        ],
    },
    [ROLES.COLABORADOR]: {
        panel: 'ESPACIO DEL COLABORADOR',
        etiqueta: 'MI TRABAJO',
        titular: 'Coordina recursos y actividad del estudio.',
        descripcion: 'Accede a las áreas de equipo, salas, catálogo, agenda y seguimiento.',
        informacion: 'Herramientas de colaboración',
        tarjetas: [
            ['Equipo', 'Artistas y producción', 'Directorio del estudio'],
            ['Estudio', 'Salas y catálogo', 'Recursos de producción'],
            ['Seguimiento', 'Agenda y estadísticas', 'Actividad disponible'],
        ],
        detalles: [
            ['Equipo', 'Consulta las áreas de artistas y producción.'],
            ['Recursos', 'Revisa las sesiones, salas y el catálogo.'],
            ['Seguimiento', 'Accede a la agenda y las estadísticas disponibles.'],
        ],
    },
};

function renderizarNavegacion(nav, secciones, pagina_actual, rol) {
    nav.replaceChildren();
    nav.setAttribute('aria-label', `Navegación de ${rol.toLowerCase()}`);

    secciones.forEach((seccion) => {
        const grupo = document.createElement('div');
        grupo.className = 'sidebar-nav-group';

        const encabezado = document.createElement('p');
        encabezado.className = 'sidebar-nav-heading';
        encabezado.textContent = seccion.grupo;
        grupo.appendChild(encabezado);

        seccion.items.forEach((item) => {
            const enlace = document.createElement('a');
            enlace.className = 'nav-item';
            enlace.href = item.ruta;
            enlace.textContent = item.etiqueta;

            if (item.ruta === pagina_actual) {
                enlace.classList.add('active');
                enlace.setAttribute('aria-current', 'page');
            }

            grupo.appendChild(enlace);
        });

        nav.appendChild(grupo);
    });

    nav.dataset.ready = 'true';
}

function personalizarInicio(contenido) {
    const etiqueta_panel = document.getElementById('rolePanelLabel');
    const etiqueta_hero = document.getElementById('roleHeroLabel');
    const titular_hero = document.getElementById('roleHeroTitle');
    const descripcion = document.getElementById('roleDescription');
    const titular_informacion = document.getElementById('roleInfoTitle');

    if (etiqueta_panel) etiqueta_panel.textContent = contenido.panel;
    if (etiqueta_hero) etiqueta_hero.textContent = contenido.etiqueta;
    if (titular_hero) titular_hero.textContent = contenido.titular;
    if (descripcion) descripcion.textContent = contenido.descripcion;
    if (titular_informacion) titular_informacion.textContent = contenido.informacion;

    document.querySelectorAll('.summary-grid .summary-card').forEach((tarjeta, indice) => {
        const copy = contenido.tarjetas[indice];
        if (!copy) return;

        const [etiqueta, titular, detalle] = copy;
        const parrafo = tarjeta.querySelector('p');
        const valor = tarjeta.querySelector('strong');
        const nota = tarjeta.querySelector('.status, .card-note');

        if (parrafo) parrafo.textContent = etiqueta;
        if (valor) valor.textContent = titular;
        if (nota?.classList.contains('status')) {
            const indicador = nota.querySelector('i');
            nota.replaceChildren(indicador, document.createTextNode(` ${detalle}`));
        } else if (nota) {
            nota.textContent = detalle;
        }
    });

    document.querySelectorAll('.information-grid article').forEach((articulo, indice) => {
        const detalle = contenido.detalles[indice];
        if (!detalle) return;

        const [titular, texto] = detalle;
        const heading = articulo.querySelector('h4');
        const parrafo = articulo.querySelector('p');
        if (heading) heading.textContent = titular;
        if (parrafo) parrafo.textContent = texto;
    });
}

const usuario_actual = Auth.requierePanel('operaciones');

if (usuario_actual) {
    const nombre = usuario_actual.nombre;
    const rol = Auth.etiquetaRol(usuario_actual.rol);
    const secciones = NAVEGACION_POR_ROL[usuario_actual.rol];
    const contenido = CONTENIDO_POR_ROL[usuario_actual.rol];
    const nav = document.querySelector('.sidebar-nav');
    const pagina_actual = window.location.pathname.split('/').pop();
    const rutas_permitidas = secciones.flatMap((seccion) =>
        seccion.items.map((item) => item.ruta)
    );

    if (!rutas_permitidas.includes(pagina_actual)) {
        window.location.replace(RUTA_INICIO_POR_ROL[usuario_actual.rol]);
    } else if (nav) {
        renderizarNavegacion(nav, secciones, pagina_actual, rol);
    }

    if (pagina_actual === RUTA_INICIO_POR_ROL[usuario_actual.rol]) {
        personalizarInicio(contenido);
    }

    const saludo = document.getElementById('welcomeUser');
    const insignia = document.getElementById('userBadge');
    const etiqueta = document.getElementById('usuarioActual');
    const espacio_rol = document.getElementById('spaceRole');

    if (saludo) saludo.textContent = nombre;
    if (insignia) insignia.textContent = `${nombre} · ${rol}`;
    if (etiqueta) etiqueta.textContent = nombre;
    if (espacio_rol) espacio_rol.textContent = `Acceso de ${rol.toLowerCase()}`;

    const boton_logout = document.getElementById('btnLogout');
    boton_logout?.addEventListener('click', () => {
        Auth.cerrarSesion();
        window.location.href = 'login.html';
    });
}
