// CAPA: Aplicación
export const ChatbotService = {
    responder(mensaje) {
        const texto = String(mensaje ?? '').trim();
        if (!texto) {
            return 'Estoy listo para ayudarte con la agenda, sesiones o solicitudes.';
        }

        return `He recibido: "${texto}". En esta versión la lógica de chatbot queda preparada para integrarse con la capa de UI.`;
    },
};

export default ChatbotService;
