import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';

const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function prepararCampoAmbiental() {
    const campo = document.querySelector('.ambient-field');
    if (!campo) return;

    campo.innerHTML = Array.from({ length: 16 }, (_, indice) =>
        `<i style="--particle-x:${(indice * 37) % 100}%;--particle-y:${(indice * 61) % 100}%;--particle-delay:${indice * -0.35}s"></i>`
    ).join('');
}

function prepararWaveform() {
    const waveform = document.querySelector('.waveform');
    if (!waveform) return;

    waveform.innerHTML = Array.from({ length: 28 }, (_, indice) => {
        const altura = 18 + ((indice * 17) % 34);
        return `<i style="--wave-height:${altura}px;--wave-delay:${indice * -0.06}s"></i>`;
    }).join('');
}

function prepararTitulo() {
    const titulo = document.querySelector('[data-split-text]');
    if (!titulo) return;

    titulo.setAttribute('aria-label', titulo.textContent.trim());
    titulo.innerHTML = titulo.textContent.trim().split(' ').map((palabra) =>
        `<span class="word"><span>${palabra}</span>&nbsp;</span>`
    ).join('');
}

function animarContadores() {
    document.querySelectorAll('.stat-value').forEach((element, indice) => {
        const inicio = performance.now() + 650 + indice * 120;
        const duracion = 1100;
        const destino = Number(element.dataset.value);

        function actualizarContador(ahora) {
            const progreso = Math.min(1, Math.max(0, (ahora - inicio) / duracion));
            const suavizado = 1 - Math.pow(1 - progreso, 3);
            element.textContent = Math.round(destino * suavizado) + (element.dataset.suffix || '');
            if (progreso < 1) requestAnimationFrame(actualizarContador);
        }

        requestAnimationFrame(actualizarContador);
    });
}

function activarParallax() {
    const panel = document.querySelector('.visual-panel');
    if (!panel || movimiento_reducido) return;

    panel.addEventListener('pointermove', (evento) => {
        const bounds = panel.getBoundingClientRect();
        const x = (evento.clientX - bounds.left) / bounds.width - 0.5;
        const y = (evento.clientY - bounds.top) / bounds.height - 0.5;
        panel.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
        panel.style.setProperty('--pointer-x', `${(x + 0.5) * 100}%`);
        panel.style.setProperty('--pointer-y', `${(y + 0.5) * 100}%`);
    });

    panel.addEventListener('pointerleave', () => {
        panel.style.transform = '';
        panel.style.setProperty('--pointer-x', '50%');
        panel.style.setProperty('--pointer-y', '50%');
    });
}

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

    animarContadores();
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

if (!movimiento_reducido)
{
    prepararCampoAmbiental();
    prepararWaveform();
    prepararTitulo();
    activarParallax();
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
