let conversaAtual = null;
let usuarioAtual = null;
let refreshInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se está logado
    if (!window.DB || !window.DB.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    usuarioAtual = window.DB.getCurrentUser();

    // Elementos do botão de nova conversa
    const btnNovaConversa = document.getElementById('btnNovaConversa');
    const modalNovaConversa = document.getElementById('modalNovaConversa');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const buscaConversa = document.getElementById('buscaConversa');
    const inputMensagem = document.getElementById('inputMensagem');
    const btnEnviar = document.getElementById('btnEnviar');
    const mensagensContainer = document.getElementById('mensagensContainer');
    const listaConversas = document.getElementById('listaConversas');

    // Mostrar nome do usuário logado
    const userLoggedNameEl = document.getElementById('userLoggedName');
    if (userLoggedNameEl && usuarioAtual) {
        userLoggedNameEl.textContent = usuarioAtual.name;
    }

    // Carregar conversas existentes (apenas a lista, sem abrir nenhuma)
    carregarConversas();
    
    // Mostrar estado inicial vazio
    mostrarEstadoVazio();
    
    // Auto-refresh a cada 3 segundos para simular tempo real
    refreshInterval = setInterval(() => {
        if (conversaAtual) {
            const scrollPos = mensagensContainer.scrollTop;
            const scrollHeight = mensagensContainer.scrollHeight;
            const isAtBottom = scrollHeight - scrollPos - mensagensContainer.clientHeight < 50;
            
            carregarMensagens(conversaAtual, !isAtBottom);
            carregarConversas(); // Apenas atualizar lista, não trocar conversa
        }
    }, 3000);

    // Abrir modal de nova conversa
    if (btnNovaConversa) {
        btnNovaConversa.addEventListener('click', function() {
            modalNovaConversa.classList.add('show');
            carregarContatos();
        });
    }

    // Fechar modal
    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', function() {
            modalNovaConversa.classList.remove('show');
        });
    }

    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        if (event.target == modalNovaConversa) {
            modalNovaConversa.classList.remove('show');
        }
    });

    // Buscar conversas
    if (buscaConversa) {
        buscaConversa.addEventListener('keyup', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const conversas = document.querySelectorAll('.conversa-item');
            
            conversas.forEach(conversa => {
                const nome = conversa.querySelector('.conversa-info h3').textContent.toLowerCase();
                if (nome.includes(searchTerm)) {
                    conversa.style.display = 'flex';
                } else {
                    conversa.style.display = 'none';
                }
            });
        });
    }

    // Enviar mensagem
    if (btnEnviar && inputMensagem) {
        btnEnviar.addEventListener('click', enviarMensagem);
        inputMensagem.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensagem();
            }
        });
    }

    // Menu inferior - adicionar classe ativa
    const menuLinks = document.querySelectorAll('.bottom-menu a');
    menuLinks.forEach(link => {
        if (link.href.includes('mensagens.html')) {
            link.classList.add('active');
        }
    });
});

function carregarConversas() {
    const listaConversas = document.getElementById('listaConversas');
    const conversations = window.DB.getUserConversations(usuarioAtual.id);
    
    listaConversas.innerHTML = '';
    
    if (conversations.length === 0) {
        listaConversas.innerHTML = '<p style="text-align: center; color: #708090; padding: 20px;">Nenhuma conversa ainda. Clique em "Nova Conversa" para começar!</p>';
        return;
    }

    conversations.forEach((conv, index) => {
        const outroUsuario = window.DB.findUser('id', conv.otherUserId);
        if (!outroUsuario) return;

        const inicial = outroUsuario.name.charAt(0).toUpperCase();
        const ultimaMensagem = conv.messages[conv.messages.length - 1];
        const horario = formatarHorario(new Date(ultimaMensagem.timestamp));
        const preview = ultimaMensagem.text.substring(0, 40) + (ultimaMensagem.text.length > 40 ? '...' : '');
        const naoLidas = conv.messages.filter(m => !m.read && m.senderId !== usuarioAtual.id).length;

        const conversaItem = document.createElement('div');
        conversaItem.className = 'conversa-item' + (conversaAtual === outroUsuario.id ? ' ativo' : '');
        conversaItem.dataset.userId = outroUsuario.id;
        conversaItem.innerHTML = `
            <div class="conversa-avatar">
                <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold;">
                    ${inicial}
                </div>
            </div>
            <div class="conversa-info">
                <h3>${outroUsuario.fullName}</h3>
                <p>${preview}</p>
                <span class="data-mensagem">${horario}</span>
            </div>
            ${naoLidas > 0 ? `<span class="badge-nao-lida">${naoLidas}</span>` : ''}
        `;

        conversaItem.addEventListener('click', function() {
            document.querySelectorAll('.conversa-item').forEach(i => i.classList.remove('ativo'));
            this.classList.add('ativo');
            abrirConversa(outroUsuario.id);
        });

        listaConversas.appendChild(conversaItem);
    });

    // Marcar conversa atual como ativa se existir
    if (conversaAtual) {
        const conversaAtualItem = listaConversas.querySelector(`[data-user-id="${conversaAtual}"]`);
        if (conversaAtualItem) {
            document.querySelectorAll('.conversa-item').forEach(i => i.classList.remove('ativo'));
            conversaAtualItem.classList.add('ativo');
        }
    }
}

function carregarContatos() {
    const listaContatos = document.getElementById('listaContatos');
    const buscaContatos = document.getElementById('buscaContatos');
    
    if (!listaContatos) {
        console.error('Elemento listaContatos não encontrado');
        return;
    }
    
    const todosUsuarios = window.DB.getAllUsers();
    const usuarios = todosUsuarios.filter(u => u.id !== usuarioAtual.id);

    function renderizarContatos(filtro = '') {
        listaContatos.innerHTML = '';
        
        const usuariosFiltrados = usuarios.filter(u => 
            u.fullName.toLowerCase().includes(filtro.toLowerCase()) ||
            u.name.toLowerCase().includes(filtro.toLowerCase()) ||
            (u.department && u.department.toLowerCase().includes(filtro.toLowerCase()))
        );

        if (usuariosFiltrados.length === 0) {
            listaContatos.innerHTML = '<p style="text-align: center; color: #708090; padding: 30px 20px; margin: 0;">Nenhum usuário encontrado.</p>';
            return;
        }

        usuariosFiltrados.forEach(usuario => {
            const inicial = usuario.name.charAt(0).toUpperCase();
            const contatoItem = document.createElement('div');
            contatoItem.className = 'contato-item';
            contatoItem.innerHTML = `
                <div class="contato-avatar">${inicial}</div>
                <div style="flex: 1;">
                    <p class="contato-nome">${usuario.fullName}</p>
                    ${usuario.department ? `<p style="font-size: 12px; color: #708090; margin: 2px 0 0 0;">${usuario.department}</p>` : ''}
                </div>
            `;
            contatoItem.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Clicou no contato:', usuario.fullName, 'ID:', usuario.id);
                iniciarConversa(usuario.id);
            });
            listaContatos.appendChild(contatoItem);
        });
    }

    // Limpar busca ao abrir modal
    if (buscaContatos) {
        buscaContatos.value = '';
        
        // Remover listeners anteriores
        const novoBusca = buscaContatos.cloneNode(true);
        buscaContatos.parentNode.replaceChild(novoBusca, buscaContatos);
        
        novoBusca.addEventListener('input', function(e) {
            renderizarContatos(e.target.value);
        });
    }

    renderizarContatos();
}

function iniciarConversa(userId) {
    console.log('=== INICIANDO CONVERSA ===');
    console.log('userId:', userId);
    console.log('usuarioAtual:', usuarioAtual);
    
    const modalNovaConversa = document.getElementById('modalNovaConversa');
    const buscaContatos = document.getElementById('buscaContatos');
    
    if (!userId) {
        console.error('userId é inválido');
        return;
    }
    
    // Fechar modal
    if (modalNovaConversa) {
        modalNovaConversa.classList.remove('show');
    }
    
    if (buscaContatos) {
        buscaContatos.value = '';
    }
    
    // Definir conversa atual
    conversaAtual = userId;
    console.log('conversaAtual definida como:', conversaAtual);
    
    // Abrir a conversa imediatamente
    abrirConversa(userId);
    
    // NÃO recarregar lista de conversas aqui para evitar voltar à conversa anterior
    // A lista será recarregada apenas quando enviar a primeira mensagem
    
    console.log('=== CONVERSA INICIADA ===');
}

function abrirConversa(userId) {
    console.log('=== ABRINDO CONVERSA ===');
    console.log('userId:', userId);
    
    conversaAtual = userId;
    const outroUsuario = window.DB.findUser('id', userId);
    
    console.log('outroUsuario:', outroUsuario);
    
    if (!outroUsuario) {
        console.error('Usuário não encontrado. userId:', userId);
        alert('Erro: Usuário não encontrado!');
        return;
    }

    // Atualizar header do chat
    const inicial = outroUsuario.name.charAt(0).toUpperCase();
    const chatHeader = document.querySelector('.chat-header .info-conversa');
    
    if (!chatHeader) {
        console.error('Elemento chat-header não encontrado');
        return;
    }
    
    chatHeader.innerHTML = `
        <div class="avatar-grande">
            <div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 22px; font-weight: bold;">
                ${inicial}
            </div>
            <span class="status-online"></span>
        </div>
        <div class="dados-contato">
            <h2>${outroUsuario.fullName}</h2>
            <p class="status-texto">${outroUsuario.department || 'Online'}</p>
        </div>
    `;

    console.log('Header atualizado');
    
    // Carregar mensagens
    carregarMensagens(userId);
    
    // Focar no input
    const inputMensagem = document.getElementById('inputMensagem');
    if (inputMensagem) {
        inputMensagem.focus();
    }
    
    console.log('=== CONVERSA ABERTA ===');
}

function carregarMensagens(userId, manterScroll = false) {
    const mensagensContainer = document.getElementById('mensagensContainer');
    const conversations = window.DB.getUserConversations(usuarioAtual.id);
    const conversa = conversations.find(c => c.otherUserId === userId);
    
    const scrollAntes = mensagensContainer.scrollTop;
    const scrollHeight = mensagensContainer.scrollHeight;
    
    mensagensContainer.innerHTML = '';

    if (!conversa || conversa.messages.length === 0) {
        const outroUsuario = window.DB.findUser('id', userId);
        const inicial = outroUsuario ? outroUsuario.name.charAt(0).toUpperCase() : '?';
        const nomeUsuario = outroUsuario ? outroUsuario.fullName : 'este usuário';
        
        mensagensContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 40px; text-align: center;">
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 36px; font-weight: bold; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">
                    ${inicial}
                </div>
                <h3 style="color: #1E3A5F; margin: 0 0 10px 0; font-size: 22px;">${nomeUsuario}</h3>
                <p style="color: #708090; margin: 0 0 20px 0; font-size: 15px;">Inicie uma conversa enviando a primeira mensagem!</p>
                <div style="padding: 12px 20px; background: linear-gradient(135deg, #f0f8ff, #e8f4ff); border-radius: 12px; border: 1px solid #d0e8ff;">
                    <i class="fa-solid fa-comment" style="color: #4A90E2; margin-right: 8px;"></i>
                    <span style="color: #4A90E2; font-weight: 600;">Digite sua mensagem abaixo</span>
                </div>
            </div>
        `;
        return;
    }

    const outroUsuario = window.DB.findUser('id', userId);
    const inicial = outroUsuario.name.charAt(0).toUpperCase();

    conversa.messages.forEach(msg => {
        const isEnviada = msg.senderId === usuarioAtual.id;
        const horario = formatarHorario(new Date(msg.timestamp));

        const mensagemDiv = document.createElement('div');
        mensagemDiv.className = 'mensagem ' + (isEnviada ? 'enviada' : 'recebida');
        
        if (isEnviada) {
            mensagemDiv.innerHTML = `
                <div class="conteudo-msg">
                    <div class="texto-msg">${escapeHtml(msg.text)}</div>
                    <span class="hora-msg">${horario}</span>
                </div>
            `;
        } else {
            mensagemDiv.innerHTML = `
                <div class="avatar-msg">
                    <div style="width: 35px; height: 35px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: bold;">
                        ${inicial}
                    </div>
                </div>
                <div class="conteudo-msg">
                    <div class="texto-msg">${escapeHtml(msg.text)}</div>
                    <span class="hora-msg">${horario}</span>
                </div>
            `;
        }

        mensagensContainer.appendChild(mensagemDiv);
    });

    // Gerenciar scroll
    if (manterScroll) {
        const novoScrollHeight = mensagensContainer.scrollHeight;
        mensagensContainer.scrollTop = scrollAntes + (novoScrollHeight - scrollHeight);
    } else {
        // Scroll automático para a última mensagem
        mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
    }

    // Marcar mensagens como lidas
    conversa.messages.forEach(msg => {
        if (msg.senderId !== usuarioAtual.id && !msg.read) {
            window.DB.markAsRead(msg.id);
        }
    });
}

function enviarMensagem() {
    const inputMensagem = document.getElementById('inputMensagem');
    const texto = inputMensagem.value.trim();
    
    if (!texto) {
        inputMensagem.focus();
        return;
    }
    
    if (!conversaAtual) {
        alert('Por favor, selecione um contato para enviar mensagens.');
        return;
    }

    console.log('=== ENVIANDO MENSAGEM ===');
    console.log('De:', usuarioAtual.id, '(', usuarioAtual.name, ')');
    console.log('Para:', conversaAtual);
    console.log('Texto:', texto);

    // Criar mensagem no banco de dados
    const resultado = window.DB.createMessage(usuarioAtual.id, conversaAtual, texto);
    
    console.log('Resultado:', resultado);

    if (resultado.success) {
        // Limpar input
        inputMensagem.value = '';
        
        // Recarregar mensagens imediatamente
        carregarMensagens(conversaAtual);
        
        // Atualizar lista de conversas
        setTimeout(() => {
            carregarConversas();
        }, 100);
        
        // Focar no input novamente
        inputMensagem.focus();
        
        console.log('=== MENSAGEM ENVIADA COM SUCESSO ===');
    } else {
        alert('Erro ao enviar mensagem!');
        console.error('Erro ao enviar mensagem');
    }
}

// Obter hora atual formatada
function obterHorarioAtual() {
    const agora = new Date();
    const horas = String(agora.getHours()).padStart(2, '0');
    const minutos = String(agora.getMinutes()).padStart(2, '0');
    return `${horas}:${minutos}`;
}

function formatarHorario(data) {
    const agora = new Date();
    const diff = agora - data;
    const horas = Math.floor(diff / (1000 * 60 * 60));
    
    if (horas < 24) {
        return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
    } else if (horas < 48) {
        return 'Ontem';
    } else {
        return `${data.getDate()}/${data.getMonth() + 1}`;
    }
}

// Escapar caracteres HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function mostrarEstadoVazio() {
    const mensagensContainer = document.getElementById('mensagensContainer');
    const chatHeader = document.querySelector('.chat-header .info-conversa');
    
    // Resetar header
    chatHeader.innerHTML = `
        <div class="dados-contato">
            <h2>Bem-vindo ao Chat</h2>
            <p class="status-texto">Selecione uma conversa para começar</p>
        </div>
    `;
    
    // Mostrar estado vazio
    mensagensContainer.innerHTML = `
        <div class="empty-chat-state">
            <div class="empty-chat-icon">
                <i class="fa-solid fa-comments"></i>
            </div>
            <h3>Selecione uma conversa</h3>
            <p>Escolha uma conversa existente na lista ao lado ou clique em "Nova Conversa" para começar a conversar.</p>
            <button class="btn-start-chat" onclick="document.getElementById('btnNovaConversa').click()">
                <i class="fa-solid fa-plus"></i>
                Iniciar Nova Conversa
            </button>
        </div>
    `;
    
    // Limpar conversa atual
    conversaAtual = null;
}
