# Proyecto Integrador EGI — Integración Completa

## Descripción

Sistema de gestión de inventario desarrollado como proyecto integrador, basado en una arquitectura de persistencia políglota y autenticación centralizada mediante Active Directory.

La solución integra:

* Autenticación LDAP contra Active Directory.
* Autorización basada en roles mediante JWT.
* Doble capa de seguridad.
* Persistencia políglota utilizando SQL Server y MongoDB.
* Backend desarrollado con Spring Boot.
* Frontend SPA desarrollado con Vite.

---

# Arquitectura General

La aplicación utiliza un backend unificado que integra servicios externos y múltiples fuentes de datos.

```text
Usuario
   │
   ▼
Frontend Vite (3000)
   │
   ▼
Backend Spring Boot (8080)
   │
   ├── Active Directory (LDAP 389)
   ├── SQL Server (1433)
   └── MongoDB (27017)
```

## Componentes

| Componente       | Función                                       |
| ---------------- | --------------------------------------------- |
| Active Directory | Fuente única de identidad y gestión de grupos |
| SQL Server       | Persistencia de datos estructurados           |
| MongoDB          | Persistencia de componentes de hardware       |
| Spring Boot      | Integración, seguridad y lógica de negocio    |
| Vite SPA         | Interfaz web de usuario                       |

---

# Flujo de la Aplicación

```text
Usuario
   ↓
Frontend (3000)
   ↓
POST /api/auth/login
   ↓
Backend (8080)
   ↓
LDAP Bind contra Active Directory
   ↓
Obtención de grupos
   ↓
Generación JWT
   ↓
Frontend almacena token
```

---

# Autenticación y Autorización

## Login contra Active Directory

1. El usuario ingresa credenciales.
2. El frontend envía:

```http
POST /api/auth/login
```

3. El backend realiza un Bind LDAP.
4. Si las credenciales son válidas:

   * Obtiene los grupos del usuario.
   * Traduce grupos a roles.
   * Genera un JWT firmado.
5. Devuelve el token al frontend.

### Mapeo de grupos

| Grupo AD          | Rol Aplicación |
| ----------------- | -------------- |
| GRP_LECTOR        | LECTOR         |
| GRP_EDITOR        | EDITOR         |
| GRP_ADMINISTRADOR | ADMINISTRADOR  |

---

## Autorización JWT

Todas las peticiones protegidas deben incluir:

```http
Authorization: Bearer <token>
```

El filtro `JwtFilter`:

* Valida firma.
* Extrae roles.
* Genera authorities de Spring Security.
* Inserta la autenticación en el contexto de seguridad.

---

## Permisos por Endpoint

| Método HTTP        | Roles Permitidos              |
| ------------------ | ----------------------------- |
| GET                | LECTOR, EDITOR, ADMINISTRADOR |
| POST               | EDITOR, ADMINISTRADOR         |
| PUT                | EDITOR, ADMINISTRADOR         |
| DELETE             | EDITOR, ADMINISTRADOR         |
| /api/auth/admin/** | ADMINISTRADOR                 |

---

# Doble Capa de Seguridad

## Capa 1 - Aplicación

Spring Security + JWT

Controla el acceso a los endpoints.

Ejemplo:

* Un usuario LECTOR intenta crear un equipo.
* Spring Security responde:

```http
403 Forbidden
```

antes de acceder a la base de datos.

---

## Capa 2 - Base de Datos

SQL Server + Active Directory (Kerberos - planificado)

El backend utiliza el usuario:

```text
app_inventario
```

para conectarse a SQL Server.

La base de datos podrá aplicar permisos adicionales según la identidad delegada del usuario.

---

# Persistencia Políglota

## SQL Server

Base de datos relacional para información estructurada.

Hibernate genera las tablas automáticamente:

```yaml
spring.jpa.hibernate.ddl-auto=update
```

---

### Tabla: ubicaciones

| Columna  | Tipo    | Descripción                    |
| -------- | ------- | ------------------------------ |
| id       | INT PK  | Autoincremental                |
| edificio | VARCHAR | Nombre del edificio            |
| area     | VARCHAR | AULA, LABORATORIO o SECRETARIA |

---

### Tabla: responsables

| Columna  | Tipo    |
| -------- | ------- |
| id       | INT PK  |
| nombre   | VARCHAR |
| apellido | VARCHAR |
| email    | VARCHAR |
| telefono | VARCHAR |

---

### Tabla: equipos

| Columna           | Tipo    |
| ----------------- | ------- |
| id                | INT PK  |
| codigo            | VARCHAR |
| fecha_adquisicion | DATE    |
| ubicacion_id      | FK      |
| responsable_id    | FK      |

---

## MongoDB

Colección:

```text
hardware
```

### Documento Hardware

| Campo            | Tipo     |
| ---------------- | -------- |
| _id              | ObjectId |
| id               | String   |
| fabricante       | String   |
| modelo           | String   |
| tipo             | String   |
| cpu              | String   |
| ram              | String   |
| disco            | String   |
| sistemaOperativo | String   |
| monitor          | String   |
| mouse            | String   |
| teclado          | String   |

---

# Endpoint de Integración

## GET /api/inventario/{id}

Este endpoint integra información de SQL Server y MongoDB.

### Proceso

1. Busca equipo, ubicación y responsable en SQL Server.
2. Obtiene el código del equipo.
3. Busca componentes asociados en MongoDB.
4. Construye un `InventarioCompletoDTO`.

```text
equipos.codigo (SQL)
           =
hardware.id (MongoDB)
```

No existen Foreign Keys entre ambas bases.

La relación es lógica y se resuelve desde el backend.

---

# Administración de Usuarios Active Directory

Acceso exclusivo para:

```text
ADMINISTRADOR
```

## Listar usuarios

```http
GET /api/auth/admin/usuarios
```

Devuelve usuarios pertenecientes a:

* GRP_LECTOR
* GRP_EDITOR
* GRP_ADMINISTRADOR

---

## Cambiar Rol

```http
POST /api/auth/admin/cambiar-rol
```

Acciones:

1. Elimina al usuario de su grupo actual.
2. Lo agrega al nuevo grupo seleccionado.
3. Actualiza Active Directory directamente.

No existe persistencia local de usuarios.

---

# DTOs

## UbicacionDTO

```json
{
  "id": 1,
  "edificio": "Central",
  "area": "AULA"
}
```

---

## ResponsableDTO

```json
{
  "id": 1,
  "nombre": "Juan",
  "apellido": "Perez",
  "email": "juan@itu.local",
  "telefono": "123456"
}
```

---

## EquipoDTO (Lectura)

```json
{
  "id": 1,
  "codigo": "PC-01",
  "fechaAdquisicion": "2025-03-15",
  "ubicacionId": 1,
  "responsableId": 1
}
```

---

## EquipoDTO (Creación / Edición)

```json
{
  "codigo": "PC-01",
  "fechaAdquisicion": "2025-03-15",
  "ubicacion": {
    "id": 1
  },
  "responsable": {
    "id": 1
  }
}
```

---

## HardwareDTO

```json
{
  "id": "PC-01",
  "fabricante": "Dell",
  "modelo": "OptiPlex 3000",
  "tipo": "desktop",
  "cpu": "i5-12400",
  "ram": "16GB",
  "disco": "512GB SSD",
  "sistemaOperativo": "Windows 11",
  "monitor": "Dell 24\"",
  "mouse": "Dell",
  "teclado": "Dell"
}
```

---

## InventarioCompletoDTO

```json
{
  "equipo": {},
  "ubicacion": {},
  "responsable": {},
  "componentes": []
}
```

---

## LoginRequest

```json
{
  "username": "usr.admin",
  "password": "<PASSWORD_ITU>"
}
```

---

## LoginResponse

```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "usr.admin",
  "roles": [
    "ADMINISTRADOR"
  ]
}
```

---

# Estructura del Proyecto

```text
src/main/java/com/inventario/backendapi/
├── auth/
│   ├── AuthController.java
│   ├── JwtUtil.java
│   ├── JwtFilter.java
│   ├── LdapAuthService.java
│   ├── LdapAdminService.java
│   ├── LdapConfig.java
│   └── SecurityConfig.java
│
├── config/
│   ├── ModelMapperConfig.java
│   └── MongoConfig.java
│
├── dto/
│
├── mongo/
│   ├── controller/
│   │   └── HardwareController.java
│   ├── model/
│   │   └── Hardware.java
│   ├── repository/
│   │   └── HardwareRepository.java
│   └── service/
│       ├── HardwareService.java
│       └── HardwareServiceImpl.java
│
└── sql/
    ├── model/
    ├── repository/
    ├── service/
    └── controller/
```

---

# Usuarios de Active Directory

| Usuario        | Contraseña | Grupo             | Rol           | Uso                  |
| -------------- | ---------- | ----------------- | ------------- | -------------------- |
| usr.admin      | <PASSWORD_ITU>  | GRP_ADMINISTRADOR | ADMINISTRADOR | Administración total |
| usr.editor     | <PASSWORD_ITU>  | GRP_EDITOR        | EDITOR        | Lectura y escritura  |
| usr.lector     | <PASSWORD_ITU>  | GRP_LECTOR        | LECTOR        | Solo lectura         |
| svc_backend    | <PASSWORD_ITU>  | -                 | -             | Bind LDAP            |
| svc_admin      | <PASSWORD_ITU>  | GRP_ADMINISTRADOR | -             | Administración AD    |
| app_inventario | <PASSWORD_ITU>  | -                 | -             | Conexión SQL Server  |

---

# Variables de Entorno

| Variable            | Descripción                   | Ejemplo                                               |
| ------------------- | ----------------------------- | ----------------------------------------------------- |
| SQL_USERNAME        | Usuario SQL Server            | app_inventario                                        |
| SQL_PASSWORD        | Contraseña SQL Server         | <PASSWORD_ITU>                                             |
| LDAP_HOST           | IP del controlador de dominio | 192.168.100.50                                        |
| LDAP_PORT           | Puerto LDAP                   | 389                                                   |
| LDAP_BASE           | Base DN                       | dc=itu,dc=local                                       |
| LDAP_USER           | Usuario LDAP                  | [<LDAP_BIND_USER>](mailto:<LDAP_BIND_USER>) |
| LDAP_PASSWORD       | Contraseña LDAP               | <PASSWORD_ITU>                                             |
| LDAP_ADMIN_USER     | Usuario administrador LDAP    | [<LDAP_ADMIN_USER>](mailto:<LDAP_ADMIN_USER>)     |
| LDAP_ADMIN_PASSWORD | Contraseña administrador LDAP | <PASSWORD_ITU>                                             |

---

# Configuración de Ejemplo

```env
SQL_USERNAME=app_inventario
SQL_PASSWORD=<PASSWORD_ITU>

LDAP_HOST=192.168.100.50
LDAP_PORT=389
LDAP_BASE=dc=itu,dc=local

LDAP_USER=<LDAP_BIND_USER>
LDAP_PASSWORD=<PASSWORD_ITU>

LDAP_ADMIN_USER=<LDAP_ADMIN_USER>
LDAP_ADMIN_PASSWORD=<PASSWORD_ITU>
```


# Tecnologías Utilizadas

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* Spring LDAP
* JWT
* SQL Server
* MongoDB
* Active Directory
* Hibernate
* ModelMapper
* Maven
* Vite
* JavaScript

```

**Proyecto Integrador EGI – Inventario con Active Directory, SQL Server y MongoDB**
```