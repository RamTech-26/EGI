# Active Directory — Documentación de Usuarios y Grupos
**Proyecto Integrador EGI — Ecosistema de Inventario Seguro**
Responsable: Franco (P2) — Bases de Datos y VMs Externas

> **Nota de versión:** Se descartó la autenticación SQL vía Kerberos por errores persistentes de `PortUnreachableException` en UDP/88. El proyecto usa **SQL Authentication** (login `app_inventario`) para la conexión a SQL Server, y **LDAP simple bind** (puerto 389) para la autenticación de usuarios y operaciones de administración contra AD.

---

## Dominio

| Campo | Valor |
|---|---|
| Dominio | `itu.local` |
| FQDN DC | `Servidor.itu.local` |
| Base DN | `DC=itu,DC=local` |
| Puerto | 389 (LDAP sin TLS) |

> Nota: se usa LDAP (puerto 389), NO LDAPS (636). Confirmado por el profesor.

---

## Estructura de OUs

Se migró de la OU genérica por defecto (`CN=Users,DC=itu,DC=local`) a una estructura propia, porque el backend (rama `prueba-integracion-matias`) hardcodea esta ruta y porque es mejor práctica que usar el contenedor default.

Creación manual desde la consola Usuarios y equipos de Active Directory (`dsa.msc`):

1. Clic derecho sobre el dominio `itu.local`, Nuevo, Unidad organizativa, nombre `EGI`
2. Clic derecho sobre `OU=EGI`, Nuevo, Unidad organizativa, nombre `Usuarios`
3. Clic derecho sobre `OU=EGI`, Nuevo, Unidad organizativa, nombre `Grupos`

Estructura resultante:

```
DC=itu,DC=local
└── OU=EGI
    ├── OU=Usuarios   (usuarios de prueba + cuentas de servicio)
    └── OU=Grupos     (los 3 grupos de rol)
```

> Nota: si al crear la OU queda tildada la opción "Proteger contenedor contra eliminación accidental", destildarla si se necesita borrar y recrear durante pruebas.
> Nota: `svc-mongo` no se migró a esta estructura, queda en su ubicación original. No es crítico para la entrega.

---

## Grupos de Roles

| Grupo AD | Rol en la aplicación | Descripción |
|---|---|---|
| `GRP_LECTOR` | LECTOR | Solo lectura del inventario |
| `GRP_EDITOR` | EDITOR | Puede crear y modificar equipos |
| `GRP_ADMINISTRADOR` | ADMINISTRADOR | Acceso total, gestión de usuarios |

Ubicación: `OU=Grupos,OU=EGI,DC=itu,DC=local`

### Creación (consola Usuarios y equipos de Active Directory)

Para cada grupo, sobre `OU=Grupos`: clic derecho, Nuevo, Grupo. En el diálogo:
- Nombre de grupo: `GRP_LECTOR` / `GRP_EDITOR` / `GRP_ADMINISTRADOR`
- Ámbito de grupo: Global
- Tipo de grupo: Seguridad

---

## Cuentas de Servicio

| Usuario | Propósito | Contraseña |
|---|---|---|
| `svc_backend` | Bind LDAP de lectura, login y consulta de grupos | `Itu12345!` |
| `svc_admin` | Bind LDAP de escritura, cambio de grupo de usuarios | `Itu12345!` |
| `svc-mongo` | MongoDB, LDAP auth | `Itu12345!` |

Ubicación (`svc_backend` y `svc_admin`): `OU=Usuarios,OU=EGI,DC=itu,DC=local`.

Confirmado: `svc_backend` y `svc_admin` existen en AD con esos nombres exactos (coinciden con `spring.ldap.username` y `spring.ldap-admin.username` en `application.yaml`).

### Creación (consola Usuarios y equipos de Active Directory)

Sobre `OU=Usuarios`: clic derecho, Nuevo, Usuario. Para cada cuenta:
- Nombre, nombre de inicio de sesión de usuario (`svc_backend` / `svc_admin`), dominio `@itu.local`
- Contraseña `Itu12345!`, destildando "El usuario debe cambiar la contraseña en el siguiente inicio" y tildando "La contraseña nunca expira"

### Permiso delegado de svc_admin sobre los grupos de rol

Para que el endpoint `POST /api/auth/admin/agregar-grupo` (cambio de grupo de un usuario desde la app) funcione, `svc_admin` necesita permiso de escritura sobre el atributo `member` de los 3 grupos `GRP_*`. Esto se otorgó manualmente con el Asistente de delegación de control:

1. Clic derecho sobre `OU=Grupos,OU=EGI`, Delegar control
2. Seleccionar el usuario `svc_admin`
3. Elegir "Crear una tarea personalizada para delegar"
4. Alcance: "Solo los siguientes objetos en la carpeta", tipo de objeto Grupo
5. Permisos: tildar específicamente "Escribir miembros" (atributo `member`)
6. Confirmar y finalizar el asistente

> Esto se verificó que aplique sobre los 3 grupos (`GRP_LECTOR`, `GRP_EDITOR`, `GRP_ADMINISTRADOR`) dentro de la OU.

> `svc-mongo` no se recreó en esta OU, sigue existiendo en su ubicación original.

---

## Usuarios de Prueba

| Usuario | Grupo | Contraseña |
|---|---|---|
| `usr.lector` | `GRP_LECTOR` | `Itu12345!` |
| `usr.editor` | `GRP_EDITOR` | `Itu12345!` |
| `usr.admin` | `GRP_ADMINISTRADOR` | `Itu12345!` |

Ubicación: `OU=Usuarios,OU=EGI,DC=itu,DC=local`

El sistema tiene 3 roles definidos por el enunciado (LECTOR, EDITOR, ADMINISTRADOR). Para que el backend pueda probar la autenticación LDAP y la autorización por rol sin depender de cuentas reales de la universidad, se crean estos usuarios en AD. Simulan un profesor (lector), técnico (editor) y administrador real.

### Creación (consola Usuarios y equipos de Active Directory)

Sobre `OU=Usuarios`: clic derecho, Nuevo, Usuario, repitiendo para `usr.lector`, `usr.editor` y `usr.admin`, con contraseña `Itu12345!` y "La contraseña nunca expira" tildado.

Luego, para asignar cada usuario a su grupo: abrir las Propiedades del grupo correspondiente (`GRP_LECTOR`, `GRP_EDITOR`, `GRP_ADMINISTRADOR`), pestaña Miembros, Agregar, escribir el nombre del usuario y Aceptar.

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
