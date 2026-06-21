# Active Directory — Documentación de Usuarios y Grupos
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**  
Responsable: Franco (P2) — Bases de Datos y VMs Externas

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88. El proyecto usa **SQL Authentication** (login `app_inventario`) para la conexión a SQL Server, y **LDAP simple bind** (puerto 389) para la autenticación de usuarios y operaciones de administración contra AD.

---

## Dominio

| Campo     | Valor                        |
|-----------|------------------------------|
| Dominio   | `itu.local`                  |
| FQDN DC   | `Servidor.itu.local`         |
| Base DN   | `DC=itu,DC=local`            |
| OU        | `CN=Users,DC=itu,DC=local`   |
| Puerto    | **389 (LDAP sin TLS)**       |

> ⚠️ Se usa LDAP (puerto 389), NO LDAPS (636). Confirmado por el profesor.

---

## Grupos de Roles

| Grupo AD            | Rol en la aplicación | Descripción                              |
|---------------------|----------------------|------------------------------------------|
| `GRP_LECTOR`        | LECTOR               | Solo lectura del inventario              |
| `GRP_EDITOR`        | EDITOR               | Puede crear y modificar equipos          |
| `GRP_ADMINISTRADOR` | ADMINISTRADOR        | Acceso total, gestión de usuarios        |

### Comandos de creación (PowerShell en el DC)

```powershell
New-ADGroup -Name "GRP_LECTOR"        -GroupScope Global -GroupCategory Security
New-ADGroup -Name "GRP_EDITOR"        -GroupScope Global -GroupCategory Security
New-ADGroup -Name "GRP_ADMINISTRADOR" -GroupScope Global -GroupCategory Security
```

---

## Cuentas de Servicio

| Usuario         | Propósito                                              | Contraseña  |
|-----------------|---------------------------------------------------------|-------------|
| `svc_backend`   | Bind LDAP de **lectura** — login y consulta de grupos    | `Itu12345!` |
| `svc_admin`     | Bind LDAP de **escritura** — cambio de grupo de usuarios | `Itu12345!` |
| `svc-mongo`     | MongoDB — LDAP auth                                      | `Itu12345!` |

> ⚠️ **Pendiente de verificar:** confirmar que `svc_backend` existe en AD con el nombre exacto que usa el backend (`application.yaml` → `spring.ldap.username`), y que `svc_admin` tiene permiso delegado para modificar el atributo `member` de los grupos `GRP_*` (necesario para el endpoint de cambio de grupo).

### Comandos de creación

```powershell
New-ADUser -Name "svc_backend" -SamAccountName "svc_backend" `
    -UserPrincipalName "svc_backend@itu.local" `
    -AccountPassword (ConvertTo-SecureString "Itu12345!" -AsPlainText -Force) `
    -PasswordNeverExpires $true -Enabled $true

New-ADUser -Name "svc_admin" -SamAccountName "svc_admin" `
    -UserPrincipalName "svc_admin@itu.local" `
    -AccountPassword (ConvertTo-SecureString "Itu12345!" -AsPlainText -Force) `
    -PasswordNeverExpires $true -Enabled $true

New-ADUser -Name "svc-mongo" -SamAccountName "svc-mongo" `
    -UserPrincipalName "svc-mongo@itu.local" `
    -AccountPassword (ConvertTo-SecureString "Itu12345!" -AsPlainText -Force) `
    -PasswordNeverExpires $true -Enabled $true
```

---

## Usuarios de Prueba

| Usuario      | Grupo               | Contraseña  |
|--------------|---------------------|-------------|
| `usr.lector` | `GRP_LECTOR`        | `Itu12345!` |
| `usr.editor` | `GRP_EDITOR`        | `Itu12345!` |
| `usr.admin`  | `GRP_ADMINISTRADOR` | `Itu12345!` |

### Comandos de creación

```powershell
$pass = ConvertTo-SecureString "Itu12345!" -AsPlainText -Force

New-ADUser -Name "usr.lector" -SamAccountName "usr.lector" `
    -UserPrincipalName "usr.lector@itu.local" `
    -AccountPassword $pass -PasswordNeverExpires $true -Enabled $true

New-ADUser -Name "usr.editor" -SamAccountName "usr.editor" `
    -UserPrincipalName "usr.editor@itu.local" `
    -AccountPassword $pass -PasswordNeverExpires $true -Enabled $true

New-ADUser -Name "usr.admin" -SamAccountName "usr.admin" `
    -UserPrincipalName "usr.admin@itu.local" `
    -AccountPassword $pass -PasswordNeverExpires $true -Enabled $true

Add-ADGroupMember -Identity "GRP_LECTOR"        -Members "usr.lector"
Add-ADGroupMember -Identity "GRP_EDITOR"        -Members "usr.editor"
Add-ADGroupMember -Identity "GRP_ADMINISTRADOR" -Members "usr.admin"
```

---

## Atributo LDAP para autenticación

El backend usa `sAMAccountName` para identificar usuarios (ej: `usr.lector`).

Bind user de lectura para login y consulta de grupos:
```
svc_backend@itu.local / Itu12345!
```

Bind user de escritura para cambio de grupo (operación de administrador):
```
svc_admin@itu.local / Itu12345!
```