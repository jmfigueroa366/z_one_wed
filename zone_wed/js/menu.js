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

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

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
        const panel_name = item.dataset.panel;

        sidebar_items.forEach(function (nav_item) {
            nav_item.classList.toggle('active', nav_item === item);
        });

        dashboard_views.forEach(function (view) {
            view.classList.toggle('active', view.dataset.view === panel_name);
        });

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
        }
    });
});
