# Backend SQL con Kerberos - Módulo P3 (Matías)

API REST con autenticación LDAP contra Active Directory y delegación Kerberos a SQL Server.
Parte del Proyecto Integrador EGI.

---

## ¿Qué hace este módulo?

- Autentica usuarios contra Active Directory vía LDAP.
- Consulta los grupos del usuario en AD y los convierte en roles (LECTOR, EDITOR, ADMINISTRADOR).
- Genera tokens JWT con los roles para autorizar peticiones.
- Protege los endpoints REST según el rol del usuario.
- Se conecta a SQL Server usando Kerberos, delegando la identidad del usuario autenticado.
- SQL Server aplica sus propios permisos granulares según el grupo de AD del usuario.
- Gestiona ubicaciones, responsables y equipos del inventario.
- Expone un endpoint combinado con MongoDB (mock temporal).

---

## Tecnologías

| Tecnología | Uso |
|------------|-----|
| Java 21 | Lenguaje principal |
| Spring Boot 3.x | Framework REST |
| Spring Security | Autenticación y autorización |
| Spring LDAP | Conexión y consultas a Active Directory |
| Spring Data JPA | Acceso a SQL Server |
| JWT (jjwt 0.12.6) | Tokens de autenticación sin estado |
| Kerberos (JAAS) | Delegación de identidad a SQL Server |
| ModelMapper | Conversión entre entidades y DTOs |
| Lombok | Reducción de código repetitivo |
| Maven | Gestión de dependencias |
| MySQL | Base de datos de desarrollo local |
| SQL Server | Base de datos objetivo (producción) |
| Docker | Contenerización |

---

## Estructura del proyecto
```text
src/
└── main/
    └── java/
        └── com/
            └── inventario/
                └── backendapi/
                    ├── auth/
                    │   ├── AuthController.java
                    │   ├── JwtUtil.java
                    │   ├── JwtFilter.java
                    │   ├── LdapAuthService.java
                    │   └── SecurityConfig.java
                    │
                    ├── config/
                    │   ├── KerberosDataSourceConfig.java
                    │   └── ModelMapperConfig.java
                    │
                    ├── dto/
                    │   ├── EquipoDTO.java
                    │   ├── HardwareDTO.java
                    │   ├── InventarioCompletoDTO.java
                    │   ├── LoginRequest.java
                    │   ├── LoginResponse.java
                    │   ├── ResponsableDTO.java
                    │   └── UbicacionDTO.java
                    │
                    └── sql/
                        ├── model/
                        │   ├── Area.java
                        │   ├── BaseSql.java
                        │   ├── Equipo.java
                        │   ├── Responsable.java
                        │   └── Ubicacion.java
                        │
                        ├── repository/
                        │   ├── BaseSqlRepository.java
                        │   ├── EquipoRepository.java
                        │   ├── ResponsableRepository.java
                        │   └── UbicacionRepository.java
                        │
                        ├── service/
                        │   ├── BaseSqlService.java
                        │   ├── BaseSqlServiceImpl.java
                        │   ├── EquipoService.java
                        │   ├── EquipoServiceImpl.java
                        │   ├── InventarioCompletoService.java
                        │   ├── InventarioCompletoServiceImpl.java
                        │   ├── ResponsableService.java
                        │   ├── ResponsableServiceImpl.java
                        │   ├── UbicacionService.java
                        │   └── UbicacionServiceImpl.java
                        │
                        └── controller/
                            ├── EquipoController.java
                            ├── InventarioCompletoController.java
                            ├── ResponsableController.java
                            └── UbicacionController.java
```



---

## Flujo de autenticación y autorización

### 1. Login
1. El frontend envía POST /api/auth/login con username y password.
2. LdapAuthService hace un bind LDAP contra Active Directory (puerto 389).
3. Si las credenciales son válidas, consulta los grupos del usuario en AD.
4. Convierte los grupos de AD a roles de aplicación:
    - Profesores → LECTOR
    - Responsables → EDITOR
    - Administradores → ADMINISTRADOR
5. Genera un token JWT firmado que contiene el username y los roles.
6. Devuelve el token al frontend.

### 2. Peticiones autenticadas
1. El frontend incluye el token en el header: Authorization: Bearer <token>.
2. JwtFilter intercepta la petición, valida el token y extrae username y roles.
3. Establece el contexto de seguridad de Spring con los roles correspondientes.
4. SecurityConfig verifica si el rol es suficiente para el endpoint solicitado:
    - GET → LECTOR, EDITOR o ADMINISTRADOR
    - POST, PUT, DELETE → EDITOR o ADMINISTRADOR

### 3. Conexión a SQL Server con Kerberos
1. KerberosDataSourceConfig configura el datasource con integratedSecurity=true y authenticationScheme=JavaKerberos.
2. La JVM usa los archivos krb5.conf y login.conf para autenticarse con el KDC (AD).
3. El backend obtiene un ticket de servicio Kerberos para SQL Server a nombre del usuario autenticado.
4. SQL Server recibe el ticket, extrae la identidad del usuario y aplica sus permisos de base de datos según los grupos de AD.
5. Las contraseñas nunca viajan a SQL Server, solo tickets Kerberos cifrados.

---

## Perfiles de configuración

### Perfil por defecto (desarrollo local con MySQL)
spring:
datasource:
url: jdbc:mysql://localhost:3306/inventario
username: root
password: tu_password
jpa:
hibernate:
ddl-auto: update
ldap:
urls: ldap://<IP_WAN_PFSENSE>:389
base: dc=itu,dc=local
username: cn=svc_backend,cn=Users,dc=itu,dc=local
password: <PASSWORD>


### Perfil kerberos (producción con SQL Server)
Activar con spring.profiles.active=kerberos en application.yaml o variable de entorno.
spring:
datasource:
url: jdbc:sqlserver://<IP>:1433;databaseName=<BD>;integratedSecurity=true
jpa:
hibernate:
ddl-auto: validate
java:
security:
krb5:
conf: /etc/krb5.conf
auth:
login:
config: /etc/login.conf


---

## Archivos de configuración Kerberos

### krb5.conf
[libdefaults]
default_realm = <REALM>
ticket_lifetime = 24h
forwardable = true

[realms]
<REALM> = {
kdc = <IP_KDC>
admin_server = <IP_KDC>
}

[domain_realm]
.<dominio> = <REALM>

### login.conf
SQLJDBCDriver {
com.sun.security.auth.module.Krb5LoginModule required
useKeyTab=true
keyTab="<RUTA_AL_KEYTAB>"
principal="<USUARIO_PRINCIPAL>"
storeKey=true
debug=false;
};


Importante: Los archivos krb5.conf, login.conf y *.keytab están en .gitignore. Usar las plantillas .example para documentación.

---

## Endpoints

### Autenticación
| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | /api/auth/login | { "username": "...", "password": "..." } | { "token": "eyJ...", "username": "..." } |

### Ubicaciones
| Método | Ruta | Roles |
|--------|------|-------|
| GET | /api/ubicaciones | LECTOR, EDITOR, ADMIN |
| GET | /api/ubicaciones/{id} | LECTOR, EDITOR, ADMIN |
| POST | /api/ubicaciones | EDITOR, ADMIN |
| PUT | /api/ubicaciones/{id} | EDITOR, ADMIN |
| DELETE | /api/ubicaciones/{id} | EDITOR, ADMIN |

### Responsables
| Método | Ruta | Roles |
|--------|------|-------|
| GET | /api/responsables | LECTOR, EDITOR, ADMIN |
| GET | /api/responsables/{id} | LECTOR, EDITOR, ADMIN |
| POST | /api/responsables | EDITOR, ADMIN |
| PUT | /api/responsables/{id} | EDITOR, ADMIN |
| DELETE | /api/responsables/{id} | EDITOR, ADMIN |

### Equipos
| Método | Ruta | Roles |
|--------|------|-------|
| GET | /api/equipos | LECTOR, EDITOR, ADMIN |
| GET | /api/equipos/{id} | LECTOR, EDITOR, ADMIN |
| POST | /api/equipos | EDITOR, ADMIN |
| PUT | /api/equipos/{id} | EDITOR, ADMIN |
| DELETE | /api/equipos/{id} | EDITOR, ADMIN |

### Inventario Completo
| Método | Ruta | Roles |
|--------|------|-------|
| GET | /api/inventario/{idEquipo} | LECTOR, EDITOR, ADMIN |

---

## Docker

### Construcción de la imagen

docker build -t backend-api-kerberos .


### Ejecución del contenedor

docker run -p 8080:8080
-e JAVA_OPTS="-Djava.security.krb5.conf=/etc/krb5.conf -Djava.security.auth.login.config=/etc/login.conf"
-v /ruta/local/krb5.conf:/etc/krb5.conf
-v /ruta/local/login.conf:/etc/login.conf
-v /ruta/local/backend.keytab:/etc/krb5.keytab
backend-api-kerberos


---

## Checklist de implementación

### Completado
- [x] Estructura del proyecto Spring Boot
- [x] Entidades JPA y repositorios
- [x] CRUD completo (ubicaciones, responsables, equipos)
- [x] Endpoint combinado /api/inventario/{idEquipo} (mock MongoDB)
- [x] DTOs compartidos unificados en feature/backend-base
- [x] Autenticación LDAP contra Active Directory
- [x] Roles en JWT (LECTOR, EDITOR, ADMINISTRADOR)
- [x] Protección de endpoints por rol
- [x] Configuración Kerberos (krb5.conf, login.conf, KerberosDataSourceConfig)
- [x] Conexión a SQL Server con autenticación integrada Windows
- [x] Dockerfile multi-stage con soporte Kerberos
- [x] .gitignore para archivos sensibles (keytab, krb5.conf, login.conf, application.yaml)

### Pendiente (depende de P2)
- [ ] Datos reales de AD (IP WAN pfSense, dominio, base DN, usuario de servicio, contraseña)
- [ ] Keytab para el SPN de SQL Server
- [ ] SPN registrado en AD (MSSQLSvc/<HOST>:1433)
- [ ] NAT en pfSense (puertos 389 y 1433)
- [ ] Pruebas de integración reales

### Pendiente (depende de P4)
- [ ] Reemplazar mock de HardwareDTO por llamada real al servicio MongoDB

### Pendiente (depende de P1)
- [ ] Manifiestos Kubernetes con Secrets para keytab y archivos Kerberos
- [ ] Despliegue en Minikube

---

## Rama
feature/backend-api-kerberos

## Autor
Matías (P3) - Proyecto Integrador EGI