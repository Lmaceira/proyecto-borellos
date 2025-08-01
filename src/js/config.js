// Configuraciones del proyecto
export const CONFIG = {
    // URLs de las APIs
    ENDPOINTS: {
        STOCK: 'https://actualizarstock-dacnykrkba-uc.a.run.app',
        PEDIDOS: 'https://crearpedido-dacnykrkba-uc.a.run.app'
    },
    
    // WhatsApp
    WHATSAPP: {
        PHONE: '+34123456789', // Actualizar con tu número
        BASE_URL: 'https://wa.me/'
    },
    
    // Configuraciones de UI
    UI: {
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000,
        MODAL_ANIMATION_DURATION: 300
    },
    
    // Mensajes
    MESSAGES: {
        STOCK_ERROR: 'Lo sentimos, no hay suficiente stock disponible.',
        CONNECTION_ERROR: 'Error de conexión. Por favor, intenta de nuevo.',
        SUCCESS: 'Pedido enviado correctamente.'
    }
};

// Funciones de utilidad
export const UTILS = {
    formatPrice: (price) => `${price.toFixed(2)}€`,
    formatDate: (date) => new Intl.DateTimeFormat('es-ES').format(date),
    generateOrderId: () => `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
};
