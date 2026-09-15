// ============================================================================
// IMPORTACIÓN DE LA LIBRERÍA
// ============================================================================
import { animate, stagger } from 'https://cdn.jsdelivr.net/npm/animejs@4.2.2/+esm';
// Importa dos funciones de la librería "anime.js" (versión 4.2.2) directamente
// desde un CDN (sin necesidad de instalarla con npm):
// - animate: función principal para crear animaciones.
// - stagger: función que crea retrasos escalonados entre varios elementos
//   animados (por ejemplo, que cada palabra aparezca un poco después que la anterior).
// ============================================================================
// DETECCIÓN DE PREFERENCIA DE "MOVIMIENTO REDUCIDO"
// ============================================================================
const movimiento_reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Consulta una preferencia del sistema operativo/navegador del usuario:
// si la persona activó "reducir movimiento" (por accesibilidad, mareos, etc.),
// matchMedia(...).matches será "true".
// Esta variable se usará más abajo para DESACTIVAR animaciones si el usuario
// no quiere ver movimiento en pantalla.
// ============================================================================
// FUNCIÓN: prepararCampoAmbiental
// Genera partículas decorativas de fondo (puntos flotantes)
// ============================================================================
function prepararCampoAmbiental() {
    const campo = document.querySelector('.ambient-field');
    // Busca el primer elemento HTML con la clase "ambient-field"
    // (normalmente un <div> vacío que sirve de contenedor de partículas).
    if (!campo) return;
    // Si ese elemento no existe en la página, termina la función aquí
    // para evitar errores.
    campo.innerHTML = Array.from({ length: 16 }, (_, indice) =>
        `<i style="--particle-x:${(indice * 37) % 100}%;--particle-y:${(indice * 61) % 100}%;--particle-delay:${indice * -0.35}s"></i>`
    ).join('');
    // Array.from({ length: 16 }, ...) crea un array con 16 posiciones (0 a 15)
    // y por cada posición ejecuta una función que genera un string HTML: 
    // un elemento <i> (usado aquí solo como contenedor visual, no como ícono).
    // Cada <i> recibe 3 variables CSS personalizadas (custom properties):
    // - --particle-x: posición horizontal (0-99%), calculada con una fórmula
    //   matemática (indice * 37) % 100 para que los valores se vean "dispersos"
    //   y no en línea recta.
    // - --particle-y: posición vertical, misma lógica pero con *61.
    // - --particle-delay: retraso de animación en segundos, negativo, para que
    //   cada partícula empiece su animación en un punto distinto del ciclo
    //   (esto se usaría en el CSS con @keyframes).
    // .join('') une los 16 strings <i>...</i> en un solo string y lo inserta
    // de una sola vez como contenido HTML del contenedor ".ambient-field".
}
// ============================================================================
// FUNCIÓN: prepararWaveform
// Genera las barras de un "ecualizador" visual (como el de un reproductor de audio)
// ============================================================================
function prepararWaveform() {
    const waveform = document.querySelector('.waveform');
    // Busca el contenedor con clase "waveform".
    if (!waveform) return;
    // Si no existe, no continúa.
    waveform.innerHTML = Array.from({ length: 28 }, (_, indice) => {
        const altura = 18 + ((indice * 17) % 34);
        // Calcula una altura variable para cada barra, entre 18 y 51 píxeles
        // aproximadamente, usando una fórmula matemática para que las alturas
        // se vean irregulares (como un ecualizador real) en vez de todas iguales.
        return `<i style="--wave-height:${altura}px;--wave-delay:${indice * -0.06}s"></i>`;
        // Genera un <i> con dos variables CSS:
        // - --wave-height: la altura calculada arriba.
        // - --wave-delay: un pequeño retraso negativo para desincronizar
        //   la animación de cada barra.
    }).join('');
    // Une las 28 barras en un solo string HTML y las inserta en el waveform.
}
// ============================================================================
// FUNCIÓN: prepararTitulo
// Separa un título en palabras individuales para animarlas una por una
// ============================================================================
function prepararTitulo() {
    const titulo = document.querySelector('[data-split-text]');
    // Busca el elemento que tenga el atributo HTML "data-split-text"
    // (un atributo personalizado usado como marcador, no una clase CSS).

    if (!titulo) return;
    // Si no existe, termina la función.
    titulo.setAttribute('aria-label', titulo.textContent.trim());
    // Antes de modificar el HTML interno, guarda el texto original completo
    // en el atributo "aria-label". Esto es importante para ACCESIBILIDAD:
    // los lectores de pantalla leerán este atributo como el texto completo,
    // en vez de leer cada <span> por separado de forma fragmentada.
    titulo.innerHTML = titulo.textContent.trim().split(' ').map((palabra) =>
        `<span class="word"><span>${palabra}</span>&nbsp;</span>`
    ).join('');
    // Paso a paso:
    // 1. titulo.textContent.trim() obtiene el texto sin espacios sobrantes.
    // 2. .split(' ') separa el texto en un array de palabras individuales.
    // 3. .map(...) convierte cada palabra en HTML: la envuelve en un <span
    //    class="word"> (para animar la palabra completa) que contiene otro
    //    <span> interno (para el efecto visual de "revelar" letra/palabra)
    //    seguido de un espacio no separable (&nbsp;) para mantener el espacio
    //    visual entre palabras.
    // 4. .join('') une todos los <span> en un solo string.
    // 5. Se reemplaza el contenido HTML original del título con este resultado.
}
// ============================================================================
// FUNCIÓN: animarContadores
// Anima números (estadísticas) desde 0 hasta su valor final
// ============================================================================
function animarContadores() {
    document.querySelectorAll('.stat-value').forEach((element, indice) => {
        // Busca TODOS los elementos con clase "stat-value" (ej: "500+", "98%")
        // y recorre cada uno con su índice de posición.
        const inicio = performance.now() + 650 + indice * 120;
        // Calcula el momento en el tiempo (en milisegundos) en que ESTE contador
        // en particular debe comenzar a animarse:
        // - performance.now(): el momento actual, con precisión de microsegundos.
        // - + 650: espera inicial de 650ms antes de arrancar cualquier contador.
        // - + indice * 120: cada contador se retrasa 120ms más que el anterior
        //   (para que no aparezcan todos exactamente al mismo tiempo).
        const duracion = 1100;
        // La animación de cada contador durará 1100 milisegundos (1.1 segundos).
        const destino = Number(element.dataset.value);
        // Lee el atributo HTML "data-value" del elemento (ej: data-value="500")
        // y lo convierte a número. Este es el valor final al que debe llegar el contador.
        function actualizarContador(ahora) {
            // Función que se ejecuta en cada "frame" de animación.
            // "ahora" es el timestamp que pasa automáticamente requestAnimationFrame.
            const progreso = Math.min(1, Math.max(0, (ahora - inicio) / duracion));
            // Calcula qué porcentaje de la animación ya transcurrió, como un
            // número entre 0 (inicio) y 1 (fin):
            // - (ahora - inicio) / duracion: tiempo transcurrido dividido entre
            //   la duración total.
            // - Math.max(0, ...): evita valores negativos si aún no ha empezado.
            // - Math.min(1, ...): evita valores mayores a 1 si ya terminó.
            const suavizado = 1 - Math.pow(1 - progreso, 3);
            // Aplica una función de "easing" (suavizado) tipo "ease-out cúbico":
            // hace que el contador avance rápido al principio y se desacelere
            // al final, en vez de avanzar a velocidad constante (más natural
            // visualmente).
            element.textContent = Math.round(destino * suavizado) + (element.dataset.suffix || '');
            // Actualiza el texto visible del elemento con el número actual
            // (redondeado) multiplicado por el progreso suavizado, y le agrega
            // un sufijo opcional guardado en "data-suffix" (ej: "%", "+", "K").
            // Si no hay data-suffix, se usa un string vacío.
            if (progreso < 1) requestAnimationFrame(actualizarContador);
            // Si la animación no ha terminado, programa la siguiente actualización
            // en el próximo frame disponible del navegador (aprox. 60 veces por segundo).
        }
        setTimeout(() => {
            element.textContent = destino + (element.dataset.suffix || '');
        }, 1900 + indice * 120);
        // Como "red de seguridad": después de 1900ms + el retraso escalonado,
        // fuerza el valor FINAL exacto en el texto. Esto asegura que, incluso
        // si requestAnimationFrame tuvo algún problema de redondeo, el número
        // final mostrado sea siempre el correcto.
        requestAnimationFrame(actualizarContador);
        // Inicia el ciclo de animación llamando la función por primera vez.
    });
}
// ============================================================================
// FUNCIÓN: activarParallax
// Efecto 3D: el panel se inclina según la posición del mouse
// ============================================================================
function activarParallax() {
    const panel = document.querySelector('.visual-panel');
    // Busca el panel visual principal (ej: una tarjeta o mockup de producto).
    if (!panel || movimiento_reducido) return;
    // No hace nada si el panel no existe, O si el usuario prefiere
    // movimiento reducido (respeta la accesibilidad).
    panel.addEventListener('pointermove', (evento) => {
        // Se ejecuta cada vez que el mouse (o dedo/lápiz óptico) se mueve
        // sobre el panel.
        const bounds = panel.getBoundingClientRect();
        // Obtiene las medidas y posición exactas del panel en la pantalla
        // (ancho, alto, distancia desde el borde izquierdo y superior de la ventana).
        const x = (evento.clientX - bounds.left) / bounds.width - 0.5;
        // Calcula la posición horizontal del cursor DENTRO del panel, como un
        // valor entre -0.5 (borde izquierdo) y 0.5 (borde derecho), con 0 en el centro.
        const y = (evento.clientY - bounds.top) / bounds.height - 0.5;
        // Lo mismo pero para la posición vertical.
        panel.style.transform = `perspective(900px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-4px)`;
        // Aplica una transformación CSS 3D al panel:
        // - perspective(900px): define qué tan "profundo" se ve el efecto 3D.
        // - rotateX: inclina el panel hacia arriba/abajo según la posición
        //   vertical del mouse (multiplicado por -4 grados máximo).
        // - rotateY: inclina el panel hacia los lados según la posición
        //   horizontal del mouse (multiplicado por 5 grados máximo).
        // - translateY(-4px): lo eleva levemente para dar sensación de "flotar".
        panel.style.setProperty('--pointer-x', `${(x + 0.5) * 100}%`);
        panel.style.setProperty('--pointer-y', `${(y + 0.5) * 100}%`);
        // Guarda la posición del cursor como porcentaje (0% a 100%) en dos
        // variables CSS personalizadas. Esto normalmente se usa en el CSS
        // para mover un brillo o reflejo de luz que sigue al cursor.
    });
    panel.addEventListener('pointerleave', () => {
        // Se ejecuta cuando el cursor SALE del área del panel.
        panel.style.transform = '';
        // Quita la transformación 3D, devolviendo el panel a su posición normal.
        panel.style.setProperty('--pointer-x', '50%');
        panel.style.setProperty('--pointer-y', '50%');
        // Reinicia las variables de posición del "brillo" al centro (50%, 50%).
    });
}
// ============================================================================
// FUNCIÓN: animarEntrada
// Secuencia de animaciones que se reproducen al cargar la página
// ============================================================================
function animarEntrada() {
    animate('.brand', {
        opacity: [0, 1],
        x: [-24, 0],
        duration: 700,
        ease: 'out(4)'
    });
    // Anima el logo/marca (clase "brand"): aparece desde transparente (0)
    // a visible (1), y se desliza desde 24px a la izquierda hasta su posición
    // final, en 700ms, con una curva de desaceleración "out(4)".
    animate('.main-nav a', {
        opacity: [0, 1],
        y: [-16, 0],
        delay: stagger(80),
        duration: 550,
        ease: 'out(3)'
    });
    // Anima cada enlace del menú principal: aparece bajando desde -16px
    // (arriba) hasta su posición. stagger(80) hace que cada enlace del menú
    // comience 80ms después que el anterior (efecto cascada).
    animate('.topbar-actions a', {
        opacity: [0, 1],
        scale: [0.85, 1],
        delay: stagger(120),
        duration: 650,
        ease: 'outElastic(1, .6)'
    });
    // Anima los botones de la barra superior (ej: "Iniciar sesión"):
    // aparecen creciendo desde 85% de su tamaño hasta 100%, con un efecto
    // "elástico" (como un pequeño rebote), escalonados cada 120ms.
    animate('.hero-copy > *', {
        opacity: [0, 1],
        y: [26, 0],
        delay: stagger(100),
        duration: 700,
        ease: 'out(4)'
    });
    // Anima cada hijo directo (>) del contenedor ".hero-copy" (título, texto,
    // botones del hero principal): suben 26px mientras aparecen, escalonados.
    animate('.visual-panel', {
        opacity: [0, 1],
        scale: [0.88, 1],
        rotate: ['-2deg', '0deg'],
        duration: 900,
        ease: 'outElastic(1, .65)'
    });
    // Anima la ENTRADA del panel visual: aparece más pequeño (88%) y
    // ligeramente rotado (-2°), y llega a su tamaño y rotación normales
    // con efecto elástico.
    animate('.visual-panel', {
        y: [-8, 8, -8],
        duration: 4200,
        loop: true,
        ease: 'inOutSine'
    });
    // Una SEGUNDA animación sobre el mismo panel (se ejecuta en paralelo a
    // la anterior): lo hace flotar suavemente de arriba a abajo (-8px a 8px
    // y de vuelta a -8px) en un ciclo de 4.2 segundos que se repite
    // infinitamente (loop: true), dando un efecto de "flotación" constante.
    animate('.progress-bar span', {
        scaleX: [0, 1],
        duration: 1200,
        delay: 850,
        ease: 'out(4)'
    });
    // Anima una barra de progreso: crece horizontalmente desde 0% hasta
    // 100% de su ancho, empezando 850ms después de cargar la página.
    animate('.chart-bars span', {
        scaleY: [0, 1],
        delay: stagger(80, { from: 'last' }),
        duration: 750,
        ease: 'outElastic(1, .7)'
    });
    // Anima las barras de un gráfico: crecen verticalmente desde 0% hasta
    // 100% de su altura. stagger(80, { from: 'last' }) hace que el
    // escalonado empiece desde la ÚLTIMA barra hacia la primera (en vez
    // del orden normal), creando un efecto visual distinto.
    animate('.feature-icon', {
        rotate: ['-20deg', '0deg'],
        scale: [0.6, 1],
        delay: stagger(100),
        duration: 800,
        ease: 'outElastic(1, .55)'
    });
    // Anima los íconos de la sección de características/features: giran
    // desde -20° hasta 0° mientras crecen desde 60% hasta 100% de su tamaño,
    // con efecto elástico y escalonado.
    animarContadores();
    // Al final de toda la secuencia de entrada, llama a la función que
    // anima los números/estadísticas (definida más arriba).
}
// ============================================================================
// FUNCIÓN: animarRevelado
// Anima elementos que "aparecen" cuando el usuario hace scroll hasta ellos
// ============================================================================
function animarRevelado(elementos) {
    // Recibe como parámetro una lista de elementos HTML a animar.
    animate(elementos, {
        opacity: [0, 1],
        y: [30, 0],
        delay: stagger(90),
        duration: 700,
        ease: 'out(4)'
    });
    // Aplica la misma animación de "aparecer subiendo" (fade + slide up)
    // que se usó en otras partes, pero esta vez sobre los elementos que
    // se le pasen como argumento (en este caso, tarjetas que entran en
    // pantalla al hacer scroll).
}
// ============================================================================
// FUNCIÓN: activarReproductor
// Simula un reproductor de audio (play/pausa, progreso, tiempo)
// ============================================================================
function activarReproductor() {
    const boton = document.querySelector('.play-toggle');
    // Botón de play/pausa.
    const panel = document.querySelector('.visual-panel');
    // El panel visual (se le agregará una clase cuando esté "reproduciendo").
    const progreso = document.querySelector('.track-progress span');
    // El <span> interno que representa visualmente la barra de progreso rellena.
    const barra = document.querySelector('.track-progress');
    // El contenedor completo de la barra de progreso (para accesibilidad ARIA).
    const tiempo_actual = document.querySelector('.track-time span');
    // El elemento de texto donde se muestra el tiempo transcurrido (ej: "1:23").
    if (!boton || !panel || !progreso || !barra || !tiempo_actual) return;
    // Si falta CUALQUIERA de estos 5 elementos en el HTML, no continúa
    // (evita errores por elementos inexistentes).
    let reproduciendo = false;
    // Variable de estado: indica si el audio está "reproduciéndose" o no.
    // Empieza en falso (pausado).
    let inicio = 0;
    // Guardará el timestamp (momento) en que comenzó la reproducción actual.
    let reloj = null;
    // Guardará la referencia al intervalo (setInterval) para poder detenerlo después.
    const duracion = 168;
    // Duración total simulada de la "canción" en segundos (168s = 2:48 minutos).
    function actualizar() {
        // Función que actualiza visualmente el progreso de reproducción.
        if (!reproduciendo) return;
        // Si no está reproduciendo, no hace nada (evita cálculos innecesarios).
        const transcurrido = (performance.now() - inicio) / 1000;
        // Calcula cuántos segundos han pasado desde que se le dio play,
        // convirtiendo de milisegundos a segundos.
        const segundos = transcurrido % duracion;
        // Usa el operador módulo (%) para que, si el tiempo transcurrido
        // supera la duración de la canción (168s), vuelva a empezar desde 0
        // (simula que la canción se repite en bucle).
        const porcentaje = (segundos / duracion) * 100;
        // Convierte los segundos actuales a un porcentaje (0% a 100%) del total.
        progreso.style.width = `${porcentaje}%`;
        // Actualiza visualmente el ancho de la barra de progreso rellena.
        barra.setAttribute('aria-valuenow', Math.round(porcentaje));
        // Actualiza el atributo ARIA "aria-valuenow" con el porcentaje actual
        // (redondeado), para que lectores de pantalla puedan anunciar el
        // progreso correctamente (accesibilidad).
        tiempo_actual.textContent = `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, '0')}`;
        // Construye el texto de tiempo en formato "minutos:segundos":
        // - Math.floor(segundos / 60): calcula los minutos completos.
        // - Math.floor(segundos % 60): calcula los segundos restantes.
        // - .padStart(2, '0'): agrega un "0" delante si el número tiene solo
        //   un dígito (ej: "5" se convierte en "05") para que siempre se vea
        //   como "0:05" en vez de "0:5".
    }
    boton.addEventListener('click', () => {
        // Se ejecuta cada vez que el usuario hace clic en el botón de play/pausa.
        reproduciendo = !reproduciendo;
        // Invierte el estado actual: si estaba en false pasa a true y viceversa.
        if (reproduciendo)
        {
            // Si AHORA está reproduciendo (se acaba de presionar play):
            inicio = performance.now();
            // Guarda el momento actual como el "inicio" de la reproducción.
            panel.classList.add('is-playing');
            // Agrega la clase CSS "is-playing" al panel (para efectos visuales,
            // como animar el waveform mediante CSS).
            boton.setAttribute('aria-label', 'Pausar Midnight Echo');
            // Cambia la etiqueta accesible del botón para lectores de pantalla,
            // indicando que ahora la acción disponible es "pausar".
            boton.setAttribute('aria-pressed', 'true');
            // Indica en accesibilidad que el botón está "presionado"/activo.
            boton.querySelector('.play-icon').textContent = 'Ⅱ';
            // Cambia el ícono visual del botón al símbolo de "pausa" (Ⅱ).
            actualizar();
            // Llama una vez de inmediato a la función actualizar() para que
            // la interfaz no espere hasta el primer intervalo.
            reloj = setInterval(actualizar, 100);
            // Programa que la función actualizar() se ejecute automáticamente
            // cada 100 milisegundos (10 veces por segundo), y guarda la
            // referencia del intervalo en "reloj" para poder detenerlo después.
        }
        else
        {
            // Si AHORA está en pausa (se acaba de presionar pausa):
            panel.classList.remove('is-playing');
            // Quita la clase "is-playing" del panel.
            boton.setAttribute('aria-label', 'Reproducir Midnight Echo');
            // Cambia la etiqueta accesible de vuelta a "reproducir".
            boton.setAttribute('aria-pressed', 'false');
            // Marca el botón como no presionado en accesibilidad.
            boton.querySelector('.play-icon').textContent = '▶';
            // Cambia el ícono de vuelta al símbolo de "play" (▶).
            clearInterval(reloj);
            // Detiene el intervalo que actualizaba el progreso cada 100ms,
            // evitando que siga corriendo en segundo plano innecesariamente.
        }
    });
}
// ============================================================================
// BLOQUE PRINCIPAL: inicialización de todas las animaciones,
// SOLO si el usuario no pidió "movimiento reducido"
// ============================================================================

if (!movimiento_reducido)
{
    // Si el usuario NO activó la preferencia de movimiento reducido,
    // se ejecutan todas las funciones de preparación y animación:
    prepararCampoAmbiental();
    // Genera las partículas de fondo.
    prepararWaveform();
    // Genera las barras del ecualizador.
    prepararTitulo();
    // Separa el título en palabras individuales.
    activarParallax();
    // Activa el efecto 3D al mover el mouse.
    activarReproductor();
    // Activa la lógica del reproductor de audio simulado.
    animarEntrada();
    // Dispara toda la secuencia de animaciones de entrada de la página.
    const observador = new IntersectionObserver((entradas, observer) => {
        // Crea un "observador de intersección": un objeto especial del
        // navegador que detecta cuándo un elemento entra o sale del área
        // visible de la pantalla (viewport), sin tener que calcularlo
        // manualmente en cada scroll (mucho más eficiente).
        // La función que se pasa aquí se ejecuta cada vez que cambia la
        // visibilidad de alguno de los elementos observados.
        // - "entradas": lista de elementos cuya visibilidad cambió.
        // - "observer": referencia al observador mismo (para poder dejar
        //   de observar un elemento después).
        entradas.forEach((entrada) => {
            // Recorre cada elemento que cambió su estado de visibilidad.
            if (!entrada.isIntersecting) return;
            // Si el elemento NO está actualmente visible en pantalla
            // (por ejemplo, si está saliendo de la vista), no hace nada.
            // Solo interesa el momento en que ENTRA a la vista.
            animarRevelado(entrada.target.querySelectorAll('.feature-card, .workflow-step, .preview-card'));
            // Busca, DENTRO del elemento que se hizo visible, todas las
            // tarjetas/tarjetas de flujo/tarjetas de vista previa, y las
            // anima con la función "animarRevelado" definida más arriba.
            observer.unobserve(entrada.target);
            // Deja de observar este elemento en particular: como ya se
            // animó una vez, no es necesario seguir vigilándolo (mejora
            // el rendimiento y evita que la animación se repita cada vez
            // que se hace scroll hacia arriba y abajo).
        });
    }, { threshold: 0.2 });
    // Segundo parámetro de configuración del observador:
    // threshold: 0.2 significa que la función se dispara cuando al menos
    // el 20% del elemento observado es visible en pantalla (no es necesario
    // que esté 100% visible).
    document.querySelectorAll('.features, .workflow, .dashboard-preview').forEach((seccion) => {
        observador.observe(seccion);
    });
    // Busca las secciones principales de la página (features, workflow,
    // dashboard-preview) y le dice al observador que empiece a vigilar
    // cada una de ellas para detectar cuándo entran en pantalla.
}
// ============================================================================
// EFECTO HOVER EN BOTONES (se aplica SIEMPRE, incluso con movimiento reducido
// desactivado arriba, porque este bloque está FUERA del "if" anterior)
// ============================================================================
document.querySelectorAll('.btn-primary, .btn-secondary, .btn-ghost').forEach((boton) => {
    // Busca TODOS los botones de la página con alguna de estas tres clases
    // (estilos primario, secundario o "fantasma"/transparente) y recorre cada uno.
    boton.addEventListener('pointerenter', () => {
        // Se ejecuta cuando el cursor (mouse, dedo, lápiz) entra al área del botón.
        if (movimiento_reducido) return;
        // Si el usuario prefiere movimiento reducido, no se anima nada
        // (se respeta la accesibilidad incluso en este bloque final).
        animate(boton, {
            scale: [1, 1.035, 1],
            duration: 360,
            ease: 'out(3)'
        });
        // Anima el botón con un pequeño "pulso": crece levemente de 100%
        // a 103.5% de su tamaño y vuelve a 100%, en 360 milisegundos,
        // simulando un efecto de "rebote" suave al pasar el mouse por encima.
    });
});
