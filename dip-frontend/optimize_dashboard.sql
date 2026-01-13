-- Create indexes to optimize dashboard queries
-- These indexes help with sorting by date and joining tables

-- 1. Indexes for system_logs (used in Recent Activity)
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON public.system_logs(user_id);

-- 2. Indexes for counting and sorting main entities
CREATE INDEX IF NOT EXISTS idx_prisoes_created_at ON public.prisoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_procurados_created_at ON public.procurados(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_investigacoes_created_at ON public.investigacoes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_boletins_created_at ON public.boletins(created_at DESC);

-- 3. Indexes for Foreign Keys to speed up joins
CREATE INDEX IF NOT EXISTS idx_boletins_created_by ON public.boletins(created_by);
CREATE INDEX IF NOT EXISTS idx_investigacoes_created_by ON public.investigacoes(created_by);
CREATE INDEX IF NOT EXISTS idx_provas_investigacao_id ON public.provas(investigacao_id);

-- 4. Analyze tables to update statistics for the query planner
ANALYZE public.system_logs;
ANALYZE public.prisoes;
ANALYZE public.procurados;
ANALYZE public.investigacoes;
ANALYZE public.boletins;
ANALYZE public.profiles;
