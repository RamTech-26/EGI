-- ============================================================
-- Proyecto Integrador EGI — Ecosistema de Inventario Seguro
-- Archivo: ubicacion-db/02_seed.sql
-- Responsable: Franco (P2) — Bases de Datos y VMs Externas
-- ============================================================
-- Datos de prueba. Ejecutar DESPUES de que Hibernate haya
-- creado las tablas (backend arrancado al menos una vez).
--
-- IMPORTANTE: 'edificio', 'area' y 'tipo' deben coincidir
-- EXACTAMENTE con los enums Java (sensible a mayusculas).
--   Edificio:        SEDE_CENTRAL | CAMPUS_TIC
--   Area:            AULA | LABORATORIO | SECRETARIA
--   TipoResponsable: ALUMNO | DOCENTE | TECNICO
-- ============================================================

USE InventarioITU;
GO

INSERT INTO ubicaciones (edificio, area, numero_area) VALUES
    ('SEDE_CENTRAL', 'LABORATORIO', 1),
    ('SEDE_CENTRAL', 'AULA', 2),
    ('CAMPUS_TIC', 'SECRETARIA', 1);
GO

INSERT INTO responsables (nombre, apellido, email, telefono, tipo) VALUES
    ('Juan',  'Perez',  'juan.perez@itu.local',  '2614000001', 'DOCENTE'),
    ('Maria', 'Garcia', 'maria.garcia@itu.local', '2614000002', 'TECNICO'),
    ('Carlos','Fernandez', 'carlos.fernandez@itu.local', '2614000003', 'ALUMNO');
GO

INSERT INTO equipos (codigo, fecha_adquisicion, ubicacion_id, responsable_id) VALUES
    ('PC-LAB-001',  '2023-03-01', 1, 1),
    ('PC-LAB-002',  '2023-03-01', 1, 1),
    ('PC-AULA-001', '2022-08-15', 2, 2),
    ('NB-SEC-001',  '2024-01-20', 3, 3);
GO
