import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';

const session_key = 'zone_usuario';
const profile_key = 'zone_perfil_usuario';
const user_badge = document.getElementById('userBadge');
const welcome_user = document.getElementById('welcomeUser');
const btn_logout = document.getElementById('btnLogout');
const user_form = document.getElementById('userForm');
const resumen_usuario = document.getElementById('resumenUsuario');
const menu_buttons = document.querySelectorAll('.btn-primary, .btn-logout');
const sidebar_items = document.querySelectorAll('.nav-item');
const dashboard_shell = document.querySelector('.dashboard-shell');
const sidebar_toggle = document.getElementById('sidebarToggle');
const drawer_toggle = document.getElementById('drawerToggle');
const drawer_backdrop = document.getElementById('drawerBackdrop');
const dashboard_views = document.querySelectorAll('.dashboard-view');
const field_toggles = document.querySelectorAll('.field-toggle');
const reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const artist_form = document.getElementById('artistForm');
const production_form = document.getElementById('productionForm');
const artist_storage_key = 'zone_artistas';
const production_storage_key = 'zone_producciones';

function obtenerRegistros(clave, valoresIniciales) {
    const registros = JSON.parse(localStorage.getItem(clave) || 'null');
    if (Array.isArray(registros)) return registros;

    localStorage.setItem(clave, JSON.stringify(valoresIniciales));
    return valoresIniciales;
}

function guardarRegistros(clave, registros) {
    localStorage.setItem(clave, JSON.stringify(registros));
}

function pintarArtistas() {
    const contenedor = document.querySelector('#panel-artistas .record-grid');
    if (!contenedor) return;

    const artistas = obtenerRegistros(artist_storage_key, [
        { nombre: 'Nova Lima', rol: 'Artista principal' },
        { nombre: 'Leo Norte', rol: 'Productor invitado' },
        { nombre: 'Alma Beats', rol: 'Proyecto independiente' }
    ]);

    contenedor.innerHTML = artistas.map((artista) => `
        <article class="record-card"><strong>${artista.nombre}</strong><span>${artista.rol}</span></article>
    `).join('');
}

function pintarProducciones() {
    const contenedor = document.querySelector('#panel-produccion .production-list');
    if (!contenedor) return;

    const producciones = obtenerRegistros(production_storage_key, [
        { nombre: 'Beat Session', etapa: 'Grabación y arreglos', avance: 92 },
        { nombre: 'Master final', etapa: 'Mezcla y masterización', avance: 78 },
        { nombre: 'Campaña de lanzamiento', etapa: 'Promoción y distribución', avance: 64 }
    ]);

    contenedor.innerHTML = producciones.map((produccion) => `
        <div class="production-item">
            <span class="production-icon" aria-hidden="true">♪</span>
            <div><strong>${produccion.nombre}</strong><small>${produccion.etapa}</small></div>
            <span class="production-progress">${produccion.avance}%</span>
        </div>
    `).join('');
}

pintarArtistas();
pintarProducciones();

if (artist_form) {
    artist_form.addEventListener('submit', function (event) {
        event.preventDefault();
        const artistas = obtenerRegistros(artist_storage_key, []);
        artistas.push({
            nombre: document.getElementById('artistName').value.trim(),
            rol: document.getElementById('artistRole').value
        });
        guardarRegistros(artist_storage_key, artistas);
        artist_form.reset();
        pintarArtistas();
    });
}

if (production_form) {
    production_form.addEventListener('submit', function (event) {
        event.preventDefault();
        const producciones = obtenerRegistros(production_storage_key, []);
        producciones.push({
            nombre: document.getElementById('productionName').value.trim(),
            etapa: document.getElementById('productionStage').value.trim(),
            avance: Number(document.getElementById('productionProgress').value)
        });
        guardarRegistros(production_storage_key, producciones);
        production_form.reset();
        pintarProducciones();
    });
}

function animateView(view) {
    if (reduced_motion || !view) return;

    const cards = view.querySelectorAll('.panel-card, .summary-card, .record-card, .report-grid div');
    const icons = view.querySelectorAll('.card-icon, .production-icon, .report-grid strong');

    animate(view, {
        opacity: [0, 1],
        scale: [0.97, 1],
        duration: 520,
        ease: 'out(4)'
    });

    animate(cards, {
        opacity: [0, 1],
        y: [24, 0],
        delay: stagger(70),
        duration: 650,
        ease: 'out(4)'
    });

    animate(icons, {
        rotate: ['-18deg', '0deg'],
        scale: [0.7, 1],
        delay: stagger(90),
        duration: 700,
        ease: 'out(4)'
    });
}

if (!reduced_motion) {
    animate(sidebar_items, {
        opacity: [0, 1],
        x: [-18, 0],
        delay: stagger(90),
        duration: 550,
        ease: 'out(3)'
    });

    animate(menu_buttons, {
        opacity: [0, 1],
        y: [-12, 0],
        delay: stagger(100),
        duration: 600,
        ease: 'out(3)'
    });

    animate(document.querySelector('.sidebar-brand'), {
        opacity: [0, 1],
        x: [-24, 0],
        duration: 700,
        ease: 'out(4)'
    });

    animate(document.querySelector('.brand-mark'), {
        rotate: ['-12deg', '0deg'],
        scale: [0.7, 1],
        duration: 900,
        ease: 'outElastic(1, .6)'
    });

    animateView(document.querySelector('.dashboard-view.active'));

    animate(document.querySelector('.summary-card-primary'), {
        scale: [1, 1.025, 1],
        duration: 2200,
        loop: true,
        ease: 'inOutSine'
    });
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

// zone_usuario contiene el nombre del usuario que inició sesión.
const usuario_guardado = localStorage.getItem(session_key);
if (!usuario_guardado) {
    redirectToLogin();
} else {
    if (user_badge) user_badge.textContent = usuario_guardado;
    if (welcome_user) welcome_user.textContent = usuario_guardado;
    if (resumen_usuario) resumen_usuario.textContent = usuario_guardado;
}

const perfil_guardado = JSON.parse(localStorage.getItem(profile_key) || '{}');
if (user_form) {
    if (perfil_guardado.nombreUsuario) {
        document.getElementById('nombreUsuario').value = perfil_guardado.nombreUsuario;
    }
    if (perfil_guardado.emailUsuario) {
        document.getElementById('emailUsuario').value = perfil_guardado.emailUsuario;
    }
    if (perfil_guardado.rolUsuario) {
        document.getElementById('rolUsuario').value = perfil_guardado.rolUsuario;
    }

    user_form.addEventListener('submit', function (e) {
        e.preventDefault();

        const perfil = {
            nombreUsuario: document.getElementById('nombreUsuario').value.trim(),
            emailUsuario: document.getElementById('emailUsuario').value.trim(),
            rolUsuario: document.getElementById('rolUsuario').value
        };

        localStorage.setItem(profile_key, JSON.stringify(perfil));
        if (welcome_user) welcome_user.textContent = perfil.nombreUsuario || usuario_guardado;
    });
}

if (btn_logout) {
    btn_logout.addEventListener('click', function () {
        localStorage.removeItem(session_key);
        localStorage.removeItem(profile_key);
        redirectToLogin();
    });
}

sidebar_items.forEach(function (item) {
    item.addEventListener('click', function () {
        if (item.tagName === 'A') return;

        const panel_name = item.dataset.panel;

        sidebar_items.forEach(function (nav_item) {
            nav_item.classList.toggle('active', nav_item === item);
        });

        dashboard_views.forEach(function (view) {
            view.classList.toggle('active', view.dataset.view === panel_name);
        });

        animateView(document.querySelector('[data-view="' + panel_name + '"]'));

        if (window.matchMedia('(max-width: 700px)').matches) {
            dashboard_shell.classList.remove('drawer-open');
            drawer_toggle.setAttribute('aria-expanded', 'false');
        }
    });
});

if (sidebar_toggle) {
    sidebar_toggle.addEventListener('click', function () {
        const collapsed = dashboard_shell.classList.toggle('sidebar-collapsed');
        sidebar_toggle.setAttribute('aria-expanded', String(!collapsed));
        sidebar_toggle.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Colapsar menú');
    });
}

function toggleDrawer() {
    const opened = dashboard_shell.classList.toggle('drawer-open');
    drawer_toggle.setAttribute('aria-expanded', String(opened));
}

if (drawer_toggle) drawer_toggle.addEventListener('click', toggleDrawer);
if (drawer_backdrop) drawer_backdrop.addEventListener('click', toggleDrawer);

field_toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function () {
        const current_panel = toggle.parentElement;
        const was_open = current_panel.classList.contains('open');

        document.querySelectorAll('.field-panel').forEach(function (panel) {
            panel.classList.remove('open');
            panel.querySelector('.field-toggle').setAttribute('aria-expanded', 'false');
        });

        if (!was_open) {
            current_panel.classList.add('open');
            toggle.setAttribute('aria-expanded', 'true');

            if (!reduced_motion) {
                animate(current_panel.querySelector('.field-content'), {
                    opacity: [0, 1],
                    scaleY: [0.8, 1],
                    duration: 360,
                    ease: 'out(4)'
                });
            }
        }
    });
});
