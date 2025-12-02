-- ConectaHub - Schema do Banco de Dados Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Em produção, use hash bcrypt
    department VARCHAR(100) NOT NULL,
    department_value VARCHAR(50) NOT NULL,
    role VARCHAR(100) DEFAULT 'Colaborador',
    position VARCHAR(100) DEFAULT 'Novo Colaborador',
    phone VARCHAR(20),
    location VARCHAR(100),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    avatar TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    stats JSONB DEFAULT '{"productivity": 0, "tasks": 0, "projects": 0}'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    recent_activities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Tarefas
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    department VARCHAR(100) NOT NULL,
    department_value VARCHAR(50) NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by_name VARCHAR(255),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    points INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Mensagens
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Notificações
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'fa-bell',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_value);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_department ON tasks(department_value);
CREATE INDEX idx_messages_from ON messages(from_user_id);
CREATE INDEX idx_messages_to ON messages(to_user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver e editar apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política: Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Política: Tarefas visíveis por departamento ou admin
CREATE POLICY "Users can view department tasks" ON tasks
    FOR SELECT USING (
        department_value IN (
            SELECT department_value FROM users WHERE id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Política: Admins podem criar tarefas
CREATE POLICY "Admins can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Política: Usuários podem atualizar suas próprias tarefas
CREATE POLICY "Users can update assigned tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

-- Política: Mensagens entre usuários
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (from_user_id = auth.uid());

-- Política: Notificações do próprio usuário
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Inserir usuário admin padrão
INSERT INTO users (
    full_name,
    name,
    email,
    password,
    department,
    department_value,
    role,
    position,
    is_admin
) VALUES (
    'Administrador',
    'Admin',
    'admin@conectahub.com',
    'admin123', -- MUDAR em produção!
    'Administração',
    'admin',
    'Administrador',
    'Administrador do Sistema',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Comentários úteis
COMMENT ON TABLE users IS 'Tabela de usuários do ConectaHub';
COMMENT ON TABLE tasks IS 'Tarefas criadas por administradores';
COMMENT ON TABLE messages IS 'Mensagens entre usuários';
COMMENT ON TABLE notifications IS 'Notificações dos usuários';
