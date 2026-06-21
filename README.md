# P2 — Bases de Datos y VMs Externas
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**
Responsable: Franco (P2)
Rama: `feature/vms-sql-ad`

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88 (la rama `feature/backend-api-kerberos` fue abandonada). El proyecto usa **SQL Authentication** (login `app_inventario`) para SQL Server y **LDAP simple bind** (puerto 389) para autenticación de usuarios y operaciones de administración. El backend se unificó en un solo servicio Spring Boot (rama `prueba-integracion-matias`) que habla con SQL Server, LDAP y MongoDB.

---

## Resumen

Esta rama contiene la documentación y scripts de configuración de las dos VMs externas al clúster Kubernetes que proveen:
- **SQL Server 2022 Express** — almacena ubicaciones, responsables y equipos
- **Active Directory / LDAP** — autenticación centralizada de usuarios

Estas VMs corren en **VirtualBox** y se conectan al clúster Minikube (K8s) a través de Services sin selector + Endpoints configurados por P1.

---

## Infraestructura de VMs

### Red interna: `LAN-SERVER` (`10.10.10.0/24`)

| VM | Rol | IP | SO |
|---|---|---|---|
| pfSense-Gateway | Router/Firewall | `10.10.10.254` (LAN) | pfSense 2.8.1 |
| Servidor (DC) | Domain Controller, DNS, DHCP | `10.10.10.10` | Windows Server 2019 |
| SERVIDOR-IIS-SQL | SQL Server, IIS | `10.10.10.20` | Windows Server 2019 |

### Decisión de red: NAT (no Bridge)

Se evaluó migrar a modo Bridge — sugerencia del profesor para simplificar la conectividad entre la PC física y las VMs — pero se decidió mantener NAT por dos motivos:

1. Bridge complicaba sostener a pfSense como firewall perimetral real frente a las VMs (uno de los requisitos de la consigna es usar pfSense/GUFW como firewall).
2. El NAT ya estaba funcionando y documentado de punta a punta. El problema real que parecía "de red" era que el `application.yaml` del backend apuntaba a la IP interna (`10.10.10.20`) en vez de la IP WAN de pfSense, corregido sin necesidad de tocar el modo de red.

### Acceso remoto (RDP) desde la PC física

El pfSense tiene NAT configurado para acceder a las VMs desde fuera:

| Destino | IP WAN pfSense | Puerto externo | Puerto interno |
|---|---|---|---|
| RDP al DC | `<IP-WAN-pfSense>` | 3389 | 3389 a 10.10.10.10 |
| RDP al SQL | `<IP-WAN-pfSense>` | 3390 | 3389 a 10.10.10.20 |
| LDAP (AD) | `<IP-WAN-pfSense>` | 389 | 389 a 10.10.10.10 |
| SQL Server | `<IP-WAN-pfSense>` | 1433 | 1433 a 10.10.10.20 |

> Nota: la IP WAN del pfSense es dinámica (DHCP). Verificar al iniciar el lab desde la consola web de pfSense (Status, Interfaces) — no asumir que sigue siendo la misma sesión a sesión (última conocida en casa: `192.168.1.49`).
> En la interfaz WAN de pfSense, "Block private networks" y "Block bogon networks" deben estar destildados.

---

## SQL Server

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

### Cadena de conexión (backend unificado, rama `prueba-integracion-matias`)
```
jdbc:sqlserver://<IP-WAN-pfSense>:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true
```
> Nota: el `application.yaml` apunta a la IP WAN de pfSense, no a `10.10.10.20` directamente, salvo que el backend corra dentro de la red interna.

### Logins de grupos AD en SQL Server

Los grupos de Active Directory se agregaron como logins de Windows en SSMS (Seguridad, Inicios de sesión, clic derecho, Nuevo inicio de sesión, tipo de autenticación de Windows), con roles asignados manualmente según el principio de menor privilegio:

| Login SQL | Rol asignado |
|---|---|
| `ITU\GRP_LECTOR` | `db_datareader` |
| `ITU\GRP_EDITOR` | `db_datareader` + `db_datawriter` |
| `ITU\GRP_ADMINISTRADOR` | `db_owner` |

Los roles de base de datos se asignaron desde las Propiedades de cada login, en la página "Asignación de usuarios", marcando la base `InventarioITU` y tildando los roles correspondientes en el panel inferior.

Esto permite, además del control de acceso vía backend, demostrar en SSMS las restricciones reales de cada usuario de AD a nivel de motor de base de datos.

### Esquema y datos

Las tablas son creadas automáticamente por Hibernate (`ddl-auto: update`) al iniciar el backend. No crear manualmente.

```
ubicaciones    -> id, edificio, area (AULA|LABORATORIO|SECRETARIA)
responsables   -> id, nombre, apellido, email, telefono
equipos        -> id, codigo, fechaAdquisicion, ubicacion_id (FK), responsable_id (FK)
```

Siguiendo el requisito del profesor de tener dos scripts por base de datos (esquema vacío + carga de datos), `ubicacion-db/init.sql` se reemplazó por:

```
ubicacion-db/
├── 01_init_schema.sql   <- Creación de la BD InventarioITU + login app_inventario + logins de grupos AD
└── 02_seed_data.sql     <- Carga de datos de prueba (ubicaciones, responsables, equipos)
```

Datos de seed ya cargados en `InventarioITU` (insertados manualmente desde SSMS, abriendo una Nueva consulta y editando filas en la grilla de resultados): 3 ubicaciones, 3 responsables, 6 equipos (`PC-01`, `PC-02`, `PC-03`, `NB-01`, `NB-02`, `NB-03`). Estos códigos coinciden exactamente con los `_id` de los documentos en MongoDB, para que el join entre ambas bases funcione.

> Nota: los IDs de `ubicaciones` y `responsables` arrancan en `0` (no en `1`). Tenerlo en cuenta si alguien recrea el seed manualmente.

---

## Active Directory

### Dominio
```
Dominio:  itu.local
FQDN DC:  Servidor.itu.local
Base DN:  DC=itu,DC=local
Puerto:   389 (LDAP sin TLS, NO usar 636)
```

### Estructura de OUs

Se migró de la OU genérica `CN=Users` a una estructura propia bajo `OU=EGI`, creada manualmente desde la consola Usuarios y equipos de Active Directory:

```
DC=itu,DC=local
└── OU=EGI
    ├── OU=Usuarios   (usuarios de prueba + cuentas de servicio)
    └── OU=Grupos     (los 3 grupos de rol)
```

Detalle completo de usuarios, grupos y pasos de creación en `active-directory/usuarios-ad.md`.

### Grupos y roles
| Grupo AD | Rol en la app |
|---|---|
| `GRP_LECTOR` | LECTOR |
| `GRP_EDITOR` | EDITOR |
| `GRP_ADMINISTRADOR` | ADMINISTRADOR |

### Usuarios de prueba

| Usuario | Grupo | Contraseña | Para probar... |
|---|---|---|---|
| `usr.lector` | GRP_LECTOR | `Itu12345!` | Login con rol solo lectura |
| `usr.editor` | GRP_EDITOR | `Itu12345!` | Login con rol edición |
| `usr.admin` | GRP_ADMINISTRADOR | `Itu12345!` | Login con rol administrador |

Cuando el backend recibe un login, consulta AD vía LDAP, verifica la contraseña y lee el grupo del usuario para asignarle el rol correspondiente en el JWT.

### Cuentas de servicio
| Usuario | Propósito | Contraseña |
|---|---|---|
| `svc_backend` | Bind LDAP de lectura, login y consulta de grupos | `Itu12345!` |
| `svc_admin` | Bind LDAP de escritura, cambio de grupo de usuarios | `Itu12345!` |
| `svc-mongo` | MongoDB, LDAP auth | `Itu12345!` |

Confirmado: `svc_backend` y `svc_admin` existen en `OU=Usuarios,OU=EGI,DC=itu,DC=local`, y `svc_admin` tiene permiso delegado sobre el atributo `member` de los 3 grupos `GRP_*` (otorgado manualmente con el Asistente de delegación de control), necesario para el endpoint de cambio de grupo desde la app.

Atributo de login: `sAMAccountName` (ej: `usr.lector`)

---

## Firewall — Puertos abiertos en las VMs

| VM | Puerto | Protocolo | Propósito |
|---|---|---|---|
| SERVIDOR-IIS-SQL | 1433 | TCP | SQL Server |
| DC (Servidor) | 389 | TCP | LDAP |
| DC (Servidor) | 3389 | TCP | RDP |

---

## Integración con Kubernetes (para P1)

P1 debe actualizar los archivos `k8s/services/sqlserver-service.yaml` y `k8s/services/ldap-service.yaml` reemplazando `0.0.0.0` con las IPs reales:

```yaml
# sqlserver-service.yaml - Endpoints
- ip: 10.10.10.20

# ldap-service.yaml - Endpoints
- ip: 10.10.10.10
```

> Nota: el puerto en `ldap-service.yaml` debe ser 389, no 636.
> Bug detectado en `ldap-service.yaml`: typo `Cluster0IP` debería ser `ClusterIP`, reportado a Romina.

---

## Despliegue en otra computadora

Si el proyecto se mueve a otra PC (casa de otro integrante, lab de la universidad, etc.), estos son los cambios necesarios:

### 1. Red interna de VirtualBox
La red `LAN-SERVER` (`10.10.10.0/24`) es interna a VirtualBox, no cambia al mover las VMs a otra PC. Las IPs `10.10.10.10`, `10.10.10.20` y `10.10.10.254` se mantienen siempre.

### 2. IP WAN del pfSense
Esta sí cambia porque es DHCP de la red de la nueva PC. Para saber cuál es:
- Abrir la consola del pfSense en VirtualBox
- Leer la línea `WAN (wan) -> em0 -> v4/DHCP4: xxx.xxx.xxx.xxx`

### 3. Archivos que deben actualizarse

| Archivo | Campo a cambiar | Valor actual | Nuevo valor |
|---|---|---|---|
| Kubernetes Secret / env | `SQLSERVER_HOST` | `10.10.10.20` | No cambia |
| Kubernetes Secret / env | `LDAP_HOST` | `10.10.10.10` | No cambia |
| `application.yaml` (local, no commiteado) | `datasource.url`, `ldap.urls`, `ldap-admin.urls` | IP WAN actual | Nueva IP WAN |
| Conexión RDP | IP de destino | IP WAN actual | Nueva IP WAN |
| pfSense NAT | IP WAN | Automático (DHCP) | Automático |

> Las IPs internas (`10.10.10.x`) nunca cambian. La IP WAN del pfSense cambia entre sesiones y afecta tanto al RDP como a la cadena de conexión del backend, porque el backend corre fuera de la red interna.

### 4. Pasos para levantar el entorno en una nueva PC

1. Importar las VMs `.ova` en VirtualBox
2. Iniciar pfSense, verificar IP WAN en consola
3. Iniciar el DC (Servidor), verificar que AD DS y DNS estén corriendo, y revisar firewall ICMPv4 entrante (ver nota de bugs recurrentes abajo)
4. Iniciar SERVIDOR-IIS-SQL, verificar SQL Server con SSMS, revisar también el segundo adaptador NAT espurio y el firewall ICMPv4
5. Iniciar Minikube
6. Aplicar manifiestos: `kubectl apply -f k8s/`
7. Verificar conectividad: desde un pod del namespace `inventario`, hacer `telnet 10.10.10.20 1433`

### Bugs recurrentes a vigilar al reiniciar VMs
- **Segundo adaptador NAT**: en DC/SQL puede aparecer un segundo adaptador NAT en VirtualBox que inyecta una IP espuria y rompe la resolución de red interna. Se corrige entrando a Configuración de la VM, Red, y deshabilitando el adaptador sobrante.
- **Firewall ICMPv4 bloqueado tras reinicio**: se corrige abriendo el Firewall de Windows con seguridad avanzada desde el Panel de control, y habilitando manualmente las reglas de entrada de tipo "Eco de solicitud ICMPv4" que aparezcan deshabilitadas.

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

## Estructura de esta rama

```
feature/vms-sql-ad/
├── ubicacion-db/
│   ├── 01_init_schema.sql    <- Creación de BD, login SQL y logins de grupos AD
│   └── 02_seed_data.sql      <- Carga de datos de prueba
├── active-directory/
│   └── usuarios-ad.md        <- Documentación de OUs, grupos, usuarios y cuentas de servicio
└── entregables-p2.md         <- Resumen de datos para el equipo
```

---

## Contacto con otras ramas

| Rama | Responsable | Qué necesita de P2 |
|---|---|---|
| `feature/infra-k8s` | Romina (P1) | IPs 10.10.10.10 y 10.10.10.20 para Endpoints, corrección puerto LDAP a 389, corrección typo `Cluster0IP` |
| `prueba-integracion-matias` | Matías (P3) | Cadena de conexión SQL Server, credenciales `app_inventario`, credenciales `svc_backend`/`svc_admin` para LDAP (secciones `ldap` y `ldap-admin` del `application.yaml`) |
