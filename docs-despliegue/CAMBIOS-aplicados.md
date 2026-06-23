# Cambios aplicados sobre `feature/infra-k8s`, `prueba-integracion-v1` y `feature/backend-mongo`

Este documento lista **solo las modificaciones** hechas sobre archivos que ya existían en las ramas del equipo, para poder llevar el despliegue de Minikube a un estado funcional. No incluye instalación de herramientas ni explicación de arquitectura — eso está en el README general de despliegue.

Por cada archivo: ruta, rama de origen, qué decía antes, qué se cambió, y por qué.

---

## 1. `k8s/deployments/mongodb-deployment.yaml`
**Rama de origen:** `feature/infra-k8s` (Romina)

**Antes:**
```yaml
image: mongo:6
```

**Después:**
```yaml
image: mongo:4.4
```

**Por qué:** `mongo:6` requiere CPU con soporte AVX. El contenedor crasheaba al iniciar (`Illegal instruction (core dumped)`) porque el procesador disponible no lo soporta. `mongo:4.4` no tiene ese requisito.

---

## 2. `k8s/deployments/backend-api-deployment.yaml`
**Rama de origen:** `feature/infra-k8s` (Romina)

**Antes:** el bloque `env:` solo mapeaba 5 variables desde el ConfigMap `app-config`:
```yaml
env:
  - name: SPRING_DATASOURCE_URL
    valueFrom: {configMapKeyRef: {name: app-config, key: SPRING_DATASOURCE_URL}}
  - name: SPRING_LDAP_URLS
    valueFrom: {configMapKeyRef: {name: app-config, key: SPRING_LDAP_URLS}}
  - name: SPRING_LDAP_BASE
    valueFrom: {configMapKeyRef: {name: app-config, key: SPRING_LDAP_BASE}}
  - name: SPRING_LDAPADMIN_URLS
    valueFrom: {configMapKeyRef: {name: app-config, key: SPRING_LDAPADMIN_URLS}}
  - name: SPRING_LDAPADMIN_BASE
    valueFrom: {configMapKeyRef: {name: app-config, key: SPRING_LDAPADMIN_BASE}}
```

**Después:** se agregaron 7 variables más, al final del mismo bloque:
```yaml
  - name: SQL_USERNAME
    valueFrom:
      secretKeyRef: {name: backend-secret, key: SQL_USERNAME}
  - name: SQL_PASSWORD
    valueFrom:
      secretKeyRef: {name: backend-secret, key: SQL_PASSWORD}
  - name: SPRING_LDAP_USERNAME
    valueFrom:
      secretKeyRef: {name: backend-secret, key: LDAP_USER}
  - name: SPRING_LDAP_PASSWORD
    valueFrom:
      secretKeyRef: {name: backend-secret, key: LDAP_PASSWORD}
  - name: SPRING_LDAPADMIN_USERNAME
    valueFrom:
      secretKeyRef: {name: backend-secret, key: LDAP_ADMIN_USER}
  - name: SPRING_LDAPADMIN_PASSWORD
    valueFrom:
      secretKeyRef: {name: backend-secret, key: LDAP_ADMIN_PASSWORD}
  - name: SPRING_DATA_MONGODB_URI
    value: "mongodb://app-inventario:<PASSWORD_MONGO>@inventario-db:27017/inventario"
```

**Por qué:** el `application.yaml` real del backend (rama `prueba-integracion-v1`) espera estas 7 variables (`${SQL_USERNAME}`, `${SPRING_LDAP_USERNAME}`, etc.) y ninguna estaba mapeada en el Deployment. Sin ellas, Spring fallaba al arrancar con `PlaceholderResolutionException: Could not resolve placeholder 'SPRING_LDAP_USERNAME'`. La URI de Mongo no existía en ningún Secret ni ConfigMap, así que se agregó como valor literal directo.

**Cambio adicional sobre el mismo archivo:** `imagePullPolicy` se cambió de `Always` a `IfNotPresent` (vía `kubectl patch`, no edición manual del YAML):
```yaml
imagePullPolicy: IfNotPresent   # antes: Always
```
**Por qué:** con `Always`, Kubernetes siempre volvía a bajar la imagen vieja desde GHCR al crear un pod nuevo, ignorando las imágenes reconstruidas localmente con las correcciones de código.

---

## 3. `k8s/deployments/frontend-deployment.yaml`
**Rama de origen:** `feature/infra-k8s` (Romina)

**Cambio:** mismo ajuste de `imagePullPolicy`:
```yaml
imagePullPolicy: IfNotPresent   # antes: Always
```

**Por qué:** mismo motivo que el punto 2 — la imagen reconstruida localmente (con la URL del backend corregida) no se aplicaba porque Kubernetes siempre repulleaba la versión vieja de GHCR.

---

## 4. `k8s/secrets/backend-secret.yaml` (no existía, solo `.example`)
**Rama de origen:** `feature/infra-k8s` (Romina) — el ejemplo

**Antes:** solo existía `backend-secret.example.yaml` con 4 claves sin valores:
```yaml
stringData:
  SQL_USERNAME: "<usuario-sql>"
  SQL_PASSWORD: "<contraseña>"
  LDAP_USER: "<usuario-ldap>"
  LDAP_PASSWORD: "<contraseña>"
```

**Después:** se creó el archivo real `backend-secret.yaml` con 6 claves (las 4 del ejemplo más 2 nuevas):
```yaml
stringData:
  SQL_USERNAME: "app_inventario"
  SQL_PASSWORD: "<PASSWORD_ITU>"
  LDAP_USER: "<LDAP_BIND_USER>"
  LDAP_PASSWORD: "<PASSWORD_ITU>"
  LDAP_ADMIN_USER: "<LDAP_ADMIN_USER>"
  LDAP_ADMIN_PASSWORD: "<PASSWORD_ITU>"
```

**Por qué:** el archivo real (gitignoreado) nunca había sido creado en este entorno. Se le agregaron además las credenciales de `svc_admin` (bind de escritura LDAP), que el `.example` original no contemplaba y que el `application.yaml` sí necesita (`SPRING_LDAPADMIN_USERNAME`/`PASSWORD`).

---

## 5. `k8s/secrets/mongo-secret.yaml` (no existía, solo `.example`)
**Rama de origen:** `feature/infra-k8s` (Romina) — el ejemplo

**Antes:** solo existía `mongo-secret.example.yaml` con 2 claves:
```yaml
stringData:
  MONGO_USER: "<usuario-mongo>"
  MONGO_PASS: "<contraseña>"
```

**Después:** se creó el archivo real con 4 claves:
```yaml
stringData:
  MONGO_INITDB_ROOT_USERNAME: "app-inventario"
  MONGO_INITDB_ROOT_PASSWORD: "<PASSWORD_MONGO>"
  MONGO_USER: "app-inventario"
  MONGO_PASS: "<PASSWORD_MONGO>"
```

**Por qué:** el Deployment de Mongo (`feature/infra-k8s`) referencia `MONGO_INITDB_ROOT_USERNAME`/`PASSWORD` (nombres estándar de la imagen oficial de Mongo), mientras que el `.example` original solo traía `MONGO_USER`/`MONGO_PASS`. Se incluyeron ambos pares para no tener que decidir cuál usa exactamente cada parte del sistema. Las credenciales (`app-inventario` / `<PASSWORD_MONGO>`) son las que ya estaban en `init-mongo.js` de la rama `feature/backend-mongo` (Agus).

---

## 6. `src/main/resources/application.yaml` (no existía, solo `.example`)
**Rama de origen:** `prueba-integracion-v1`

**Antes:** solo existía `application.yaml.example`. Maven empaquetaba el `.jar` sin ningún `application.yaml` real adentro.

**Después:** se copió el contenido del `.example` a un archivo nuevo con el nombre correcto:
```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```
(mismo contenido, solo cambia el nombre del archivo)

**Por qué:** Spring Boot busca específicamente `application.yaml`, no `application.yaml.example`. Sin el archivo con el nombre correcto, la app arrancaba con la configuración por defecto, ignorando completamente las variables de entorno (`${SQL_USERNAME}`, etc.) — esto causaba que SQL Server rechazara la conexión con *"Error de inicio de sesión del usuario ''"* (usuario vacío), aunque el Secret y las variables del pod fueran correctos.

---

## 7. `src/main/java/com/inventario/backendapi/auth/SecurityConfig.java`
**Rama de origen:** `prueba-integracion-v1`

**Antes:**
```java
config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
```

**Después:**
```java
config.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173", "http://192.168.49.2:30000"));
```

**Por qué:** la lista de orígenes CORS permitidos solo contemplaba escenarios de desarrollo local (frontend corriendo fuera de Kubernetes, en `localhost`). Al desplegar el frontend dentro de Minikube y acceder vía `http://<IP-minikube>:30000`, el navegador recibía `CORS Missing Allow Origin` / 403 en el preflight `OPTIONS`. Se agregó el origen real del frontend desplegado.

> Nota: `192.168.49.2` es la IP que tuvo Minikube en esta sesión (`minikube ip`). Si el clúster se recrea en otra PC o tras un `minikube delete`, esta IP puede cambiar y hay que actualizar la lista de nuevo.

---

## 8. `inventario-web/.env` (no existía, solo `.env.example`)
**Rama de origen:** `prueba-integracion-v1`

**Antes:** solo existía `.env.example`:
```
VITE_API_URL=http://localhost:8080
```
El código (`src/api.js`) usa `import.meta.env.VITE_API_URL || "http://localhost:8080"` — sin el `.env` real, Vite hornea el fallback `localhost:8080` directo en el JS compilado.

**Después:** se creó `inventario-web/.env`:
```
VITE_API_URL=http://192.168.49.2:30001
```

**Por qué:** Vite resuelve esta variable **en tiempo de build**, no en tiempo de ejecución. Sin el `.env` real, el frontend siempre intentaba conectar a `localhost:8080` (donde no hay nada escuchando dentro del contenedor/red de Minikube), causando `CORS Failed` / conexión rehusada en el navegador.

---

## 9. `inventario-web/.dockerignore`
**Rama de origen:** `prueba-integracion-v1`

**Antes:**
```
node_modules
dist
.git
.env
npm-debug.log
```

**Después:** se quitó la línea `.env`:
```
node_modules
dist
.git
npm-debug.log
```

**Por qué:** con `.env` en el `.dockerignore`, Docker nunca copiaba ese archivo al contexto de build (`COPY . .`), así que aunque el archivo existiera en el filesystem del host, `npm run build` corría sin la variable `VITE_API_URL` disponible y volvía a usar el fallback `localhost:8080`. Sacarlo de la exclusión permite que el build real lo incluya.

> Nota de seguridad: esto es razonable para este `.env` puntual (solo contiene una URL, no secretos), pero si en el futuro ese archivo llegara a tener credenciales, convendría usar `--build-arg` de Docker en vez de sacar `.env` del `.dockerignore` por completo.

---

## 10. Datos en SQL Server — tabla `ubicaciones` (no es un archivo de código, pero es un cambio necesario)
**Origen del dato:** seed manual cargado desde SSMS (documentado en `feature/vms-sql-ad`, rama de Franco)

**Antes:**
| id | edificio | area |
|---|---|---|
| 0 | `Edificio A` | LABORATORIO |
| 1 | `Edificio B` | AULA |
| 2 | `Edificio C` | SECRETARIA |

**Después:**
```sql
USE InventarioITU;
UPDATE ubicaciones SET edificio = 'SEDE_CENTRAL' WHERE id IN (0, 1);
UPDATE ubicaciones SET edificio = 'CAMPUS_TIC' WHERE id = 2;
```

| id | edificio | area |
|---|---|---|
| 0 | `SEDE_CENTRAL` | LABORATORIO |
| 1 | `SEDE_CENTRAL` | AULA |
| 2 | `CAMPUS_TIC` | SECRETARIA |

**Por qué:** la entidad Java `Ubicacion` mapea la columna `edificio` con `@Enumerated(EnumType.STRING)` contra el enum:
```java
public enum Edificio { SEDE_CENTRAL, CAMPUS_TIC }
```
Los valores `"Edificio A/B/C"` insertados manualmente no coinciden con ninguna constante del enum. Hibernate lanzaba una excepción al mapear las filas dentro de la transacción de `findAll()`, que se manifestaba como `UnexpectedRollbackException` y un `403` sin mensaje útil al pedir `GET /api/equipos` — a pesar de que la autenticación y los permisos eran correctos.

---

## Resumen de archivos tocados

| Archivo | Tipo de cambio |
|---|---|
| `k8s/deployments/mongodb-deployment.yaml` | Editado (versión de imagen) |
| `k8s/deployments/backend-api-deployment.yaml` | Editado (env vars + imagePullPolicy) |
| `k8s/deployments/frontend-deployment.yaml` | Editado (imagePullPolicy) |
| `k8s/secrets/backend-secret.yaml` | Creado (no existía, solo `.example`) |
| `k8s/secrets/mongo-secret.yaml` | Creado (no existía, solo `.example`) |
| `src/main/resources/application.yaml` | Creado (copia renombrada del `.example`) |
| `src/main/java/.../auth/SecurityConfig.java` | Editado (lista de orígenes CORS) |
| `inventario-web/.env` | Creado (no existía, solo `.example`) |
| `inventario-web/.dockerignore` | Editado (se quitó la exclusión de `.env`) |
| Datos en SQL Server, tabla `ubicaciones` | Corregidos (valores de `edificio`) |

Ningún cambio modificó la lógica de negocio del backend ni el diseño de los manifiestos de Romina — todos son: variables faltantes, archivos de configuración nunca creados, o datos de seed desincronizados con el modelo Java.

---

## 11. Usuario MongoDB de aplicacion no existia en la base correcta

**Sintoma:** GET /api/hardware devolvia 403 sin body, con cualquier usuario o incluso sin token. El 403 era enganoso: Spring Security autorizaba la peticion sin problema, pero una excepcion no controlada dentro del controller (MongoDB rechazando la autenticacion) terminaba siendo mostrada como 403 generico por el manejador de errores por defecto de Spring Boot.

**Causa real:** el Secret mongo-secret.yaml crea, via MONGO_INITDB_ROOT_USERNAME, un usuario app-inventario root en la base admin. La URI real del backend intenta autenticar ese mismo usuario contra la base inventario, donde nunca existio. MongoDB devolvia AuthenticationFailed (code 18).

**Solucion:** ejecutar inventario-db/init-mongo.js dentro del pod de Mongo, autenticado como el usuario root, para crear el usuario app-inventario con rol readWrite acotado a la base inventario:

kubectl cp inventario-db/init-mongo.js inventario/<pod-mongo>:/tmp/init-mongo.js
kubectl exec -n inventario <pod-mongo> -- mongo admin -u app-inventario -p <PASSWORD_MONGO> --authenticationDatabase admin /tmp/init-mongo.js

**Importante:** repetir este paso cada vez que se recree el PVC de Mongo o el cluster, ya que mongo:4.4 pelado no ejecuta init-mongo.js automaticamente. Pendiente: usar inventario-db/Dockerfile (que si lo monta) en el deployment.

**Diagnostico util para casos similares:** si Spring Security da 403 sin razon aparente (mismo resultado con o sin token), sospechar de una excepcion de aplicacion enmascarada como 403. Confirmar viendo si el metodo del controller aparece en el stack trace de los logs.
