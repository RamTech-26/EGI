-- ============================================================
-- Proyecto Integrador EGI — Ecosistema de Inventario Seguro
-- Archivo: ubicacion-db/init.sql
-- Responsable: Franco (P2) — Bases de Datos y VMs Externas
-- Instancia: SERVIDOR-IIS-SQL\ITULAB
-- ============================================================

-- Crear base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'InventarioITU')
BEGIN
    CREATE DATABASE InventarioITU;
END
GO

USE InventarioITU;
GO

-- ============================================================
-- Crear login SQL para la aplicación backend
-- ============================================================
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'app_inventario')
BEGIN
    CREATE LOGIN app_inventario WITH PASSWORD = 'Itu12345!';
END
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'app_inventario')
BEGIN
    CREATE USER app_inventario FOR LOGIN app_inventario;
END
GO

ALTER ROLE db_owner ADD MEMBER app_inventario;
GO

-- ============================================================
-- Nota: Las tablas son creadas automáticamente por Hibernate
-- (ddl-auto: update) al iniciar el backend por primera vez.
-- Se documentan aquí para referencia del esquema esperado.
-- ============================================================

-- Tabla: ubicaciones
-- CREATE TABLE ubicaciones (
--     id         INT IDENTITY(1,1) PRIMARY KEY,
--     edificio   VARCHAR(100) NOT NULL,
--     area       VARCHAR(50)  NOT NULL  -- AULA | LABORATORIO | SECRETARIA
-- );

-- Tabla: responsables
-- CREATE TABLE responsables (
--     id        INT IDENTITY(1,1) PRIMARY KEY,
--     nombre    VARCHAR(100) NOT NULL,
--     apellido  VARCHAR(100) NOT NULL,
--     email     VARCHAR(150),
--     telefono  VARCHAR(30)
-- );

-- Tabla: equipos
-- CREATE TABLE equipos (
--     id              INT IDENTITY(1,1) PRIMARY KEY,
--     codigo          VARCHAR(50)  NOT NULL,
--     fechaAdquisicion DATE,
--     ubicacion_id    INT FOREIGN KEY REFERENCES ubicaciones(id),
--     responsable_id  INT FOREIGN KEY REFERENCES responsables(id)
-- );

-- ============================================================
-- Datos de prueba (ejecutar DESPUÉS de que Hibernate cree las tablas)
-- ============================================================

-- INSERT INTO ubicaciones (edificio, area) VALUES
--     ('Edificio A', 'LABORATORIO'),
--     ('Edificio B', 'AULA'),
--     ('Edificio C', 'SECRETARIA');

-- INSERT INTO responsables (nombre, apellido, email, telefono) VALUES
--     ('Juan',  'Pérez',  'juan.perez@itu.local',  '2614000001'),
--     ('María', 'García', 'maria.garcia@itu.local', '2614000002');

-- INSERT INTO equipos (codigo, fechaAdquisicion, ubicacion_id, responsable_id) VALUES
--     ('PC-LAB-001', '2023-03-01', 1, 1),
--     ('PC-LAB-002', '2023-03-01', 1, 1),
--     ('PC-AULA-001','2022-08-15', 2, 2);
