# Cómo desplegar EGI en otra computadora (PC de un compañero o laboratorio de la facultad)

Esta guía asume que vas a repetir el despliegue completo en una **computadora distinta** a la usada originalmente, con su propia red física. Sirve tanto para la PC de un compañero de equipo como para el laboratorio de la facultad.

No repite la explicación de *por qué* cada cosa es así (eso está en `CAMBIOS-aplicados.md` y en el README general de despliegue) — esto es una guía de ejecución, paso a paso, pensada para no perder tiempo el día de la demo.

---

## 0. Qué necesitás tener antes de empezar

- Los 4 archivos `.ova` de las VMs: **pfSense**, **DC (Servidor de AD)**, **SQL Server (SERVIDOR-IIS-SQ)**, y la **VM de Ubuntu** (si se exportó ya con Docker/kubectl/Minikube instalados — ahorra toda la sección 2).
- VirtualBox instalado en la nueva PC.
- El repositorio clonable (acceso a GitHub con un Personal Access Token si el repo sigue privado).
- Conexión a internet en la nueva PC (para `apt`, Docker Hub, GHCR — solo si hay que reinstalar algo).

---

## 1. Importar las VMs

En el Administrador de VirtualBox de la nueva PC:

**Archivo → Importar servicio virtualizado** → seleccionar cada `.ova` (pfSense, DC, SQL Server, Ubuntu).

### Verificaciones obligatorias después de importar, antes de prender nada:

Para **cada VM** (pfSense, DC, SQL, Ubuntu), entrar a **Configuración → Red** y confirmar:

1. **El adaptador de Red Interna tiene el mismo nombre en las 4 VMs.** VirtualBox a veces no preserva el nombre exacto al importar un `.ova` en otra PC — si una VM quedó con `LAN-SERVER` y otra con algo como `LAN-SERVER (1)`, no se van a poder comunicar. Corregir el nombre para que coincida en todas.

2. **No hay un segundo adaptador NAT espurio** en DC ni en SQL Server. Es un bug recurrente al reimportar: aparece un Adaptador 2 en modo NAT que no debería estar ahí, inyecta una IP que rompe la resolución interna. Si aparece, deshabilitarlo (destildar "Habilitar adaptador de red" en esa pestaña).

3. **La VM de Ubuntu tiene los dos adaptadores correctos:**
   - Adaptador 1: NAT (para internet)
   - Adaptador 2: Red Interna, mismo nombre que las otras 3 VMs

   Si la VM de Ubuntu se importó sin el Adaptador 2 (por ejemplo, porque se exportó desde una sesión anterior sin él), agregarlo: Configuración → Red → Adaptador 2 → Habilitar → Conectado a: Red interna → mismo nombre que el DC/SQL.

---

## 2. Prender las VMs en orden

```
1. pfSense       (esperar que termine de bootear, consola de texto)
2. DC (Servidor) (esperar que Windows arranque completo)
3. SQL Server    (esperar que Windows arranque completo)
4. Ubuntu        (al final)
```

### En el DC, después de arrancar:
- Confirmar que **Active Directory Domain Services** y **DNS** estén corriendo (Administrador del servidor → Servicios).
- Revisar el **Firewall de Windows con seguridad avanzada** → Reglas de entrada → si "Eco de solicitud ICMPv4" (o el wildcard `*ICMP4*` si se busca por PowerShell) aparece deshabilitada, habilitarla. Es un bug recurrente tras reiniciar la VM.

### En SQL Server, después de arrancar:
- Abrir **SQL Server Configuration Manager** → confirmar que el servicio de la instancia `ITULAB` esté **en ejecución**.
- Mismo chequeo de firewall ICMPv4 que en el DC.
- Si por algún motivo el login `app_inventario` no conecta, abrir **SSMS** y verificar en Seguridad → Inicios de sesión → Propiedades → que no esté deshabilitado y que la contraseña sea `<PASSWORD_ITU>`.

---

## 3. Configurar la red de la VM de Ubuntu (si no vino ya configurada en el `.ova`)

Dentro de Ubuntu, **Configuración del sistema → Red**. Va a aparecer una conexión con internet (la del Adaptador 1, NAT — no tocar) y otra sin internet (la del Adaptador 2). En esa segunda, click en el engranaje → **IPv4**:

- Método: **Manual**
- Dirección: `10.10.10.30`
- Máscara de red: `255.255.255.0`
- Puerta de enlace: **vacío**
- DNS → Automático: **apagado**, campo vacío

Aplicar, y confirmar:
```bash
ip a show enp0s8
```
Debe mostrar `inet 10.10.10.30/24` (el nombre de la interfaz puede variar; verificar con `ip link show` cuál corresponde al Adaptador 2 comparando la MAC con la que muestra VirtualBox).

### Verificación de conectividad (hacer siempre, no asumir):

```bash
ping -c 3 10.10.10.10        # DC
nc -vz 10.10.10.20 1433      # SQL Server
nc -vz 10.10.10.10 389       # LDAP
ping -c 3 8.8.8.8             # Internet por NAT
```

Los cuatro tienen que responder OK. Si el DC/SQL no responden, revisar el punto 1.1/1.2 antes de seguir (nombre de red interna o adaptador NAT espurio).

---

## 4. Si la VM de Ubuntu NO viene con Docker/kubectl/Minikube ya instalados

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget apt-transport-https ca-certificates gnupg conntrack git

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo reboot
```

Después de reiniciar:
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

---

## 5. Levantar o verificar el clúster de Minikube

Si la VM viene con el clúster **ya creado** (de una exportación anterior):
```bash
minikube status
```
Si dice `Stopped`:
```bash
minikube start --driver=docker --cni=calico --cpus=<N> --memory=5000 --disk-size=20g
```
(`<N>` = cantidad de vCPU asignadas a la VM en VirtualBox, revisar en Configuración → Sistema → Procesador antes de elegir el número)

Si es la **primera vez** que se crea el clúster en esta PC (sin exportación previa):
```bash
minikube start --driver=docker --cni=calico --cpus=<N> --memory=5000 --disk-size=20g
```
La primera vez tarda varios minutos (descarga imágenes base + Calico).

### Verificación:
```bash
kubectl get nodes
kubectl get pods -n kube-system | grep calico
```
El nodo debe estar `Ready` y los pods de Calico en `1/1 Running`.

---

## 6. Traer el código (si no viene ya en la VM)

```bash
git clone https://github.com/Romis2799/EGI.git
cd EGI
git checkout prueba-integracion-v1
git fetch origin
git checkout origin/feature/infra-k8s -- k8s/
```

> Repo privado: pide usuario y un Personal Access Token (classic, scope `repo`) como contraseña. `git config --global credential.helper store` lo guarda para no reingresarlo.

Si el código ya viene con todas las correcciones aplicadas y comiteadas, este paso es solo un `git pull`.

---

## 7. Verificar cuál es la IP de Minikube — paso crítico

```bash
minikube ip
```

**Anotá este valor.** Todo lo que sigue depende de él. En la sesión original fue `192.168.49.2`, pero en otra PC puede ser distinto (típicamente algo en el rango `192.168.49.x` o `192.168.58.x`, pero no asumir, siempre verificar con el comando).

---

## 8. Crear/actualizar los Secrets (si no vienen comiteados)

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
  SQL_PASSWORD: "<PASSWORD_ITU>"
  LDAP_USER: "<LDAP_BIND_USER>"
  LDAP_PASSWORD: "<PASSWORD_ITU>"
  LDAP_ADMIN_USER: "<LDAP_ADMIN_USER>"
  LDAP_ADMIN_PASSWORD: "<PASSWORD_ITU>"
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
  MONGO_INITDB_ROOT_PASSWORD: "<PASSWORD_MONGO>"
  MONGO_USER: "app-inventario"
  MONGO_PASS: "<PASSWORD_MONGO>"
EOF
```

---

## 9. Actualizar la IP de Minikube en el código (SOLO si cambió respecto a la última vez)

Si el valor de `minikube ip` (paso 7) es **distinto** al que estaba puesto en el código la última vez, hay que actualizar dos archivos y rebuildear ambas imágenes.

### 9.1 Frontend
```bash
echo "VITE_API_URL=http://$(minikube ip):30001" > inventario-web/.env
```

Confirmar que `inventario-web/.dockerignore` **no** tenga la línea `.env` (si la tiene, quitarla):
```bash
sed -i '/^\.env$/d' inventario-web/.dockerignore
```

### 9.2 Backend — `SecurityConfig.java`

Editar manualmente `src/main/java/com/inventario/backendapi/auth/SecurityConfig.java`, línea con `setAllowedOrigins`, y agregar (o actualizar) la IP nueva:
```java
config.setAllowedOrigins(List.of(
    "http://localhost:3000",
    "http://localhost:5173",
    "http://<IP-NUEVA-DE-MINIKUBE>:30000"
));
```

> Si esta IP nunca cambia entre sesiones en esa PC en particular (porque nunca se borra el clúster), este paso se hace una sola vez por máquina.

---

## 10. Asegurarse de que `application.yaml` exista (no solo `.example`)

```bash
ls src/main/resources/application.yaml
```
Si no existe:
```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
```

---

## 11. Build de las imágenes — IMPORTANTE: usar el Docker del host, no el de Minikube

```bash
cd ~/EGI
echo $DOCKER_HOST
```
Si ese comando devuelve algo (no está vacío), significa que el entorno está apuntando al Docker de Minikube. Revertir:
```bash
eval $(minikube docker-env -u)
```

### Build del backend:
```bash
docker build -t ghcr.io/romis2799/backend-api:v2 .
```

### Build del frontend:
```bash
cd inventario-web
docker build -t ghcr.io/romis2799/inventario-web:v2 .
cd ..
```

> Si alguno de los dos no necesitó cambios respecto a la última vez (la IP de Minikube no cambió y el código no cambió), este build es opcional — se puede usar la imagen ya cargada en Minikube si viene de una exportación anterior de la VM.

---

## 12. Cargar las imágenes en Minikube (reemplazando cualquier versión vieja)

Repetir esta secuencia para **cada imagen que se haya rebuildeado** en el paso 11:

```bash
# Backend
kubectl scale deployment backend-api -n inventario --replicas=0 2>/dev/null
sleep 3
minikube ssh -- docker images ghcr.io/romis2799/backend-api:v2   # anotar ID viejo si existe
minikube ssh -- docker rmi <ID-VIEJO> 2>/dev/null
minikube image load ghcr.io/romis2799/backend-api:v2
minikube ssh -- docker images ghcr.io/romis2799/backend-api:v2   # confirmar ID nuevo

# Frontend
kubectl scale deployment inventario-web -n inventario --replicas=0 2>/dev/null
sleep 3
minikube ssh -- docker images ghcr.io/romis2799/inventario-web:v2
minikube ssh -- docker rmi <ID-VIEJO> 2>/dev/null
minikube image load ghcr.io/romis2799/inventario-web:v2
minikube ssh -- docker images ghcr.io/romis2799/inventario-web:v2
```

> Si es la primera vez que se despliega en esta PC (namespace/deployments no existen todavía), el `kubectl scale` va a fallar con "not found" — normal, seguir igual con el resto de los pasos.

---

## 13. Aplicar los manifiestos (orden completo)

```bash
cd ~/EGI

kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/rbac/
kubectl apply -f k8s/configmaps/app-config.yaml
kubectl apply -f k8s/secrets/backend-secret.yaml
kubectl apply -f k8s/secrets/mongo-secret.yaml
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/services/
```

### Asegurar `imagePullPolicy: IfNotPresent` en ambos deployments:
```bash
kubectl patch deployment backend-api -n inventario -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend-api","imagePullPolicy":"IfNotPresent"}]}}}}'
kubectl patch deployment inventario-web -n inventario -p '{"spec":{"template":{"spec":{"containers":[{"name":"inventario-web","imagePullPolicy":"IfNotPresent"}]}}}}'
```

### Re-escalar a 1 si se habían bajado a 0 en el paso 12:
```bash
kubectl scale deployment backend-api -n inventario --replicas=1
kubectl scale deployment inventario-web -n inventario --replicas=1
```

### Esperar y verificar:
```bash
sleep 20
kubectl get pods -n inventario
```

Los 3 pods (`backend-api`, `inventario-db`, `inventario-web`) deben estar `1/1 Running` sin reinicios constantes.

### Recién al final, las NetworkPolicies:
```bash
kubectl apply -f k8s/networkpolicies/
```

> Si existe el archivo `k8s/networkpolicies/allow-dns-egress.yaml` (regla de egress a DNS puerto 53), confirmar que esté incluido en la carpeta antes de aplicar — sin él, los pods pierden la capacidad de resolverse por nombre entre sí.

---

## 14. Probar antes de la demo

```bash
curl -s http://$(minikube ip):30001/api/auth/login \
  -d '{"username":"usr.admin","password":"<PASSWORD_ITU>"}' \
  -H "Content-Type: application/json"
```

Debe devolver un JSON con `roles`, `token` y `username`. Si da error, revisar `kubectl logs -n inventario -l app=backend-api --tail=100` antes de seguir.

Después, abrir en el navegador **de la VM Ubuntu**:
```
http://<IP-de-minikube>:30000
```

Probar login con `usr.admin`, `usr.lector` o `usr.editor` (contraseña `<PASSWORD_ITU>` para todos), y confirmar que el listado de equipos cargue sin el error *"No se pudieron cargar los equipos"*.

> Si aparece ese error específico, revisar en SSMS que la columna `edificio` de la tabla `ubicaciones` tenga los valores `SEDE_CENTRAL` / `CAMPUS_TIC` (no `Edificio A/B/C` ni ningún otro string que no coincida exactamente con el enum Java).

---

## 15. Checklist rápido (para imprimir o tener a mano el día de la demo)

```
[ ] VMs importadas: pfSense, DC, SQL, Ubuntu
[ ] Nombre de Red Interna coincide en las 4 VMs
[ ] Sin adaptador NAT espurio en DC/SQL
[ ] Firewall ICMPv4 habilitado en DC y SQL
[ ] Orden de arranque: pfSense → DC → SQL → Ubuntu
[ ] AD DS + DNS corriendo en el DC
[ ] Servicio SQL Server (ITULAB) corriendo
[ ] ping 10.10.10.10 OK
[ ] nc -vz 10.10.10.20 1433 OK
[ ] nc -vz 10.10.10.10 389 OK
[ ] ping 8.8.8.8 OK (internet por NAT)
[ ] minikube status → Running
[ ] kubectl get nodes → Ready
[ ] kubectl get pods -n kube-system | grep calico → 1/1 Running
[ ] minikube ip anotada y comparada con la última usada
[ ] Si cambió la IP: .env del frontend y SecurityConfig.java actualizados + rebuild
[ ] application.yaml existe (no solo .example)
[ ] Secrets backend-secret.yaml y mongo-secret.yaml creados
[ ] kubectl get pods -n inventario → los 3 en 1/1 Running
[ ] curl de login devuelve JWT
[ ] Login + listado de equipos funciona en el navegador
[ ] NetworkPolicies aplicadas (incluyendo allow-dns-egress) y todo sigue funcionando
```
