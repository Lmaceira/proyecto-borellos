
// Configuración de endpoints (carga desde config.js)
const PEDIDO_ENDPOINT = window.APP_CONFIG?.PEDIDO_ENDPOINT || 'https://crearpedido-dacnykrkba-uc.a.run.app';
const PEDIDO_API_KEY = window.APP_CONFIG?.PEDIDO_API_KEY || 'ClaveEnviarPedido1234';
// Función para mostrar el modal de confirmación de pedido



window.mostrarModalConfirmacionPedido = function({ carrito, productos, nombre, diaEntrega, onConfirm }) {
  // Filtrar productos únicos por nombre
  const productosUnicos = [];
  const nombresVistos = new Set();
  productos.forEach(p => {
    if (!nombresVistos.has(p.nombre)) {
      productosUnicos.push(p);
      nombresVistos.add(p.nombre);
    }
  });
  // Construir ticket de productos
  let total = 0;
  let itemsHtml = '';
  let hayProductos = false;
  productosUnicos.forEach(producto => {
    const cantidad = carrito[producto.id] || 0;  // Usar producto.id en lugar de producto.nombre
    if (cantidad > 0) {
      hayProductos = true;
      let precio = typeof producto.precioUnidad === 'number' ? producto.precioUnidad : parseFloat((producto.precioUnidad || producto.precio || '0').toString().replace(/[^\d,\.]/g, '').replace(',', '.'));
      const subtotal = precio * cantidad;
      total += subtotal;
      itemsHtml += `
        <div class="ticket-item">
          <div class="ticket-item-row">
            <span class="ticket-prod">${producto.nombre}</span>
            <span class="ticket-cant">x${cantidad}</span>
          </div>
          <div class="ticket-item-row ticket-precios">
            <span class="ticket-precio-unit">${precio.toFixed(2)}€ c/u</span>
            <span class="ticket-subtotal">${subtotal.toFixed(2)}€</span>
          </div>
        </div>
      `;
    }
  });
  if (!hayProductos) {
    // Si no hay productos, no mostrar modal y devolver false
    return false;
  }

  const modal = document.createElement('div');
  modal.className = 'pedido-modal-bg';
  modal.innerHTML = `
    <div class="pedido-modal ticket-modal">
      <h3>Confirma tu pedido</h3>
      <div class="ticket-lista">${itemsHtml}</div>
      <div class="ticket-total">Total: <strong>${total.toFixed(2)}€</strong></div>
      <div class="pedido-modal-btns">
        <button id="pedido-modal-aceptar">Aceptar y enviar</button>
        <button id="pedido-modal-cancelar">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById('pedido-modal-cancelar').onclick = () => modal.remove();
  document.getElementById('pedido-modal-aceptar').onclick = () => {
    modal.remove();
    if (typeof onConfirm === 'function') onConfirm();
  };
  return true;
};

// Función para enviar el pedido a la Cloud Function
window.enviarPedido = async function({ carrito, productos, nombre, diaEntrega }) {
  // Construir array de productos del pedido
  const productosPedido = productos.filter(p => (carrito[p.id] || 0) > 0).map(p => {
    let precio = typeof p.precioUnidad === 'number' ? p.precioUnidad : parseFloat((p.precioUnidad || p.precio || '0').toString().replace(/[^\d,\.]/g, '').replace(',', '.'));
    return {
      nombre: p.nombre,
      cantidad: carrito[p.id],
      precio: precio
    };
  });
  const pedido = {
    nombre,
    diaEntrega,
    productos: productosPedido,
    estado: 'Pendiente',
    fecha: new Date().toISOString()
  };
  try {
    const res = await fetch(PEDIDO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PEDIDO_API_KEY
      },
      body: JSON.stringify(pedido)
    });
    if (!res.ok) throw new Error('Error al guardar el pedido');
    return true;
  } catch (e) {
    alert('No se pudo registrar el pedido. Intenta de nuevo.');
    return false;
  }
};