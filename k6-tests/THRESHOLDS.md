# Justificación de Umbrales - Pruebas de Rendimiento K6

## 📊 Contexto del Sistema

El sistema de votaciones electrónicas de la Universidad Técnica Nacional requiere soportar elecciones con participación estudiantil y administrativa. Para establecer umbrales realistas, se consideraron los siguientes factores:

### Estimación de Carga de Usuarios

**Población objetivo:**
- Estudiantes activos: ~5,000
- Personal administrativo: ~500
- **Total de votantes potenciales: 5,500**

**Patrón de uso esperado:**
- **Ventana de votación típica:** 8 horas (28,800 segundos)
- **Participación estimada:** 70% (3,850 usuarios)
- **Distribución temporal:** No uniforme, con picos en:
  - Primera hora (30% del total): ~1,155 votos
  - Hora del almuerzo (25% del total): ~963 votos
  - Última hora (20% del total): ~770 votos

**Carga pico calculada:**
- **Usuarios en primera hora:** 1,155 votos / 3,600s = **0.32 votos/segundo**
- **Factor de concurrencia:** 3-5 minutos promedio por sesión
- **Usuarios concurrentes estimados:** **15-25 usuarios simultáneos**

---

## 🧪 Smoke Test - Justificación de Umbrales

### Objetivo
Verificar que el sistema responde correctamente bajo carga mínima, validando la disponibilidad básica del servicio de autenticación.

### Configuración
```javascript
vus: 3,              // Usuarios virtuales simultáneos
duration: '10s',     // Duración de la prueba
```

### Umbrales Definidos

#### 1. Tasa de Fallos HTTP: `< 1%`
```javascript
http_req_failed: ['rate<0.01']
```

**Justificación:**
- En condiciones normales, el sistema debe responder exitosamente a prácticamente todas las peticiones
- 1% permite un margen mínimo para fallos transitorios (red, timeouts)
- En smoke test, esperamos 0% de fallos ya que la carga es mínima
- **Traducción:** De cada 100 requests, máximo 1 puede fallar

#### 2. Latencia P95: `< 1000ms`
```javascript
http_req_duration: ['p(95)<1000']
```

**Justificación:**
- El 95% de los logins deben completarse en menos de 1 segundo
- Login incluye:
  - Verificación BCrypt del password (~50-100ms)
  - Consulta a base de datos (~10-30ms)
  - Generación de JWT token (~5-15ms)
- Umbral de 1 segundo proporciona experiencia de usuario fluida
- **Traducción:** 95 de cada 100 logins responden en menos de 1 segundo

**Resultado Obtenido:**
- ✅ P95: **167.53ms** (6x mejor que el umbral)
- ✅ Tasa de fallos: **0.00%**
- ✅ 100% de checks exitosos (81/81)

---

## 🗳️ Vote Test (HU6) - Justificación de Umbrales

### Objetivo
Simular el flujo completo de emisión de voto bajo condiciones de carga realistas, incluyendo:
1. Login del votante
2. Consulta de candidatos disponibles
3. Emisión del voto

### Configuración de Carga Progresiva
```javascript
stages: [
  { duration: '30s', target: 10 },  // Rampa inicial: 0 → 10 usuarios
  { duration: '1m', target: 20 },   // Aumento gradual: 10 → 20 usuarios
  { duration: '1m', target: 20 },   // Carga sostenida: 20 usuarios constantes
  { duration: '30s', target: 0 },   // Cooldown: 20 → 0 usuarios
]
```

**Justificación de la carga:**
- **20 usuarios concurrentes** representa aproximadamente el **80% del pico esperado** (25 usuarios)
- Permite identificar comportamiento del sistema cerca del límite operativo
- Stages progresivos permiten detectar el punto de degradación
- Pool de **508 usuarios únicos** garantiza realismo (múltiples usuarios válidos)

---

## 🎯 Umbrales del Vote Test

### 1. Latencia Máxima Aceptable

#### HTTP Request Duration P95: `< 2000ms`
```javascript
http_req_duration: ['p(95)<2000']
```

**Justificación:**
- El 95% de TODAS las peticiones (login, consulta, voto) deben responder en menos de 2 segundos
- Considera el promedio ponderado de las 3 operaciones
- Proporciona experiencia de usuario aceptable en interfaz web
- **Resultado:** ✅ P95: **138.92ms** (14.4x mejor)

#### HTTP Request Duration P99: `< 3000ms`
```javascript
'http_req_duration{expected_response:true}': ['p(99)<3000']
```

**Justificación:**
- El 99% de peticiones exitosas deben responder en menos de 3 segundos
- Umbral más permisivo para casos extremos (99th percentile)
- Evita que outliers ocasionales fallen la prueba
- **Resultado:** ✅ P99: **155.73ms** (19.2x mejor)

---

### 2. Latencias por Operación Específica

#### Login Duration P95: `< 1500ms`
```javascript
login_duration: ['p(95)<1500']
```

**Justificación:**
- Login es CPU-intensive (BCrypt hashing con 10-13 rounds)
- Incluye:
  - Búsqueda de usuario en DB (~10-30ms)
  - Verificación BCrypt del password (~80-120ms)
  - Generación de JWT token (~10-20ms)
- 1.5 segundos es aceptable para autenticación segura
- **Resultado:** ✅ P95: **147ms** (10.2x mejor)

#### Candidates Query Duration P95: `< 1200ms`
```javascript
candidates_query_duration: ['p(95)<1200']
```

**Justificación:**
- Consulta con JOIN entre Elecciones y Candidatos
- Incluye filtrado por elecciones activas y verificación de si ya votó
- Query relativamente simple, pero considera múltiples elecciones activas
- **Resultado:** ✅ P95: **13ms** (92.3x mejor)

#### Vote Cast Duration P95: `< 2500ms`
```javascript
vote_cast_duration: ['p(95)<2500']
```

**Justificación:**
- Operación más compleja del flujo:
  - Validación de datos (~5-10ms)
  - Transacción DB (INSERT + UPDATE) (~15-30ms)
  - **Envío de email de confirmación (~50-200ms)** ← Principal factor
  - Commit de transacción (~5-10ms)
- Email sincrónico justifica umbral más alto
- Umbral de 2.5s aún proporciona UX aceptable
- **Resultado:** ✅ P95: **31.1ms** (80.4x mejor)

---

### 3. Porcentaje Máximo de Errores

#### HTTP Request Failed: `< 5%`
```javascript
http_req_failed: ['rate<0.05']
```

**Justificación:**
- Tasa de fallos HTTP debe ser mínima bajo carga normal
- Excluye errores de negocio esperados (409 - Ya votó)
- 5% permite margen para:
  - Timeouts ocasionales bajo carga pico
  - Errores transitorios de red
  - Fallos de DB bajo alta concurrencia
- **Traducción:** Máximo 5 de cada 100 requests pueden fallar técnicamente
- **Resultado:** ✅ **0.00%** (Sin fallos HTTP)

#### Error Rate General: `< 15%`
```javascript
errors: ['rate<0.15']
```

**Justificación:**
- Incluye TODOS los tipos de error (HTTP + checks fallidos)
- Más permisivo que `http_req_failed`
- Permite que algunos checks fallen sin detener la prueba
- **Traducción:** Máximo 15 de cada 100 operaciones pueden tener algún error
- **Resultado:** ✅ **0.00%** (Sin errores)

#### Vote Success Rate: `> 50%`
```javascript
vote_success: ['rate>0.5']
```

**Justificación:**
- No todos los intentos de voto serán exitosos (status 201)
- Usuarios pueden intentar votar múltiples veces → 409 (Ya votó)
- 409 NO es un error técnico, es una respuesta de negocio esperada
- Al menos 50% de intentos deben resultar en voto registrado o ya votado
- **Traducción:** Al menos 50 de cada 100 intentos deben ser exitosos (201) o ya votados (409)
- **Resultado:** ✅ **100%** (Todos los votos procesados correctamente)

---

## 👥 Múltiples Usuarios Válidos

### Pool de Votantes
```javascript
const MAX_GENERATED_USERS = 500; // Usuarios generados automáticamente
```

**Composición del pool:**
- **8 usuarios base:** Con historial de votos en elecciones pasadas
- **500 usuarios generados:** Identificaciones del formato `1XXXXXXXX` (100000001 - 100000500)
- **Total: 508 usuarios únicos**

**Justificación:**
- Pool suficientemente grande para evitar colisiones frecuentes de "ya votó"
- Permite simular comportamiento realista con múltiples votantes
- Algunos usuarios ya votaron (generan 409) → simula reintentos reales
- Selección aleatoria en cada iteración garantiza distribución uniforme

**Beneficios:**
- ✅ Evita cache artificial de mismo usuario
- ✅ Simula concurrencia real de múltiples sesiones
- ✅ Prueba manejo correcto de usuarios que ya votaron
- ✅ Valida que el sistema maneja correctamente 409 sin contar como error

---

## 📈 Resultados Obtenidos vs Umbrales

| Métrica | Umbral Definido | Resultado Real | Margen | Estado |
|---------|----------------|----------------|--------|--------|
| **HTTP req failed** | < 5% | 0.00% | 5.0% | ✅ EXCELENTE |
| **HTTP duration P95** | < 2000ms | 138.92ms | 14.4x mejor | ✅ EXCELENTE |
| **HTTP duration P99** | < 3000ms | 155.73ms | 19.2x mejor | ✅ EXCELENTE |
| **Login P95** | < 1500ms | 147ms | 10.2x mejor | ✅ EXCELENTE |
| **Candidates P95** | < 1200ms | 13ms | 92.3x mejor | ✅ EXCELENTE |
| **Vote Cast P95** | < 2500ms | 31.1ms | 80.4x mejor | ✅ EXCELENTE |
| **Error rate** | < 15% | 0.00% | 15.0% | ✅ EXCELENTE |
| **Vote success** | > 50% | 100% | 2x mejor | ✅ EXCELENTE |
