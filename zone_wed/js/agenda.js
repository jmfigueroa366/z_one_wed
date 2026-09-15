// ============================================================================
// IMPORTACIÓN DE LA LIBRERÍA
// ============================================================================
import { animate, stagger } from './motion.js';
// Importa dos funciones de la librería "anime.js" (v4.2.2) desde un CDN:
// - animate: función principal para crear animaciones.
// - stagger: crea retrasos escalonados entre varios elementos animados,
//   para que no aparezcan todos exactamente al mismo tiempo.
// ============================================================================
// DETECCIÓN DE PREFERENCIA DE "MOVIMIENTO REDUCIDO"
// ============================================================================
const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Consulta si el usuario activó, en su sistema o navegador, la preferencia
// de accesibilidad "reducir movimiento". Si "matches" es true, significa
// que NO quiere ver animaciones. Esta variable se usa más abajo para
// desactivar todas las animaciones en ese caso.
// ============================================================================
// FUNCIÓN: animarAgenda
// Anima la entrada de las tarjetas/paneles de la vista de agenda
// ============================================================================
function animarAgenda() {
    if (movimiento_reducido) return;
    // Si el usuario prefiere movimiento reducido, termina la función de
    // inmediato sin animar nada (respeta la accesibilidad).
    animate('.agenda-layout > .panel-card', {
        // Selecciona todos los elementos con clase "panel-card" que sean
        // HIJOS DIRECTOS (>) de un elemento con clase "agenda-layout".
        // El ">" es importante: solo afecta a los hijos inmediatos, no a
        // "panel-card" anidados más profundo dentro de otros elementos.
        opacity: [0, 1],
        // Anima la opacidad: de invisible (0) a completamente visible (1).
        translateY: [18, 0],
        // Anima la posición vertical: empieza 18px más abajo de su posición
        // final y se desliza hacia arriba hasta llegar a su lugar (0).
        delay: stagger(90),
        // Cada tarjeta comienza su animación 90ms después que la anterior,
        // creando un efecto de aparición "en cascada" en vez de todas a la vez.
        duration: 650,
        // Cada animación individual dura 650 milisegundos.
        easing: 'outCubic'
        // Curva de aceleración: "outCubic" hace que la animación empiece
        // rápido y se desacelere suavemente al final (efecto natural).
        // Nota: en anime.js v4 la propiedad correcta suele ser "ease" en vez
        // de "easing" (usada en versiones anteriores/v3). Puede que esta línea
        // no tenga efecto si la librería ya no reconoce "easing" como nombre
        // de propiedad válido en la v4.
    });
}
// ============================================================================
// FUNCIÓN: observarCalendario
// Detecta cambios en el calendario y la lista de eventos, y los anima
// automáticamente cada vez que su contenido cambia
// ============================================================================
function observarCalendario() {
    const grid = document.getElementById('calendarGrid');
    // Busca el elemento con id="calendarGrid" (la cuadrícula del calendario,
    // con los días del mes).
    const lista = document.getElementById('eventList');
    // Busca el elemento con id="eventList" (la lista de eventos del día
    // seleccionado, por ejemplo).
    if (!grid || !lista || movimiento_reducido) return;
    // Si falta el grid, falta la lista, O el usuario prefiere movimiento
    // reducido, termina la función sin hacer nada. Los tres casos deben
    // cumplirse (existir ambos elementos Y no tener movimiento reducido)
    // para que continúe.
    const animar_celdas = () => animate('#calendarGrid .calendar-day:not(.empty)', {
        // Función flecha que anima las celdas del calendario.
        // Selector: dentro de "#calendarGrid", todos los elementos con clase
        // "calendar-day" que NO tengan también la clase "empty" (es decir,
        // ignora las celdas vacías/de relleno que muestran días de otros meses).
        opacity: [0, 1],
        // De invisible a visible.
        scale: [0.96, 1],
        // Crecen levemente desde 96% de su tamaño hasta 100% (efecto sutil
        // de "aparecer creciendo").
        delay: stagger(18),
        // Cada celda se anima 18ms después que la anterior (retraso muy
        // pequeño porque hay muchas celdas, para que el efecto cascada
        // no tarde demasiado en total).
        duration: 420,
        // Duración de 420 milisegundos por celda.
        easing: 'outQuad'
        // Curva de desaceleración cuadrática (efecto natural, más suave/
        // sutil que "outCubic"). Misma nota que arriba: en anime.js v4
        // la propiedad podría llamarse "ease" en vez de "easing".
    });
    const animar_eventos = () => animate('#eventList .event-item', {
        // Función flecha que anima los elementos de la lista de eventos.
        // Selector: dentro de "#eventList", todos los elementos con clase
        // "event-item".
        opacity: [0, 1],
        // De invisible a visible.
        translateX: [12, 0],
        // Se deslizan horizontalmente: empiezan 12px a la derecha de su
        // posición final y se mueven hacia la izquierda hasta llegar a 0.
        delay: stagger(70),
        // Cada evento se anima 70ms después que el anterior.
        duration: 400,
        // Duración de 400 milisegundos por evento.
        easing: 'outCubic'
        // Misma curva de desaceleración usada en animarAgenda().
    });
    new MutationObserver(() => {
        animar_celdas();
        animar_eventos();
    }).observe(grid, { childList: true });
    // Crea un "MutationObserver": un objeto especial del navegador que
    // vigila cambios en el HTML de un elemento (por ejemplo, cuando se
    // agregan o quitan elementos hijos dinámicamente con JavaScript, como
    // al cambiar de mes en el calendario).
    // - La función que se le pasa al crear el observer se ejecuta CADA VEZ
    //   que detecta un cambio: en este caso, llama tanto a animar_celdas()
    //   como a animar_eventos() (es decir, cuando cambia el calendario,
    //   también vuelve a animar los eventos).
    // - .observe(grid, { childList: true }) le dice al observador que
    //   empiece a vigilar el elemento "grid" (#calendarGrid), y que se
    //   fije específicamente en cambios de "childList" (cuando se agregan
    //   o eliminan elementos hijos directos, como nuevas celdas de días).
    new MutationObserver(animar_eventos).observe(lista, { childList: true });
    // Crea un SEGUNDO observer independiente, esta vez vigilando la lista
    // de eventos (#eventList). Cada vez que cambian sus hijos (por ejemplo,
    // al seleccionar un día distinto y cargar nuevos eventos), se ejecuta
    // ÚNICAMENTE animar_eventos() (no vuelve a animar las celdas del
    // calendario, porque este cambio no las afecta).
}
// ============================================================================
// EJECUCIÓN INICIAL
// ============================================================================
animarAgenda();
// Llama a la función que anima la entrada de los paneles de la agenda
// apenas se carga el script.
observarCalendario();
// Llama a la función que configura los observadores de cambios en el
// calendario y la lista de eventos, dejándolos "escuchando" cambios
// futuros en el HTML.