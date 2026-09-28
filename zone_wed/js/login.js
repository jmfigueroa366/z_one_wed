// login.js — Autenticación e inicio de sesión de Z-ONE
(function () {
    const form = document.getElementById('loginForm');
    const mensaje = document.getElementById('mensaje');
    const btn_login = document.getElementById('btnLogin');
    const btn_menu = document.getElementById('btnMenu');

    function resetLoginMessage() {
        if (!mensaje) return;
        mensaje.textContent = '';
        mensaje.className = 'mensaje';
    }

    function mostrarMensaje(texto, esError = false) {
        if (!mensaje) return;
        mensaje.textContent = texto;
        if (esError) {
            mensaje.className = 'mensaje error';
        } else {
            mensaje.className = 'mensaje';
        }
    }

    // Cuentas semilla por defecto
    const cuentasBase = [
        { nombre: 'Dirección Z-ONE', email: 'admin@z-one.com', password: 'admin123', rol: 'administrador', perfil: null },
        { nombre: 'Lúa Ferreira', email: 'lua@z-one.com', password: 'colab123', rol: 'colaborador', perfil: 'artista' },
        { nombre: 'Cliente Zeta', email: 'cliente@z-one.com', password: 'cliente123', rol: 'cliente', perfil: null }
    ];

    // Buscar una cuenta en todas las fuentes de almacenamiento posibles
    function buscarCuenta(identificador, password) {
        const busq = String(identificador || '').trim().toLowerCase();
        const pass = String(password || '').trim();

        let todas = [...cuentasBase];

        // 1. z_one.usuarios
        try {
            const rawZ = localStorage.getItem('z_one.usuarios');
            if (rawZ) {
                const arrZ = JSON.parse(rawZ);
                if (Array.isArray(arrZ)) todas = todas.concat(arrZ);
            }
        } catch (e) {}

        // 2. usuario_registrado
        try {
            const rawU = localStorage.getItem('usuario_registrado');
            if (rawU) {
                const arrU = JSON.parse(rawU);
                if (Array.isArray(arrU)) todas = todas.concat(arrU);
                else if (arrU && typeof arrU === 'object') todas.push(arrU);
            }
        } catch (e) {}

        for (const c of todas) {
            if (!c) continue;
            const matchNombre = c.nombre && String(c.nombre).trim().toLowerCase() === busq;
            const matchEmail = c.email && String(c.email).trim().toLowerCase() === busq;
            const matchPass = String(c.password || '').trim() === pass;

            if ((matchNombre || matchEmail) && matchPass) {
                return c;
            }
        }

        return null;
    }

    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const identificador = document.getElementById('usuario')?.value.trim() || '';
            const password = document.getElementById('password')?.value.trim() || '';

            // Obtener rol seleccionado en la interfaz
            const radioSeleccionado = document.querySelector('input[name="perfil"]:checked');
            let rolSeleccionado = radioSeleccionado?.value || document.getElementById('rol')?.value || '';

            resetLoginMessage();

            if (!identificador || !password) {
                mostrarMensaje('❌ Por favor ingresa tu usuario y contraseña', true);
                return;
            }

            if (btn_login) {
                btn_login.disabled = true;
                btn_login.textContent = 'Verificando...';
            }

            const cuenta = buscarCuenta(identificador, password);

            if (!cuenta) {
                mostrarMensaje('❌ Usuario o contraseña incorrectos', true);
                if (btn_login) {
                    btn_login.disabled = false;
                    btn_login.textContent = 'Iniciar sesión';
                }
                return;
            }

            // Si el usuario no seleccionó un rol o eligió otro, usar el rol de su cuenta
            if (!rolSeleccionado || rolSeleccionado !== cuenta.rol) {
                rolSeleccionado = cuenta.rol || 'cliente';
                const radio = document.querySelector(`input[name="perfil"][value="${rolSeleccionado}"]`);
                if (radio) radio.checked = true;
                const campoRol = document.getElementById('rol');
                if (campoRol) campoRol.value = rolSeleccionado;
            }

            // Guardar sesión en todos los formatos compatibles
            const sesion = {
                id: cuenta.id || Date.now(),
                nombre: cuenta.nombre || identificador,
                email: cuenta.email || '',
                rol: rolSeleccionado,
                perfil: cuenta.perfil || (rolSeleccionado === 'colaborador' ? 'artista' : null)
            };

            localStorage.setItem('z_one.sesion', JSON.stringify(sesion));
            localStorage.setItem('zone_usuario', sesion.nombre);
            localStorage.setItem('zone_rol_usuario', sesion.rol);
            localStorage.setItem('zone_perfil_usuario', JSON.stringify(sesion));

            // Redirigir al menú principal
            window.location.href = 'menu_principal.html';
        });
    }

    if (btn_menu) {
        btn_menu.setAttribute('href', 'index.html');
        btn_menu.setAttribute('data-role', 'menu');
    }
})();