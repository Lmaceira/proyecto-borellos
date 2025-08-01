// Configuración de endpoints (carga desde config.js con fallbacks seguros)
const STOCK_ENDPOINT = (window.APP_CONFIG && window.APP_CONFIG.STOCK_ENDPOINT) || 'https://actualizarstock-dacnykrkba-uc.a.run.app';
const STOCK_API_KEY = (window.APP_CONFIG && window.APP_CONFIG.STOCK_API_KEY) || 'Br3ll0s_St0ck_2025_Pr0d_Av1l4_S3cur3_K3y_789';

document.addEventListener('DOMContentLoaded', function() {
    const navToggle = document.querySelector('.nav-toggle');
    const navList = document.querySelector('.nav-list');
    if (navToggle && navList) {
        navToggle.addEventListener('click', function() {
            navList.classList.toggle('open');
        });
        // Cierra el menú al hacer clic en cualquier enlace
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                navList.classList.remove('open');
            });
        });
    }

    // Scroll suave para los botones del menú
    document.getElementById('nav-inicio').addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.getElementById('nav-menu').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('nav-promo').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('promo').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('nav-pedido').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('haceTuPedido').scrollIntoView({ behavior: 'smooth' });
    });

    // Guarda el carrito en el scope superior
    const carrito = {};
    const contadoresQty = {}; // Nuevo: almacenar referencias a los contadores
    
    // Llama a la Cloud Function actualizarStock antes de enviar el pedido
    async function actualizarStockProductos(carrito, productos) {
        try {
                const res = await fetch('https://actualizarstock-dacnykrkba-uc.a.run.app', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-api-key': STOCK_API_KEY
                },
                body: JSON.stringify({ carrito, productos })
            });
            if (res.ok) return true;
            const data = await res.json();
            if (data && data.faltantes) {
                mostrarModalStock('', data.stockDisponible);
            } else {
                mostrarModalStock('Error al actualizar stock.');
            }
            return false;
        } catch (e) {
            alert('Error de conexión al actualizar stock.');
            return false;
        }
    }

    // Validar stock con reintentos
    async function validarStock(carrito, reintentos = 3) {
        // Verificar que los productos estén cargados
        if (!productos || productos.length === 0) {
            console.error('Los productos no están cargados aún');
            mostrarModalStock('Error: datos no disponibles. Intente de nuevo.');
            return false;
        }
        
        console.log('Enviando validación con:', { 
            carrito, 
            productos: productos.length + ' productos',
            validar: true 
        });
        
        // Mostrar detalles del carrito para debug
        console.log('Detalles del carrito:');
        for (const [productoId, cantidad] of Object.entries(carrito)) {
            if (cantidad > 0) {
                const producto = productos.find(p => p.id === productoId);
                console.log(`- ${producto?.nombre || productoId}: ${cantidad} unidades`);
                if (producto?.promocion && producto?.productos) {
                    // console.log(`  Es promoción con:`, producto.productos);
                }
            }
        }
        
        for (let intento = 1; intento <= reintentos; intento++) {
            try {
                const res = await fetch('https://actualizarstock-dacnykrkba-uc.a.run.app', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-api-key': STOCK_API_KEY
                    },
                    body: JSON.stringify({ carrito, productos, validar: true }) // Enviar productos también
                });
                const data = await res.json();
                console.log('Respuesta de validación:', data);
                
                if (res.ok) return true;
                
                console.log(`Intento ${intento} de validación falló:`, data);
                
                if (data && data.faltantes) {
                    mostrarModalStock('', data.stockDisponible);
                    return false; // No reintentar si hay productos faltantes
                } else if (intento === reintentos) {
                    mostrarModalStock('Error al validar stock después de varios intentos.');
                    return false;
                }
                
                // Esperar antes del siguiente intento (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, intento) * 100));
                
            } catch (e) {
                console.log(`Intento ${intento} falló por error de conexión:`, e);
                if (intento === reintentos) {
                    mostrarModalStock('Error de conexión al validar stock.');
                    return false;
                }
                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, intento) * 100));
            }
        }
        return false;
    }

    // Guarda los productos al cargar el menú
    let productos = [];

    // Cargar productos y promociones desde Firestore
    const menuItems = document.getElementById('menu-items');
    const promoItems = document.getElementById('promo-items');
    menuItems.innerHTML = '';
    promoItems.innerHTML = '';

    // Firestore: obtener todos los productos
    db.collection("productos").get().then((querySnapshot) => {
        const data = [];
        querySnapshot.forEach((doc) => {
            const producto = doc.data();
            producto.id = doc.id; // Agrega el ID del documento
            data.push(producto);
        });
        
        // Guardar productos ANTES de crear la UI
        productos = data;
        
        data.forEach(item => {
            if (!item.disponible) return;
            carrito[item.id] = 0; // Usar productoId internamente
            const div = document.createElement('div');
            div.className = item.promocion ? 'promo-item' : 'menu-item';
            // Formatear precios
            let precioMostrar = '';
            if (typeof item.precio === 'number') {
                precioMostrar = item.precio.toFixed(2) + '€';
            } else if (item.precio) {
                precioMostrar = item.precio;
            }
            let precioUnidadMostrar = '';
            if (typeof item.precioUnidad === 'number') {
                precioUnidadMostrar = item.precioUnidad.toFixed(2) + '€ unidad';
            } else if (item.precioUnidad) {
                precioUnidadMostrar = item.precioUnidad;
            }
            div.innerHTML = `
                <div class="menu-item-content">
                    <div class="menu-item-row">
                        <img src="${item.imagen}" alt="${item.nombre}" class="menu-img" style="cursor:pointer;">
                        <h3 class="menu-item-title">${item.nombre}</h3>
                    </div>
                    <div class="menu-item-desc-row">
                        <p class="menu-item-desc">${item.descripcion}</p>
                    </div>
                    <div class="menu-item-actions">
                        <span class="price">
                            ${precioUnidadMostrar ? precioUnidadMostrar : precioMostrar}
                        </span>
                        <div class="quantity-selector">
                            <button class="qty-btn" data-action="decrease">-</button>
                            <span class="qty-value">0</span>
                            <button class="qty-btn" data-action="increase">+</button>
                        </div>
                    </div>
                </div>
            `;
            // Imagen clicable para modal
            div.querySelector('.menu-img').addEventListener('click', function(e) {
                e.stopPropagation();
                showModal(item.imagen, item.nombre);
            });

            // Selector de cantidad
            const qtyValue = div.querySelector('.qty-value');
            const btnDecrease = div.querySelector('.qty-btn[data-action="decrease"]');
            const btnIncrease = div.querySelector('.qty-btn[data-action="increase"]');
            
            btnDecrease.addEventListener('click', function(e) {
                e.preventDefault();
                let qty = parseInt(qtyValue.textContent) || 0;
                if (qty > 0) qty--;
                qtyValue.textContent = qty;
                carrito[item.id] = qty; // Usar productoId internamente
                actualizarTotalCarrito();
            });
            btnIncrease.addEventListener('click', function(e) {
                e.preventDefault();
                let qty = parseInt(qtyValue.textContent) || 0;
                // Para promociones, no limitar por stock (se valida el stock de productos incluidos)
                // Para productos normales, limitar por su stock
                if (!item.promocion && qty >= item.stock) {
                    return; // No permitir más si es producto normal y ya llegó al límite
                }
                qty++;
                qtyValue.textContent = qty;
                carrito[item.id] = qty; // Usar productoId internamente
                actualizarTotalCarrito();
            });

            if (item.promocion) {
                promoItems.appendChild(div);
            } else {
                menuItems.appendChild(div);
            }
        });
        productos = data; // Guarda los productos con sus IDs
    }).catch(error => {
        console.error('Error cargando el menú desde Firestore:', error);
    });

    // Modal básico
    function showModal(src, alt) {
        let modal = document.createElement('div');
        modal.className = 'menu-modal';
        modal.innerHTML = `
            <div class="menu-modal-content">
                <img src="${src}" alt="${alt}">
            </div>
        `;
        document.body.appendChild(modal);
        // Cerrar modal al hacer clic en cualquier parte
        modal.addEventListener('click', function() {
            modal.remove();
        });
    }

    // WhatsApp dinámico con confirmación y registro de pedido
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            // Validar stock antes de proceder
            const stockValido = await validarStock(carrito);
            if (!stockValido) return;

            // Obtener nombre y día
            const nombreInput = document.getElementById('nombre-usuario');
            const nombre = nombreInput && nombreInput.value.trim() ? nombreInput.value.trim() : "[Tu nombre]";
            const diaSelect = document.getElementById('dia-entrega');
            const dia = diaSelect && diaSelect.value ? diaSelect.value : "[Elegir entre miércoles por la tarde o sábado por la mañana]";

            // Mostrar modal de confirmación
            console.log('Intentando mostrar modal de confirmación...');
            console.log('window.mostrarModalConfirmacionPedido existe?', typeof window.mostrarModalConfirmacionPedido);
            
            const modalMostrado = window.mostrarModalConfirmacionPedido({
                carrito,
                productos,
                nombre,
                diaEntrega: dia,
                onConfirm: async () => {
                    // Validar y actualizar stock en Firestore antes de enviar pedido
                    const stockOk = await actualizarStockProductos(carrito, productos);
                    if (!stockOk) return;
                    // Enviar pedido a backend
                    const ok = await window.enviarPedido({ carrito, productos, nombre, diaEntrega: dia });
                    if (ok) {
                        // Construir mensaje WhatsApp
                        let mensaje = "Hola, quiero hacer un pedido con lo siguiente:%0A";
                        let hayProductos = false;
                        for (const [productoId, cantidad] of Object.entries(carrito)) {
                            if (cantidad > 0) {
                                // Buscar el producto para obtener su nombre
                                const producto = productos.find(p => p.id === productoId);
                                const nombreProducto = producto ? producto.nombre : productoId;
                                mensaje += `- ${nombreProducto}: ${cantidad}%0A`;
                                hayProductos = true;
                            }
                        }
                        if (hayProductos) {
                            mensaje += `%0AMi nombre es *${nombre}* %0APor favor, me gustaría recibirlo el día *${dia}*.`;
                        } else {
                            mensaje = "Hola, quiero hacer un pedido.";
                        }
                        mensaje += "%0AGracias!";
                        const url = `https://wa.me/34611033550?text=${mensaje}`;
                        window.open(url, '_blank');
                    }
                }
            });
            
            console.log('Modal mostrado?', modalMostrado);
            if (modalMostrado === false) {
                // Si no hay productos, enviar WhatsApp directamente (sin fetch)
                let mensaje = "Hola, quiero hacer un pedido.";
                if (nombre || dia) {
                    mensaje += `%0AMi nombre es *${nombre}* %0APor favor, me gustaría recibirlo el día *${dia}*.`;
                }
                mensaje += "%0AGracias!";
                const url = `https://wa.me/34611033550?text=${mensaje}`;
                window.open(url, '_blank');
            }
        });
    }

    const nombreInput = document.getElementById('nombre-usuario');
    if (nombreInput) {
        nombreInput.addEventListener('focus', function() {
            this.placeholder = '';
        });
        nombreInput.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.placeholder = 'Nombre';
            }
        });
        nombreInput.addEventListener('input', function() {
            // Solo letras y espacios
            this.value = this.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g, '');
        });
    }

    // Efecto de visibilidad para promociones
    const promoSection = document.querySelector('.promociones');
    if (promoSection) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        promoSection.classList.add('visible');
                    } else {
                        promoSection.classList.remove('visible');
                    }
                });
            },
            { threshold: 0.3 }
        );
        observer.observe(promoSection);
    }

    function actualizarTotalCarrito() {
        let total = 0;
        for (const [productoId, cantidad] of Object.entries(carrito)) {
            if (cantidad > 0) {
                // Busca el producto en el array productos
                const producto = productos.find(p => p.id === productoId); // Usar productoId para buscar
                if (producto) {
                    let precio = 0;
                    // Si precioUnidad es number, úsalo; si es string, parsea; si no, usa precio
                    if (typeof producto.precioUnidad === 'number') {
                        precio = producto.precioUnidad;
                    } else if (producto.precioUnidad) {
                        precio = parseFloat(producto.precioUnidad.replace(/[^\d,\.]/g, '').replace(',', '.'));
                    } else if (typeof producto.precio === 'number') {
                        precio = producto.precio;

                    } else if (producto.precio) {
                        precio = parseFloat(producto.precio.replace(/[^\d,\.]/g, '').replace(',', '.'));
                    }
                    total += precio * cantidad;
                }
            }
        }
        document.getElementById('carrito-total').textContent = total > 0 ? total.toFixed(2) + "€" : "0€";
    }

    // Función para limpiar el carrito y resetear contadores
    function limpiarCarritoCompleto() {
        console.log("Limpiando carrito completo...");
        
        // Resetear el objeto carrito
        for (const productoId in carrito) {
            carrito[productoId] = 0;
        }
        
        // Resetear todos los contadores visuales
        document.querySelectorAll('.qty-value').forEach(qtyElement => {
            qtyElement.textContent = '0';
        });
        
        // Actualizar contador del header
        const basketCountElement = document.getElementById('basket-count');
        if (basketCountElement) {
            basketCountElement.textContent = '0';
        }
        
        // Actualizar el total
        actualizarTotalCarrito();
        
        console.log("Carrito completamente limpiado");
    }

    // Hacer la función disponible globalmente para mostrarModalStock
    window.limpiarCarritoCompleto = limpiarCarritoCompleto;
});

function mostrarModalStock(mensaje, stockDisponible = null) {
    const modal = document.getElementById('stock-modal');
    const modalMessage = document.getElementById('stock-modal-message');
    const closeModal = document.getElementById('close-stock-modal');

    // Si tenemos información de stock disponible, crear un modal personalizado
    if (stockDisponible) {
        let contenidoHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <h3>Lo sentimos <span class="emoji">😔</span></h3>
                <p>No tenemos todo lo que necesitas, actualmente te podemos ofrecer:</p>
            </div>
            <div class="stock-container">
                <ul style="list-style: none; padding: 0; margin: 0;">
        `;
        
        for (const [producto, stock] of Object.entries(stockDisponible)) {
            contenidoHTML += `
                <li>
                    <span>${producto}</span>
                    <span class="stock-badge">${stock} disponibles</span>
                </li>
            `;
        }
        
        contenidoHTML += `
                </ul>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <p>Si tienes alguna duda nos puedes contactar por WhatsApp.</p>
                <button onclick="window.open('https://wa.me/34611033550?text=Hola, tengo una consulta', '_blank')" 
                        class="whatsapp-btn">
                    💬 Contactar por WhatsApp
                </button>
            </div>
        `;
        
        modalMessage.innerHTML = contenidoHTML;
    } else {
        // Modal básico para otros mensajes
        modalMessage.textContent = mensaje;
    }
    
    modal.classList.remove('hidden');

    // Limpiar carrito y resetear contadores
    if (stockDisponible) {
        window.limpiarCarritoCompleto();
    }

    closeModal.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}
