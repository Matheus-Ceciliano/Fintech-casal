-- ==========================================
-- FINTECH PWA PARA CASAIS - DATABASE SCHEMA
-- ==========================================

-- Habilita extensão pgcrypto para funções de uuid, se não estiver ativo
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. ENUMS
-- ==========================================
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE transaction_category AS ENUM (
  'Mercado', 
  'Alimentação', 
  'Moradia', 
  'Transporte', 
  'Saúde', 
  'Educação', 
  'Lazer', 
  'Viagem',
  'Salário',
  'Outros'
);

-- ==========================================
-- 2. TABELAS
-- ==========================================

-- Tabela: couples (Casais)
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: profiles (Perfis de Usuários)
-- A chave primária é uma FK para auth.users, garantindo relação 1:1
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
  has_biometrics BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: goals (Metas do Casal)
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(10, 2) NOT NULL,
  current_amount NUMERIC(10, 2) DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela: transactions (Lançamentos / Transações)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  type transaction_type NOT NULL DEFAULT 'expense',
  category transaction_category NOT NULL DEFAULT 'Outros',
  description TEXT NOT NULL,
  date DATE NOT NULL,
  receipt_url TEXT,
  is_shared BOOLEAN NOT NULL DEFAULT true, -- Permite filtrar gastos individuais vs do casal
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==========================================

ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para resgatar o couple_id do usuário logado
CREATE OR REPLACE FUNCTION get_user_couple_id()
RETURNS UUID AS $$
  SELECT couple_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas para 'profiles'
CREATE POLICY "Users can view their own or partner's profile" 
ON profiles FOR SELECT 
USING (
  id = auth.uid() OR 
  (couple_id IS NOT NULL AND couple_id = get_user_couple_id())
);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (id = auth.uid());

-- Políticas para 'couples'
CREATE POLICY "Users can view couples" 
ON couples FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create a couple" 
ON couples FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Políticas para 'goals'
CREATE POLICY "Users can manage their couple goals" 
ON goals FOR ALL 
USING (couple_id = get_user_couple_id())
WITH CHECK (couple_id = get_user_couple_id());

-- Políticas para 'transactions'
CREATE POLICY "Users can manage their couple transactions" 
ON transactions FOR ALL 
USING (couple_id = get_user_couple_id())
WITH CHECK (couple_id = get_user_couple_id());

-- ==========================================
-- 4. TRIGGERS
-- ==========================================

-- Cria o profile automaticamente quando um usuário se cadastra via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==========================================
-- 5. STORAGE (BUCKETS)
-- ==========================================

-- Insere o bucket "receipts" caso ele não exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS básico para Storage (Permite upload e visualização apenas para usuários logados)
-- Dica: Em um cenário de produção rigoroso, o path do bucket pode incluir o couple_id
CREATE POLICY "Authenticated users can upload receipts" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can view receipts" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'receipts' AND 
  auth.role() = 'authenticated'
);
