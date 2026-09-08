const session_key = 'zone_usuario';
const profile_key = 'zone_perfil_usuario';
const user_badge = document.getElementById('userBadge');
const welcome_user = document.getElementById('welcomeUser');
const btn_logout = document.getElementById('btnLogout');
const user_form = document.getElementById('userForm');
const resumen_usuario = document.getElementById('resumenUsuario');

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
