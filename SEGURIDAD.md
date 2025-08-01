# 🔒 CONFIGURACIÓN DE SEGURIDAD PARA PRODUCCIÓN

## ⚠️ IMPORTANTE - LEE ESTO ANTES DE DESPLEGAR

Tu proyecto ahora está configurado con **variables de entorno** para máxima seguridad en producción.

## 📋 Checklist de Seguridad

### ✅ 1. Variables de Entorno Configuradas
- [x] Frontend: `.env` con `REACT_APP_*` variables
- [x] Backend: `functions/.env` con claves de API
- [x] Archivos `.env` en `.gitignore` (NO se suben a GitHub)

### ✅ 2. Archivos Críticos
```
.env                    ← Configuración frontend (NO commitear)
functions/.env          ← Configuración backend (NO commitear)
.env.example           ← Plantilla para otros desarrolladores (SÍ commitear)
```

### ✅ 3. Scripts de Despliegue
```bash
npm run deploy:prod    ← Despliegue completo
npm run logs:live      ← Monitoreo en tiempo real
```

## 🚀 Pasos para Producción

### 1. **Configurar Variables de Entorno**
```bash
# Si es la primera vez
npm run setup

# Editar valores reales
nano .env
nano functions/.env
```

### 2. **Validar Configuración**
```bash
# Probar localmente
npm run dev

# Ver que las variables se cargan correctamente
```

### 3. **Desplegar a Producción**
```bash
# Despliegue completo con validaciones
npm run deploy:prod

# Monitorear logs
npm run logs:live
```

## 🔐 Configuración de Firebase para Producción

### Variables de Entorno para Cloud Functions
```bash
firebase functions:config:set stock.clave="TU_CLAVE_SUPER_SECRETA"
firebase functions:config:set pedidos.clave="TU_OTRA_CLAVE_SECRETA"
```

### Reglas de Seguridad Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo Cloud Functions pueden escribir
    match /{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

## 🛡️ Mejores Prácticas Implementadas

1. **✅ API Keys fuera del código**
2. **✅ URLs configurables por ambiente**
3. **✅ Archivos sensibles en .gitignore**
4. **✅ Fallbacks para desarrollo**
5. **✅ Scripts automatizados**
6. **✅ Documentación clara**

## 🔍 Verificación de Seguridad

Antes de cada despliegue, verifica:

```bash
# 1. No hay secretos en el código
git log --oneline | head -10

# 2. Variables de entorno cargadas
echo $REACT_APP_STOCK_ENDPOINT

# 3. Funciones deployadas correctamente
firebase functions:log
```

## 🚨 En caso de Emergencia

Si accidentalmente commiteas secretos:

```bash
# 1. Cambiar todas las claves inmediatamente
# 2. Regenerar API keys
# 3. Limpiar historial de Git si es necesario
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch .env' --prune-empty --tag-name-filter cat -- --all
```

---

**¡Tu proyecto está ahora LISTO para PRODUCCIÓN con máxima seguridad! 🔒✨**
