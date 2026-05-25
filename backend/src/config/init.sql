-- =============================================
-- DATAOPS CONTROL CENTER - Schema Principal
-- =============================================

-- Tabla de conexiones registradas (Modulo 1)
CREATE TABLE IF NOT EXISTS connections (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    motor VARCHAR(20) NOT NULL CHECK (motor IN ('Oracle', 'SQLServer', 'PostgreSQL')),
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    database_name VARCHAR(100) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    password_encrypted TEXT NOT NULL,
    status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ERROR')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de metricas de salud (Modulo 2)
CREATE TABLE IF NOT EXISTS db_metrics (
    id SERIAL PRIMARY KEY,
    db_id INTEGER REFERENCES connections(id),
    cpu DECIMAL(5,2),
    memory DECIMAL(5,2),
    connections INTEGER,
    locks INTEGER,
    deadlocks INTEGER,
    disk_usage DECIMAL(10,2),
    capture_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de consultas lentas (Modulo 3)
CREATE TABLE IF NOT EXISTS query_log (
    id SERIAL PRIMARY KEY,
    db_id INTEGER REFERENCES connections(id),
    query_text TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    rows_returned INTEGER,
    index_used VARCHAR(255),
    execution_plan TEXT,
    classification VARCHAR(10) CHECK (classification IN ('Fast', 'Medium', 'Slow', 'Critical')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de transacciones concurrentes (Modulo 4)
CREATE TABLE IF NOT EXISTS tx_log (
    id SERIAL PRIMARY KEY,
    db_id INTEGER REFERENCES connections(id),
    session VARCHAR(100),
    operacion VARCHAR(10) CHECK (operacion IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT')),
    inicio TIMESTAMP,
    fin TIMESTAMP,
    wait_time INTEGER,
    lock_type VARCHAR(20) CHECK (lock_type IN ('SHARED', 'EXCLUSIVE', 'DEADLOCK', 'TIMEOUT'))
);

-- Tabla de historial de backups (Modulo 5)
CREATE TABLE IF NOT EXISTS backup_history (
    id SERIAL PRIMARY KEY,
    db_id INTEGER REFERENCES connections(id),
    tipo VARCHAR(10) CHECK (tipo IN ('FULL', 'DIFF', 'INC')),
    size_mb DECIMAL(10,2),
    duration_seconds INTEGER,
    restore_point VARCHAR(255),
    parent_backup_id INTEGER REFERENCES backup_history(id),
    cloud_url TEXT,
    hash_md5 VARCHAR(255),
    status VARCHAR(10) CHECK (status IN ('SUCCESS', 'FAILED', 'RUNNING')),
    rpo_minutes INTEGER,
    rto_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas (Modulo 9)
CREATE TABLE IF NOT EXISTS alert_log (
    id SERIAL PRIMARY KEY,
    db_id INTEGER REFERENCES connections(id),
    condicion VARCHAR(255) NOT NULL,
    severidad VARCHAR(10) CHECK (severidad IN ('Warning', 'Critical')),
    motor_afectado VARCHAR(100),
    estado VARCHAR(15) DEFAULT 'OPEN' CHECK (estado IN ('OPEN', 'RESOLVED', 'ACKNOWLEDGED')),
    mensaje TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Tabla de configuracion de alertas (Modulo 9)
CREATE TABLE IF NOT EXISTS alert_rules (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    condicion VARCHAR(255) NOT NULL,
    umbral DECIMAL(10,2) NOT NULL,
    severidad VARCHAR(10) CHECK (severidad IN ('Warning', 'Critical')),
    accion VARCHAR(50),
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de metricas de cache Redis (Modulo 7)
CREATE TABLE IF NOT EXISTS cache_metrics (
    id SERIAL PRIMARY KEY,
    cache_hit BOOLEAN,
    query_key VARCHAR(255),
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de replicacion (Modulo 6)
CREATE TABLE IF NOT EXISTS replication_status (
    id SERIAL PRIMARY KEY,
    primary_host VARCHAR(255),
    replica_host VARCHAR(255),
    lag_seconds INTEGER,
    estado VARCHAR(15) CHECK (estado IN ('Aceptable', 'Advertencia', 'Critico')),
    capture_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar reglas de alerta por defecto
INSERT INTO alert_rules (nombre, condicion, umbral, severidad, accion) VALUES
('CPU Alta', 'cpu > umbral', 85, 'Warning', 'EMAIL'),
('Deadlocks Criticos', 'deadlocks > umbral', 3, 'Critical', 'DASHBOARD'),
('Backup Fallido', 'backup_status = FAILED', 1, 'Critical', 'EMAIL_ALARM'),
('Lag Replicacion', 'lag_seconds > umbral', 10, 'Warning', 'DASHBOARD'),
('Disco Lleno', 'disk_usage > umbral', 90, 'Critical', 'EMAIL_VISUAL'),
('Conexiones Altas', 'connections > umbral', 100, 'Warning', 'NOTIFICATION');

-- Insertar datos de prueba en connections
INSERT INTO connections (nombre, motor, host, port, database_name, user_name, password_encrypted, status) VALUES
('PostgreSQL Local', 'PostgreSQL', 'postgres', 5432, 'dataops_db', 'dataops_user', 'encrypted_pass', 'ACTIVE'),
('SQL Server Demo', 'SQLServer', 'sqlserver-host', 1433, 'demo_db', 'sa', 'encrypted_pass', 'ACTIVE'),
('Oracle Demo', 'Oracle', 'oracle-host', 1521, 'ORCL', 'system', 'encrypted_pass', 'INACTIVE');