# Backend SQL - Módulo P3 (Matías)

API REST para la gestión de ubicaciones, responsables y equipos del inventario.

Parte del Proyecto Integrador EGI.

---

# ¿Qué hace este módulo?

Este módulo se encarga de gestionar la información relacional del inventario:

* Dónde está cada equipo (Ubicación).
* Quién tiene asignado cada equipo (Responsable).
* Datos propios del equipo (código, fecha de adquisición, etc.).

Además, expone endpoints REST para que el frontend pueda:

* Listar registros.
* Crear registros.
* Modificar registros.
* Eliminar registros.

También incluye un endpoint combinado:

```http
GET /api/inventario/{idEquipo}
```

que integra información almacenada en SQL con los componentes de hardware provenientes del módulo MongoDB (actualmente mediante datos mock).

---

# Tecnologías Utilizadas

| Tecnología      | Uso                                   |
| --------------- | ------------------------------------- |
| Java 21         | Lenguaje principal                    |
| Spring Boot 3.x | Framework principal                   |
| Spring Data JPA | Acceso a datos                        |
| Hibernate       | ORM y generación automática de tablas |
| Lombok          | Reducción de código repetitivo        |
| ModelMapper     | Conversión entre entidades y DTOs     |
| Maven           | Gestión de dependencias               |
| MySQL           | Base de datos de desarrollo           |
| SQL Server      | Base de datos objetivo                |
| Spring Security | Seguridad y autenticación             |
| Postman         | Pruebas de API                        |

---

# Estructura del Proyecto

```text
com.inventario.backendapi.sql
│
├── model
│   ├── BaseSql.java
│   ├── Area.java
│   ├── Ubicacion.java
│   ├── Responsable.java
│   └── Equipo.java
│
├── repository
│   ├── BaseSqlRepository.java
│   ├── UbicacionRepository.java
│   ├── ResponsableRepository.java
│   └── EquipoRepository.java
│
├── service
│   ├── BaseSqlService.java
│   ├── BaseSqlServiceImpl.java
│   ├── UbicacionService.java
│   ├── UbicacionServiceImpl.java
│   ├── ResponsableService.java
│   ├── ResponsableServiceImpl.java
│   ├── EquipoService.java
│   ├── EquipoServiceImpl.java
│   ├── InventarioCompletoService.java
│   └── InventarioCompletoServiceImpl.java
│
└── controller
    ├── UbicacionController.java
    ├── ResponsableController.java
    ├── EquipoController.java
    └── InventarioCompletoController.java
```

## Otros paquetes relevantes

```text
dto/      -> Objetos de transferencia de datos compartidos con P4
auth/     -> Configuración de seguridad
config/   -> Configuración de beans (ModelMapper)
```

---

# Flujo de una Petición

```text
Frontend
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Base de Datos

Entidades
    │
    ▼
ModelMapper
    │
    ▼
DTOs
```

Proceso:

1. El Controller recibe la petición HTTP.
2. El Service ejecuta la lógica de negocio.
3. El Repository interactúa con la base de datos.
4. Las entidades se transforman a DTOs mediante ModelMapper.
5. El Controller devuelve la respuesta en formato JSON.

---

# Configuración Local

## Requisitos

* Java 21
* MySQL ejecutándose en localhost:3306
* Base de datos `inventario`
* Maven
* Postman (opcional)

## application.yml

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/inventario?useSSL=false&serverTimezone=UTC
    username: root
    password: tu_password
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

## Ejecución

1. Clonar el repositorio.
2. Configurar la base de datos.
3. Ejecutar `BackendApiApplication`.
4. Probar los endpoints mediante Postman.

### Credenciales temporales

```text
Usuario: admin
Contraseña: admin
```

---

# Endpoints Disponibles

## Ubicaciones

| Método | Endpoint              |
| ------ | --------------------- |
| GET    | /api/ubicaciones      |
| GET    | /api/ubicaciones/{id} |
| POST   | /api/ubicaciones      |
| PUT    | /api/ubicaciones/{id} |
| DELETE | /api/ubicaciones/{id} |

### Ejemplo POST

```json
{
  "edificio": "Central",
  "area": "AULA"
}
```

Valores válidos para `area`:

```text
AULA
LABORATORIO
SECRETARIA
```

---

## Responsables

| Método | Endpoint               |
| ------ | ---------------------- |
| GET    | /api/responsables      |
| GET    | /api/responsables/{id} |
| POST   | /api/responsables      |
| PUT    | /api/responsables/{id} |
| DELETE | /api/responsables/{id} |

### Ejemplo POST

```json
{
  "nombre": "Juan",
  "apellido": "Perez",
  "email": "juan@correo.com",
  "telefono": "123456"
}
```

---

## Equipos

| Método | Endpoint          |
| ------ | ----------------- |
| GET    | /api/equipos      |
| GET    | /api/equipos/{id} |
| POST   | /api/equipos      |
| PUT    | /api/equipos/{id} |
| DELETE | /api/equipos/{id} |

### Ejemplo POST

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

**Importante:** para las referencias de ubicación y responsable únicamente es necesario enviar el ID.

---

## Inventario Completo

| Método | Endpoint                   |
| ------ | -------------------------- |
| GET    | /api/inventario/{idEquipo} |

Devuelve:

* Equipo
* Ubicación
* Responsable
* Componentes de hardware

### Ejemplo de Respuesta

```json
{
  "equipo": {
    "id": 1,
    "codigo": "PC-01",
    "fechaAdquisicion": "2025-03-15",
    "ubicacionId": 1,
    "responsableId": 1
  },
  "ubicacion": {
    "id": 1,
    "edificio": "Central",
    "area": "AULA"
  },
  "responsable": {
    "id": 1,
    "nombre": "Juan",
    "apellido": "Perez",
    "email": "juan@correo.com",
    "telefono": "123456"
  },
  "componentes": [
    {
      "id": "mock-1",
      "idEquipo": 1,
      "tipo": "CPU",
      "marca": "Intel",
      "modelo": "i7",
      "estado": "Operativo"
    }
  ]
}
```

---

# Estado del Proyecto

## Completado

* Estructura base del proyecto Spring Boot.
* Entidades JPA y relaciones.
* Repositorios con Spring Data JPA.
* CRUD completo para Ubicaciones, Responsables y Equipos.
* DTOs compartidos.
* Conversión automática mediante ModelMapper.
* Endpoints REST funcionales.
* Endpoint combinado `/api/inventario/{idEquipo}`.
* Pruebas locales con MySQL y Postman.

## Pendiente

* Implementación de JWT.
* Integración con LDAPS / Active Directory.
* Pruebas sobre SQL Server.
* Integración real con MongoDB (reemplazo del mock).
* Dockerización del servicio.

---

# Rama de Desarrollo

```text
feature/backend-sql
```

# Autor

**Matías Fernández (P3)**

Proyecto Integrador EGI.
