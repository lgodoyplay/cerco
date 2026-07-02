-- Script de setup para Log de Auditoria
-- Execute este script no SQL Editor do Supabase

-- Garantir extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Log de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_name TEXT,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Audit logs são legíveis apenas por autenticados" ON audit_logs;
CREATE POLICY "Audit logs são legíveis apenas por autenticados" 
    ON audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Audit logs são inseríveis apenas pelo sistema" ON audit_logs;
CREATE POLICY "Audit logs são inseríveis apenas pelo sistema" 
    ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs são atualizáveis apenas para marcar como lido" ON audit_logs;
CREATE POLICY "Audit logs são atualizáveis apenas para marcar como lido" 
    ON audit_logs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Índice para melhorar performance de consultas por data
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
