import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';

const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animarAgenda() {
    if (movimiento_reducido) return;

    animate('.agenda-layout > .panel-card', {
        opacity: [0, 1],
        translateY: [18, 0],
        delay: stagger(90),
        duration: 650,
        easing: 'outCubic'
    });
}

function observarCalendario() {
    const grid = document.getElementById('calendarGrid');
    const lista = document.getElementById('eventList');
    if (!grid || !lista || movimiento_reducido) return;

    const animar_celdas = () => animate('#calendarGrid .calendar-day:not(.empty)', {
        opacity: [0, 1],
        scale: [0.96, 1],
        delay: stagger(18),
        duration: 420,
        easing: 'outQuad'
    });

    const animar_eventos = () => animate('#eventList .event-item', {
        opacity: [0, 1],
        translateX: [12, 0],
        delay: stagger(70),
        duration: 400,
        easing: 'outCubic'
    });

    new MutationObserver(() => {
        animar_celdas();
        animar_eventos();
    }).observe(grid, { childList: true });

    new MutationObserver(animar_eventos).observe(lista, { childList: true });
}

animarAgenda();
observarCalendario();