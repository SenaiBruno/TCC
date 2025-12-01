document.addEventListener('DOMContentLoaded', function() {
    // Elementos das notificações
    const bellIcon = document.getElementById('bell-icon');
    const notificationsPopup = document.getElementById('notifications-popup');
    const markAllReadBtn = document.getElementById('mark-all-read');
    const notificationBadge = document.querySelector('.notification-badge');
    const unreadNotifications = document.querySelectorAll('.notification-item.unread');
    
    // Elementos do usuário
    const userAvatar = document.getElementById('user-avatar');
    const userGreeting = document.getElementById('user-greeting');
    
    // Configurar usuário
    function setupUser() {
        // Obter nome do sessionStorage ou usar padrão
        const username = sessionStorage.getItem('user_logged') || 'Usuário';
        const firstName = username.split(' ')[0] || 'Usuário';
        
        // Extrair primeira letra do nome para o avatar
        const firstLetter = firstName.charAt(0).toUpperCase();
        userAvatar.textContent = firstLetter;
        
        // Atualizar saudação com hora do dia
        const hour = new Date().getHours();
        let greeting = 'Bom dia';
        if (hour >= 12 && hour < 18) greeting = 'Boa tarde';
        else if (hour >= 18) greeting = 'Boa noite';
        
        userGreeting.textContent = `${greeting}, ${firstName}!`;
    }
    
    // Inicializar configurações do usuário
    setupUser();
    
    // Alternar a exibição do pop-up de notificações
    bellIcon.addEventListener('click', function(e) {
        e.preventDefault();
        notificationsPopup.classList.toggle('show');
    });
    
    // Marcar todas as notificações como lidas
    markAllReadBtn.addEventListener('click', function() {
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
            notification.style.animation = 'fadeIn 0.3s ease';
        });
        
        // Atualizar o badge de notificações
        updateNotificationBadge(0);
    });
    
    // Marcar notificação individual como lida
    document.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            if (this.classList.contains('unread')) {
                this.classList.remove('unread');
                const currentCount = parseInt(notificationBadge.textContent);
                updateNotificationBadge(currentCount - 1);
                
                // Simular ação da notificação
                const title = this.querySelector('.notification-title').textContent;
                console.log('Notificação clicada:', title);
            }
        });
    });
    
    // Fechar o pop-up ao clicar fora dele
    document.addEventListener('click', function(e) {
        if (!bellIcon.contains(e.target) && !notificationsPopup.contains(e.target)) {
            notificationsPopup.classList.remove('show');
        }
    });
    
    // Função para atualizar o badge de notificações
    function updateNotificationBadge(count) {
        if (count > 0) {
            notificationBadge.textContent = count;
            notificationBadge.style.display = 'flex';
        } else {
            notificationBadge.style.display = 'none';
        }
    }
    
    // Adicionar interatividade aos itens do menu inferior
    const menuItems = document.querySelectorAll('.bottom-menu i, .bottom-menu a');
    menuItems.forEach(item => {
        if (item.tagName === 'I') {
            item.addEventListener('click', function() {
                menuItems.forEach(i => i.classList.remove('active'));
                this.classList.add('active');
            });
        }
    });
    
    // Adicionar funcionalidade de pesquisa
    const searchInput = document.querySelector('.search input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(this.value);
        }
    });
    
    function performSearch(query) {
        if (query.trim()) {
            console.log('Buscando por:', query);
            // Aqui você pode adicionar lógica real de busca
        }
    }
    
    // Adicionar funcionalidade ao botão do banner com efeito
    const bannerButton = document.querySelector('.banner-content button');
    bannerButton.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 100);
        alert('Redirecionando para o feed de notícias...');
    });
    
    // Adicionar funcionalidade aos itens de categoria com animação
    const catItems = document.querySelectorAll('.cat-item');
    catItems.forEach((item, index) => {
        item.style.animation = `slideInUp 0.5s ease ${index * 0.1}s backwards`;
        
        item.addEventListener('click', function() {
            this.style.transform = 'scale(0.95)';
            const categoryName = this.querySelector('span').textContent;
            setTimeout(() => {
                this.style.transform = 'scale(1)';
                console.log('Abrindo categoria:', categoryName);
            }, 100);
        });
    });
    
    // Adicionar animação aos itens
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Adicionar funcionalidade ao botão de plus do menu
    const plusButton = document.querySelector('.plus');
    plusButton.addEventListener('click', function() {
        // Simular menu de ações rápidas
        console.log('Abrindo menu de ações rápidas...');
    });
});

// Redirecionamento para ranking ao clicar no troféu
document.addEventListener('DOMContentLoaded', function() {
    const trophyIcon = document.querySelector('.menu-trophy i');
    
    if (trophyIcon) {
        trophyIcon.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'ranking.html';
        });
    }
});

// Redirecionamento para mensagens ao clicar no comentário
document.addEventListener('DOMContentLoaded', function() {
    const messagesLink = document.querySelector('.menu-messages');
    
    if (messagesLink) {
        messagesLink.addEventListener('click', function(e) {
            window.location.href = 'mensagens.html';
        });
    }
});