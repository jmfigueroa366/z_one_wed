/* interacciones.js — Persona B
   Como todavía no existe guardado.js (Persona A no lo ha creado), este
   archivo trae sus propias funciones genéricas de guardado con
   localStorage, para no bloquear el trabajo. Cuando exista guardado.js
   real, estas dos funciones se pueden borrar de aquí y usar las suyas.
*/
 
function guardarDato(clave, datos) {
    localStorage.setItem(clave, JSON.stringify(datos));
}
 
function obtenerDatos(clave) {
    const crudo = localStorage.getItem(clave);
    return crudo ? JSON.parse(crudo) : [];
}
 
/* Confirmación simple reutilizable para Guardar / Eliminar,
   pedida en el plan de trabajo para las pantallas de Persona B. */
function confirmarAccion(mensaje) {
    return window.confirm(mensaje);
}
 
/* ---------------------------------------------------------
   Catálogo musical (catalogo.html)
--------------------------------------------------------- */
const CATALOGO_KEY = 'zone_catalogo';
 

const catalogoSeed = [
    { id: 'c1', titulo: 'Midnight Echo', artista: 'Lúa Ferreira', album: 'Nocturno', tipo: 'cancion', duracion: '3:24', estado: 'publicado' },
    { id: 'c2', titulo: 'Midnight Echo (VIP Mix)', artista: 'Lúa Ferreira', album: 'Nocturno', tipo: 'version', duracion: '4:02', estado: 'proceso' },
    { id: 'c3', titulo: 'Nocturno', artista: 'Lúa Ferreira', album: '—', tipo: 'album', duracion: '38:10', estado: 'publicado' },
    { id: 'c4', titulo: 'Rio Seco', artista: 'Batey Norte', album: 'Batey Norte EP', tipo: 'cancion', duracion: '2:58', estado: 'borrador' },
];
 
function inicializarCatalogo() {
    const tabla = document.getElementById('catalogoBody');
    if (!tabla) return; // no estamos en catalogo.html
 
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
 
        tabla.innerHTML = '';
 
        if (items.length === 0) {
            tabla.innerHTML = '<tr class="empty-row"><td colspan="5">No hay elementos con este filtro todavía.</td></tr>';
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
        return { cancion: 'Canción', version: 'Versión', album: 'Álbum' }[tipo] || tipo;
    }
 
    function etiquetaEstado(estado) {
        return { publicado: 'Publicado', proceso: 'En proceso', borrador: 'Borrador' }[estado] || estado;
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
 
    if (buscador) {
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
                album: document.getElementById('catAlbum').value.trim() || '—',
                tipo: document.getElementById('catTipo').value,
                duracion: document.getElementById('catDuracion').value.trim() || '—',
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
 
/* ---------------------------------------------------------
   Sesiones de grabación (sesiones.html)
--------------------------------------------------------- */
const SESIONES_KEY = 'zone_sesiones';
const CABINAS = ['Cabina A', 'Cabina B', 'Cabina C', 'Sala de mezcla'];
 
const sesionesSeed = [
    { id: 's1', fecha: '2026-09-15', hora: '10:00', duracion: '2h', cabina: 'Cabina A', artista: 'Lúa Ferreira', tipo: 'Grabación', estado: 'confirmada' },
    { id: 's2', fecha: '2026-09-15', hora: '15:00', duracion: '3h', cabina: 'Sala de mezcla', artista: 'Batey Norte', tipo: 'Mezcla', estado: 'pendiente' },
    { id: 's3', fecha: '2026-09-16', hora: '09:00', duracion: '1h 30m', cabina: 'Cabina B', artista: 'Lúa Ferreira', tipo: 'Masterización', estado: 'confirmada' },
    { id: 's4', fecha: '2026-09-12', hora: '18:00', duracion: '2h', cabina: 'Cabina A', artista: 'Ecos del Sur', tipo: 'Grabación', estado: 'cancelada' },
];
 
function inicializarSesiones() {
    const tabla = document.getElementById('sesionesBody');
    if (!tabla) return; // no estamos en sesiones.html
 
    if (obtenerDatos(SESIONES_KEY).length === 0) {
        guardarDato(SESIONES_KEY, sesionesSeed);
    }
 
    pintarCabinas();
 
    const form = document.getElementById('sesionForm');
    const chips = document.querySelectorAll('.filter-chip[data-estado]');
    let filtroEstado = 'todas';
 
    function ocupacionHoy(cabina) {
        const hoy = new Date().toISOString().slice(0, 10);
        return obtenerDatos(SESIONES_KEY).some(
            (s) => s.cabina === cabina && s.fecha === hoy && s.estado !== 'cancelada'
        );
    }
 
    function pintarCabinas() {
        const cont = document.getElementById('cabinGrid');
        if (!cont) return;
        cont.innerHTML = CABINAS.map((cabina) => {
            const ocupada = ocupacionHoy(cabina);
            return `
                <div class="cabin-card">
                    <h4>${cabina}</h4>
                    <span class="cabin-status ${ocupada ? 'ocupada' : 'libre'}">${ocupada ? 'Ocupada hoy' : 'Libre hoy'}</span>
                    <p class="cabin-note">${ocupada ? 'Ya tiene una sesión agendada para hoy.' : 'Sin sesiones agendadas para hoy.'}</p>
                </div>
            `;
        }).join('');
    }
 
    function pintarTabla() {
        const items = obtenerDatos(SESIONES_KEY)
            .filter((s) => filtroEstado === 'todas' || s.estado === filtroEstado)
            .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));
 
        tabla.innerHTML = '';
 
        if (items.length === 0) {
            tabla.innerHTML = '<tr class="empty-row"><td colspan="6">No hay sesiones con este filtro todavía.</td></tr>';
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
                <td><span class="session-status ${s.estado}">${etiquetaEstadoSesion(s.estado)}</span></td>
                <td><button type="button" class="row-remove" data-id="${s.id}">Eliminar</button></td>
            `;
            tabla.appendChild(tr);
        });
 
        tabla.querySelectorAll('.row-remove').forEach((btn) => {
            btn.addEventListener('click', function () {
                if (!confirmarAccion('¿Deseas eliminar esta sesión de la agenda de cabinas?')) return;
                const restantes = obtenerDatos(SESIONES_KEY).filter((s) => s.id !== btn.dataset.id);
                guardarDato(SESIONES_KEY, restantes);
                pintarTabla();
                pintarCabinas();
            });
        });
    }
 
    function formatearFecha(fecha) {
        const [y, m, d] = fecha.split('-');
        return `${d}/${m}/${y}`;
    }
 
    function etiquetaEstadoSesion(estado) {
        return { confirmada: 'Confirmada', pendiente: 'Pendiente', cancelada: 'Cancelada' }[estado] || estado;
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
                duracion: document.getElementById('sesDuracion').value.trim() || '—',
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
 
/* ---------------------------------------------------------
   Agenda / calendario (agenda.html)
--------------------------------------------------------- */
const AGENDA_KEY = 'zone_agenda';
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
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
        { id: 'a1', fecha: en(0), hora: '11:00', titulo: 'Reunión de repertorio', tipo: 'Reunión' },
        { id: 'a2', fecha: en(2), hora: '20:00', titulo: 'Lanzamiento "Rio Seco"', tipo: 'Lanzamiento' },
        { id: 'a3', fecha: en(3), hora: '10:00', titulo: 'Sesión Lúa Ferreira', tipo: 'Sesión' },
        { id: 'a4', fecha: en(9), hora: '16:00', titulo: 'Entrevista con medio local', tipo: 'Otro' },
    ];
}
function inicializarAgenda() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return; // no estamos en agenda.html
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
    function eventosDe(fecha) {
        return obtenerDatos(AGENDA_KEY)
            .filter((e) => e.fecha === fecha)
            .sort((a, b) => a.hora.localeCompare(b.hora));
    }
    function pintarCalendario() {
        titulo.textContent = `${MESES[mesActual]} ${anioActual}`;
        const primerDia = new Date(anioActual, mesActual, 1);
        const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
        const offset = (primerDia.getDay() + 6) % 7; // lunes = 0
        let html = DIAS_SEMANA.map((d) => `<div class="calendar-weekday">${d}</div>`).join('');
        for (let i = 0; i < offset; i++) {
            html += '<div class="calendar-day empty"></div>';
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
        mesActual -= 1;
        if (mesActual < 0) { mesActual = 11; anioActual -= 1; }
        pintarCalendario();
    });
    document.getElementById('nextMonth').addEventListener('click', function () {
        mesActual += 1;
        if (mesActual > 11) { mesActual = 0; anioActual += 1; }
        pintarCalendario();
    });
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!confirmarAccion('¿Deseas guardar este evento en la agenda?')) return;
            const nuevo = {
                id: 'a' + Date.now(),
                fecha: document.getElementById('agFecha').value,
                hora: document.getElementById('agHora').value,
                titulo: document.getElementById('agTitulo').value.trim(),
                tipo: document.getElementById('agTipo').value,
            };
            const items = obtenerDatos(AGENDA_KEY);
            items.push(nuevo);
            guardarDato(AGENDA_KEY, items);
            diaSeleccionado = nuevo.fecha;
            mesActual = Number(nuevo.fecha.split('-')[1]) - 1;
            anioActual = Number(nuevo.fecha.split('-')[0]);
            form.reset();
            pintarCalendario();
            pintarLista();
        });
    }
     pintarCalendario()
    pintarLista();
}
 
/* ---------------------------------------------------------
   Panel de Estadísticas (estadisticas.html)
--------------------------------------------------------- */
function asegurarDatosDemo() {
    if (obtenerDatos(CATALOGO_KEY).length === 0) guardarDato(CATALOGO_KEY, catalogoSeed);
    if (obtenerDatos(SESIONES_KEY).length === 0) guardarDato(SESIONES_KEY, sesionesSeed);
    if (obtenerDatos(AGENDA_KEY).length === 0) guardarDato(AGENDA_KEY, agendaSeed());
}
 
function inicializarEstadisticas() {
    const cont = document.getElementById('kpiGrid');
    if (!cont) return; // no estamos en estadisticas.html
 
    asegurarDatosDemo();
 
    const catalogo = obtenerDatos(CATALOGO_KEY);
    const sesiones = obtenerDatos(SESIONES_KEY);
    const agenda = obtenerDatos(AGENDA_KEY);
 
    /* KPIs */
    const totalCatalogo = catalogo.length;
    const publicadas = catalogo.filter((c) => c.estado === 'publicado').length;
    const pctPublicado = totalCatalogo ? Math.round((publicadas / totalCatalogo) * 100) : 0;
    const sesionesConfirmadas = sesiones.filter((s) => s.estado === 'confirmada').length;
 
    const hoy = new Date();
    const en7dias = new Date(hoy);
    en7dias.setDate(en7dias.getDate() + 7);
    const proximosEventos = agenda.filter((e) => {
        const f = new Date(e.fecha + 'T00:00:00');
        return f >= new Date(fechaLocalISO(hoy) + 'T00:00:00') && f <= en7dias;
    }).length;
 
    document.getElementById('kpiGrid').innerHTML = `
        <div class="kpi-card"><span>Canciones en catálogo</span><strong>${totalCatalogo}</strong></div>
        <div class="kpi-card"><span>% publicado</span><strong>${pctPublicado}%</strong></div>
        <div class="kpi-card"><span>Sesiones confirmadas</span><strong>${sesionesConfirmadas}</strong></div>
        <div class="kpi-card"><span>Eventos próximos 7 días</span><strong>${proximosEventos}</strong></div>
    `;
 
    /* Catálogo por tipo (barras verticales) */
    const tipos = ['cancion', 'version', 'album'];
    const etiquetasTipo = { cancion: 'Canciones', version: 'Versiones', album: 'Álbumes' };
    const conteoTipos = tipos.map((t) => catalogo.filter((c) => c.tipo === t).length);
    const maxTipo = Math.max(1, ...conteoTipos);
 
    document.getElementById('vbarChart').innerHTML = tipos.map((t, i) => `
        <div class="vbar">
            <div class="vbar-fill-wrap">
                <div class="vbar-fill" style="height:${(conteoTipos[i] / maxTipo) * 100}%"></div>
            </div>
            <span class="vbar-value">${conteoTipos[i]}</span>
            <span class="vbar-label">${etiquetasTipo[t]}</span>
        </div>
    `).join('');
 
    /* Catálogo por estado (barras horizontales) */
    const estados = ['publicado', 'proceso', 'borrador'];
    const etiquetasEstado = { publicado: 'Publicado', proceso: 'En proceso', borrador: 'Borrador' };
    document.getElementById('hbarEstados').innerHTML = estados.map((es) => {
        const n = catalogo.filter((c) => c.estado === es).length;
        const pct = totalCatalogo ? Math.round((n / totalCatalogo) * 100) : 0;
        return `
            <div class="hbar-row">
                <span>${etiquetasEstado[es]}</span>
                <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%"></div></div>
                <span>${n}</span>
            </div>
        `;
    }).join('');
 
    /* Sesiones por cabina (barras horizontales) */
    const maxSesionesCabina = Math.max(1, ...CABINAS.map((c) => sesiones.filter((s) => s.cabina === c).length));
    document.getElementById('hbarCabinas').innerHTML = CABINAS.map((cabina) => {
        const n = sesiones.filter((s) => s.cabina === cabina).length;
        const pct = Math.round((n / maxSesionesCabina) * 100);
        return `
            <div class="hbar-row">
                <span>${cabina}</span>
                <div class="hbar-track"><div class="hbar-fill" style="width:${pct}%"></div></div>
                <span>${n}</span>
            </div>
        `;
    }).join('');
 
    /* Próximos eventos de agenda */
    const proximos = agenda
        .filter((e) => new Date(e.fecha + 'T00:00:00') >= new Date(fechaLocalISO(hoy) + 'T00:00:00'))
        .sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora))
        .slice(0, 5);
 
    const listaProximos = document.getElementById('upcomingList');
    listaProximos.innerHTML = proximos.length
        ? proximos.map((e) => {
            const [y, m, d] = e.fecha.split('-');
            return `
                <div class="upcoming-item">
                    <span>${e.titulo}</span>
                    <span class="upcoming-date">${d}/${m} · ${e.hora}</span>
                </div>
            `;
        }).join('')
        : '<p class="field-hint">No hay eventos próximos.</p>';
}
 
/* ---------------------------------------------------------
   Chatbot — interfaz visual (chatbot.html)
   Como dice el plan de trabajo: sin lógica real de clasificación,
   solo una respuesta fija de ejemplo (aquí, elegida al azar entre
   unas pocas para que se sienta menos robótico en la demo).
--------------------------------------------------------- */
const CHAT_KEY = 'zone_chat';
 
const RESPUESTAS_EJEMPLO = [
    'Todavía soy una maqueta visual, no estoy conectado a ninguna lógica real. Pero en la versión final podría contarte esto por ti.',
    'Buena pregunta. Cuando esté conectado al sistema real, voy a poder responder cosas como esa consultando el catálogo o la agenda.',
    'Por ahora solo simulo una conversación para la sustentación — esta respuesta no depende de lo que escribiste.',
];
 
function horaActual() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}
 
function chatSeed() {
    return [
        { id: 'm1', autor: 'bot', texto: 'Hola, soy el asistente de Z-ONE. Preguntame algo sobre artistas, catálogo o sesiones.', hora: horaActual() },
    ];
}
 
function inicializarChatbot() {
    const ventana = document.getElementById('chatMessages');
    if (!ventana) return; // no estamos en chatbot.html
 
    if (obtenerDatos(CHAT_KEY).length === 0) {
        guardarDato(CHAT_KEY, chatSeed());
    }
 
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
 
    function pintarMensajes() {
        const mensajes = obtenerDatos(CHAT_KEY);
        ventana.innerHTML = mensajes.map((m) => `
            <div class="chat-bubble ${m.autor}">
                ${m.texto}
                <span class="chat-bubble-time">${m.hora}</span>
            </div>
        `).join('');
        ventana.scrollTop = ventana.scrollHeight;
    }
 
    function enviarMensaje(texto) {
        const limpio = texto.trim();
        if (!limpio) return;
 
        const mensajes = obtenerDatos(CHAT_KEY);
        mensajes.push({ id: 'm' + Date.now(), autor: 'user', texto: limpio, hora: horaActual() });
        guardarDato(CHAT_KEY, mensajes);
        pintarMensajes();
 
        // "Escribiendo…" simulado, luego la respuesta fija de ejemplo
        const typing = document.createElement('div');
        typing.className = 'chat-typing';
        typing.innerHTML = '<span></span><span></span><span></span>';
        ventana.appendChild(typing);
        ventana.scrollTop = ventana.scrollHeight;
 
        setTimeout(function () {
            typing.remove();
            const respuesta = RESPUESTAS_EJEMPLO[Math.floor(Math.random() * RESPUESTAS_EJEMPLO.length)];
            const actuales = obtenerDatos(CHAT_KEY);
            actuales.push({ id: 'm' + Date.now(), autor: 'bot', texto: respuesta, hora: horaActual() });
            guardarDato(CHAT_KEY, actuales);
            pintarMensajes();
        }, 650);
    }
 
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            enviarMensaje(input.value);
            input.value = '';
            input.focus();
        });
    }
 
    document.querySelectorAll('.chat-suggestion').forEach((btn) => {
        btn.addEventListener('click', function () {
            enviarMensaje(btn.textContent);
        });
    });
 
    pintarMensajes();
}
 
/* ---------------------------------------------------------
   Artistas (artistas.html) — borrador funcional de Persona B
   para que la pantalla no quede rota; Persona A puede
   reemplazar esta lógica por la suya cuando la tenga lista.
--------------------------------------------------------- */
const ARTISTAS_KEY = 'zone_artistas';
 
function inicializarArtistas() {
    const grid = document.getElementById('artistasGrid');
    const form = document.getElementById('artistForm');
    if (!grid || !form) return; // no estamos en artistas.html
 
    if (obtenerDatos(ARTISTAS_KEY).length === 0) {
        guardarDato(ARTISTAS_KEY, [
            { nombre: 'Nova Lima', rol: 'Artista principal' },
            { nombre: 'Leo Norte', rol: 'Productor invitado' },
            { nombre: 'Alma Beats', rol: 'Proyecto independiente' },
        ]);
    }
 
    function pintar() {
        grid.innerHTML = obtenerDatos(ARTISTAS_KEY).map((a) => `
            <article class="record-card"><strong>${a.nombre}</strong><span>${a.rol}</span></article>
        `).join('');
    }
 
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('artistName').value.trim(),
            rol: document.getElementById('artistRole').value,
        };
        const items = obtenerDatos(ARTISTAS_KEY);
        items.push(nuevo);
        guardarDato(ARTISTAS_KEY, items);
        form.reset();
        pintar();
    });
 
    pintar();
}
 
/* ---------------------------------------------------------
   Productores (productores.html) — borrador funcional de Persona B
--------------------------------------------------------- */
const PRODUCTORES_KEY = 'zone_productores';
 
function inicializarProductores() {
    const grid = document.getElementById('productoresGrid');
    const form = document.getElementById('productorForm');
    if (!grid || !form) return; // no estamos en productores.html
 
    if (obtenerDatos(PRODUCTORES_KEY).length === 0) {
        guardarDato(PRODUCTORES_KEY, [
            { nombre: 'Marco Reyes', especialidad: 'Mezcla' },
            { nombre: 'Diana Cobos', especialidad: 'Masterización' },
            { nombre: 'Iker Salas', especialidad: 'Grabación' },
        ]);
    }
 
    function pintar() {
        grid.innerHTML = obtenerDatos(PRODUCTORES_KEY).map((p) => `
            <article class="record-card"><strong>${p.nombre}</strong><span>${p.especialidad}</span></article>
        `).join('');
    }
 
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nuevo = {
            nombre: document.getElementById('productorName').value.trim(),
            especialidad: document.getElementById('productorEspecialidad').value,
        };
        const items = obtenerDatos(PRODUCTORES_KEY);
        items.push(nuevo);
        guardarDato(PRODUCTORES_KEY, items);
        form.reset();
        pintar();
    });
 
    pintar();
}
 
/* ---------------------------------------------------------
   Configuración (configuracion.html) — acordeón de tipos de campo
--------------------------------------------------------- */
function inicializarAcordeon() {
    const acordeon = document.getElementById('fieldAccordion');
    if (!acordeon) return; // no estamos en configuracion.html
 
    acordeon.querySelectorAll('.field-toggle').forEach((btn) => {
        btn.addEventListener('click', function () {
            const panel = btn.closest('.field-panel');
            const abierto = panel.classList.toggle('open');
            btn.setAttribute('aria-expanded', abierto ? 'true' : 'false');
        });
    });
}
 
document.addEventListener('DOMContentLoaded', function () {
    inicializarCatalogo();
    inicializarSesiones();
    inicializarAgenda();
    inicializarEstadisticas();
    inicializarChatbot();
    inicializarArtistas();
    inicializarProductores();
    inicializarAcordeon();
});
 