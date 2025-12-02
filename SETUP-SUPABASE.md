# 🚀 Como Integrar Supabase no ConectaHub

Este guia mostra como migrar o ConectaHub de localStorage para Supabase (banco de dados online PostgreSQL).

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com) (gratuita)
- Navegador moderno com suporte a ES6+

## 🔧 Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em **"New Project"**
4. Preencha os dados:
   - **Name**: ConectaHub
   - **Database Password**: escolha uma senha forte
   - **Region**: escolha a mais próxima (ex: South America)
5. Aguarde alguns minutos enquanto o projeto é criado

## 🗄️ Passo 2: Criar as Tabelas

1. No painel do Supabase, vá em **SQL Editor** (menu lateral esquerdo)
2. Clique em **"New Query"**
3. Copie TODO o conteúdo do arquivo `database-schema.sql` deste projeto
4. Cole no editor SQL
5. Clique em **"Run"** (ou pressione Ctrl+Enter)
6. Verifique se todas as tabelas foram criadas em **Table Editor**

## 🔑 Passo 3: Obter Credenciais

1. No painel do Supabase, vá em **Settings** > **API**
2. Você verá duas informações importantes:
   - **Project URL**: algo como `https://xxxxx.supabase.co`
   - **anon/public key**: uma chave longa começando com `eyJ...`
3. Copie ambas as informações

## ⚙️ Passo 4: Configurar o Projeto

1. Abra o arquivo `static/supabase-config.js`
2. Substitua as credenciais:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://SEU_PROJETO.supabase.co',  // Cole sua URL aqui
    anonKey: 'SUA_CHAVE_ANONIMA_AQUI',       // Cole sua chave aqui
};
```

3. Salve o arquivo

## 📦 Passo 5: Adicionar Biblioteca Supabase

Adicione o CDN do Supabase nos seus arquivos HTML, **ANTES** de carregar o `database.js`:

```html
<!-- Em TODOS os arquivos HTML, adicione estas linhas no <head> -->
<head>
    <!-- ...outros links... -->
    
    <!-- Supabase CDN -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <!-- Configuração Supabase -->
    <script src="../static/supabase-config.js"></script>
</head>

<body>
    <!-- ...conteúdo... -->
    
    <!-- Trocar database.js por database-supabase.js -->
    <script src="../static/database-supabase.js"></script>
    <script src="../static/home.js"></script>
</body>
```

### Arquivos que precisam ser alterados:

- `html/home.html`
- `html/login.html`
- `html/cadastro.html`
- `html/perfil.html`
- `html/ranking.html`
- `html/mensagens.html`
- `html/admin.html`

## 🔄 Passo 6: Trocar database.js

Em **TODOS** os arquivos HTML, substitua:

```html
<!-- De: -->
<script src="../static/database.js"></script>

<!-- Para: -->
<script src="../static/database-supabase.js"></script>
```

## ✅ Passo 7: Testar

1. Abra o `login.html` no navegador
2. Abra o **Console do navegador** (F12)
3. Você deve ver:
   ```
   ✅ Supabase conectado com sucesso!
   ✅ Modo: Supabase (Online)
   ```
4. Faça login com o admin padrão:
   - **Email**: admin@conectahub.com
   - **Senha**: admin123

## 🔍 Verificar Dados no Supabase

1. No painel do Supabase, vá em **Table Editor**
2. Clique na tabela `users`
3. Você deve ver o usuário admin criado
4. Ao criar tarefas, elas aparecerão na tabela `tasks`

## 🚨 Solução de Problemas

### ❌ Erro: "Supabase não inicializado"

- Verifique se adicionou o CDN do Supabase no HTML
- Verifique se o `supabase-config.js` está sendo carregado antes do `database-supabase.js`

### ❌ Erro: "Invalid API key"

- Confirme que copiou a chave **anon/public** (não a service_role)
- Verifique se não há espaços extras nas credenciais

### ❌ Erro: "Row Level Security"

- Execute o script SQL completo que cria as políticas RLS
- Ou desative RLS temporariamente nas configurações da tabela (não recomendado em produção)

### 🔄 Modo Fallback

Se o Supabase não estiver configurado, o sistema volta automaticamente para localStorage (modo offline). Verifique o console:

- **✅ Modo: Supabase (Online)** - Funcionando online
- **⚠️ Modo: localStorage (Offline)** - Usando armazenamento local

## 📊 Vantagens do Supabase

✅ **Dados persistentes** - Não se perdem ao limpar navegador  
✅ **Multi-dispositivo** - Acesse de qualquer lugar  
✅ **Sincronização em tempo real** - Múltiplos usuários simultâneos  
✅ **Backup automático** - Dados seguros  
✅ **Escalável** - Suporta milhares de usuários  
✅ **Gratuito** - Plano free generoso para começar

## 🔐 Segurança

⚠️ **IMPORTANTE EM PRODUÇÃO:**

1. **NUNCA** armazene senhas em texto puro
   - Use bcrypt ou Supabase Auth
2. Configure **Row Level Security (RLS)** nas tabelas
3. Use variáveis de ambiente para credenciais
4. Ative autenticação de dois fatores no Supabase

## 🆘 Suporte

- Documentação Supabase: [supabase.com/docs](https://supabase.com/docs)
- Discord Supabase: [discord.supabase.com](https://discord.supabase.com)

## 📈 Próximos Passos

Após configurar o Supabase:

1. ✅ Testar login, cadastro e tarefas
2. ✅ Verificar notificações em tempo real
3. ✅ Configurar autenticação Supabase (opcional)
4. ✅ Implementar chat em tempo real com Realtime
5. ✅ Adicionar upload de avatares com Storage

---

**Dica**: Mantenha o `database.js` original como backup caso precise voltar ao localStorage.
