# Entregables P2 — Franco
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88. El proyecto usa **SQL Authentication** (login `app_inventario`) y **LDAP simple bind** (puerto 389). El backend se unificó en un solo servicio Spring Boot, rama `prueba-integracion-matias`.

---

## VMs y Red

| Servicio | IP | Puerto | Notas |
|---|---|---|---|
| DC (AD/DNS) | 10.10.10.10 | 389 | LDAP sin TLS |
| SQL Server | 10.10.10.20 | 1433 | Instancia ITULAB |
| Gateway pfSense | 10.10.10.254 | — | GUI: http://10.10.10.254 |
| WAN pfSense | DHCP dinámico | — | Verificar al iniciar el lab |

> Nota: la IP WAN del pfSense cambia entre casa y el lab. P1 debe usar Kubernetes Secrets para las IPs internas (que no cambian); el backend, en cambio, sí necesita la IP WAN actualizada en su `application.yaml` local porque corre fuera de la red interna.

### Decisión de red: NAT (Bridge evaluado y descartado)

Se evaluó pasar a modo Bridge (sugerencia del profesor) para simplificar la conectividad PC física con las VMs, pero se decidió mantener NAT: Bridge dificultaba sostener a pfSense como firewall perimetral real (requisito de la consigna), y el NAT ya estaba funcionando de punta a punta. El problema de conectividad que parecía "de red" era en realidad el `application.yaml` apuntando a la IP interna en vez de a la IP WAN de pfSense.

---

## Active Directory

| Campo | Valor |
|---|---|
| Dominio | `itu.local` |
| Base DN | `DC=itu,DC=local` |
| OU base | `OU=EGI,DC=itu,DC=local` (con sub-OUs `Usuarios` y `Grupos`) |
| Puerto | 389 (NO usar 636) |
| Bind user (lectura) | `svc_backend@itu.local` |
| Bind user (escritura) | `svc_admin@itu.local` |
| Contraseña | `Itu12345!` |

Confirmado: `svc_backend` y `svc_admin` existen en `OU=Usuarios,OU=EGI,DC=itu,DC=local`, y `svc_admin` tiene permiso delegado sobre el atributo `member` de los 3 grupos `GRP_*` en `OU=Grupos,OU=EGI` (asignado manualmente con el Asistente de delegación de control), necesario para el endpoint `POST /api/auth/admin/agregar-grupo`.

---

## SQL Server

| Campo | Valor |
|---|---|
| Host | `10.10.10.20` |
| Puerto | `1433` |
| Instancia | `SERVIDOR-IIS-SQL\ITULAB` |
| Base de datos | `InventarioITU` |
| Usuario app | `app_inventario` |
| Contraseña | `Itu12345!` |
| Cadena conexión (desde dentro de la red interna) | `jdbc:sqlserver://10.10.10.20:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true` |
| Cadena conexión (backend, desde fuera) | `jdbc:sqlserver://<IP-WAN-pfSense>:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true` |

Los grupos AD se agregaron manualmente como logins de SQL Server desde SSMS, con roles correspondientes:

| Login SQL | Rol asignado |
|---|---|
| `ITU\GRP_LECTOR` | `db_datareader` |
| `ITU\GRP_EDITOR` | `db_datareader` + `db_datawriter` |
| `ITU\GRP_ADMINISTRADOR` | `db_owner` |

### Esquema y datos (entregable en dos scripts)

Siguiendo el requisito del profesor (esquema vacío + carga de datos por separado):

```
ubicacion-db/
├── 01_init_schema.sql   <- BD InventarioITU + login app_inventario + logins de grupos AD
└── 02_seed_data.sql     <- Datos de prueba
```

Datos ya cargados (insertados manualmente desde SSMS): 3 ubicaciones, 3 responsables, 6 equipos (`PC-01`, `PC-02`, `PC-03`, `NB-01`, `NB-02`, `NB-03`). Coinciden exactamente con los `_id` de MongoDB para que el join funcione entre las dos bases.

> Nota: los IDs de `ubicaciones`/`responsables` arrancan en `0` (no en `1`).

---

## Para Romina (P1, Kubernetes) — Actualizar Endpoints

En `k8s/services/sqlserver-service.yaml` y `k8s/services/ldap-service.yaml`, reemplazar `0.0.0.0` con las IPs reales:

```yaml
# sqlserver-service.yaml
- ip: 10.10.10.20   # SQL Server

# ldap-service.yaml
- ip: 10.10.10.10   # DC / Active Directory
```

> Nota: el puerto LDAP en `ldap-service.yaml` debe ser 389, no 636.
> Typo detectado en `ldap-service.yaml`: `Cluster0IP` debería ser `ClusterIP`.

---

## Para el Backend (rama `prueba-integracion-matias`)

Configuración SQL y LDAP en `application.yaml` (local, nunca se commitea):

```yaml
spring:
  datasource:
    url: jdbc:sqlserver://<IP-WAN-pfSense>:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true
    username: app_inventario
    password: Itu12345!
    driver-class-name: com.microsoft.sqlserver.jdbc.SQLServerDriver
  jpa:
    hibernate:
      ddl-auto: update
  ldap:
    urls: ldap://<IP-WAN-pfSense>:389
    base: dc=itu,dc=local
    username: svc_backend@itu.local
    password: Itu12345!
  ldap-admin:
    urls: ldap://<IP-WAN-pfSense>:389
    base: dc=itu,dc=local
    username: svc_admin@itu.local
    password: Itu12345!
```

Las tablas (`ubicaciones`, `responsables`, `equipos`) son creadas automáticamente por Hibernate con `ddl-auto: update`, no crearlas manualmente.

---

## Reglas de Firewall abiertas en las VMs

| VM | Puerto | Protocolo | Estado |
|---|---|---|---|
| SERVIDOR-IIS-SQL | 1433 | TCP | Abierto |
| DC (Servidor) | 389 | TCP | Abierto |
| DC (Servidor) | 3389 | TCP | Abierto (RDP) |

## NAT pfSense configurado

| Descripción | Puerto WAN | IP destino | Puerto destino |
|---|---|---|---|
| RDP al DC | 3389 | 10.10.10.10 | 3389 |
| RDP al SQL | 3390 | 10.10.10.20 | 3389 |
| LDAP (AD) | 389 | 10.10.10.10 | 389 |
| SQL Server | 1433 | 10.10.10.20 | 1433 |
