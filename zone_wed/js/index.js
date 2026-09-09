import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';

const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animarEntrada() {
    animate('.brand', {
        opacity: [0, 1],
        x: [-24, 0],
        duration: 700,
        ease: 'out(4)'
    });

    animate('.main-nav a', {
        opacity: [0, 1],
        y: [-16, 0],
        delay: stagger(80),
        duration: 550,
        ease: 'out(3)'
    });

    animate('.topbar-actions a', {
        opacity: [0, 1],
        scale: [0.85, 1],
        delay: stagger(120),
        duration: 650,
        ease: 'outElastic(1, .6)'
    });

    animate('.hero-copy > *', {
        opacity: [0, 1],
        y: [26, 0],
        delay: stagger(100),
        duration: 700,
        ease: 'out(4)'
    });

    animate('.visual-panel', {
        opacity: [0, 1],
        scale: [0.88, 1],
        rotate: ['-2deg', '0deg'],
        duration: 900,
        ease: 'outElastic(1, .65)'
    });

    animate('.visual-panel', {
        y: [-8, 8, -8],
        duration: 4200,
        loop: true,
        ease: 'inOutSine'
    });

    animate('.progress-bar span', {
        scaleX: [0, 1],
        duration: 1200,
        delay: 850,
        ease: 'out(4)'
    });

    animate('.chart-bars span', {
        scaleY: [0, 1],
        delay: stagger(80, { from: 'last' }),
        duration: 750,
        ease: 'outElastic(1, .7)'
    });

    animate('.feature-icon', {
        rotate: ['-20deg', '0deg'],
        scale: [0.6, 1],
        delay: stagger(100),
        duration: 800,
        ease: 'outElastic(1, .55)'
    });

    animate('.stat-value', {
        innerHTML: (element) => element.dataset.value,
        round: 1,
        delay: stagger(120, { start: 650 }),
        duration: 1100,
        ease: 'out(3)',
        onUpdate: (animation) => {
            const element = animation.animatables[0].target;
            element.textContent = Math.round(Number(element.textContent)) + (element.dataset.suffix || '');
        }
    });
}

function animarRevelado(elementos) {
    animate(elementos, {
        opacity: [0, 1],
        y: [30, 0],
        delay: stagger(90),
        duration: 700,
        ease: 'out(4)'
    });
}

if (!movimiento_reducido) {
    animarEntrada();

    const observador = new IntersectionObserver((entradas, observer) => {
        entradas.forEach((entrada) => {
            if (!entrada.isIntersecting) return;
            animarRevelado(entrada.target.querySelectorAll('.feature-card, .preview-card'));
            observer.unobserve(entrada.target);
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.features, .dashboard-preview').forEach((seccion) => {
        observador.observe(seccion);
    });
}

document.querySelectorAll('.btn-primary, .btn-secondary, .btn-ghost').forEach((boton) => {
    boton.addEventListener('pointerenter', () => {
        if (movimiento_reducido) return;
        animate(boton, {
            scale: [1, 1.035, 1],
            duration: 360,
            ease: 'out(3)'
        });
    });
});
