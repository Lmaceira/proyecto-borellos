// === GESTOR DE COOKIES ===
class CookieManager {
    constructor() {
        this.cookieName = 'borellos_cookie_preferences';
        this.defaultPreferences = {
            essential: true,
            analytics: false,
            timestamp: Date.now(),
            version: '1.0'
        };
        this.init();
    }

    init() {
        // Cargar preferencias existentes
        this.preferences = this.loadPreferences();
        
        // Si no hay preferencias guardadas, mostrar banner
        if (!this.preferences) {
            this.showBanner();
        } else {
            // Aplicar preferencias guardadas
            this.applyPreferences(this.preferences);
        }
        
        // Configurar event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Botones del banner
        document.getElementById('cookie-accept')?.addEventListener('click', () => {
            this.acceptAll();
        });
        
        document.getElementById('cookie-essential')?.addEventListener('click', () => {
            this.acceptEssential();
        });
        
        document.getElementById('cookie-info')?.addEventListener('click', () => {
            this.showInfoModal();
        });
        
        // Modal de información
        document.getElementById('close-cookie-modal')?.addEventListener('click', () => {
            this.hideInfoModal();
        });
        
        document.getElementById('save-cookie-preferences')?.addEventListener('click', () => {
            this.saveCustomPreferences();
        });
    }

    showBanner() {
        const banner = document.getElementById('cookie-banner');
        const carritoModal = document.querySelector('.carrito-modal');
        
        if (banner) {
            banner.classList.remove('hidden');
            // Añadir clase al carrito para moverlo hacia arriba
            if (carritoModal) {
                carritoModal.classList.add('cookie-active');
            }
            // Pequeño delay para la animación
            setTimeout(() => {
                banner.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        const carritoModal = document.querySelector('.carrito-modal');
        
        if (banner) {
            banner.style.transform = 'translateY(100%)';
            // Remover clase del carrito
            if (carritoModal) {
                carritoModal.classList.remove('cookie-active');
            }
            setTimeout(() => {
                banner.classList.add('hidden');
            }, 400);
        }
    }

    showInfoModal() {
        const modal = document.getElementById('cookie-info-modal');
        if (modal) {
            modal.classList.remove('hidden');
            // Cargar estado actual del toggle
            const analyticsToggle = document.getElementById('analytics-toggle');
            if (analyticsToggle) {
                analyticsToggle.checked = this.preferences ? this.preferences.analytics : true;
            }
        }
    }

    hideInfoModal() {
        const modal = document.getElementById('cookie-info-modal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    acceptAll() {
        const preferences = {
            essential: true,
            analytics: true,
            timestamp: Date.now(),
            version: '1.0'
        };
        this.savePreferences(preferences);
        this.applyPreferences(preferences);
        this.hideBanner();
    }

    acceptEssential() {
        const preferences = {
            essential: true,
            analytics: false,
            timestamp: Date.now(),
            version: '1.0'
        };
        this.savePreferences(preferences);
        this.applyPreferences(preferences);
        this.hideBanner();
    }

    saveCustomPreferences() {
        const analyticsToggle = document.getElementById('analytics-toggle');
        const preferences = {
            essential: true,
            analytics: analyticsToggle ? analyticsToggle.checked : false,
            timestamp: Date.now(),
            version: '1.0'
        };
        this.savePreferences(preferences);
        this.applyPreferences(preferences);
        this.hideInfoModal();
        this.hideBanner();
    }

    savePreferences(preferences) {
        try {
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1); // 1 año
            document.cookie = `${this.cookieName}=${JSON.stringify(preferences)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
            this.preferences = preferences;
            console.log('✅ Preferencias de cookies guardadas:', preferences);
        } catch (error) {
            console.error('❌ Error guardando preferencias de cookies:', error);
        }
    }

    loadPreferences() {
        try {
            const cookies = document.cookie.split(';');
            const cookieValue = cookies.find(cookie => 
                cookie.trim().startsWith(`${this.cookieName}=`)
            );
            
            if (cookieValue) {
                const value = cookieValue.split('=')[1];
                const preferences = JSON.parse(decodeURIComponent(value));
                console.log('✅ Preferencias de cookies cargadas:', preferences);
                return preferences;
            }
        } catch (error) {
            console.error('❌ Error cargando preferencias de cookies:', error);
        }
        return null;
    }

    applyPreferences(preferences) {
        // Aplicar cookies esenciales (siempre activas)
        if (preferences.essential) {
            console.log('✅ Cookies esenciales: Activas');
        }

        // Aplicar cookies de analytics
        if (preferences.analytics) {
            console.log('✅ Cookies de analytics: Activas');
            this.enableAnalytics();
        } else {
            console.log('❌ Cookies de analytics: Desactivadas');
            this.disableAnalytics();
        }
    }

    enableAnalytics() {
        // Solo habilitar si existe measurementId en la configuración
        if (window.firebaseConfig && window.firebaseConfig.measurementId) {
            try {
                // Cargar Google Analytics de forma dinámica
                if (window.loadGoogleAnalytics) {
                    window.loadGoogleAnalytics();
                    console.log('🔍 Google Analytics habilitado');
                } else {
                    console.log('⚠️ Función loadGoogleAnalytics no disponible');
                }
            } catch (error) {
                console.error('❌ Error activando analytics:', error);
            }
        } else {
            console.log('ℹ️ Google Analytics no configurado (measurementId no encontrado)');
        }
    }

    disableAnalytics() {
        // Desactivar analytics si está activo
        try {
            if (window.disableGoogleAnalytics) {
                window.disableGoogleAnalytics();
                console.log('🔍 Google Analytics desactivado');
            }
        } catch (error) {
            console.error('❌ Error desactivando analytics:', error);
        }
    }

    // Método público para verificar consentimiento
    hasConsent(type) {
        return this.preferences && this.preferences[type] === true;
    }

    // Método para resetear preferencias (útil para testing)
    resetPreferences() {
        document.cookie = `${this.cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        this.preferences = null;
        console.log('🔄 Preferencias de cookies reseteadas');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    window.cookieManager = new CookieManager();
});

// Hacer disponible globalmente para debugging
window.CookieManager = CookieManager;
