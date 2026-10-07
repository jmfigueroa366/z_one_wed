# Z-ONE

Prototipo de gestión para producción musical, con espacios diferenciados para administración, coordinación, colaboración y clientes.

## Ejecución local

Sirve la carpeta `zone_wed/` desde un servidor HTTP estático y abre `html/login.html`. Los módulos ES del navegador no deben abrirse con `file://`.

## Cuentas de demostración

| Perfil | Usuario | Contraseña |
| --- | --- | --- |
| Administrador | `admin@z-one.com` | `admin123` |
| Coordinador | `coordinador@z-one.com` | `coordinador123` |
| Colaborador | `lua@z-one.com` | `colab123` |
| Cliente | `cliente@z-one.com` | `cliente123` |

Las cuentas semilla se crean si no existen. El registro público permite Cliente y Colaborador; Administrador y Coordinador son perfiles de demostración, no seleccionables durante el registro.

## Arquitectura actual

- `js/roles.js`: roles, matriz central de 18 capacidades y comprobación de permisos.
- `js/navegacionRoles.js`: divisiones y rutas visibles por perfil.
- `js/solicitudService.js`: reglas del flujo, propiedad de registros, invitaciones, contraofertas, confirmaciones, cancelación, notificaciones y auditoría.
- `js/solicitudRepo.js`: lectura, creación y actualización de solicitudes; adapta registros seed antiguos.
- `js/storage.js`: adaptador de persistencia local. Puede reemplazarse por llamadas a una API cuando se integre Oracle.
- `html/solicitudes.html` y `js/solicitudes.js`: interfaz de solicitudes, invitaciones y actividad.
- `html/permisos.html` y `js/permisos.js`: matriz visible por rol y reglas de notificación.

## Flujo disponible

Cliente o Colaborador crea una solicitud futura con sala, horario y uno o más profesionales. Las invitaciones vencen en 72 horas. Cada Colaborador invitado puede aceptar, rechazar o enviar una contraoferta; quien creó la solicitud puede aceptarla. Al aceptar todos los invitados, la solicitud se confirma automáticamente. Administración y Coordinación pueden confirmarla manualmente; Administración puede forzar una aceptación indicando el motivo.

El sistema rechaza horarios que se solapen con sesiones o solicitudes ya confirmadas para la misma sala. Cliente o Colaborador puede cancelar sus propias solicitudes con al menos 24 horas de anticipación. Las acciones relevantes generan notificaciones locales y entradas de auditoría.

## Alcance y seguridad

Los datos se guardan en `localStorage` y solo existen en ese navegador. La matriz y los guards controlan la navegación del prototipo, pero no proporcionan seguridad real: un usuario puede editar datos locales. Antes de producción, la autenticación, permisos, límites de tarifas, transiciones de estado, notificaciones y auditoría deben validarse en una API; Oracle debe quedar detrás de esa API.

La primera fase no incluye aún entregables, hilos, liquidaciones/facturas, aprobaciones reales de colaboradores, splits ni recordatorios automáticos. Las pantallas anteriores de Catálogo, Sesiones, Agenda, Estadísticas y Chatbot conservan comportamiento de demostración y no están conectadas al nuevo modelo de solicitudes.