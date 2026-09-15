
function guardarDato(clave, datos) {
    // localStorage solo acepta texto; JSON convierte el arreglo en texto.
    localStorage.setItem(clave, JSON.stringify(datos));
}

function obtenerDatos(clave) {
    // Al leer, JSON.parse reconstruye el arreglo original.
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : [];
}

/*Confirmación reutilizable para Guardar/Eliminar*/
function confirmarAccion(mensaje) {
    return window.confirm(mensaje);
}


/*CATALOGO MUSICAL (catalogo.html)*/

const CATALOGO_KEY = 'zone_catalogo';

const catalogoSeed = [
    {id: 'c1', titulo: 'Canción 1', artista: 'Artista 1', album: 'Álbum 1', tipo: 'cancion', duracion: '3:45', estado: 'publicado' },
    {id: 'c2', titulo: 'Canción 2', artista: 'Artista 2', album: 'Álbum 2', tipo: 'cancion', duracion: '4:20', estado: 'proceso' },
    {id: 'c3', titulo: 'Canción 3', artista: 'Artista 3', album: 'Álbum 3', tipo: 'cancion', duracion: '5:10', estado: 'publicado'},
    {id: 'c4', titulo: 'Canción 4', artista: 'Artista 4', album: 'Álbum 4', tipo: 'cancion', duracion: '3:30', estado: 'borrador' },
     ];
    
function inicializarCatalogo() {
    const tabla = document.getElementById('catalogoBody');
    if (!tabla) return; 

    if (obtenerDatos(CATALOGO_KEY).length === 0) {
        guardarDato(CATALOGO_KEY, catalogoSeed);
    }

    const form = document.getElementById('catalogoForm');
    const buscador = document.getElementById('catalogoBuscar');
    const chips = document.querySelectorAll('.filter-chip');
    let filtroTipo = 'todos';
    let filtroTexto = '';

    function pintarTabla() {
        const items = obtenerDatos(CATALOGO_KEY)
            .filter((it) => filtroTipo === 'todos' || it.tipo === filtroTipo)
            .filter((it) => {
                const q = filtroTexto.trim().toLowerCase();
                if (!q) return true;
                return (it.titulo + ' ' + it.artista + ' ' + it.album).toLowerCase().includes(q);
            });

        tabla.innerHTML = ' ';

        if (items.length === 0) {
            tabla.innerHTML = '<tr class="empty-row"><td colspan="5">No hay resultados</td></tr>';
            return;
        }

        items.forEach((it) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="track-title">${it.titulo}</span>
                    <span class="track-sub">${it.artista}</span>
                </td>
                <td>${it.album}</td>
                <td><span class="type-badge ${it.tipo}">${etiquetaTipo(it.tipo)}</span></td>
                <td>${it.duracion}</td>
                <td>
                    <span class="status-pill ${it.estado}">${etiquetaEstado(it.estado)}</span>
                </td>
                <td><button type="button" class="row-remove" data-id="${it.id}">Eliminar</button></td>
            `;
            tabla.appendChild(tr);
        });

        tabla.querySelectorAll('.row-remove').forEach((btn) => {
            btn.addEventListener('click', function () {
                if (!confirmarAccion('¿Deseas eliminar este elemento del catálogo?')) return;
                const restantes = obtenerDatos(CATALOGO_KEY).filter((it) => it.id !== btn.dataset.id);
                guardarDato(CATALOGO_KEY, restantes);
                pintarTabla();
            });
        });
    }
    
    function etiquetaTipo(tipo) {
        return {cancion: 'Canción', version: 'Versión', album: 'Álbum'} [ tipo ] || tipo;
    }

    function etiquetaEstado(estado) {
        return {publicado: 'Publicado', proceso: 'En proceso', borrador: 'Borrador'} [ estado ] || estado;
    }

    if (chips.length) {
        chips.forEach((chip) => {
            chip.addEventListener('click', function () {
                chips.forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                filtroTipo = chip.dataset.tipo;
                pintarTabla();
            });
        });
    }

    if(buscador) {
        buscador.addEventListener('input', function () {
            filtroTexto = buscador.value;
            pintarTabla();
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!confirmarAccion('¿Deseas guardar esta canción en el catálogo?')) return;

            const nuevo = {
                id: 'c' + Date.now(),
                titulo: document.getElementById('catTitulo').value.trim(),
                artista: document.getElementById('catArtista').value.trim(),
                album: document.getElementById('catAlbum').value.trim() || '-',
                tipo: document.getElementById('catTipo').value,
                duracion: document.getElementById('catDuracion').value.trim() || '-',
                estado: document.getElementById('catEstado').value,
            };

            const items = obtenerDatos(CATALOGO_KEY);
            items.unshift(nuevo);
            guardarDato(CATALOGO_KEY, items);
            form.reset();
            pintarTabla();
        });
    }

    pintarTabla();
}


/*SESIONES DE GRABACION (sesiones.html)*/

const SESIONES_KEY = 'zone_sesiones';
const CABINAS = ['Cabina A', 'Cabina B', 'Cabina C', 'Sala de Mezclas'];

const sesionesSeed = [
    {id: 's1', fecha: '2024-06-01', hora: '10:00', duracion: '1 hora', cabina: 'Cabina A', 
        artista: 'Artista 1', tipo: 'grabacion', estado: 'confirmada'},
    {id: 's2', fecha: '2024-06-02', hora: '14:00', duracion: '2 horas', cabina: 'Cabina B', 
        artista: 'Artista 2', tipo: 'mezcla', estado: 'pendiente'},
    {id: 's3', fecha: '2024-06-03', hora: '09:00', duracion: '1.5 horas', cabina: 'Cabina C', 
        artista: 'Artista 3', tipo: 'ensayo', estado: 'cancelada'},
    {id: 's4', fecha: '2024-06-04', hora: '11:00', duracion: '2 horas', cabina: 'Sala de Mezclas', 
        artista: 'Artista 4', tipo: 'grabacion', estado: 'confirmada'},
];

function inicializarSesiones() {
    const tabla = document.getElementById('sesionesBody');
    if (!tabla) return;

    if (obtenerDatos(SESIONES_KEY).length === 0) {
        guardarDato(SESIONES_KEY, sesionesSeed);
    }

    pintarCabinas();

    const form = document.getElementById('sesionForm');
    const chips = document.querySelectorAll('.filter-chip[data-estado]');
    let filtroEstado = 'todas';

    function ocupacionHoy (cabina) {
        const hoy = new Date().toISOString().slice(0, 10);
        return obtenerDatos(SESIONES_KEY).some(
            (s) => s.cabina === cabina && s.fecha === hoy && s.estado !== 'cancelada'
        );
    }

    function pintarCabinas() {
        const cont=document.getElementById('cabinGrid');
        if (!cont) return;
        cont.innerHTML =  CABINAS.map((cabina) => {
            const ocupada = ocupacionHoy(cabina);
            return `
                <div class="cabin-card">
                    <h4>${cabina}</h4>
                    <span class="cabin-status ${ocupada ? 'ocupada' : 'libre'}">${ocupada ? 'Ocupada Hoy' : 'Libre Hoy'}</span>
                    <p class="cabin-note">${ocupada ? 'Ya tiene una sesion agendada para hoy.' : 'Sin sesiones agendadas para hoy.'}</p>
                </div>
            `;
        }).join(' ');
    }

    function pintarTabla() {
        const items = obtenerDatos(SESIONES_KEY)
            .filter((s) => filtroEstado === 'todas' || s.estado === filtroEstado)
            .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

        tabla.innerHTML = '';

        if (items.length === 0) {
            tabla.innerHTML = '<tr class="empty-row"><td colspan="6">No hay resultados</td></tr>';
            return;
        }

        items.forEach((s) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <span class="session-when">${formatearFecha(s.fecha)} · ${s.hora}</span>
                    <span class="session-when-sub">${s.duracion}</span>
                </td>
                <td>${s.cabina}</td>
                <td>${s.artista}</td>
                <td><span class="session-type">${s.tipo}</span></td>
                    <span class="session-status ${s.estado}">${etiquetaEstadoSesion(s.estado)}</span>
                </td>
                <td><button type="button" class="row-remove" data-id="${s.id}">Eliminar</button></td>
            `;
            tabla.appendChild(tr);
        });

        tabla.querySelectorAll('.row-remove').forEach((btn) => {
            btn.addEventListener('click', function () {
                if (!confirmarAccion('¿Deseas eliminar esta sesión?')) return;
                const restantes = obtenerDatos(SESIONES_KEY).filter((s) => s.id !== btn.dataset.id);
                guardarDato(SESIONES_KEY, restantes);
                pintarTabla();
            });
        });
    }

    function formatearFecha(fecha) {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    }

    function etiquetaEstadoSesion(estado) {
        return {confirmada: 'Confirmada', pendiente: 'Pendiente', cancelada: 'Cancelada'}[estado] || estado;
    }

    if (chips.length) {
        chips.forEach((chip) => {
            chip.addEventListener('click', function () {
                chips.forEach((c) => c.classList.remove('active'));
                chip.classList.add('active');
                filtroEstado = chip.dataset.estado;
                pintarTabla();
            });
        });
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!confirmarAccion('¿Deseas guardar esta sesión?')) return;

            const nueva = {
                id: 's' + Date.now(),
                fecha: document.getElementById('sesFecha').value,
                hora: document.getElementById('sesHora').value,
                duracion: document.getElementById('sesDuracion').value.trim() || '-',
                cabina: document.getElementById('sesCabina').value,
                artista: document.getElementById('sesArtista').value.trim(),
                tipo: document.getElementById('sesTipo').value,
                estado: document.getElementById('sesEstado').value,
            };

            const items = obtenerDatos(SESIONES_KEY);
            items.push(nueva);
            guardarDato(SESIONES_KEY, items);
            form.reset();
            pintarTabla();
            pintarCabinas();
        });
    }

    pintarTabla();
}


/*AGENDA (agenda.html)*/

const AGENDA_KEY = 'zone_agenda';
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function fechaLocalISO(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function agendaSeed() {
    const hoy = new Date();
    const en = (offset) => {
        const d = new Date(hoy);
        d.setDate(d.getDate() + offset);
        return fechaLocalISO(d);
    };
    return [
        {id: 'a1', fecha: en(0), hora: '10:00', titulo: 'Reunión de equipo', tipo: 'Reunion' },
        {id: 'a2', fecha: en(2), hora: '14:00', titulo: 'Lanzamiento de Rojo', tipo: 'Lanzamineto' },
        {id: 'a3', fecha: en(3), hora: '09:00', titulo: 'Sesión de grabación', tipo: 'Grabación' },
        {id: 'a4', fecha: en(5), hora: '11:00', titulo: 'Revisión de mezclas', tipo: 'Mezcla' },
    ];
}

function inicializarAgenda() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    if (obtenerDatos(AGENDA_KEY).length === 0) {
        guardarDato(AGENDA_KEY, agendaSeed());
    }

    const hoy = new Date();
    let mesActual = hoy.getMonth();
    let anioActual = hoy.getFullYear();
    let diaSeleccionado = fechaLocalISO(hoy);

    const titulo = document.getElementById('calendarTitle');
    const lista = document.getElementById('eventList');
    const listaLabel = document.getElementById('eventListLabel');
    const form = document.getElementById('agendaForm');

    function eventosDe (fecha) {
        return obtenerDatos(AGENDA_KEY)
        .filter((e) => e.fecha === fecha)
        .sort((a, b) => a.hora.localeCompare(b.hora));
    }
        
    function pintarCalendario() {
        titulo.textContent = `${MESES[mesActual]} ${anioActual}`;

        const primerDia = new Date(anioActual, mesActual, 1);
        const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
        const offset = (primerDia.getDay() + 6) %7; //lunes = 0

        let html = DIAS_SEMANA.map((d) => `<div class="calendar-weekday">${d}</div>`).join('');

        for (let i=0; i < offset; i++) {
            html += '<div class ="calendar-day empty"></div>'; 
        }

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = fechaLocalISO(new Date(anioActual, mesActual, dia));
            const tieneEventos = eventosDe(fecha).length > 0;
            const esHoy = fecha === fechaLocalISO(hoy);
            const esSeleccionado = fecha === diaSeleccionado;

            html += `
                <div class="calendar-day ${esHoy ? 'today' : ''} ${esSeleccionado ? 'selected' : ''}" data-fecha="${fecha}">
                    <span class="day-num">${dia}</span>
                    ${tieneEventos ? '<span class="day-dot"></span>' : ''}
                </div>
            `;
        }

        grid.innerHTML = html;
 
        grid.querySelectorAll('.calendar-day[data-fecha]').forEach((celda) => {
            celda.addEventListener('click', function () {
                diaSeleccionado = celda.dataset.fecha;
                pintarCalendario();
                pintarLista();
            });
        });
    }

    function pintarLista() {
        const eventos = eventosDe(diaSeleccionado);
        const [y, m, d] = diaSeleccionado.split('-');
        listaLabel.textContent = `${d}/${m}/${y}`;

        if (eventos.length === 0) {
            lista.innerHTML = '<p class="field-hint">No hay eventos este día.</p>';
            return;
        }

         lista.innerHTML = eventos.map((e) => `
            <div class="event-item">
                <span class="event-time">${e.hora}</span>
                <div class="event-body">
                    <span class="event-title">${e.titulo}</span>
                    <span class="event-type">${e.tipo}</span>
                </div>
                <button type="button" class="row-remove" data-id="${e.id}">Eliminar</button>
            </div>
        `).join('');

        lista.querySelectorAll('.row-remove').forEach((btn) => {
            btn.addEventListener('click', function () {
                if (!confirmarAccion('¿Deseas eliminar este evento de la agenda?')) return;
                const restantes = obtenerDatos(AGENDA_KEY).filter((e) => e.id !== btn.dataset.id);
                guardarDato(AGENDA_KEY, restantes);
                pintarCalendario();
                pintarLista();
            });
        });
    }

    document.getElementById('prevMonth').addEventListener('click', function () {
        mesActual -=1;
        if (mesActual < 0) {
            mesActual = 11; anioActual -=1;
        }
        pintarCalendario();
    });

    document.getElementById('nextMonth').addEventListener('click', function () {
        mesActual +=1;
        if (mesActual > 11) {
            mesActual = 0; anioActual +=1;
        }
        pintarCalendario();
    });

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!confirmarAccion('¿Deseas guardar este evento en la agenda?')) return;

            const nueva = {
                id: 'a' + Date.now(),
                fecha: document.getElementById('agFecha').value,
                hora: document.getElementById('agHora').value,
                titulo: document.getElementById('agTitulo').value.trim(),
                tipo: document.getElementById('agTipo').value,
            };

            const items = obtenerDatos(AGENDA_KEY);
            items.push(nueva);
            guardarDato(AGENDA_KEY, items);

            diaSeleccionado = nueva.fecha;
            mesActual = Number(nueva.fecha.split('-')[1]) - 1;
            anioActual = Number(nueva.fecha.split('-')[0]);


            form.reset();
            pintarCalendario();
            pintarLista();
        });
    }

    pintarCalendario();
    pintarLista();
}

document.addEventListener('DOMContentLoaded', function () {
    inicializarCatalogo();
    inicializarSesiones();
    inicializarAgenda();
});

