/* eslint-disable */
// Cargar variables de entorno
require('dotenv').config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.actualizarStock = functions.https.onRequest(async (req, res) => {
  // Configurar headers CORS más específicos
  res.set("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, x-api-key");
  res.set("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Método no permitido");
    return;
  }

  try {
    // Validar API key
    const claveEnviada = req.get("x-api-key");
    const claveCorrecta = process.env.STOCK_CLAVE;
    if (claveEnviada !== claveCorrecta) {
      return res.status(403).send("Prohibido");
    }

    const { carrito, productos, validar } = req.body;
    console.log('Datos recibidos:', { 
        carrito: Object.keys(carrito || {}), 
        productos: productos ? productos.length : 'undefined',
        validar 
    });
    
    if (!carrito) {
        return res.status(400).json({ error: "Faltan datos: carrito requerido" });
    }
    
    // Si solo es validación, no necesitamos productos
    if (!validar && !productos) {
        return res.status(400).json({ error: "Faltan datos: productos requerido para actualización" });
    }
    const dbRef = admin.firestore();
    
    // Usar transacción para garantizar consistencia
    const result = await dbRef.runTransaction(async (transaction) => {
        const stockRequerido = {}; // Solo acumular stock de productos reales (no promociones)
        const faltantes = [];
        const datosProductos = {}; // Cache para los datos de productos leídos
        
        // PASO 1: Leer todos los productos del carrito primero
        const productosALeer = Object.keys(carrito).filter(id => carrito[id] > 0);
        for (const productoId of productosALeer) {
            const docRef = dbRef.collection("productos").doc(productoId);
            const docSnapshot = await transaction.get(docRef);
            if (docSnapshot.exists) {
                datosProductos[productoId] = docSnapshot.data();
            }
        }
        
        // PASO 2: Procesar todos los items del carrito usando los datos leídos
        for (const [productoId, cantidad] of Object.entries(carrito)) {
            if (cantidad <= 0) continue;
            
            console.log(`Procesando: ${productoId}, cantidad: ${cantidad}`);
            
            const producto = datosProductos[productoId];
            if (!producto) {
                console.error(`Producto ${productoId} no existe`);
                continue;
            }
            
            console.log(`Producto: ${producto.nombre}, es promoción: ${producto.promocion}`);
            console.log(`Productos incluidos:`, producto.productos);
            console.log(`Tipo de producto.productos:`, typeof producto.productos);
            console.log(`Es array?:`, Array.isArray(producto.productos));
            
            if (producto.promocion && producto.productos) {
                // Es una promoción - agregar stock requerido de productos incluidos
                console.log(`✅ DETECTADA PROMOCIÓN: ${producto.nombre} con productos:`, producto.productos);
                
                // Si productos es un array
                if (Array.isArray(producto.productos)) {
                    for (const inc of producto.productos) {
                        console.log(`Procesando producto incluido (array):`, inc);
                        if (inc && inc.id && inc.cantidad) {
                            const cantidadRequerida = cantidad * inc.cantidad;
                            console.log(`  - Producto incluido ${inc.id}: ${cantidadRequerida} unidades (${cantidad} x ${inc.cantidad})`);
                            
                            if (!stockRequerido[inc.id]) {
                                stockRequerido[inc.id] = 0;
                            }
                            stockRequerido[inc.id] += cantidadRequerida;
                        } else {
                            console.log(`❌ Producto incluido inválido:`, inc);
                        }
                    }
                } 
                // Si productos es un objeto/map
                else if (typeof producto.productos === 'object') {
                    console.log(`Procesando productos como objeto/map:`, producto.productos);
                    // Si tiene propiedades id y cantidad directamente
                    if (producto.productos.id && producto.productos.cantidad) {
                        const cantidadRequerida = cantidad * producto.productos.cantidad;
                        console.log(`  - Producto incluido ${producto.productos.id}: ${cantidadRequerida} unidades (${cantidad} x ${producto.productos.cantidad})`);
                        
                        if (!stockRequerido[producto.productos.id]) {
                            stockRequerido[producto.productos.id] = 0;
                        }
                        stockRequerido[producto.productos.id] += cantidadRequerida;
                    }
                    // Si es un map con múltiples productos
                    else {
                        for (const [key, value] of Object.entries(producto.productos)) {
                            console.log(`Procesando entrada del map:`, key, value);
                            if (value && typeof value === 'object' && value.id && value.cantidad) {
                                const cantidadRequerida = cantidad * value.cantidad;
                                console.log(`  - Producto incluido ${value.id}: ${cantidadRequerida} unidades (${cantidad} x ${value.cantidad})`);
                                
                                if (!stockRequerido[value.id]) {
                                    stockRequerido[value.id] = 0;
                                }
                                stockRequerido[value.id] += cantidadRequerida;
                            }
                        }
                    }
                }
            } else {
                // Es un producto normal - agregar directamente al stock requerido
                console.log(`⚪ PRODUCTO NORMAL: ${producto.nombre}, agregando ${cantidad} unidades`);
                if (!stockRequerido[productoId]) {
                    stockRequerido[productoId] = 0;
                }
                stockRequerido[productoId] += cantidad;
            }
        }
        
        console.log('Stock requerido final:', stockRequerido);
        
        // PASO 3: Leer productos adicionales que necesitamos para el stock requerido
        const productosAdicionales = Object.keys(stockRequerido).filter(id => !datosProductos[id]);
        for (const productoId of productosAdicionales) {
            const docRef = dbRef.collection("productos").doc(productoId);
            const docSnapshot = await transaction.get(docRef);
            if (docSnapshot.exists) {
                datosProductos[productoId] = docSnapshot.data();
            }
        }
        
        // PASO 4: Validación final usando los datos ya leídos
        console.log('=== INICIANDO VALIDACIÓN FINAL ===');
        let stockDisponible = {};
        
        for (const productoId of Object.keys(stockRequerido)) {
            const cantidadRequerida = stockRequerido[productoId] || 0;
            if (cantidadRequerida <= 0) continue;
            
            console.log(`Validando producto ${productoId}: necesita ${cantidadRequerida} unidades`);
            
            const producto = datosProductos[productoId];
            if (!producto) {
                console.error(`El documento con ID ${productoId} no existe en la colección productos.`);
                faltantes.push(productoId);
                continue;
            }

            console.log(`Producto ${producto.nombre}: stock disponible = ${producto.stock}, requerido = ${cantidadRequerida}`);
            stockDisponible[producto.nombre] = producto.stock;
            
            if (cantidadRequerida > producto.stock) {
                console.log(`❌ STOCK INSUFICIENTE: ${producto.nombre} - Requerido: ${cantidadRequerida}, Disponible: ${producto.stock}`);
                faltantes.push(producto.nombre);
            } else {
                console.log(`✅ STOCK SUFICIENTE: ${producto.nombre} - Requerido: ${cantidadRequerida}, Disponible: ${producto.stock}`);
            }
        }
        
        console.log('=== RESULTADO VALIDACIÓN ===');
        console.log('Productos faltantes:', faltantes);
        
        // PASO 5: Si no es solo validación y no hay faltantes, proceder con la actualización
        if (!validar && faltantes.length === 0) {
            for (const [productoId, cantidadRequerida] of Object.entries(stockRequerido)) {
                if (cantidadRequerida <= 0) continue;
                
                const docRef = dbRef.collection("productos").doc(productoId);
                const productoActual = datosProductos[productoId];
                
                if (!productoActual) {
                    throw new Error(`El documento con ID ${productoId} no existe`);
                }
                
                // Actualizar stock
                transaction.update(docRef, { 
                    stock: admin.firestore.FieldValue.increment(-cantidadRequerida),
                    ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp()
                });
                
                console.log(`Stock actualizado: ${productoActual.nombre} - Descontado: ${cantidadRequerida}`);
            }
        }
        
        return { faltantes, stockRequerido, stockDisponible };
    });
    
    const { faltantes, stockDisponible } = result;

    if (faltantes.length > 0) {
        return res.status(400).json({ faltantes, stockDisponible });
    }

    // Si solo es validación, retornar éxito sin actualizar
    if (validar) {
        return res.json({ ok: true, mensaje: "Stock validado correctamente" });
    }

    // Si llegamos aquí, significa que no hay faltantes y no es solo validación
    // La actualización ya se realizó en la transacción anterior
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error actualizando stock:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});