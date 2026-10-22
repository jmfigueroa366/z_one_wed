# Z-ONE

Prototipo de gestión para producción musical, con espacios diferenciados para administración, coordinación, colaboración y clientes.

## Ejecución local

Desde `zone_wed/`, instala las dependencias y levanta Vite:

```sh
npm install
npm run dev
```

Abre la URL que muestra Vite; la ruta inicial redirige a `/login`. También puedes generar la versión de producción con `npm run build` y probarla con `npm run preview`.

## Conexión a Supabase

La aplicación usa un proyecto de Supabase compartido por todo el equipo (no cada quien el suyo).

1. Copia `zone_wed/.env.example` a `zone_wed/.env`.
2. Solicita al responsable del proyecto los valores reales de `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` por un canal privado (nunca por git).
3. Rellena tu `.env`. Ese archivo está en `.gitignore` y no se sube al repositorio.
4. Los scripts de `zone_wed/supabase/*.sql` (tablas, RLS, funciones y arreglos) ya están aplicados en el proyecto compartido. No los ejecutes con DROP/DELETE sin coordinar, porque afectarían los datos de todos.

Variables requeridas: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_DEMO_ADMIN_CLAVE`, `VITE_DEMO_COLAB_CLAVE`, `VITE_DEMO_CLIENTE_CLAVE`.

## Estructura React

- `src/pages/`, `src/components/`, `src/hooks/` y `src/context/` contienen la capa de presentación.
- `src/services/` contiene los casos de uso de aplicación.
- `src/models/`, `src/config/` y `src/utils/` contienen el dominio.
- `src/repositories/`, `src/infrastructure/` y `src/data/` contienen persistencia e infraestructura.
- `src/styles/` agrupa el CSS por página y `public/Imagenes/` las imágenes servidas en `/Imagenes/...`.
- `App.jsx` define las rutas React; `index.html` es el único documento de entrada de Vite.

## Estado de la migración

La migración a React está prácticamente completa. Ya están implementadas las rutas, la autenticación con guards por rol, el layout del área de trabajo y las pantallas de Inicio, Agenda, Solicitudes, Artistas, Productores, Sesiones, Catálogo, Estadísticas, Permisos, Configuración, Login, Registro y la página pública. La pantalla de Chatbot permanece como vista preparada (`src/pages/Chatbot.jsx`) a la espera de conectar su interfaz con `chatbotService.js`.

Se eliminaron los CSS e imágenes duplicados de la versión vanilla; toda la presentación usa `src/styles/` (CSS por página) y `public/Imagenes/` (imágenes).

## Cuentas de demostración

| Perfil | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin@z-one.com` | (definida en Supabase Auth) |
| Colaborador | `lua@z-one.com` | (definida en Supabase Auth) |
| Cliente | `carolina@z-one.com` | (definida en Supabase Auth) |

Las cuentas se gestionan en Supabase Authentication. No se guardan contraseñas en el código ni en la semilla (`seed.ts`). El registro público permite Cliente y Colaborador; el Administrador es de demostración y no es seleccionable durante el registro.

## Alcance y seguridad

Los datos de autenticación, solicitudes y sesiones se guardan en Supabase (proyecto compartido). El resto de módulos (salas, canciones, proyectos, órdenes, colaboradores) sigue con una estrategia de caché local en localStorage sincronizada por fases. La matriz y los guards controlan la navegación del prototipo, pero no proporcionan seguridad real: un usuario puede editar datos locales. Antes de producción, la autenticación, permisos, límites de tarifas, transiciones de estado, notificaciones y auditoría deben validarse por completo en una API; Oracle debe quedar detrás de esa API.

La primera fase no incluye aún entregables, hilos, liquidaciones/facturas, aprobaciones reales de colaboradores, splits ni recordatorios automáticos. Las pantallas anteriores de Catálogo, Sesiones, Agenda, Estadísticas y Chatbot conservan comportamiento de demostración y no están conectadas al nuevo modelo de solicitudes.