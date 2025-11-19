# VotacionesApp 🗳️

Sistema de votación electrónica para la gestión de elecciones democráticas y transparentes.

## 📋 Estado del Proyecto

🚧 **En Construcción** - Actualmente en desarrollo activo

### Historias de Usuario Completadas

#### ✅ HU1: Autenticación de Usuarios

**Historia:** Como usuario del sistema, quiero iniciar sesión con mis credenciales para acceder a las funcionalidades según mi rol.

**Criterios de Aceptación:**

- El login requiere identificación y contraseña válidos
- Si las credenciales son incorrectas, el sistema debe rechazar el acceso
- El sistema debe distinguir entre dos roles: **Administrador** y **Votante**

**Estado:** ✅ Completada

#### ✅ HU2: Registro de Votantes

**Historia:** Como administrador, quiero registrar a los votantes con su identificación y credenciales de acceso para que puedan participar en la elección.

**Criterios de Aceptación:**

- El administrador puede crear nuevos votantes en el sistema
- Cada votante debe tener identificación única
- Se asignan credenciales de acceso para cada votante
- Los votantes registrados pueden participar en las elecciones

**Estado:** ✅ Completada

#### ✅ HU3: Creación de elección

**Historia:** Como administrador, quiero crear una elección con nombre, fecha de inicio y fin para que los votantes puedan emitir su voto en el periodo definido.

**Criterios de Aceptación:**

- El sistema debe permitir crear una nueva elección. 
- Solo pueden participar candidatos registrados. 
- Solo pueden votar los votantes habilitados.

**Estado:** ✅ Completada

#### ✅ HU4: Registro de candidatos

**Historia:** Como administrador, quiero registrar a los candidatos de la elección para definir la lista de opciones disponibles al votar.

**Criterios de Aceptación:**

- El sistema debe permitir ingresar el candidato y la agrupación que representa.
- No se permiten dos candidatos con el mismo nombre en una elección.
- Cada candidato debe quedar asociado a una elección.

**Estado:** ✅ Completada

#### ✅ HU5: Visualizar lista de candidatos

**Historia:** Como votante, quiero ver la lista de candidatos disponibles para seleccionar mi opción de voto.

**Criterios de Aceptación:**

- La lista debe mostrar nombre y agrupación de cada candidato.
- Solo se muestran candidatos de la elección activa.
- El sistema debe contar con una interfaz clara e intuitiva, que permita la fácil lectura e identificación de los candidatos.

**Estado:** ✅ Completada

#### ✅ HU6: Emisión de voto

**Historia:** Como votante, quiero seleccionar un candidato y emitir mi voto para participar en la elección.

**Criterios de Aceptación:**

- El sistema debe registrar el voto y marcar al votante como 'ya votó'.
- El votante debe recibir confirmación del voto. 
- No se debe permitir modificar el voto una vez emitido.

**Estado:** ✅ Completada

#### ✅ HU7: Restricción de voto único

**Historia:** Como sistema, debo asegurar que cada votante emita un único voto por elección para mantener la integridad del proceso.

**Criterios de Aceptación:**

- Si un votante intenta votar dos veces, el sistema debe impedirlo.

**Estado:** ✅ Completada

---

## 🎯 Definición de Hecho

Una historia de usuario se considera **HECHA** cuando cumple con los siguientes criterios:

### Criterios Generales

- ✅ Código implementado y funcionando según los criterios de aceptación
- ✅ Código revisado y probado
- ✅ Sin errores críticos o bloqueantes
- ✅ Interfaz de usuario responsive y accesible
- ✅ Validaciones implementadas (frontend y backend)
- ✅ Manejo de errores apropiado
- ✅ Documentación actualizada

### Criterios Técnicos

- ✅ API REST funcional con endpoints documentados
- ✅ Base de datos actualizada con las migraciones correspondientes
- ✅ Autenticación y autorización implementadas (donde aplique)
- ✅ Logs de auditoría registrados (para operaciones críticas)
- ✅ Código compatible con los estándares del proyecto

### Criterios de Calidad

- ✅ Pruebas unitarias implementadas (cobertura mínima)
- ✅ Pruebas de integración realizadas
- ✅ Pruebas de usuario exitosas
- ✅ Sin vulnerabilidades de seguridad conocidas

---

## 🏗️ Notas de la Solución

### Arquitectura

El proyecto implementa una **arquitectura cliente-servidor** con separación clara de responsabilidades:

#### Frontend (Client)

- **Framework:** Next.js 15+ con App Router
- **Lenguaje:** TypeScript
- **UI Components:** shadcn/ui + Tailwind CSS
- **Estado:** React Hooks + Server Actions
- **Autenticación:** Middleware de Next.js para protección de rutas

**Estructura del Cliente:**

```
client/
├── src/
│   ├── app/                 # Páginas y rutas (App Router)
│   │   ├── login/          # Página de inicio de sesión
│   │   └── dashboard/      # Panel de administración
│   ├── components/         # Componentes reutilizables
│   │   ├── ui/            # Componentes de UI base
│   │   └── auth-guard.tsx # Protección de rutas
│   ├── lib/               # Utilidades y acciones
│   │   └── action/        # Server Actions de Next.js
│   └── middleware.ts      # Middleware de autenticación
```

#### Backend (Server)

- **Framework:** ASP.NET Core 8.0
- **Lenguaje:** C#
- **ORM:** Entity Framework Core
- **Base de Datos:** SQL Server
- **Autenticación:** JWT (JSON Web Tokens)
- **Patrón:** Repository + Service Layer

**Estructura del Servidor:**

```
server/
├── Controllers/         # Endpoints de la API REST
│   ├── AuthController.cs       # Autenticación
│   └── VotersController.cs     # Gestión de votantes
├── Models/             # Modelos de dominio
│   ├── User.cs        # Modelo de usuario
│   ├── Election.cs    # Modelo de elección
│   ├── Vote.cs        # Modelo de voto
│   └── AuditLog.cs    # Logs de auditoría
├── DTOs/              # Data Transfer Objects
├── Services/          # Lógica de negocio
│   └── JwtTokenService.cs
├── Data/              # Contexto de base de datos
└── Migrations/        # Migraciones de EF Core
```

### Decisiones de Diseño

#### 1. Autenticación y Seguridad

- **JWT:** Se utiliza JWT para autenticación stateless
- **Roles:** Sistema basado en roles (Admin/Voter) para autorización
- **Password Hashing:** Las contraseñas se almacenan con hash seguro
- **HTTPS:** Todas las comunicaciones deben ser por HTTPS en producción

#### 2. Base de Datos

- **SQL Server:** Base de datos relacional para garantizar integridad
- **Entity Framework Core:** ORM para acceso a datos type-safe
- **Migraciones:** Versionamiento del esquema de base de datos
- **Auditoría:** Tabla AuditLog para rastrear operaciones críticas

#### 3. Frontend Moderno

- **Server Components:** Uso de React Server Components por defecto
- **Server Actions:** Para mutaciones de datos sin necesidad de API routes
- **TypeScript:** Type safety en todo el frontend
- **Responsive Design:** Mobile-first approach

---

## 🚀 Implementación

### Requisitos Previos

#### Backend

- .NET 8.0 SDK o superior
- SQL Server 2019 o superior (o SQL Server Express)
- Visual Studio 2022 o VS Code con extensión C#

#### Frontend

- Node.js 18+ y npm/yarn/pnpm
- Editor de código (VS Code recomendado)

### Configuración Local

#### 1. Configurar la Base de Datos

```powershell
# Ejecutar el script de base de datos
cd db
# Ejecutar script.sql en SQL Server Management Studio o usando sqlcmd
```

#### 2. Configurar el Backend

```powershell
cd server/server

# Restaurar dependencias
dotnet restore

# Configurar la cadena de conexión en appsettings.json
# Editar ConnectionStrings:DefaultConnection con tus credenciales

# Aplicar migraciones
dotnet ef database update

# Ejecutar el servidor
dotnet run
```

El servidor estará disponible en: `https://localhost:7290` (o puerto configurado)

#### 3. Configurar el Frontend

```powershell
cd client

# Instalar dependencias
npm install

# Configurar variables de entorno
# Crear archivo .env.local con:
# NEXT_PUBLIC_API_URL=https://localhost:7290

# Ejecutar en modo desarrollo
npm run dev
```

El cliente estará disponible en: `http://localhost:3000`

### Deployment

#### Backend (ASP.NET Core)

**Opción 1: Azure App Service**

```powershell
# Publicar para producción
dotnet publish -c Release

# Deploy a Azure (requiere Azure CLI)
az webapp deploy --resource-group <grupo> --name <nombre-app> --src-path ./bin/Release/net8.0/publish
```

**Opción 2: IIS (Windows Server)**

- Publicar la aplicación en modo Release
- Configurar un nuevo sitio en IIS
- Configurar el Application Pool para .NET Core
- Copiar los archivos publicados al directorio del sitio

#### Frontend (Next.js)

**Opción 1: Vercel**

```powershell
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel --prod
```

**Opción 2: Build estático**

```powershell
cd client
npm run build
npm run start
```

#### Variables de Entorno en Producción

**Backend (appsettings.json)**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=<server>;Database=VotacionesDB;User Id=<user>;Password=<password>;"
  },
  "Jwt": {
    "Key": "<clave-secreta-segura>",
    "Issuer": "VotacionesApp",
    "Audience": "VotacionesApp"
  }
}
```

**Frontend (.env.production)**

```
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

---

## 🧪 Pruebas

### Pruebas Realizadas

#### HU1: Autenticación de Usuarios

**Casos de Prueba:**

| ID   | Descripción                     | Entrada                            | Resultado Esperado                | Estado |
| ---- | ------------------------------- | ---------------------------------- | --------------------------------- | ------ |
| T1.1 | Login exitoso como Admin        | ID válido + contraseña correcta    | Acceso al dashboard de admin      | ✅     |
| T1.2 | Login exitoso como Votante      | ID válido + contraseña correcta    | Acceso al panel de votante        | ✅     |
| T1.3 | Login con contraseña incorrecta | ID válido + contraseña incorrecta  | Mensaje de error, acceso denegado | ✅     |
| T1.4 | Login con ID inexistente        | ID inválido + cualquier contraseña | Mensaje de error, acceso denegado | ✅     |
| T1.5 | Validación de campos vacíos     | Campos vacíos                      | Mensaje de validación             | ✅     |
| T1.6 | Persistencia de sesión          | Login exitoso + refresh            | Sesión mantiene estado            | ✅     |
| T1.7 | Protección de rutas             | Acceso directo sin login           | Redirección a login               | ✅     |

**Pruebas de Seguridad:**

- ✅ Las contraseñas no se envían en texto plano
- ✅ Los tokens JWT tienen expiración
- ✅ No se puede acceder a rutas protegidas sin autenticación
- ✅ Los roles se validan correctamente en el backend

#### HU2: Registro de Votantes

**Casos de Prueba:**

| ID   | Descripción                     | Entrada                           | Resultado Esperado                   | Estado |
| ---- | ------------------------------- | --------------------------------- | ------------------------------------ | ------ |
| T2.1 | Registro exitoso de votante     | Datos válidos completos           | Votante creado, confirmación         | ✅     |
| T2.2 | Registro con ID duplicado       | ID existente                      | Mensaje de error, registro rechazado | ✅     |
| T2.3 | Validación de campos requeridos | Campos faltantes                  | Mensaje de validación                | ✅     |
| T2.4 | Formato de identificación       | ID con formato inválido           | Mensaje de error de formato          | ✅     |
| T2.5 | Solo admin puede registrar      | Usuario votante intenta registrar | Acceso denegado                      | ✅     |
| T2.6 | Credenciales generadas          | Registro exitoso                  | Credenciales únicas creadas          | ✅     |

**Pruebas de Integración:**

- ✅ El votante registrado puede iniciar sesión inmediatamente
- ✅ Los datos se persisten correctamente en la base de datos
- ✅ El log de auditoría registra la creación del votante
- ✅ La interfaz muestra la lista actualizada de votantes

#### HU3: Creación de Elección

**Casos de Prueba:**

| ID   | Descripción                     | Entrada                           | Resultado Esperado                   | Estado |
| ---- | ------------------------------- | --------------------------------- | ------------------------------------ | ------ |
| T3.1 | Creación exitosa                | Datos válidos completos           | Elección creado, confirmación        | ✅     |
| T3.2 | Fecha fin anterior al inicio    | Ingreso de fechas                 | Mensaje de error, registro rechazado | ✅     |
| T3.3 | Nombre duplicado                | Campo ya existente                | Mensaje de validación                | ✅     |
| T3.4 | Campos requeridos vacíos        | No ingresar datos                 | Mensaje de error                     | ✅     |
| T3.5 | Periodo solapado                | Ingreso de periodo inválido       | Mensaje de error                     | ✅     |

**Pruebas de Integración:**

- ✅ El administrador puede agregar elecciones
- ✅ Los datos se persisten correctamente en la base de datos
- ✅ El log de auditoría registra la creación de las elecciones
- ✅ La interfaz muestra la lista actualizada de elecciones

#### HU4: Registro de Candidatos

**Casos de Prueba:**

| ID   | Descripción                     | Entrada                                  | Resultado Esperado                   | Estado |
| ---- | ------------------------------- | ---------------------------------------- | ------------------------------------ | ------ |
| T4.1 | Alta exitosa                    | Datos válidos completos                  | Candidato creado                     | ✅     |
| T4.2 | Campo obligatorio vacío         | No ingresar un dato obligatorio          | Validación bloquea registro          | ✅     |
| T4.3 | Duplicado por elección          | Duplicar un candidato en la elección     | Registro rechazado                   | ✅     |
| T4.4 | Mismo candidato en otra elección| Ingresar un candidato para otra elección | Registro permitido                   | ✅     |
| T4.5 | Elección inexistente            | Ingresar una elección inexistente        | Error “Elección no encontrada”       | ✅     |

**Pruebas de Integración:**

- ✅ El administrador puede agregar Candidatos
- ✅ Los datos se persisten correctamente en la base de datos
- ✅ El log de auditoría registra la creación del candidato
- ✅ La interfaz muestra la lista actualizada de candidatos

## HU5: Emisión de Voto

### Casos de Prueba

| ID   | Descripción                | Entrada                                | Resultado Esperado                            | Estado |
|------|-----------------------------|----------------------------------------|------------------------------------------------|--------|
| T5.1 | Voto exitoso                | Votante habilitado elige candidato     | Voto registrado correctamente                  | ✅ |
| T5.2 | Voto duplicado              | Intento de votar nuevamente            | Sistema bloquea la acción                      | ✅ |
| T5.3 | Elección no activa          | Intentar votar fuera del periodo       | Error de validación / Acción rechazada         | ✅ |
| T5.4 | Votante inhabilitado        | Usuario sin permisos                   | Acceso denegado                                | ✅ |
| T5.5 | Candidato inexistente       | ID de candidato no válido              | Error “Candidato no encontrado”                | ✅ |

### Pruebas de Integración

- ✅ El sistema registra el voto correctamente en la base de datos.  
- ✅ El sistema impide votos duplicados para el mismo usuario.  
- ✅ Los intentos de voto fuera del periodo o sin permisos son rechazados.  
- ✅ El log de auditoría registra todas las acciones de emisión de voto.  
- ✅ La interfaz actualiza el estado del votante y muestra confirmación del voto.

---

## HU6: Conteo de Votos

### Casos de Prueba

| ID   | Descripción                 | Entrada                              | Resultado Esperado                             | Estado |
|------|-----------------------------|--------------------------------------|-------------------------------------------------|--------|
| T6.1 | Conteo correcto total       | Sumar todos los votos registrados    | Total coincide con el número de votos válidos   | ✅ |
| T6.2 | Conteo por candidato        | Consultar resultados por elección    | Totales correctos agrupados por candidato       | ✅ |
| T6.3 | Conteo sin votos            | Elección sin votos registrados       | Total cero sin errores                          | ✅ |
| T6.4 | Consulta tras cierre        | Elección cerrada                     | Resultados visibles en modo solo lectura        | ✅ |

### Pruebas de Integración

- ✅ El sistema calcula correctamente el total general de votos.  
- ✅ El sistema agrupa y muestra los resultados por candidato.  
- ✅ Las consultas sobre elecciones cerradas se muestran en modo lectura.  
- ✅ Los datos de conteo se obtienen directamente de la base de datos sin inconsistencias.  
- ✅ La interfaz refleja correctamente los totales y los estados de cada elección.

---

## HU7: Publicación de Resultados

### Casos de Prueba

| ID   | Descripción                     | Entrada                              | Resultado Esperado                              | Estado |
|------|---------------------------------|--------------------------------------|--------------------------------------------------|--------|
| T7.1 | Publicación exitosa             | Elección finalizada correctamente    | Resultados generados y visibles al público       | ✅ |
| T7.2 | Intento de reapertura           | Reabrir elección ya publicada        | Acción bloqueada, sistema mantiene cierre        | ✅ |
| T7.3 | Exportación de resultados       | Descargar archivo CSV o JSON         | Archivo exportado completo y correcto            | ✅ |

### Pruebas de Integración

- ✅ El sistema permite publicar resultados solo si la elección está finalizada.  
- ✅ Los datos publicados coinciden con los resultados almacenados en la base de datos.  
- ✅ Los intentos de reapertura o modificación posterior a la publicación son bloqueados.  
- ✅ El sistema genera correctamente los archivos de exportación (CSV / JSON).  
- ✅ La interfaz muestra los resultados en formato legible y con opciones de descarga.

---

## HU8: Resultados de la Elección

### Casos de Prueba

| ID   | Descripción                             | Entrada                              | Resultado Esperado                                   |
|------|-----------------------------------------|--------------------------------------|------------------------------------------------------|
| T8.1 | Totales por candidato (solo admin)      | Consultar resultados con rol admin   | Muestra cifras correctas por candidato.              |
| T8.2 | No disponibles antes del cierre         | Consultar antes del cierre           | Bloquea la consulta anticipada.                      |
| T8.3 | Disponibles tras cierre                 | Consultar después del cierre         | Resultados visibles en modo lectura.                 |
| T8.4 | Consistencia total vs votos registrados | Verificar sumatoria de votos         | Totales coinciden con los registros de votos.        |

### Pruebas de Integración

- ✅ El sistema permite consultar resultados solo tras el cierre de la elección.  
- ✅ Los resultados son visibles únicamente para el rol **Administrador**.  
- ✅ Las consultas previas al cierre son correctamente bloqueadas.  
- ✅ Los totales coinciden con los registros de votos en base de datos.  
- ✅ La interfaz muestra los resultados en formato legible y sin errores.

---

## HU9: Reporte de Participación

### Casos de Prueba

| ID   | Descripción                | Entrada                            | Resultado Esperado                             |
|------|----------------------------|------------------------------------|------------------------------------------------|
| T9.1 | Cálculo de participación   | Ejecutar reporte de participación  | Sistema calcula porcentaje correctamente.      |
| T9.2 | Conteo de no participantes | Consultar reporte de no votantes   | Sistema muestra número exacto de no votantes.  |
| T9.3 | Disponible al cierre       | Intentar consulta antes del cierre | Reporte bloqueado hasta el cierre de elección. |

### Pruebas de Integración

- ✅ El sistema calcula correctamente el porcentaje de participación (votos emitidos / total de votantes).  
- ✅ Los valores del reporte coinciden con los registros almacenados en base de datos.  
- ✅ El reporte solo puede generarse tras el cierre de la elección.  
- ✅ El reporte puede exportarse en formato PDF o CSV de manera legible.

---

## HU10: Bitácora de Auditoría

### Casos de Prueba

| ID    | Descripción            | Entrada                       | Resultado Esperado                                       |
|-------|------------------------|-------------------------------|----------------------------------------------------------|
| T10.1 | Registro de creación   | Crear elección o votante      | Log generado con fecha, hora y usuario.                  |
| T10.2 | Registro de voto       | Emitir voto válido            | Evento auditado sin registrar contenido del voto.        |
| T10.3 | Consulta de logs       | Filtrar por usuario o fecha   | Resultados correctos mostrados.                          |
| T10.4 | Acceso restringido     | Intentar acceder sin permisos | Solo visible para usuarios con rol Admin/Auditor.        |

### Pruebas de Integración

- ✅ El sistema registra eventos de creación, votación y consultas de auditoría.  
- ✅ Los registros incluyen fecha, hora, usuario y acción realizada.  
- ✅ No se almacena información sensible del voto.  
- ✅ Solo los usuarios con rol **Administrador** o **Auditor** pueden consultar la bitácora.  
- ✅ Los registros son inmutables y cumplen la política de trazabilidad.

---


### Cómo Ejecutar las Pruebas

#### Pruebas Manuales

1. Iniciar el backend y frontend en local
2. Seguir los casos de prueba documentados arriba
3. Verificar que cada resultado coincide con el esperado

#### Pruebas Automatizadas (Futuro)

```powershell
# Backend - Unit Tests
cd server/server.Tests
dotnet test

# Frontend - Jest/Testing Library
cd client
npm run test
```

---

**Última actualización:** 19 Nocviembre 2025
