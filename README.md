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

## 📝 Próximas Historias de Usuario

- [ ] **HU3:** Como administrador, quiero registrar a los votantes con su identificación y credenciales de acceso para que puedan participar en la elección.
- [ ] **HU4:** Como administrador, quiero registrar a los candidatos de la elección para definir la lista de opciones disponibles al votar.
- [ ] **HU5:** Como votante, quiero ver la lista de candidatos disponibles para seleccionar mi opción de voto.
- [ ] **HU6:** Como votante, quiero seleccionar un candidato y emitir mi voto para participar en la elección.
- [ ] **HU7:** Como sistema, debo asegurar que cada votante emita un único voto por elección para mantener la integridad del proceso.
- [ ] **HU8:** Como administrador, quiero ver el total de votos por candidato para conocer los resultados de la elección.
- [ ] **HU9:** Como administrador, quiero ver el porcentaje de votantes que emitieron su voto para evaluar la participación.
- [ ] **HU10:** Como auditor, quiero ver un registro de acciones críticas para garantizar trazabilidad del proceso.

---
**Última actualización:** 30 Septiembre 2025
