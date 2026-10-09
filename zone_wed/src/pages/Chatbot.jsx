// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import { ChatbotService } from '../services/chatbotService.js';
import '../styles/tailwind.css';

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
    const listaRef = useRef(null);
    const contadorRef = useRef(0);

    useEffect(() => {
        const lista = listaRef.current;
        if (lista) {
            lista.scrollTop = lista.scrollHeight;
        }
    }, [mensajes]);

    const siguienteId = () => {
        contadorRef.current += 1;
        return `mensaje-${contadorRef.current}`;
    };

    const responder = (texto) => {
        const limpio = String(texto ?? '').trim();
        if (!limpio) {
            return;
        }

        const respuesta = ChatbotService.responder(limpio);
        setMensajes((actuales) => [
            ...actuales,
            { id: siguienteId(), autor: 'usuario', texto: limpio },
            { id: siguienteId(), autor: 'bot', texto: respuesta },
        ]);
    };

    const enviar = (event) => {
        event.preventDefault();
        responder(entrada);
        setEntrada('');
    };

    return (
        <main className="workspace-content" data-page="chatbot">
            <header className="page-heading">
                <p className="workspace-eyebrow">ASISTENCIA</p>
                <h1>Chatbot</h1>
                <p>Resuelve tus dudas sobre la agenda, las sesiones y las solicitudes del estudio.</p>
            </header>

            <section
                className="mt-6 flex max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-surface/70"
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
                            <article key={mensaje.id} className={`flex flex-col gap-1 ${esUsuario ? 'items-end text-right' : 'items-start'}`}>
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
                            </article>
                        );
                    })}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-border p-4" aria-label="Preguntas sugeridas">
                    {SUGERENCIAS.map((sugerencia) => (
                        <button
                            className="rounded-full border border-border bg-white/[0.03] px-3 py-2 text-xs font-semibold text-sutil transition hover:border-accent/60 hover:text-accent"
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
                        className="min-h-[44px] rounded-xl bg-gradient-to-r from-[#9365f2] to-[#e34ba6] px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                        type="submit"
                        disabled={!entrada.trim()}
                    >
                        Enviar
                    </button>
                </form>
            </section>
        </main>
    );
}
