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

    // Cargar productos del menú dinámicamente
    fetch('menu.json')
        .then(response => response.json())
        .then(data => {
            const menuItems = document.getElementById('menu-items');
            const promoItems = document.getElementById('promo-items');
            menuItems.innerHTML = '';
            promoItems.innerHTML = '';

            data.forEach(item => {
                if (!item.disponible) return;
                carrito[item.nombre] = 0; 
                const div = document.createElement('div');
                div.className = item.promocion ? 'promo-item' : 'menu-item';
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
                                ${item.precioUnidad ? item.precioUnidad : item.precio}
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
                let qty = 0;
                btnDecrease.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (qty > 0) qty--;
                    qtyValue.textContent = qty;
                    carrito[item.nombre] = qty; // Actualiza la variable
                    actualizarTotalCarrito(); // Actualiza el total del carrito
                });
                btnIncrease.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (qty < item.stock) qty++;
                    qtyValue.textContent = qty;
                    carrito[item.nombre] = qty; // Actualiza la variable
                    actualizarTotalCarrito(); // Actualiza el total del carrito
                });

                if (item.promocion) {
                    promoItems.appendChild(div);
                } else {
                    menuItems.appendChild(div);
                }
            });

            // Puedes acceder a las cantidades seleccionadas en cualquier momento:
            // console.log(carrito);
        })
        .catch(error => {
            console.error('Error cargando el menú:', error);
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

    // WhatsApp dinámico
    const whatsappBtn = document.getElementById('whatsapp-btn');
    if (whatsappBtn) {
        whatsappBtn.addEventListener('click', function(e) {
            e.preventDefault();
            let mensaje = "Hola, quiero hacer un pedido con lo siguiente:%0A";
            let hayProductos = false;
            for (const [producto, cantidad] of Object.entries(carrito)) {
                if (cantidad > 0) {
                    mensaje += `- ${producto}: ${cantidad}%0A`;
                    hayProductos = true;
                }
            }

            // Obtener nombre y día
            const nombreInput = document.getElementById('nombre-usuario');
            const nombre = nombreInput && nombreInput.value.trim() ? nombreInput.value.trim() : "[Tu nombre]";
            const diaSelect = document.getElementById('dia-entrega');
            const dia = diaSelect && diaSelect.value ? diaSelect.value : "[Elegir entre miércoles por la tarde o sábado por la mañana]";

            mensaje += `%0AMi nombre es *${nombre}* %0APor favor, me gustaría recibirlo el día *${dia}*.`;
            mensaje += "%0AGracias!";

            if (!hayProductos) {
                mensaje = "Hola, quiero hacer un pedido.";
            }

            const url = `https://wa.me/34664097967?text=${mensaje}`;
            window.open(url, '_blank');
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
        for (const [nombre, cantidad] of Object.entries(carrito)) {
            if (cantidad > 0) {
                // Busca el producto en el JSON cargado
                const producto = productos.find(p => p.nombre === nombre);
                if (producto) {
                    // Usa precioUnidad si existe, si no precio
                    let precio = 0;
                    if (producto.precioUnidad) {
                        precio = parseFloat(producto.precioUnidad.replace(/[^\d,\.]/g, '').replace(',', '.'));
                    } else if (producto.precio) {
                        precio = parseFloat(producto.precio.replace(/[^\d,\.]/g, '').replace(',', '.'));
                    }
                    total += precio * cantidad;
                }
            }
        }
        document.getElementById('carrito-total').textContent = total > 0 ? total.toFixed(2) + "€" : "0€";
    }

    // Guarda los productos al cargar el menú
    let productos = [];
    fetch('menu.json')
        .then(response => response.json())
        .then(data => {
            productos = data;
            // ...tu código para renderizar productos...
            // En el evento de los botones + y -:
            // Después de actualizar carrito[item.nombre], llama:
            // actualizarTotalCarrito();
        });
});