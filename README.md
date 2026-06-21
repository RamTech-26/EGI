# P2 — Bases de Datos y VMs Externas
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**  
Responsable: Franco (P2)  
Rama: `feature/vms-sql-ad`

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88 (la rama `feature/backend-api-kerberos` fue abandonada). El proyecto usa **SQL Authentication** (login `app_inventario`) para SQL Server y **LDAP simple bind** (puerto 389) para autenticación de usuarios y operaciones de administración.

---

## 📋 Resumen

Esta rama contiene la documentación y scripts de configuración de las dos VMs externas al clúster Kubernetes que proveen:
- **SQL Server 2022 Express** → almacena ubicaciones, responsables y equipos
- **Active Directory / LDAP** → autenticación centralizada de usuarios

Estas VMs corren en **VirtualBox** y se conectan al clúster Minikube (K8s) a través de Services sin selector + Endpoints configurados por P1.

---

## 🖥️ Infraestructura de VMs

### Red interna: `LAN-SERVER` (`10.10.10.0/24`)

| VM | Rol | IP | SO |
|---|---|---|---|
| pfSense-Gateway | Router/Firewall | `10.10.10.254` (LAN) | pfSense 2.8.1 |
| Servidor (DC) | Domain Controller, DNS, DHCP | `10.10.10.10` | Windows Server 2019 |
| SERVIDOR-IIS-SQL | SQL Server, IIS | `10.10.10.20` | Windows Server 2019 |

### Acceso remoto (RDP) desde la PC física

El pfSense tiene NAT configurado para acceder a las VMs desde fuera:

| Destino | IP WAN pfSense | Puerto externo | Puerto interno |
|---|---|---|---|
| RDP al DC | `<IP-WAN-pfSense>` | 3389 | 3389 → 10.10.10.10 |
| RDP al SQL | `<IP-WAN-pfSense>` | 3390 | 3389 → 10.10.10.20 |
| LDAP (AD) | `<IP-WAN-pfSense>` | 389 | 389 → 10.10.10.10 |
| SQL Server | `<IP-WAN-pfSense>` | 1433 | 1433 → 10.10.10.20 |

> ⚠️ La IP WAN del pfSense es dinámica (DHCP). Verificar al iniciar el lab con la consola de pfSense.  
> En casa actual: `192.168.1.49`. En el lab de la universidad puede cambiar.

---

## 🗄️ SQL Server

### Instancia
```
Host:      10.10.10.20
Puerto:    1433
Instancia: SERVIDOR-IIS-SQL\ITULAB
BD:        InventarioITU
```

### Credenciales de la aplicación
```
Usuario:    app_inventario
Contraseña: Itu12345!
Rol:        db_owner en InventarioITU
```

### Cadena de conexión (para P3 — backend-sql)
```
jdbc:sqlserver://10.10.10.20:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true
```

### Logins de grupos AD en SQL Server

Los grupos de Active Directory están mapeados como logins de Windows en SQL Server, con roles asignados según el principio de menor privilegio:

| Login SQL                | Rol asignado     |
|----------------------------|------------------|
| `ITU\GRP_LECTOR`          | `db_datareader`  |
| `ITU\GRP_EDITOR`          | `db_datawriter`  |
| `ITU\GRP_ADMINISTRADOR`   | `db_owner`       |

Esto permite, además del control de acceso vía backend, demostrar en SSMS las restricciones reales de cada usuario de AD a nivel de motor de base de datos.

### Esquema de tablas
Las tablas son **creadas automáticamente por Hibernate** (`ddl-auto: update`) al iniciar el backend. No crear manualmente.

```
ubicaciones    → id, edificio, area (AULA|LABORATORIO|SECRETARIA)
responsables   → id, nombre, apellido, email, telefono
equipos        → id, codigo, fechaAdquisicion, ubicacion_id (FK), responsable_id (FK)
```

El script `ubicacion-db/init.sql` contiene la creación de la BD, el login SQL y datos de prueba comentados.

---

## 🔐 Active Directory

### Dominio
```
Dominio:  itu.local
FQDN DC:  Servidor.itu.local
Base DN:  DC=itu,DC=local
Puerto:   389 (LDAP sin TLS — NO usar 636)
```

### Grupos y roles
| Grupo AD | Rol en la app |
|---|---|
| `GRP_LECTOR` | LECTOR |
| `GRP_EDITOR` | EDITOR |
| `GRP_ADMINISTRADOR` | ADMINISTRADOR |

### Usuarios de prueba

El sistema tiene 3 roles definidos por el enunciado (LECTOR, EDITOR, ADMINISTRADOR).  
Para que el backend pueda probar la autenticación LDAP y la autorización por rol  
sin depender de cuentas reales de la universidad, se crean estos usuarios en AD:

| Usuario | Grupo | Contraseña | Para probar... |
|---|---|---|---|
| `usr.lector` | GRP_LECTOR | `Itu12345!` | Login con rol solo lectura |
| `usr.editor` | GRP_EDITOR | `Itu12345!` | Login con rol edición |
| `usr.admin` | GRP_ADMINISTRADOR | `Itu12345!` | Login con rol administrador |

Cuando el backend recibe un login, consulta AD vía LDAP, verifica la contraseña  
y lee el grupo del usuario para asignarle el rol correspondiente en el JWT.  
Estos usuarios simulan un profesor (lector), técnico (editor) y administrador real.

### Cuentas de servicio
| Usuario | Propósito | Contraseña |
|---|---|---|
| `svc_backend` | Bind LDAP de lectura — login y consulta de grupos | `Itu12345!` |
| `svc_admin` | Bind LDAP de escritura — cambio de grupo de usuarios | `Itu12345!` |
| `svc-mongo` | MongoDB — LDAP auth | `Itu12345!` |

> ⚠️ **Pendiente de verificar:** confirmar que `svc_backend` existe en AD con ese nombre exacto, y que `svc_admin` tiene permiso delegado para modificar el atributo `member` de los grupos `GRP_*` (necesario para el endpoint de cambio de grupo desde la app).

Bind user para queries LDAP desde el backend (lectura):
```
svc_backend@itu.local / Itu12345!
```

Bind user para operaciones de administración (escritura, cambio de grupo):
```
svc_admin@itu.local / Itu12345!
```

Atributo de login: `sAMAccountName` (ej: `usr.lector`)

---

## 🔧 Firewall — Puertos abiertos en las VMs

| VM | Puerto | Protocolo | Propósito |
|---|---|---|---|
| SERVIDOR-IIS-SQL | 1433 | TCP | SQL Server |
| DC (Servidor) | 389 | TCP | LDAP |
| DC (Servidor) | 3389 | TCP | RDP |

---

## 🔗 Integración con Kubernetes (para P1)

P1 debe actualizar los archivos `k8s/services/sqlserver-service.yaml` y `k8s/services/ldap-service.yaml` reemplazando `0.0.0.0` con las IPs reales:

```yaml
# sqlserver-service.yaml — Endpoints
- ip: 10.10.10.20

# ldap-service.yaml — Endpoints
- ip: 10.10.10.10
```

> ⚠️ El puerto en `ldap-service.yaml` debe ser **389**, no 636.

---

## 🚀 Despliegue en otra computadora

Si el proyecto se mueve a otra PC (casa de otro integrante, lab de la universidad, etc.), estos son los cambios necesarios:

### 1. Red interna de VirtualBox
La red `LAN-SERVER` (`10.10.10.0/24`) es interna a VirtualBox — **no cambia** al mover las VMs a otra PC. Las IPs `10.10.10.10`, `10.10.10.20` y `10.10.10.254` se mantienen siempre.

### 2. IP WAN del pfSense
Esta **sí cambia** porque es DHCP de la red de la nueva PC. Para saber cuál es:
- Abrir la consola del pfSense en VirtualBox
- Leer la línea `WAN (wan) → em0 → v4/DHCP4: xxx.xxx.xxx.xxx`

### 3. Archivos que deben actualizarse

| Archivo | Campo a cambiar | Valor actual | Nuevo valor |
|---|---|---|---|
| Kubernetes Secret / env | `SQLSERVER_HOST` | `10.10.10.20` | No cambia |
| Kubernetes Secret / env | `LDAP_HOST` | `10.10.10.10` | No cambia |
| Conexión RDP | IP de destino | `192.168.1.49` | Nueva IP WAN |
| pfSense NAT | IP WAN | Automático (DHCP) | Automático |

> Las IPs internas (`10.10.10.x`) **nunca cambian**. Solo cambia la IP WAN del pfSense, y esa solo importa para RDP desde la PC física — no afecta al funcionamiento del proyecto en Kubernetes.

### 4. Pasos para levantar el entorno en una nueva PC

1. Importar las VMs `.ova` en VirtualBox
2. Iniciar pfSense → verificar IP WAN en consola
3. Iniciar el DC (Servidor) → verificar que AD DS y DNS estén corriendo
4. Iniciar SERVIDOR-IIS-SQL → verificar SQL Server con SSMS
5. Iniciar Minikube: `minikube start --cni=calico`
6. Aplicar manifiestos: `kubectl apply -f k8s/`
7. Verificar conectividad: desde un pod del namespace `inventario`, hacer `telnet 10.10.10.20 1433`

### 5. Variables de entorno / Secrets de Kubernetes

Nunca hardcodear IPs en el código. Usar Secrets:

```yaml
# k8s/secrets/sqlserver-secret.yaml (ejemplo)
apiVersion: v1
kind: Secret
metadata:
  name: sqlserver-secret
  namespace: inventario
type: Opaque
stringData:
  host: "10.10.10.20"
  port: "1433"
  database: "InventarioITU"
  username: "app_inventario"
  password: "Itu12345!"
```

---

## 📁 Estructura de esta rama

```
feature/vms-sql-ad/
├── ubicacion-db/
│   └── init.sql              ← Script de creación de BD y usuario SQL
├── active-directory/
│   └── usuarios-ad.md        ← Documentación de grupos, usuarios y cuentas de servicio
└── entregables-p2.md         ← Resumen de datos para el equipo
```

---

## 📞 Contacto con otras ramas

| Rama | Responsable | Qué necesita de P2 |
|---|---|---|
| `feature/infra-k8s` | P1 | IPs 10.10.10.10 y 10.10.10.20 para Endpoints, corrección puerto LDAP a 389 |
| `feature/backend-sql` | Matías (P3) | Cadena de conexión SQL Server, credenciales `app_inventario`, credenciales `svc_backend`/`svc_admin` para LDAP |