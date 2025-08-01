// Firebase configuration (para navegador - estas configuraciones son públicas por diseño)
const firebaseConfig = {
  apiKey: "AIzaSyBrNE4zcqt8_ahrb7pkGdffnGpa6Qlryw",
  authDomain: "borellos.firebaseapp.com",
  projectId: "borellos",
  storageBucket: "borellos.appspot.com",
  messagingSenderId: "540807515613",
  appId: "1:540807515613:web:8a68f3504fa6373873634",
  measurementId: "G-KH6VXZQRSE"
};

// Configuración de API para producción (temporal hasta implementar backend proxy)
window.APP_CONFIG = {
  STOCK_ENDPOINT: 'https://actualizarstock-dacnykrkba-uc.a.run.app',
  STOCK_API_KEY: 'Br3ll0s_St0ck_2025_Pr0d_Av1l4_S3cur3_K3y_789',
  PEDIDO_ENDPOINT: 'https://crearpedido-dacnykrkba-uc.a.run.app',
  PEDIDO_API_KEY: 'Br3ll0s_P3d1d0_2025_Pr0d_Av1l4_S3cur3_K3y_456'
};
