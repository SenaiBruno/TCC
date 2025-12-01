document.addEventListener('DOMContentLoaded', function() {
    // Elementos do botão de nova conversa
    const btnNovaConversa = document.getElementById('btnNovaConversa');
    const modalNovaConversa = document.getElementById('modalNovaConversa');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const buscaConversa = document.getElementById('buscaConversa');
    const inputMensagem = document.getElementById('inputMensagem');
    const btnEnviar = document.getElementById('btnEnviar');
    const mensagensContainer = document.getElementById('mensagensContainer');
    const listaConversas = document.getElementById('listaConversas');

    // Mostrar nome do usuário logado (se disponível)
    const userLoggedNameEl = document.getElementById('userLoggedName');
    const loggedUser = sessionStorage.user_logged || sessionStorage.getItem('user_logged') || localStorage.remember_user || localStorage.getItem('remember_user');
    if (userLoggedNameEl && loggedUser) {
        userLoggedNameEl.textContent = loggedUser;
    }

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

    // Carregar contatos no modal
    function carregarContatos() {
        const listaContatos = document.getElementById('listaContatos');
        const contatos = [
            { nome: 'Ana Costa', avatar: 'A' },
            { nome: 'Bruno Lima', avatar: 'B' },
            { nome: 'Carolina Silva', avatar: 'C' },
            { nome: 'Diego Martins', avatar: 'D' },
            { nome: 'Érika Souza', avatar: 'E' }
        ];

        listaContatos.innerHTML = '';
        contatos.forEach(contato => {
            const contatoItem = document.createElement('div');
            contatoItem.className = 'contato-item';
            contatoItem.innerHTML = `
                <div class="contato-avatar">${contato.avatar}</div>
                <p class="contato-nome">${contato.nome}</p>
            `;
            contatoItem.addEventListener('click', function() {
                iniciarConversa(contato.nome);
            });
            listaContatos.appendChild(contatoItem);
        });
    }

    // Iniciar nova conversa
    function iniciarConversa(nomeContato) {
        const contatosSearch = document.getElementById('buscaContatos');
        contatosSearch.value = '';
        modalNovaConversa.classList.remove('show');
        
        // Você pode adicionar lógica adicional aqui para atualizar a conversa
        console.log('Iniciando conversa com:', nomeContato);
    }

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

    function enviarMensagem() {
        const texto = inputMensagem.value.trim();
        
        if (texto) {
            const mensagem = document.createElement('div');
            mensagem.className = 'mensagem enviada';
            mensagem.innerHTML = `
                <div class="conteudo-msg">
                    <div class="texto-msg">${escapeHtml(texto)}</div>
                    <span class="hora-msg">${obterHoraAtual()}</span>
                </div>
            `;
            
            mensagensContainer.appendChild(mensagem);
            inputMensagem.value = '';
            inputMensagem.focus();
            
            // Scroll automático para a última mensagem
            mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
            
            // Simular resposta após 1 segundo
            setTimeout(function() {
                const respostaSimulada = document.createElement('div');
                respostaSimulada.className = 'mensagem recebida';
                respostaSimulada.innerHTML = `
                    <div class="avatar-msg">
                        <img src="../img/avatar1.jpg" alt="Usuário">
                    </div>
                    <div class="conteudo-msg">
                        <div class="texto-msg">Entendi! Obrigado pela mensagem 😊</div>
                        <span class="hora-msg">${obterHoraAtual()}</span>
                    </div>
                `;
                mensagensContainer.appendChild(respostaSimulada);
                mensagensContainer.scrollTop = mensagensContainer.scrollHeight;
            }, 1000);
        }
    }

    // Obter hora atual formatada
    function obterHoraAtual() {
        const agora = new Date();
        const horas = String(agora.getHours()).padStart(2, '0');
        const minutos = String(agora.getMinutes()).padStart(2, '0');
        return `${horas}:${minutos}`;
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

    // Clicar em conversa
    const conversasItems = document.querySelectorAll('.conversa-item');
    conversasItems.forEach(item => {
        item.addEventListener('click', function() {
            conversasItems.forEach(i => i.classList.remove('ativo'));
            this.classList.add('ativo');
        });
    });

    // Menu inferior - adicionar classe ativa
    const menuLinks = document.querySelectorAll('.bottom-menu a');
    menuLinks.forEach(link => {
        if (link.href.includes('mensagens.html')) {
            link.classList.add('active');
        }
    });
});
