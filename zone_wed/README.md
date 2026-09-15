# Z-ONE
Sistema web de gestión para una productora musical.

## Dónde se guardan los datos

Los datos se guardan en el `localStorage` del navegador, no en un servidor ni en una base de datos. Se pueden revisar desde DevTools del navegador en **Application > Local Storage** usando el origen de la página.

| Clave | Qué guarda | Archivo que la usa |
| --- | --- | --- |
| `usuario_registrado` | Nombre, correo y contraseña creados en el registro | `js/register.js`, `js/login.js` |
| `zone_usuario` | Nombre del usuario que inició sesión | `js/login.js`, `js/menu.js` |
| `zone_perfil_usuario` | Nombre, correo y rol del perfil del menú | `js/menu.js` |
| `zone_artistas` | Arreglo de artistas registrados | `js/menu.js` |
| `zone_producciones` | Arreglo de proyectos de producción | `js/menu.js` |
| `zone_catalogo` | Arreglo de canciones, versiones y álbumes | `js/interacciones.js` |
| `zone_sesiones` | Arreglo de sesiones de grabación | `js/interacciones.js` |
| `zone_agenda` | Arreglo de eventos de agenda | `js/interacciones.js` |

## Guía rápida de JavaScript

- `register.js`: toma los valores del formulario, crea el objeto `usuario` y lo convierte a texto con `JSON.stringify` antes de guardarlo en `usuario_registrado`.
- `login.js`: lee la cuenta con `localStorage.getItem`, convierte el texto con `JSON.parse`, compara nombre o correo y contraseña, y guarda el nombre activo en `zone_usuario`.
- `menu.js`: verifica `zone_usuario`; si no existe, devuelve al login. `obtenerRegistros` lee arreglos y `guardarRegistros` los vuelve a guardar después de agregar artistas o producciones.
- `interacciones.js`: `obtenerDatos` lee cualquier arreglo guardado, `guardarDato` lo persiste y `pintarTabla` reconstruye la tabla del catálogo después de cada registro.

Para limpiar las pruebas, abre la consola del navegador y ejecuta `localStorage.clear()`.
