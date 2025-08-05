
// Configuración de endpoints (carga desde config.js con fallbacks seguros)
const PEDIDO_ENDPOINT = (window.APP_CONFIG && window.APP_CONFIG.PEDIDO_ENDPOINT) || 'https://crearpedido-dacnykrkba-uc.a.run.app';
const PEDIDO_API_KEY = (window.APP_CONFIG && window.APP_CONFIG.PEDIDO_API_KEY) || 'Br3ll0s_P3d1d0_2025_Pr0d_Av1l4_S3cur3_K3y_456';
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

// Función para calcular la fecha de entrega según el día seleccionado
function calcularFechaEntrega(diaEntrega) {
  const ahora = new Date();
  const fecha = new Date();
  
  if (diaEntrega === "Miércoles por la tarde") {
    // Buscar el próximo miércoles (día 3 de la semana, donde 0=domingo)
    const diasHastaMiercoles = (3 - ahora.getDay() + 7) % 7;
    if (diasHastaMiercoles === 0) {
      // Si hoy es miércoles, buscar el siguiente miércoles
      fecha.setDate(ahora.getDate() + 7);
    } else {
      fecha.setDate(ahora.getDate() + diasHastaMiercoles);
    }
    fecha.setHours(18, 0, 0, 0); // 6:00 PM UTC+2
  } else if (diaEntrega === "Sábado por la mañana") {
    // Buscar el próximo sábado (día 6 de la semana)
    const diasHastaSabado = (6 - ahora.getDay() + 7) % 7;
    if (diasHastaSabado === 0) {
      // Si hoy es sábado, buscar el siguiente sábado
      fecha.setDate(ahora.getDate() + 7);
    } else {
      fecha.setDate(ahora.getDate() + diasHastaSabado);
    }
    fecha.setHours(9, 0, 0, 0); // 9:00 AM UTC+2
  }
  
  return fecha;
}

// Función para validar si se pueden hacer pedidos según el día actual
function validarDiasPedido() {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
  const horaActual = ahora.getHours();
  
  // Viernes (5) y Sábado (6) -> No se reciben pedidos
  if (diaSemana === 5 || diaSemana === 6) {
    return { 
      puedeRealizarPedido: false, 
      diasDisponibles: [],
      mensaje: "Los pedidos se vuelven a recibir el domingo cuando se actualice el stock semanal."
    };
  }
  
  // Domingo (0), Lunes (1), Martes (2) hasta las 13h -> Pueden pedir para miércoles
  if (diaSemana === 0 || diaSemana === 1 || (diaSemana === 2 && horaActual < 13)) {
    return { 
      puedeRealizarPedido: true, 
      diasDisponibles: ["Miércoles por la tarde", "Sábado por la mañana"],
      mensaje: ""
    };
  }
  
  // Martes después de las 13h (2), Miércoles (3), Jueves (4) -> Solo pueden pedir para sábado
  if ((diaSemana === 2 && horaActual >= 13) || diaSemana === 3 || diaSemana === 4) {
    return { 
      puedeRealizarPedido: true, 
      diasDisponibles: ["Sábado por la mañana"],
      mensaje: ""
    };
  }
  
  // Fallback (no debería llegar aquí)
  return { 
    puedeRealizarPedido: false, 
    diasDisponibles: [],
    mensaje: "Error en la validación de días."
  };
}

// Función para enviar el pedido a la Cloud Function
window.enviarPedido = async function({ carrito, productos, nombre, diaEntrega }) {
  // Validar que se pueda realizar pedido
  const validacion = validarDiasPedido();
  if (!validacion.puedeRealizarPedido) {
    alert(validacion.mensaje);
    return false;
  }
  
  // Construir array de productos del pedido y calcular total
  let total = 0;
  const productosPedido = productos.filter(p => (carrito[p.id] || 0) > 0).map(p => {
    let precio = typeof p.precioUnidad === 'number' ? p.precioUnidad : parseFloat((p.precioUnidad || p.precio || '0').toString().replace(/[^\d,\.]/g, '').replace(',', '.'));
    const cantidad = carrito[p.id];
    const subtotal = precio * cantidad;
    total += subtotal;
    
    return {
      idProducto: p.id,
      nombre: p.nombre,
      precio: precio,
      cantidad: cantidad,
      subtotal: subtotal
    };
  });
  
  // Calcular fecha de entrega
  const fechaEntrega = calcularFechaEntrega(diaEntrega);
  
  const pedido = {
    cliente: nombre || "",
    direccionEnvio: "", // Campo vacío por ahora
    creadoEn: "Web",
    fechaCreacion: new Date(),
    diaEntrega: diaEntrega,
    fechaEntrega: fechaEntrega,
    ultimaActualizacion: new Date(),
    total: parseFloat(total.toFixed(2)),
    estado: "Pendiente", // Estado inicial del pedido
    productos: productosPedido
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
    console.error('Error guardando pedido:', e);
    alert('No se pudo registrar el pedido. Intenta de nuevo.');
    return false;
  }
};

// Exponer la función de validación globalmente
window.validarDiasPedido = validarDiasPedido;