// ARCHIVO DE EJEMPLO - Copia este archivo como config.js y configura tus claves reales
// Configuración centralizada para el frontend

// Función para detectar el entorno
function getEnvironment() {
    // En desarrollo local (puerto 5000 o localhost)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
    }
    // En Firebase Hosting o dominio personalizado
    return 'production';
}

// Configuración por ambiente
const CONFIG = {
    development: {
        STOCK_ENDPOINT: 'https://actualizarstock-dacnykrkba-uc.a.run.app',
        STOCK_API_KEY: 'TU_CLAVE_DE_DESARROLLO_STOCK',
        PEDIDO_ENDPOINT: 'https://crearpedido-dacnykrkba-uc.a.run.app',
        PEDIDO_API_KEY: 'TU_CLAVE_DE_DESARROLLO_PEDIDOS'
    },
    production: {
        STOCK_ENDPOINT: 'https://actualizarstock-dacnykrkba-uc.a.run.app',
        STOCK_API_KEY: 'TU_CLAVE_DE_PRODUCCION_STOCK_MUY_COMPLEJA',
        PEDIDO_ENDPOINT: 'https://crearpedido-dacnykrkba-uc.a.run.app',
        PEDIDO_API_KEY: 'TU_CLAVE_DE_PRODUCCION_PEDIDOS_MUY_COMPLEJA'
    }
};

// Obtener configuración actual
const currentConfig = CONFIG[getEnvironment()];

// Debug info (solo en desarrollo)
if (getEnvironment() === 'development') {
    console.log('🔧 Entorno detectado:', getEnvironment());
    console.log('🔧 Configuración cargada:', currentConfig);
}

// Exportar configuración (para uso global)
window.APP_CONFIG = currentConfig;
