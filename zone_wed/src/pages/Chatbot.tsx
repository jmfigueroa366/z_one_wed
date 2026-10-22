// CAPA: Presentación
import { useEffect, useMemo, useRef, useState } from 'react';
import anime from 'animejs';
import { Bot, CalendarClock, Send, Sparkles, User, Zap } from 'lucide-react';
import { ChatbotService } from '../services/chatbotService.ts';
import type { FormEvent } from 'react';
import '../styles/tailwind.css';

const MENOS_MOVIMIENTO = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface MensajeChat {
    id: string;
    autor: 'bot' | 'usuario';
    texto: string;
    hora: string;
}

const MENSAJE_INICIAL: MensajeChat = {
    id: 'mensaje-inicial',
    autor: 'bot',
    texto: 'Hola, soy el asistente de Z-ONE. Puedo orientarte con la agenda, las sesiones y las solicitudes del estudio.',
    hora: '',
};

const SUGERENCIAS = [
    { texto: '¿Cómo creo una sesión?', icono: CalendarClock },
    { texto: '¿Qué salas están disponibles?', icono: Sparkles },
    { texto: '¿Cómo gestiono una solicitud?', icono: Zap },
];

function horaActual(): string {
    return new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

export default function Chatbot() {
    const [mensajes, setMensajes] = useState<MensajeChat[]>([{ ...MENSAJE_INICIAL, hora: horaActual() }]);
    const [entrada, setEntrada] = useState('');
    const [escribiendo, setEscribiendo] = useState(false);
    const [usadas, setUsadas] = useState<string[]>([]);
    const listaRef = useRef<HTMLDivElement>(null);
    const contadorRef = useRef(0);
    const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const totalPrevioRef = useRef(0);

    useEffect(() => () => clearTimeout(temporizadorRef.current ?? undefined), []);

    useEffect(() => {
        const lista = listaRef.current;
        if (lista) lista.scrollTo({ top: lista.scrollHeight, behavior: MENOS_MOVIMIENTO() ? 'auto' : 'smooth' });
        if (MENOS_MOVIMIENTO()) return undefined;
        const nodos = lista ? [...lista.querySelectorAll('[data-mensaje]')] : [];
        const nuevos = nodos.slice(totalPrevioRef.current);
        totalPrevioRef.current = nodos.length;
        if (!nuevos.length) return undefined;
        const animacion = anime({
            targets: nuevos,
            opacity: [0, 1],
            translateY: [16, 0],
            scale: [0.97, 1],
            duration: 420,
            delay: anime.stagger(70),
            easing: 'easeOutCubic',
        });
        return () => animacion.pause();
    }, [mensajes, escribiendo]);

    const siguienteId = () => {
        contadorRef.current += 1;
        return `mensaje-${contadorRef.current}`;
    };

    const responder = (texto: string) => {
        const limpio = String(texto ?? '').trim();
        if (!limpio) return;

        const respuesta = ChatbotService.responder(limpio);
        setMensajes((actuales) => [...actuales, { id: siguienteId(), autor: 'usuario', texto: limpio, hora: horaActual() }]);
        setEscribiendo(true);
        clearTimeout(temporizadorRef.current ?? undefined);
        temporizadorRef.current = setTimeout(() => {
            setMensajes((actuales) => [...actuales, { id: siguienteId(), autor: 'bot', texto: respuesta, hora: horaActual() }]);
            setEscribiendo(false);
        }, MENOS_MOVIMIENTO() ? 0 : 700);
    };

    const enviar = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        responder(entrada);
        setEntrada('');
    };

    const usarSugerencia = (sugerencia: string) => {
        setUsadas((actuales) => (actuales.includes(sugerencia) ? actuales : [...actuales, sugerencia]));
        responder(sugerencia);
    };

    const sugerenciasVisibles = useMemo(() => SUGERENCIAS.filter((item) => !usadas.includes(item.texto)), [usadas]);

    return (
        <main className="workspace-content" data-page="chatbot">
            <header className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-surface-2/80 via-surface/60 to-surface/20 p-6 sm:p-8">
                <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-10 h-64 w-64 animate-aurora rounded-full bg-[#9365f2]/25 blur-3xl" />
                <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 animate-aurora rounded-full bg-magenta/20 blur-3xl" />
                <div className="relative">
                    <p className="workspace-eyebrow">ASISTENCIA</p>
                    <h1 className="mt-1 text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight tracking-[-0.04em]">
                        Chat<span className="texto-degradado">bot</span>
                    </h1>
                    <p className="mt-2 max-w-2xl leading-relaxed text-sutil">
                        Resuelve tus dudas sobre la agenda, las sesiones y las solicitudes del estudio.
                    </p>
                </div>
            </header>

            <section
                className="relative mt-6 overflow-hidden rounded-[2rem] border border-accent/30 p-6 sm:p-7"
                style={{
                    background:
                        'radial-gradient(ellipse at 90% 8%, rgba(240, 79, 166, 0.32), transparent 46%), radial-gradient(ellipse at 4% 100%, rgba(111, 75, 187, 0.42), transparent 50%), linear-gradient(120deg, rgba(111, 75, 187, 0.42), rgba(23, 19, 34, 0.96) 72%)',
                }}
            >
                <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-60 w-60 animate-aurora rounded-full bg-[#e34ba6]/25 blur-3xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#9365f2] to-[#e34ba6] text-white shadow-lg shadow-accent/30">
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
                className="mt-5 flex flex-col overflow-hidden rounded-[2rem] border border-border bg-gradient-to-b from-surface-2/70 via-surface/70 to-surface-2/40 shadow-xl shadow-black/30"
                aria-label="Asistente conversacional"
            >
                <div
                    className="flex h-[min(56vh,520px)] flex-col gap-4 overflow-y-auto p-5 [scrollbar-color:theme(colors.accent/40)_transparent]"
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
                                className={`flex gap-3 ${esUsuario ? 'flex-row-reverse' : ''}`}
                            >
                                <span
                                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white shadow-md shadow-black/30 ${
                                        esUsuario ? 'bg-gradient-to-br from-[#9365f2] to-[#e34ba6]' : 'bg-gradient-to-br from-surface-3 to-surface-2'
                                    }`}
                                    aria-hidden="true"
                                >
                                    {esUsuario ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </span>
                                <div className={`flex max-w-[80%] flex-col gap-1 ${esUsuario ? 'items-end' : 'items-start'}`}>
                                    <span className="flex items-center gap-2 px-1 text-[0.68rem] font-bold uppercase tracking-wider text-sutil">
                                        {esUsuario ? 'Tú' : 'Z-ONE'}
                                        {mensaje.hora && <span className="font-normal normal-case tracking-normal text-sutil/70">{mensaje.hora}</span>}
                                    </span>
                                    <div className={`relative rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                                        esUsuario
                                            ? 'rounded-br-md bg-gradient-to-r from-[#9365f2] to-[#e34ba6] text-white shadow-lg shadow-accent/20'
                                            : 'rounded-bl-md border border-border bg-surface/90 text-texto shadow-md shadow-black/20'
                                    }`}>
                                        {mensaje.texto}
                                        <span
                                            className={`absolute bottom-0 h-3 w-3 ${
                                                esUsuario
                                                    ? '-right-1 rounded-bl-full bg-[#e34ba6]'
                                                    : '-left-1 rounded-br-full border-b border-l border-border bg-surface/90'
                                            }`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                </div>
                            </article>
                        );
                    })}

                    {escribiendo && (
                        <article data-mensaje className="flex gap-3">
                            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-surface-3 to-surface-2 text-white shadow-md shadow-black/30" aria-hidden="true">
                                <Bot className="h-4 w-4" />
                            </span>
                            <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-surface/90 px-4 py-3 shadow-md shadow-black/20" aria-label="El asistente está escribiendo">
                                <i className="h-2 w-2 animate-bounce rounded-full bg-accent-soft" />
                                <i className="h-2 w-2 animate-bounce rounded-full bg-accent-soft [animation-delay:0.15s]" />
                                <i className="h-2 w-2 animate-bounce rounded-full bg-accent-soft [animation-delay:0.3s]" />
                            </span>
                        </article>
                    )}

                    {mensajes.length === 1 && sugerenciasVisibles.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-2" aria-label="Preguntas sugeridas">
                            {sugerenciasVisibles.map(({ texto, icono: Icono }) => (
                                <button
                                    className="group inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/[0.08] px-3.5 py-2 text-xs font-semibold text-accent-soft transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-accent/15"
                                    key={texto}
                                    onClick={() => usarSugerencia(texto)}
                                    type="button"
                                >
                                    <Icono className="h-3.5 w-3.5 transition group-hover:scale-110" aria-hidden="true" />
                                    {texto}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <form className="flex gap-2 border-t border-border bg-black/20 p-4" onSubmit={enviar}>
                    <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-surface-2 px-4 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/40">
                        <Sparkles className="h-4 w-4 shrink-0 text-sutil" aria-hidden="true" />
                        <input
                            className="flex-1 bg-transparent py-3 text-sm text-texto outline-none placeholder:text-sutil/70"
                            aria-label="Mensaje para el asistente"
                            onChange={(event) => setEntrada(event.target.value)}
                            placeholder="Escribe tu mensaje..."
                            type="text"
                            value={entrada}
                        />
                    </div>
                    <button
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white shadow-lg shadow-accent/25 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
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
