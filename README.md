# inventario-db — MongoDB

Módulo a cargo de **P3**. Contiene el contenedor de MongoDB con los datos de hardware de los equipos de laboratorio, y el backend REST que expone esos datos.

---

## ¿Qué hace este módulo?

- Almacena los componentes internos de cada equipo (CPU, RAM, disco, SO, periféricos)
- Expone endpoints REST para consultar, crear, actualizar y eliminar registros de hardware
- Se autentica con usuario propio de MongoDB (no admin)

---

## Estructura

```
inventario-db/
├── Dockerfile
└── init-mongo.js     # crea usuario y carga datos de prueba

src/main/java/com/inventario/backendapi/
├── config/
│   └── MongoConfig.java
├── dto/
│   └── HardwareDTO.java
└── mongo/
    ├── controller/HardwareController.java
    ├── model/Hardware.java
    ├── repository/HardwareRepository.java
    └── service/
        ├── HardwareService.java
        └── HardwareServiceImpl.java
```

---

## Cómo levantar el contenedor MongoDB

### Requisitos
- Docker Desktop corriendo

### Pasos

```bash
cd inventario-db

docker build -t inventario-mongo .

docker run -d --name inventario-db -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=adminpass \
  inventario-mongo
```

### Verificar que levantó bien

```bash
docker logs inventario-db
```

Buscar la línea: `MongoDB init process complete; ready for start up`

---

## Datos de conexión

| Campo | Valor |
|---|---|
| Host (local) | `localhost` |
| Host (Kubernetes) | `inventario-db` |
| Puerto | `27017` |
| Base de datos | `inventario` |
| Usuario de la app | `app-inventario` |
| Contraseña | `password123` |
| Auth source | `inventario` |
| URI completa | `mongodb://app-inventario:password123@inventario-db:27017/inventario?authSource=inventario` |

---

## Variables de entorno necesarias

Para el manifiesto de Kubernetes (P1):

```yaml
env:
  - name: MONGO_INITDB_ROOT_USERNAME
    value: admin
  - name: MONGO_INITDB_ROOT_PASSWORD
    value: adminpass
```

Para el backend (application.yaml):

```yaml
spring:
  data:
    mongodb:
      uri: mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOST}:27017/inventario?authSource=inventario
```

O mediante la clase `MongoConfig.java` leyendo la variable de entorno `MONGO_URI`.

---

## Endpoints disponibles

Todos los endpoints requieren token JWT en el header:
```
Authorization: Bearer <token>
```

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/hardware` | Obtener todos los equipos |
| GET | `/api/hardware/{id}` | Obtener un equipo por ID (ej: `PC-01`) |
| POST | `/api/hardware` | Crear un equipo |
| PUT | `/api/hardware/{id}` | Actualizar un equipo |
| DELETE | `/api/hardware/{id}` | Eliminar un equipo |

### Ejemplo de body (POST/PUT)

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
  "monitor": "Dell 24''",
  "mouse": "Logitech M90",
  "teclado": "Logitech K120"
}
```

> Las laptops no incluyen `monitor`, `mouse` ni `teclado`.

---

## Queries desde el shell del contenedor

```bash
docker exec -it inventario-db mongosh -u admin -p adminpass --authenticationDatabase admin
```

Una vez adentro:

```javascript
use inventario

// Ver todos los documentos
db.hardware.find()

// Filtrar por tipo
db.hardware.find({ tipo: "laptop" })

// Actualizar un campo
db.hardware.updateOne({ _id: "PC-01" }, { $set: { estado: "mantenimiento" } })

// Eliminar un documento
db.hardware.deleteOne({ _id: "NB-03" })
```

---

## Para P1 — Kubernetes

- **Imagen**: construir desde `inventario-db/Dockerfile`
- **Puerto expuesto**: `27017`
- **Tipo de Service**: `ClusterIP` (solo accesible desde el backend-api)
- **Variables de entorno requeridas**: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`
- **URI para el backend**: `mongodb://app-inventario:password123@inventario-db:27017/inventario?authSource=inventario`

---

## Para P2 (backend SQL)

El endpoint que necesitás para obtener los componentes de un equipo es:

```
GET /api/hardware/{id}
```

Donde `{id}` es el identificador del equipo (ej: `PC-01`). No requiere autenticación entre servicios internos, solo el token JWT del usuario.

**URL en Kubernetes**: `http://backend-api:8080/api/hardware/{id}`