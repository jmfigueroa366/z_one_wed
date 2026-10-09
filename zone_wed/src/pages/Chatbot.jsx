// CAPA: Presentación
import { useEffect, useRef, useState } from 'react';
import { ChatbotService } from '../services/chatbotService.js';
import '../styles/chatbot.css';

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
        <main className="workspace-content chatbot-page" data-page="chatbot">
            <header className="page-heading">
                <p className="workspace-eyebrow">ASISTENCIA</p>
                <h1>Chatbot</h1>
                <p>Resuelve tus dudas sobre la agenda, las sesiones y las solicitudes del estudio.</p>
            </header>

            <section className="chatbot-panel" aria-label="Asistente conversacional">
                <div className="chatbot-messages" ref={listaRef} role="log" aria-live="polite">
                    {mensajes.map((mensaje) => (
                        <article
                            className={`chatbot-message chatbot-message-${mensaje.autor}`}
                            key={mensaje.id}
                        >
                            <span className="chatbot-message-author">
                                {mensaje.autor === 'bot' ? 'Z-ONE' : 'Tú'}
                            </span>
                            <p>{mensaje.texto}</p>
                        </article>
                    ))}
                </div>

                <div className="chatbot-suggestions" aria-label="Preguntas sugeridas">
                    {SUGERENCIAS.map((sugerencia) => (
                        <button
                            className="chatbot-suggestion"
                            key={sugerencia}
                            onClick={() => responder(sugerencia)}
                            type="button"
                        >
                            {sugerencia}
                        </button>
                    ))}
                </div>

                <form className="chatbot-form" onSubmit={enviar}>
                    <input
                        aria-label="Mensaje para el asistente"
                        onChange={(event) => setEntrada(event.target.value)}
                        placeholder="Escribe tu mensaje..."
                        type="text"
                        value={entrada}
                    />
                    <button type="submit" disabled={!entrada.trim()}>
                        Enviar
                    </button>
                </form>
            </section>
        </main>
    );
}
