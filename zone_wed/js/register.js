// Clave donde se conserva la cuenta creada en este navegador.
const registered_user_key = 'usuario_registrado'; 
// Guarda el nombre de la "clave" que se usará en localStorage para 
// almacenar los datos del usuario registrado. Usar una constante evita 
// errores de tipeo si se repite el nombre en otras partes del código.

const form = document.getElementById('registerForm');
// Busca en el HTML el elemento con id="registerForm" (el formulario de registro)
// y lo guarda en la variable "form" para poder trabajar con él.

const register_message = document.getElementById('registerMessage');
// Busca el elemento con id="registerMessage" (normalmente un <p> o <span>)
// donde se mostrarán mensajes de error o éxito al usuario.

function obtenerUsuarioRegistrado() {
    try {
        const dato = localStorage.getItem('usuario_registrado');
        if (!dato) return null;
        const usuario = JSON.parse(dato);
        return usuario && typeof usuario === 'object' ? usuario : null;
    } catch (error) {
        return null;
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
        const rol = document.getElementById('rol')?.value || 'productor';
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

        const usuario_existente = obtenerUsuarioRegistrado();
        const nombre_duplicado = usuario_existente &&
            usuario_existente.nombre &&
            usuario_existente.nombre.toLowerCase() === nombre.toLowerCase();
        const email_duplicado = usuario_existente &&
            usuario_existente.email &&
            usuario_existente.email.toLowerCase() === email.toLowerCase();

        if (nombre_duplicado || email_duplicado) {
            if (register_message) {
                register_message.textContent = '❌ Este usuario o correo ya está registrado. Elige otro.';
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
        localStorage.setItem(registered_user_key, JSON.stringify(usuario));
        // localStorage solo puede guardar texto (strings), por eso el objeto
        // "usuario" se convierte a texto en formato JSON con JSON.stringify().
        // Luego se guarda en el navegador usando la clave "usuario_registrado".

        window.location.href = 'login.html';
        // Redirige automáticamente al usuario a la página "login.html"
        // una vez que el registro fue guardado con éxito.
    });
}