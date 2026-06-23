-- ============================================================
-- Proyecto Integrador EGI — Ecosistema de Inventario Seguro
-- Archivo: ubicacion-db/01_schema.sql
-- Responsable: Franco (P2) — Bases de Datos y VMs Externas
-- Instancia: SERVIDOR-IIS-SQ\ITULAB
-- ============================================================
-- Este script crea la base de datos y el login de aplicacion.
-- Las TABLAS las crea Hibernate automaticamente al iniciar el
-- backend (configuracion: spring.jpa.hibernate.ddl-auto=update).
-- No crear las tablas manualmente.
-- ============================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'InventarioITU')
BEGIN
    CREATE DATABASE InventarioITU;
END
GO

USE InventarioITU;
GO

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

-- Referencia del esquema esperado (creado automaticamente por
-- Hibernate, NO ejecutar estos CREATE TABLE manualmente):

-- CREATE TABLE ubicaciones (
--     id         INT IDENTITY(1,1) PRIMARY KEY,
--     edificio   VARCHAR(100) NOT NULL,
--     area       VARCHAR(50)  NOT NULL,
--     numero_area INT
-- );

-- CREATE TABLE responsables (
--     id        INT IDENTITY(1,1) PRIMARY KEY,
--     nombre    VARCHAR(100) NOT NULL,
--     apellido  VARCHAR(100) NOT NULL,
--     email     VARCHAR(150),
--     telefono  VARCHAR(30),
--     tipo      VARCHAR(50)
-- );

-- CREATE TABLE equipos (
--     id                  INT IDENTITY(1,1) PRIMARY KEY,
--     codigo              VARCHAR(50)  NOT NULL,
--     fecha_adquisicion   DATE,
--     fecha_mantenimiento DATE,
--     fecha_devolucion    DATE,
--     ubicacion_id        INT FOREIGN KEY REFERENCES ubicaciones(id),
--     responsable_id      INT FOREIGN KEY REFERENCES responsables(id)
-- );
