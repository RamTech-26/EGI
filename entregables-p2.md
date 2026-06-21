# Entregables P2 — Franco
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88. El proyecto usa **SQL Authentication** (login `app_inventario`) y **LDAP simple bind** (puerto 389).

---

## VMs y Red

| Servicio       | IP           | Puerto | Notas                        |
|----------------|--------------|--------|------------------------------|
| DC (AD/DNS)    | 10.10.10.10  | 389    | LDAP sin TLS                 |
| SQL Server     | 10.10.10.20  | 1433   | Instancia ITULAB             |
| Gateway pfSense| 10.10.10.254 | —      | GUI: http://10.10.10.254     |
| WAN pfSense    | DHCP dinámico| —      | Verificar al iniciar el lab  |

> ⚠️ La IP WAN del pfSense cambia entre casa y el lab. P1 debe usar Kubernetes Secrets para las IPs, no hardcodearlas.

---

## Active Directory

| Campo      | Valor                      |
|------------|----------------------------|
| Dominio    | `itu.local`                |
| Base DN    | `DC=itu,DC=local`          |
| Puerto     | **389** (NO usar 636)      |
| Bind user (lectura)  | `svc_backend@itu.local` |
| Bind user (escritura)| `svc_admin@itu.local`   |
| Contraseña | `Itu12345!`                |

> ⚠️ **Pendiente de verificar:** confirmar que `svc_backend` y `svc_admin` existen en AD y que `svc_admin` tiene permiso delegado para modificar el atributo `member` de los grupos `GRP_*`.

---

## SQL Server

| Campo          | Valor                                                                                      |
|----------------|--------------------------------------------------------------------------------------------|
| Host           | `10.10.10.20`                                                                              |
| Puerto         | `1433`                                                                                     |
| Instancia      | `SERVIDOR-IIS-SQL\ITULAB`                                                                  |
| Base de datos  | `InventarioITU`                                                                            |
| Usuario app    | `app_inventario`                                                                           |
| Contraseña     | `Itu12345!`                                                                                |
| Cadena conexión| `jdbc:sqlserver://10.10.10.20:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true` |

Los grupos AD ya están mapeados como logins de SQL Server con sus roles correspondientes:

| Login SQL              | Rol asignado     |
|-------------------------|------------------|
| `ITU\GRP_LECTOR`        | `db_datareader`  |
| `ITU\GRP_EDITOR`        | `db_datawriter`  |
| `ITU\GRP_ADMINISTRADOR` | `db_owner`       |

---

## Para P1 (Kubernetes) — Actualizar Endpoints

En `k8s/services/sqlserver-service.yaml` y `k8s/services/ldap-service.yaml`, reemplazar `0.0.0.0` con las IPs reales:

```yaml
# sqlserver-service.yaml
- ip: 10.10.10.20   # SQL Server

# ldap-service.yaml  
- ip: 10.10.10.10   # DC / Active Directory
```

> ⚠️ El puerto LDAP en `ldap-service.yaml` debe ser **389**, no 636.

---

## Para P3 (Backend SQL)

Usar la cadena de conexión:
```
jdbc:sqlserver://10.10.10.20:1433;databaseName=InventarioITU;encrypt=false;trustServerCertificate=true
username: app_inventario
password: Itu12345!
```

Para LDAP:
```
spring.ldap.username: svc_backend@itu.local
spring.ldap.password: Itu12345!
spring.ldap-admin.username: svc_admin@itu.local
spring.ldap-admin.password: Itu12345!
```

Las tablas (`ubicaciones`, `responsables`, `equipos`) son creadas automáticamente por Hibernate con `ddl-auto: update`.

---

## Reglas de Firewall abiertas en las VMs

| VM              | Puerto | Protocolo | Estado     |
|-----------------|--------|-----------|------------|
| SERVIDOR-IIS-SQL| 1433   | TCP       | ✅ Abierto |
| DC (Servidor)   | 389    | TCP       | ✅ Abierto |
| DC (Servidor)   | 3389   | TCP       | ✅ Abierto (RDP) |

## NAT pfSense configurado

| Descripción  | Puerto WAN | IP destino   | Puerto destino |
|--------------|------------|--------------|----------------|
| RDP al DC    | 3389       | 10.10.10.10  | 3389           |
| RDP al SQL   | 3390       | 10.10.10.20  | 3389           |
| LDAP (AD)    | 389        | 10.10.10.10  | 389            |
| SQL Server   | 1433       | 10.10.10.20  | 1433           |