# EGI — Despliegue completo en Minikube (sesión de prueba)

Este documento registra el despliegue de prueba realizado en la VM Ubuntu Desktop 24.04 (host con VirtualBox), uniendo las ramas `prueba-integracion-v1` (backend + frontend) y `feature/infra-k8s` (manifiestos Kubernetes). Incluye todos los problemas reales encontrados, su diagnóstico y la solución aplicada, más la guía para repetir el despliegue en una computadora distinta (laboratorio de la facultad) con red DHCP.

---

## 1. Resultado final

Al cierre de la sesión, el ecosistema completo funciona de punta a punta:

- Login contra Active Directory (LDAP simple bind, puerto 389) ✔
- JWT generado con el rol correcto según el grupo AD del usuario ✔
- Listado de equipos desde SQL Server, con ubicación y responsable resueltos ✔
- Frontend (`inventario-web`) y backend (`backend-api`) corriendo dentro de Minikube ✔
- MongoDB corriendo dentro de Minikube (pendiente de probar el cruce de hardware) ✔

Usuarios de prueba validados: `usr.admin`, `usr.lector` (contraseña `Itu12345!` para todos).

---

## 2. Arquitectura de red usada

La VM de Ubuntu se configuró con **dos adaptadores de red simultáneos** en VirtualBox, sin necesidad de alternar entre ellos:

| Adaptador | Modo | Propósito |
|---|---|---|
| Adaptador 1 (`enp0s3`) | NAT | Internet: `apt`, Docker Hub, GHCR, imágenes de Minikube/Calico |
| Adaptador 2 (`enp0s8`) | Red Interna `LAN-SERVER` | Alcanzar el DC (`10.10.10.10`) y SQL Server (`10.10.10.20`) |

Configuración del Adaptador 2 (IPv4 manual):
- Dirección: `10.10.10.30`
- Máscara: `255.255.255.0`
- Puerta de enlace: **vacía** (la ruta por defecto la sigue dando el adaptador NAT)
- DNS: **vacío**

Verificación de que ambos caminos funcionan a la vez:
```bash
ping -c 3 10.10.10.10        # DC interno
nc -vz 10.10.10.20 1433      # SQL Server interno
ping -c 3 8.8.8.8             # Internet vía NAT
```

> Esta decisión reemplaza la sugerencia inicial (incorrecta) de usar Bridge. El equipo ya había decidido mantener NAT en la capa de VMs para preservar a pfSense como firewall perimetral real; agregar un segundo adaptador de Red Interna en la VM de Ubuntu logra lo mismo sin romper esa decisión.

---

## 3. Instalación de herramientas en la VM Ubuntu

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget apt-transport-https ca-certificates gnupg conntrack git

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo reboot

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

### Levantar el clúster con Calico (obligatorio para las NetworkPolicies)

```bash
minikube start --driver=docker --cni=calico --cpus=4 --memory=5000 --disk-size=20g
```

> Si la VM tiene menos CPUs asignadas que las pedidas, bajar `--cpus`. **El valor de `--cpus` solo se aplica al crear el clúster por primera vez** — si ya existe y se quiere cambiar, hay que borrarlo (`minikube delete`) y recrearlo.

Verificación:
```bash
minikube status
kubectl get nodes
kubectl get pods -n kube-system | grep calico
```

---

## 4. Traer el código

```bash
git clone https://github.com/Romis2799/EGI.git
cd EGI
git checkout prueba-integracion-v1
```

Como los manifiestos de Kubernetes viven en una rama separada (`feature/infra-k8s`) que todavía no está mergeada, se trajo solo esa carpeta sin cambiar de rama:

```bash
git fetch origin
git checkout origin/feature/infra-k8s -- k8s/
```

> Para clonar un repo privado por HTTPS hace falta un **Personal Access Token (classic)** de GitHub con scope `repo` únicamente, usado como password en el prompt de `git clone`. Guardarlo en caché con `git config --global credential.helper store` evita reingresarlo.

---

## 5. Secrets que no vienen en el repo (gitignored)

El repo trae `.example.yaml` con los nombres de las claves pero sin valores. Hubo que crear los reales:

```bash
cat > k8s/secrets/backend-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: backend-secret
  namespace: inventario
type: Opaque
stringData:
  SQL_USERNAME: "app_inventario"
  SQL_PASSWORD: "Itu12345!"
  LDAP_USER: "svc_backend@itu.local"
  LDAP_PASSWORD: "Itu12345!"
  LDAP_ADMIN_USER: "svc_admin@itu.local"
  LDAP_ADMIN_PASSWORD: "Itu12345!"
EOF

cat > k8s/secrets/mongo-secret.yaml << 'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: mongo-secret
  namespace: inventario
type: Opaque
stringData:
  MONGO_INITDB_ROOT_USERNAME: "app-inventario"
  MONGO_INITDB_ROOT_PASSWORD: "password123"
  MONGO_USER: "app-inventario"
  MONGO_PASS: "password123"
EOF
```

> El secret de backend incluye 6 campos: los 4 originales del `.example` más `LDAP_ADMIN_USER`/`LDAP_ADMIN_PASSWORD` (cuenta `svc_admin`, bind de escritura), que faltaban documentados.

---

## 6. Problemas reales encontrados y su solución

Esta sección es la más importante: documenta cada falla real, no hipotética, encontrada durante el despliegue.

### 6.1 — MongoDB no arranca: `Illegal instruction (core dumped)`

**Causa:** `mongo:6` requiere instrucciones de CPU **AVX**, que el procesador del host (o cómo VirtualBox expone la virtualización) no soporta.

**Solución:** bajar la versión de la imagen a una que no requiera AVX.

```bash
sed -i 's/image: mongo:6/image: mongo:4.4/' k8s/deployments/mongodb-deployment.yaml
```

> Anotar esto en la documentación del proyecto como limitación de hardware del entorno de laboratorio, no como bug propio.

### 6.2 — Backend en `CrashLoopBackOff`: variable LDAP no resuelta

**Síntoma:**
```
Could not resolve placeholder 'SPRING_LDAP_USERNAME' in value "${SPRING_LDAP_USERNAME}"
```

**Causa:** el `application.yaml.example` del backend espera variables que el `ConfigMap`/`Deployment` de la rama de infraestructura no mapeaba: `SQL_USERNAME`, `SQL_PASSWORD`, `SPRING_LDAP_USERNAME`, `SPRING_LDAP_PASSWORD`, `SPRING_LDAPADMIN_USERNAME`, `SPRING_LDAPADMIN_PASSWORD`, y `SPRING_DATA_MONGODB_URI` (esta última no existía en ningún lado).

**Solución:** se agregaron al `env:` de `backend-api-deployment.yaml` los 7 campos faltantes, mapeando desde los Secrets ya creados, más la URI de Mongo armada a mano:

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
  value: "mongodb://app-inventario:password123@inventario-db:27017/inventario"
```

### 6.3 — Frontend pega a `localhost:8080` en vez del backend real (CORS Failed)

**Causa:** Vite hornea `VITE_API_URL` **en tiempo de build**, no en tiempo de ejecución. El `.env` real nunca existía (solo `.env.example`), así que el código usaba el fallback `http://localhost:8080`.

**Solución:**
1. Crear `inventario-web/.env` con la URL real del backend (IP de Minikube + NodePort 30001).
2. El `.dockerignore` excluía `.env` — había que sacarlo de ahí para que el build lo viera.
3. Rebuildear la imagen del frontend con `docker build` (ver sección 7 sobre cómo cargarla en Minikube correctamente).

```bash
echo "VITE_API_URL=http://$(minikube ip):30001" > inventario-web/.env
sed -i '/^\.env$/d' inventario-web/.dockerignore
```

> **Atención:** la IP de Minikube (`minikube ip`) puede ser distinta en cada PC/sesión donde se recree el clúster. Hay que regenerar este `.env` y rebuildear si cambia.

### 6.4 — CORS rechazado por el backend (403 en el preflight `OPTIONS`)

**Causa:** `SecurityConfig.java` solo permite los orígenes `http://localhost:3000` y `http://localhost:5173` (pensados para desarrollo local con el frontend corriendo fuera de Kubernetes).

**Solución:** agregar el origen real del frontend (IP de Minikube + NodePort 30000) a la lista:

```java
// src/main/java/com/inventario/backendapi/auth/SecurityConfig.java
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "http://localhost:5173",
    "http://192.168.49.2:30000"   // <- IP de Minikube de esa sesión
));
```

Esto requiere **rebuildear la imagen del backend** (es código Java, no configuración externa).

> Para el laboratorio, conviene dejar esta lista con la IP que tenga Minikube ese día, o mejorarlo a futuro para que lea los orígenes permitidos desde una variable de entorno.

### 6.5 — `application.yaml` real nunca se empaquetaba en el `.jar`

**Síntoma:** SQL Server rechazaba el login con *"Error de inicio de sesión del usuario ''"* (usuario vacío), a pesar de que el Secret y las variables de entorno del pod eran correctos.

**Causa real:** en el repo solo existe `application.yaml.example`. Maven empaqueta los recursos tal como están en el filesystem — si nunca se crea el archivo `application.yaml` (sin `.example`), Spring Boot arranca sin ninguna configuración personalizada y usa defaults, ignorando las variables `${SQL_USERNAME}`, etc.

**Solución:**
```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```
y volver a compilar (`docker build`). Confirmado con:
```bash
unzip -l app.jar | grep -i application.yaml
# debe decir BOOT-INF/classes/application.yaml (sin .example)
```

### 6.6 — `minikube image load` no actualiza una imagen con el mismo tag

**Síntoma:** después de rebuildear, el pod sigue corriendo el código viejo, aunque `minikube image load` se ejecute "exitosamente" en 2 segundos (sospechosamente rápido para el tamaño real de la imagen).

**Causa:** si ya existe una imagen con ese tag dentro del nodo de Minikube, `minikube image load` no siempre la reemplaza de forma confiable, sobre todo si la imagen vieja está "in use" por un pod corriendo.

**Solución confiable** (repetir cada vez que se rebuildea backend o frontend):
```bash
# 1. Liberar la imagen (escalar a 0 para que ningún pod la use)
kubectl scale deployment <nombre> -n inventario --replicas=0
sleep 5

# 2. Borrar la imagen vieja del nodo por su ID exacto
minikube ssh -- docker images ghcr.io/romis2799/<nombre>:v2   # anotar el ID
minikube ssh -- docker rmi <ID-VIEJO>

# 3. Construir (en el Docker del HOST, no el de Minikube) y cargar
docker build -t ghcr.io/romis2799/<nombre>:v2 .
minikube image load ghcr.io/romis2799/<nombre>:v2

# 4. Confirmar el ID nuevo
minikube ssh -- docker images ghcr.io/romis2799/<nombre>:v2

# 5. Volver a escalar
kubectl scale deployment <nombre> -n inventario --replicas=1
```

> **Importante:** construir siempre con el Docker del host de la VM, nunca con `eval $(minikube docker-env)` activo — si ese entorno está seteado (`echo $DOCKER_HOST` muestra algo), revertirlo con `eval $(minikube docker-env -u)` antes de buildear, porque un build dentro del daemon de Minikube con bind mounts (`-v $(pwd):/app`) no encuentra los archivos del host.

### 6.7 — `imagePullPolicy: Always` ignora la imagen local

**Causa:** con `Always`, Kubernetes vuelve a bajar la imagen del registro remoto (GHCR) en cada creación de pod, ignorando cualquier imagen cargada localmente con `minikube image load`.

**Solución:** mientras se desarrolla/depura localmente sin publicar a GHCR, cambiar a `IfNotPresent`:
```bash
kubectl patch deployment <nombre> -n inventario -p \
  '{"spec":{"template":{"spec":{"containers":[{"name":"<nombre>","imagePullPolicy":"IfNotPresent"}]}}}}'
```

### 6.8 — `UnexpectedRollbackException` al listar equipos (403/500 silencioso)

**Síntoma:** login funciona, pero `GET /api/equipos` devuelve 403 sin body, incluso con un JWT válido y rol `ADMINISTRADOR`. En los logs aparece:
```
org.springframework.transaction.UnexpectedRollbackException: Transaction silently rolled back because it has been marked as rollback-only
```

**Causa real (no es de autenticación ni de red):** la entidad `Ubicacion` mapea la columna `edificio` con `@Enumerated(EnumType.STRING)` contra el enum Java:
```java
public enum Edificio { SEDE_CENTRAL, CAMPUS_TIC }
```
pero los datos de seed insertados manualmente en SQL Server tenían los valores `"Edificio A"`, `"Edificio B"`, `"Edificio C"` — que no coinciden con ninguna constante del enum. Hibernate lanza una excepción al mapear la fila dentro de la transacción de `findAll()`, lo que la marca como rollback-only.

**Solución:** corregir los datos para que coincidan con el enum (en SSMS):
```sql
USE InventarioITU;
UPDATE ubicaciones SET edificio = 'SEDE_CENTRAL' WHERE id IN (0, 1);
UPDATE ubicaciones SET edificio = 'CAMPUS_TIC' WHERE id = 2;
```

> Esto es un desajuste entre el seed de datos manual y el modelo Java, no un bug del backend ni de Kubernetes. Vale la pena revisar si hay otros enums (`Area`, `TipoResponsable` cuando se agregue, roles AD) con el mismo riesgo de desincronización entre lo que se tipea a mano en SSMS y las constantes Java.

### 6.9 — `kubectl logs` corto / sin contexto del error real

Cuando el pod estaba en `CrashLoopBackOff`, los logs cortos (`--tail=N` chico) mostraban solo el final del stack trace, sin la causa raíz. Para diagnosticar bien:
```bash
kubectl logs -n inventario -l app=<nombre> --tail=200 > /tmp/full.txt
grep -n "Caused by\|Exception:" /tmp/full.txt
```
Y si el pod se reinicia muy rápido, usar un **pod de debug** con `command: ["sleep", "3600"]` y el mismo `env`/`volumeMounts` que el real, para poder entrar con `kubectl exec` sin que crashee y revisar variables de entorno, archivos montados, o correr comandos de diagnóstico con calma.

---

## 7. Pendiente para la NetworkPolicies (no aplicado aún en esta sesión)

La documentación de Romina señala un punto crítico que todavía no se aplicó: el set de NetworkPolicies (`deny-all`, `allow-frontend-ingress`, `allow-frontend-to-backend`, `allow-backend-egress`) **no incluye una regla de egress a DNS (puerto 53)**. Sin ella, apenas se activen las políticas, ningún pod va a poder resolver nombres como `inventario-db`, `ldap-service` o `ubicacion-db`, y todo el sistema se rompe.

Ya se preparó el manifiesto faltante (`k8s/networkpolicies/allow-dns-egress.yaml`):
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: inventario
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
```

**Antes de aplicar las NetworkPolicies por primera vez**, aplicar este manifiesto junto con los demás, y volver a probar el login y el listado de equipos para confirmar que sigue funcionando con Zero-Trust activo.

---

## 8. Orden completo de despliegue (resumen, sin las correcciones de código)

Una vez que el código YA tiene todas las correcciones de la sección 6 aplicadas (es decir, para repetir el despliegue de una imagen ya corregida):

```bash
cd ~/EGI

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac/
kubectl apply -f k8s/configmaps/app-config.yaml
kubectl apply -f k8s/secrets/backend-secret.yaml
kubectl apply -f k8s/secrets/mongo-secret.yaml
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/

# Verificar que todo levantó ANTES de aplicar las políticas de red
kubectl get pods -n inventario
kubectl get svc -n inventario

# Recién al final (incluyendo el manifiesto de DNS de la sección 7)
kubectl apply -f k8s/networkpolicies/
```

Acceso final:
- Frontend: `http://$(minikube ip):30000`
- Backend: `http://$(minikube ip):30001`

---

## 9. Despliegue en el laboratorio de la facultad (otra PC, otra red, DHCP)

Esto es lo que cambia y lo que hay que verificar al mover todo a una computadora distinta del laboratorio.

### 9.1 Qué NO cambia

- Las IPs internas `10.10.10.10` (DC) y `10.10.10.20` (SQL) **siguen iguales**, porque son parte de la Red Interna de VirtualBox (`LAN-SERVER`), que es virtual y no depende de la red física de la PC anfitriona.
- Los manifiestos de Kubernetes, Secrets, y el código corregido (CORS, `application.yaml`, datos de enum) **no cambian**.
- Las credenciales (`Itu12345!`, `app_inventario`, `svc_backend`, etc.) siguen iguales.

### 9.2 Qué SÍ cambia y hay que verificar en el lab

#### a) IP de la VM de Ubuntu en la red del laboratorio (DHCP)

En el laboratorio, el Adaptador 1 (NAT) sigue funcionando igual sin tocar nada — VirtualBox maneja el NAT internamente sin depender de la red física. **No hace falta tocar este adaptador.**

El Adaptador 2 (Red Interna) tampoco depende de la red física del lab, porque es una red interna de VirtualBox — pero hay que confirmar que **las VMs del DC y SQL Server también estén conectadas a esa misma Red Interna** después de importar los `.ova` en la nueva PC (ver punto siguiente).

#### b) Importar las VMs `.ova` en la PC del laboratorio

1. Importar los `.ova` de: pfSense, DC (Servidor), SQL Server (SERVIDOR-IIS-SQ), y la VM de Ubuntu con Minikube ya configurado (si se exporta también como `.ova`, evita repetir toda la instalación de Docker/kubectl/Minikube).
2. **Verificar el nombre de la Red Interna** en cada VM tras importar: VirtualBox a veces no preserva el nombre exacto de la red interna al importar un `.ova` en otra PC. Entrar a Configuración → Red de cada VM y confirmar que todas (DC, SQL, Ubuntu) usan el mismo nombre de red interna (`LAN-SERVER`).
3. **Revisar el bug del segundo adaptador NAT espurio**: ya documentado como recurrente al reimportar VMs — entrar a Configuración → Red de DC y SQL, y deshabilitar cualquier adaptador NAT adicional que haya quedado solo.
4. **Revisar el firewall ICMPv4 de Windows** en DC y SQL tras el reinicio (otro bug recurrente ya documentado): Firewall de Windows con seguridad avanzada → Reglas de entrada → habilitar "Eco de solicitud ICMPv4" si aparece deshabilitada.

#### c) IP WAN de pfSense (dinámica, cambia siempre)

Si en algún momento se necesita acceder a SQL Server o LDAP **desde fuera** de la red interna (por ejemplo, para correr el backend en IntelliJ directamente en la PC física del laboratorio, sin Kubernetes), hay que:
1. Abrir la consola de pfSense en VirtualBox.
2. Leer la línea `WAN (wan) -> em0 -> v4/DHCP4: xxx.xxx.xxx.xxx`.
3. Actualizar esa IP donde corresponda.

**Esto no aplica al despliegue dentro de Kubernetes**, porque el backend corre dentro de la VM de Ubuntu, que está en la red interna — sigue usando `10.10.10.20`/`10.10.10.10` directamente, sin pasar por la WAN de pfSense.

#### d) IP de Minikube (`minikube ip`) — la más importante de revisar

Cada vez que se recrea el clúster de Minikube (no en un simple start/stop, sino si se borra con `minikube delete` y se vuelve a crear), la IP interna que asigna Minikube **puede cambiar** (en esta sesión fue `192.168.49.2`, pero no está garantizado que sea siempre esa).

Si la IP cambia, hay que actualizar **dos lugares** y rebuildear:

1. **Frontend** — `inventario-web/.env`:
   ```bash
   echo "VITE_API_URL=http://$(minikube ip):30001" > inventario-web/.env
   ```
   y rebuildear + recargar la imagen (sección 6.6).

2. **Backend** — `SecurityConfig.java`, agregar el nuevo origen:
   ```java
   config.setAllowedOrigins(List.of(
       "http://localhost:3000",
       "http://localhost:5173",
       "http://<NUEVA-IP-MINIKUBE>:30000"
   ));
   ```
   y rebuildear + recargar la imagen.

> Si la VM de Ubuntu se importa ya con el clúster de Minikube existente (sin borrar y recrear), la IP **no cambia**, porque Minikube reutiliza la misma red Docker interna (`192.168.49.0/24` en este caso) al hacer `minikube start` sobre un clúster ya creado. La situación de riesgo es solo si alguien corre `minikube delete`.

#### e) Verificación de conectividad antes de desplegar, en el lab

Repetir exactamente esta secuencia, igual que se hizo en casa:
```bash
ping -c 3 10.10.10.10
nc -vz 10.10.10.20 1433
nc -vz 10.10.10.10 389
ping -c 3 8.8.8.8
minikube status
kubectl get nodes
kubectl get pods -n kube-system | grep calico
```

#### f) Checklist resumido para el día del examen/demo en el lab

1. Importar los 4 `.ova` (pfSense, DC, SQL, Ubuntu+Minikube).
2. Prender pfSense → DC → SQL → Ubuntu, en ese orden (orden de dependencia del profesor: AD → SQL → pfSense → Mongo/K8s → App).
3. Revisar: segundo adaptador NAT espurio, firewall ICMPv4, nombre de Red Interna coincide en las 3 VMs.
4. Verificar conectividad (punto e).
5. `minikube status` — si dice `Stopped`, `minikube start --driver=docker --cni=calico --cpus=<N> --memory=5000`.
6. `minikube ip` — comparar con la IP usada en el último build del frontend/backend. Si cambió, rebuildear ambos (secciones 6.3, 6.4, 6.6).
7. `kubectl get pods -n inventario` — confirmar que los 3 pods estén `1/1 Running`.
8. Probar login y listado de equipos antes de la demo en vivo.

---

## 10. Notas para la defensa del proyecto

- El nombre real del servidor SQL en AD/DNS es `SERVIDOR-IIS-SQ` (sin la `L` final, por el límite de 15 caracteres de NetBIOS) — no es un typo. Usar ese nombre en documentación y capturas, aunque el código conecta por IP directa y no se ve afectado.
- El `app-config` ConfigMap hardcodea la IP de SQL Server en `SPRING_DATASOURCE_URL` en vez de usar un Secret — funciona, pero contradice la regla del profesor de "IPs nunca hardcodeadas". Pendiente de mover a Secret para la entrega final.
- `mongo:4.4` en vez de `mongo:6` es una limitación de hardware (falta de soporte AVX en la VM), documentarlo así si se pregunta en la defensa.
- El bug del enum `Edificio` (sección 6.8) es un buen ejemplo para mencionar en la defensa sobre la importancia de los dos scripts separados (`01_init_schema.sql` / `02_seed_data.sql`) que pide el profesor — un seed de datos automatizado y versionado habría evitado este desajuste manual entre SSMS y el código Java.
