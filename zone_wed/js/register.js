// Clave donde se conservan las cuentas creadas en este navegador.
const registered_user_key = 'usuario_registrado';

const form = document.getElementById('registerForm');
// Busca en el HTML el elemento con id="registerForm" (el formulario de registro)
// y lo guarda en la variable "form" para poder trabajar con él.

const register_message = document.getElementById('registerMessage');
// Busca el elemento con id="registerMessage" (normalmente un <p> o <span>)
// donde se mostrarán mensajes de error o éxito al usuario.

function obtenerUsuarioRegistrado() {
    try {
        const dato = localStorage.getItem(registered_user_key);
        if (!dato) return [];
        const usuarios = JSON.parse(dato);
        return Array.isArray(usuarios) ? usuarios : [usuarios];
    } catch (error) {
        return [];
        return [];
    }
}

if (form) {
    // Verifica que el formulario realmente exista en la página antes de
    // intentar usarlo. Esto evita errores si el script se carga en una 
    // página donde no hay formulario de registro.

    form.addEventListener('submit', function (e) {
        // Agrega un "escuchador de eventos" al formulario: cada vez que el 
        // usuario intente enviarlo (submit), se ejecutará esta función.
        // "e" es el objeto del evento que se genera automáticamente.

        e.preventDefault();
        // Evita el comportamiento por defecto del formulario, que sería
        // recargar la página. Así podemos manejar el envío con JavaScript.

        const nombre = document.getElementById('nombre').value.trim();
        // Obtiene el valor escrito en el campo con id="nombre",
        // y usa .trim() para eliminar espacios en blanco al inicio y al final.

        const email = document.getElementById('email').value.trim();
        // Igual que arriba, pero para el campo de correo electrónico.

        const password = document.getElementById('password').value.trim();
        const rol = document.getElementById('rol')?.value || 'cliente';
        const rol = document.getElementById('rol')?.value || 'cliente';
        // Igual que arriba, pero para el campo de contraseña.

        if (!nombre || !email || !password) {
            // Verifica si alguno de los tres campos quedó vacío 
            // (el signo "!" significa "si NO tiene valor / está vacío").

            if (register_message) {
                // Comprueba que exista el elemento donde mostrar el mensaje.

                register_message.textContent = 'Completa todos los campos.';
                // Muestra el mensaje de error al usuario.
            }
            return;
            // Detiene la ejecución de la función aquí: no continúa 
            // guardando datos si faltan campos.
        }

        const usuarios_existentes = obtenerUsuarioRegistrado();
        const nombre_normalizado = nombre.toLowerCase();
        const email_normalizado = email.toLowerCase();
        const usuario_duplicado = usuarios_existentes.some((usuario_existente) =>
            usuario_existente.nombre?.toLowerCase() === nombre_normalizado ||
            usuario_existente.email?.toLowerCase() === email_normalizado
        );
        const usuarios_existentes = obtenerUsuarioRegistrado();
        const nombre_normalizado = nombre.toLowerCase();
        const email_normalizado = email.toLowerCase();
        const usuario_duplicado = usuarios_existentes.some((usuario_existente) =>
            usuario_existente.nombre?.toLowerCase() === nombre_normalizado ||
            usuario_existente.email?.toLowerCase() === email_normalizado
        );

        if (usuario_duplicado) {
        if (usuario_duplicado) {
            if (register_message) {
                register_message.textContent = 'No se puede repetir el nombre ni el usuario/correo.';
                register_message.classList.add('error');
            }
            return;
        }

        const usuario = {
            nombre,
            email,
            password,
            rol
        };
        // Crea un objeto JavaScript llamado "usuario" que agrupa los tres
        // datos capturados. Es la forma abreviada de escribir:
        // { nombre: nombre, email: email, password: password }

        // JSON permite guardar varios campos dentro de una sola entrada.
        localStorage.setItem(registered_user_key, JSON.stringify([...usuarios_existentes, usuario]));
        // localStorage solo puede guardar texto (strings), por eso el objeto
        // "usuario" se convierte a texto en formato JSON con JSON.stringify().
        // Luego se guarda en el navegador usando la clave "usuario_registrado".

        window.location.href = 'login.html';
        // Redirige automáticamente al usuario a la página "login.html"
        // una vez que el registro fue guardado con éxito.
    });
}