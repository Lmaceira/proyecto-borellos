/* eslint-disable */
// Cargar variables de entorno
require('dotenv').config();

const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.crearPedido = functions.https.onRequest(async (req, res) => {
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
    const claveEnviada = req.get("x-api-key");
    const claveCorrecta = process.env.PEDIDOS_CLAVE;
    if (claveEnviada !== claveCorrecta) {
      return res.status(403).send("Prohibido");
    }
    
    // Guardar pedido en Firestore
    const db = admin.firestore();
    const pedidoData = {
      ...req.body,
      fecha: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection("pedidos").add(pedidoData);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Error creando pedido:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});
