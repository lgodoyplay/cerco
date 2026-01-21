-- Tabela de Requisições de Equipamentos
CREATE TABLE IF NOT EXISTS logistics_requisitions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  item_type TEXT NOT NULL, -- 'weapon', 'ammo', 'vest', 'kit', 'replacement'
  item_name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'active', -- 'active' (em uso), 'returned' (devolvido), 'consumed' (usado/gasto)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  returned_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Custódia de Bens
CREATE TABLE IF NOT EXISTS logistics_custody (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  officer_id UUID REFERENCES auth.users(id) NOT NULL,
  item_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT NOT NULL, -- 'weapon', 'drug', 'money', 'evidence', 'other'
  case_reference TEXT, -- Número do BO ou Inquérito
  location TEXT, -- Onde está guardado (ex: Prateleira A1)
  status TEXT DEFAULT 'in_custody', -- 'in_custody', 'released', 'destroyed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Políticas de Segurança (RLS)
ALTER TABLE logistics_requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_custody ENABLE ROW LEVEL SECURITY;

-- Políticas para logistics_requisitions
CREATE POLICY "Users can view all requisitions" ON logistics_requisitions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own requisitions" ON logistics_requisitions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requisitions" ON logistics_requisitions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para logistics_custody
CREATE POLICY "Users can view all custody items" ON logistics_custody
  FOR SELECT USING (true);

CREATE POLICY "Users can insert custody items" ON logistics_custody
  FOR INSERT WITH CHECK (auth.uid() = officer_id);

CREATE POLICY "Users can update custody items" ON logistics_custody
  FOR UPDATE USING (true); -- Permitir atualização por qualquer um (para retirada/movimentação) ou restringir depois
