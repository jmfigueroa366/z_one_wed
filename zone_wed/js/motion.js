const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function resolver_elementos(targets) {
    if (typeof targets === 'string') {
        return Array.from(document.querySelectorAll(targets));
    }

    if (Array.isArray(targets)) {
        return targets.filter(Boolean);
    }

    return targets ? [targets] : [];
}

function stagger(intervalo) {
    return (indice) => indice * intervalo;
}

function animate(targets, options = {}) {
    const elementos = resolver_elementos(targets);
    const duracion = movimiento_reducido ? 0 : Number(options.duration || 0);
    const obtener_retraso = typeof options.delay === 'function'
        ? options.delay
        : () => Number(options.delay || 0);
    const desplazamiento_y = options.y ?? options.translateY ?? 0;
    const desplazamiento_x = options.translateX ?? 0;

    elementos.forEach((elemento, indice) => {
        const retraso = movimiento_reducido ? 0 : obtener_retraso(indice);
        const transform_inicial = `translate(${desplazamiento_x}px, ${desplazamiento_y}px)`;

        elemento.style.opacity = options.opacity ? options.opacity[0] : '';
        elemento.style.transform = transform_inicial;
        elemento.style.transition = `opacity ${duracion}ms ease, transform ${duracion}ms ease`;

        window.setTimeout(() => {
            elemento.style.opacity = options.opacity ? options.opacity[1] : '1';
            elemento.style.transform = 'translate(0, 0) scale(1)';
        }, retraso);
    });
}

export { animate, stagger };
