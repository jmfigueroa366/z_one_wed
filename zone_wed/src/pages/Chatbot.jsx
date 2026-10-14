// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import { Bot, Send, Sparkles } from 'lucide-react';
import { ChatbotService } from '../services/chatbotService.js';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const MENSAJE_INICIAL = {
    id: 'mensaje-inicial',
    autor: 'bot',
    texto: 'Hola, soy el asistente de Z-ONE. Puedo orientarte con la agenda, las sesiones y las solicitudes del estudio.',
};

const SUGERENCIAS = [
    '¿Cómo creo una sesión?',
    '¿Qué salas están disponibles?',
    '¿Cómo gestiono una solicitud?',
];

export default function Chatbot() {
    const [mensajes, setMensajes] = useState([MENSAJE_INICIAL]);
    const [entrada, setEntrada] = useState('');
    const [escribiendo, setEscribiendo] = useState(false);
    const listaRef = useRef(null);
    const contadorRef = useRef(0);
    const temporizadorRef = useRef(null);
    const totalPrevioRef = useRef(0);

    useEffect(() => () => clearTimeout(temporizadorRef.current), []);

    useEffect(() => {
        const lista = listaRef.current;
        if (lista) lista.scrollTop = lista.scrollHeight;
        if (MENOS_MOVIMIENTO()) return undefined;
        const nodos = lista ? [...lista.querySelectorAll('[data-mensaje]')] : [];
        const nuevos = nodos.slice(totalPrevioRef.current);
        totalPrevioRef.current = nodos.length;
        if (!nuevos.length) return undefined;
        const animacion = anime({
            targets: nuevos,
            opacity: [0, 1],
            translateY: [12, 0],
            duration: 380,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [mensajes, escribiendo]);

    const siguienteId = () => {
        contadorRef.current += 1;
        return `mensaje-${contadorRef.current}`;
    };

    const responder = (texto) => {
        const limpio = String(texto ?? '').trim();
        if (!limpio) return;

        const respuesta = ChatbotService.responder(limpio);
        setMensajes((actuales) => [...actuales, { id: siguienteId(), autor: 'usuario', texto: limpio }]);
        setEscribiendo(true);
        clearTimeout(temporizadorRef.current);
        temporizadorRef.current = setTimeout(() => {
            setMensajes((actuales) => [...actuales, { id: siguienteId(), autor: 'bot', texto: respuesta }]);
            setEscribiendo(false);
        }, MENOS_MOVIMIENTO() ? 0 : 700);
    };

    const enviar = (event) => {
        event.preventDefault();
        responder(entrada);
        setEntrada('');
    };

    return (
        <main className="workspace-content" data-page="chatbot">
            <header className="page-heading border-l-4 border-[#9365f2] pl-4">
                <p className="workspace-eyebrow">ASISTENCIA</p>
                <h1>Chatbot</h1>
                <p>Resuelve tus dudas sobre la agenda, las sesiones y las solicitudes del estudio.</p>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/25 p-6 sm:p-7"
                style={{
                    background:
                        'radial-gradient(ellipse at 90% 8%, rgba(240, 79, 166, 0.24), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.34), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.34), rgba(23, 19, 34, 0.97) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/20 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white shadow-lg shadow-accent/25">
                            <Bot className="h-7 w-7" aria-hidden="true" />
                            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 animate-pulse rounded-full border-2 border-[#171322] bg-exito" aria-hidden="true" />
                        </span>
                        <div>
                            <p className="workspace-eyebrow flex items-center gap-2">
                                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> ASISTENTE Z-ONE
                            </p>
                            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-texto-soft">Tu copiloto del estudio</h2>
                            <p className="text-sm text-sutil">Pregunta lo que necesites, respondo al momento.</p>
                        </div>
                    </div>
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-exito/40 bg-exito/10 px-3 py-1 text-xs font-bold text-exito-soft">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-exito" aria-hidden="true" />
                        En línea
                    </span>
                </div>
            </section>

            <section
                className="mt-5 flex max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-surface/70 backdrop-blur"
                aria-label="Asistente conversacional"
            >
                <div
                    className="flex max-h-[460px] flex-col gap-4 overflow-y-auto p-5"
                    ref={listaRef}
                    role="log"
                    aria-live="polite"
                >
                    {mensajes.map((mensaje) => {
                        const esUsuario = mensaje.autor === 'usuario';
                        return (
                            <article
                                key={mensaje.id}
                                data-mensaje
                                className={`flex gap-3 ${esUsuario ? 'flex-row-reverse items-end' : 'items-end'}`}
                            >
                                <span
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${
                                        esUsuario ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6]' : 'bg-surface-3'
                                    }`}
                                    aria-hidden="true"
                                >
                                    {esUsuario ? 'TÚ' : <Bot className="h-4 w-4" />}
                                </span>
                                <div className={`flex flex-col gap-1 ${esUsuario ? 'items-end text-right' : 'items-start'}`}>
                                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-accent-soft">
                                        {esUsuario ? 'Tú' : 'Z-ONE'}
                                    </span>
                                    <p
                                        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                                            esUsuario
                                                ? 'bg-gradient-to-r from-[#9365f2] to-[#e34ba6] text-white'
                                                : 'bg-surface-2 text-texto'
                                        }`}
                                    >
                                        {mensaje.texto}
                                    </p>
                                </div>
                            </article>
                        );
                    })}

                    {escribiendo && (
                        <article data-mensaje className="flex items-end gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-3 text-white" aria-hidden="true">
                                <Bot className="h-4 w-4" />
                            </span>
                            <span className="flex items-center gap-1.5 rounded-2xl bg-surface-2 px-4 py-3" aria-label="El asistente está escribiendo">
                                <i className="h-2 w-2 animate-pulse rounded-full bg-accent-soft" />
                                <i className="h-2 w-2 animate-pulse rounded-full bg-accent-soft [animation-delay:0.2s]" />
                                <i className="h-2 w-2 animate-pulse rounded-full bg-accent-soft [animation-delay:0.4s]" />
                            </span>
                        </article>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border p-4" aria-label="Preguntas sugeridas">
                    {SUGERENCIAS.map((sugerencia) => (
                        <button
                            className="rounded-full border border-border bg-white/[0.03] px-3 py-2 text-xs font-semibold text-sutil transition hover:-translate-y-0.5 hover:border-accent/60 hover:text-accent"
                            key={sugerencia}
                            onClick={() => responder(sugerencia)}
                            type="button"
                        >
                            {sugerencia}
                        </button>
                    ))}
                </div>

                <form className="flex gap-2 border-t border-border p-4" onSubmit={enviar}>
                    <input
                        className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-texto outline-none transition placeholder:text-sutil/70 focus:border-accent focus:ring-2 focus:ring-accent/40"
                        aria-label="Mensaje para el asistente"
                        onChange={(event) => setEntrada(event.target.value)}
                        placeholder="Escribe tu mensaje..."
                        type="text"
                        value={entrada}
                    />
                    <button
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={!entrada.trim()}
                    >
                        <Send className="h-4 w-4" aria-hidden="true" /> Enviar
                    </button>
                </form>
            </section>
        </main>
    );
}
