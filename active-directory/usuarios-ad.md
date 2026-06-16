# Active Directory — Documentación de Usuarios y Grupos
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**  
Responsable: Franco (P2) — Bases de Datos y VMs Externas

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

| Usuario         | Propósito                        | Contraseña  |
|-----------------|----------------------------------|-------------|
| `svc_inventario`| SQL Server — autenticación Kerberos | `Itu12345!` |
| `svc-mongo`     | MongoDB Enterprise — LDAP auth   | `Itu12345!` |

### Comandos de creación

```powershell
New-ADUser -Name "svc_inventario" -SamAccountName "svc_inventario" `
    -UserPrincipalName "svc_inventario@itu.local" `
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

## SPN Registrado (Kerberos para SQL Server)

```
MSSQLSvc/SERVIDOR-IIS-SQL.itu.local:1433
MSSQLSvc/10.10.10.20:1433
```

### Comandos de registro

```powershell
setspn -A MSSQLSvc/SERVIDOR-IIS-SQL.itu.local:1433 svc_inventario
setspn -A MSSQLSvc/10.10.10.20:1433 svc_inventario
```

### Verificación

```powershell
setspn -L svc_inventario
```

---

## Keytab

```
Ruta: C:\sqlserver.keytab  (en el DC)
```

> ⚠️ El keytab **NUNCA** debe subirse al repositorio Git.  
> Entregarlo a P1 y P3 por canal privado.

### Comando de generación

```powershell
ktpass -princ MSSQLSvc/SERVIDOR-IIS-SQL.itu.local:1433@ITU.LOCAL `
    -mapuser svc_inventario@ITU.LOCAL -crypto ALL `
    -ptype KRB5_NT_PRINCIPAL -pass Itu12345! `
    -out C:\sqlserver.keytab
```

---

## Atributo LDAP para autenticación

El backend usa `sAMAccountName` para identificar usuarios (ej: `usr.lector`).

Bind user para queries LDAP:
```
svc-mongo@itu.local / Itu12345!
```
