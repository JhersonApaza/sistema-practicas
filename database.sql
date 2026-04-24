-- =============================================
-- SISTEMA DE PRÁCTICAS - Base de Datos
-- =============================================

CREATE DATABASE IF NOT EXISTS sistema_practicas;
USE sistema_practicas;

-- Tabla supervisores
CREATE TABLE IF NOT EXISTS supervisores (
  id_supervisor INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  correo        VARCHAR(100) NOT NULL UNIQUE,
  contrasenia   VARCHAR(255) NOT NULL
);

-- Tabla estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
  id_estudiante INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  apellido      VARCHAR(100) NOT NULL,
  dni           VARCHAR(20)  NOT NULL,
  carrera       VARCHAR(100) NOT NULL,
  institucion   VARCHAR(150) NOT NULL,
  nota          DECIMAL(4,2) DEFAULT NULL,
  correo        VARCHAR(100) NOT NULL UNIQUE,
  contrasenia   VARCHAR(255) NOT NULL,
  id_supervisor INT,
  FOREIGN KEY (id_supervisor) REFERENCES supervisores(id_supervisor)
);

-- Datos de prueba - Supervisor
INSERT INTO supervisores (nombre, apellido, correo, contrasenia)
VALUES ('Carlos', 'Ramírez', 'supervisor@empresa.com', '123456');

-- Datos de prueba - Estudiantes
INSERT INTO estudiantes (nombre, apellido, dni, carrera, institucion, nota, correo, contrasenia, id_supervisor) VALUES
('Ana',    'García',   '12345678', 'Ingeniería de Sistemas',    'Universidad Nacional',  18.5, 'ana@correo.com',    '123456', 1),
('Luis',   'Martínez', '87654321', 'Administración de Empresas','Universidad Privada',   14.0, 'luis@correo.com',   '123456', 1),
('María',  'López',    '11223344', 'Contabilidad',              'Instituto Superior',     9.5, 'maria@correo.com',  '123456', 1),
('Pedro',  'Torres',   '44332211', 'Diseño Gráfico',            'Universidad Nacional',  16.0, 'pedro@correo.com',  '123456', 1),
('Sofía',  'Díaz',     '55667788', 'Marketing Digital',         'Universidad Privada',  NULL,  'sofia@correo.com',  '123456', 1);
