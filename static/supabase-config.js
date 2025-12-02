// Configuração do Supabase para ConectaHub
// IMPORTANTE: Substitua as credenciais abaixo pelas suas!

const SUPABASE_CONFIG = {
    // URL do seu projeto Supabase (encontre em Project Settings > API)
    url: 'https://eannacynhliacnhwwzmw.supabase.co',
    
    // Chave anônima pública (encontre em Project Settings > API > anon/public)
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbm5hY3luaGxpYWNuaHd3em13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2Njk2MDQsImV4cCI6MjA4MDI0NTYwNH0.AQX_b49JlQzMd3cptVlnzmwGJouBl3YhugosmcU1h34',
};

// Cliente Supabase
let supabase = null;

// Inicializar Supabase
function initSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Biblioteca Supabase não carregada! Adicione o CDN no HTML.');
        return false;
    }
    
    try {
        supabase = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase conectado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar com Supabase:', error);
        return false;
    }
}

// Exportar para uso global
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.supabaseClient = supabase;
window.initSupabase = initSupabase;

// Inicializar automaticamente quando o script for carregado
document.addEventListener('DOMContentLoaded', function() {
    initSupabase();
});

// Funções auxiliares para facilitar uso do Supabase

// Verificar se usuário está autenticado
async function getCurrentSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

// Login com email/senha (opcional - para usar auth do Supabase)
async function signInWithEmail(email, password) {
    if (!supabase) return { error: 'Supabase não inicializado' };
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    return { data, error };
}

// Logout
async function signOut() {
    if (!supabase) return { error: 'Supabase não inicializado' };
    const { error } = await supabase.auth.signOut();
    return { error };
}

// Exportar funções auxiliares
window.getCurrentSession = getCurrentSession;
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;

console.log('🔧 Configuração Supabase carregada');
console.log('📝 Lembre-se de configurar suas credenciais em supabase-config.js');
