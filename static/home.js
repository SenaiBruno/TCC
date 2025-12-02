document.addEventListener('DOMContentLoaded', function() {
    // Elementos das notificações
    const bellIcon = document.getElementById('bell-icon');
    const notificationsPopup = document.getElementById('notifications-popup');
    const markAllReadBtn = document.getElementById('mark-all-read');
    const notificationBadge = document.querySelector('.notification-badge');
    
    // Botão de logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Deseja realmente sair?')) {
                if (window.DB) {
                    window.DB.logout();
                }
                window.location.href = 'login.html';
            }
        });
    }
    
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

        // Mostrar botão de admin se o usuário for admin
        if (window.DB && window.DB.isAdmin()) {
            const adminBtn = document.getElementById('admin-panel-btn');
            if (adminBtn) {
                adminBtn.style.display = 'block';
            }
            
            // Mostrar botão de criar tarefa
            const createTaskBtn = document.getElementById('create-task-btn');
            if (createTaskBtn) {
                createTaskBtn.style.display = 'block';
                createTaskBtn.addEventListener('click', openCreateTaskModal);
            }
        }
    }
    
    // Carregar notificações do usuário
    function loadNotifications() {
        const currentUser = window.DB ? window.DB.getCurrentUser() : null;
        
        if (!currentUser || !currentUser.notifications || currentUser.notifications.length === 0) {
            // Usuário sem notificações - mostrar mensagem
            const existingNotifications = notificationsPopup.querySelectorAll('.notification-item');
            existingNotifications.forEach(item => item.remove());
            
            const emptyMessage = document.createElement('div');
            emptyMessage.style.cssText = 'padding: 20px; text-align: center; color: #708090;';
            emptyMessage.textContent = 'Você não tem notificações no momento.';
            notificationsPopup.appendChild(emptyMessage);
            
            // Esconder badge
            updateNotificationBadge(0);
        } else {
            // Limpar notificações existentes
            const existingNotifications = notificationsPopup.querySelectorAll('.notification-item');
            existingNotifications.forEach(item => item.remove());
            
            // Renderizar notificações do usuário
            currentUser.notifications.forEach(notification => {
                const notifElement = createNotificationElement(notification);
                notificationsPopup.appendChild(notifElement);
            });
            
            // Carregar notificações do usuário
            const unreadCount = currentUser.notifications.filter(n => !n.read).length;
            updateNotificationBadge(unreadCount);
        }
    }
    
    // Criar elemento de notificação
    function createNotificationElement(notification) {
        const div = document.createElement('div');
        div.className = `notification-item${!notification.read ? ' unread' : ''}`;
        div.dataset.notificationId = notification.id;
        
        const iconClass = notification.icon || 'fa-bell';
        const timeAgo = getTimeAgo(notification.timestamp);
        
        div.innerHTML = `
            <div class="notification-icon">
                <i class="fa-solid ${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-desc">${notification.description}</div>
                <div class="notification-time">${timeAgo}</div>
            </div>
        `;
        
        div.addEventListener('click', function() {
            if (!notification.read) {
                window.DB.markNotificationAsRead(notification.id);
                div.classList.remove('unread');
                const currentCount = parseInt(notificationBadge.textContent) || 0;
                updateNotificationBadge(currentCount - 1);
            }
        });
        
        return div;
    }
    
    // Calcular tempo decorrido
    function getTimeAgo(timestamp) {
        const now = new Date();
        const notifTime = new Date(timestamp);
        const diffMs = now - notifTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `Há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 7) return `Há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        return notifTime.toLocaleDateString('pt-BR');
    }
    
    // Inicializar configurações do usuário
    setupUser();
    loadNotifications();
    updatePerformanceChart();
    
    // Função para atualizar gráfico de desempenho
    function updatePerformanceChart() {
        const currentUser = window.DB ? window.DB.getCurrentUser() : null;
        let completedPercent = 0;
        
        if (currentUser && currentUser.stats) {
            const totalTasks = currentUser.stats.tasks || 0;
            const completedTasks = Math.floor(totalTasks * 0.8); // Simular 80% concluído
            completedPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        }
        
        const pendingPercent = 100 - completedPercent;
        
        // Atualizar textos
        document.getElementById('tasks-completed').textContent = `${completedPercent}% de tarefas concluídas`;
        document.getElementById('tasks-pending').textContent = `${pendingPercent}% de tarefas pendentes`;
        document.getElementById('progress-percent').textContent = completedPercent;
        
        // Atualizar gráfico circular
        const circle = document.getElementById('performance-circle');
        circle.setAttribute('data-progress', completedPercent);
        
        const degrees = (completedPercent / 100) * 360;
        circle.style.background = `conic-gradient(
            #4A90E2 0deg ${degrees}deg,
            #e0e0e0 ${degrees}deg 360deg
        )`;
    }
    
    // Alternar a exibição do pop-up de notificações
    bellIcon.addEventListener('click', function(e) {
        e.preventDefault();
        notificationsPopup.classList.toggle('show');
    });
    
    // Marcar todas as notificações como lidas
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', function() {
            if (window.DB) {
                window.DB.markAllNotificationsAsRead();
                const unreadNotifications = document.querySelectorAll('.notification-item.unread');
                unreadNotifications.forEach(notification => {
                    notification.classList.remove('unread');
                    notification.style.animation = 'fadeIn 0.3s ease';
                });
                
                // Atualizar o badge de notificações
                updateNotificationBadge(0);
            }
        });
    }
    
    // Remover event listeners antigos de notificações individuais (serão criados dinamicamente)
    
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
    
    // Adicionar funcionalidade ao botão de plus do menu -> abrir modal de tarefas
    const plusButton = document.querySelector('.plus');
    plusButton.addEventListener('click', function() {
        openTasksModal();
    });

    // ========== MODAL DE TAREFAS DISPONÍVEIS ==========
    function openTasksModal() {
        const modal = document.getElementById('modal-tasks');
        if (!window.DB) return alert('Base de dados indisponível.');
        const currentUser = window.DB.getCurrentUser();
        if (!currentUser) return (window.location.href = 'login.html');

        // Mostrar modal
        if (modal) {
            modal.style.display = 'flex';
        }

        renderAvailableTasks();
    }

    function closeTasksModal() {
        const modal = document.getElementById('modal-tasks');
        if (modal) modal.style.display = 'none';
    }

    function renderAvailableTasks() {
        const list = document.getElementById('tasks-list');
        const empty = document.getElementById('tasks-empty');
        if (!list) return;

        const currentUser = window.DB.getCurrentUser();
        const allTasks = window.DB.getAllTasks();
        const available = allTasks
            .filter(t => t.departmentValue === currentUser.departmentValue && t.status === 'pending' && !t.assignedTo)
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

        list.innerHTML = '';
        if (available.length === 0) {
            empty.style.display = 'block';
            return;
        }
        empty.style.display = 'none';

        available.forEach(task => {
            const el = document.createElement('div');
            el.className = 'task-item';
            el.innerHTML = `
                <div>
                    <div class="task-title">${task.title}</div>
                    ${task.description ? `<div class="task-desc">${task.description}</div>` : ''}
                    <div class="task-meta">
                        <span><i class="fa-solid fa-building"></i> ${task.department}</span>
                        <span><i class="fa-solid fa-star"></i> ${task.points} XP</span>
                        <span><i class="fa-solid fa-clock"></i> ${new Date(task.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-accept" data-task-id="${task.id}"><i class="fa-solid fa-check"></i> Aceitar</button>
                </div>
            `;
            list.appendChild(el);
        });

        // bind accepts
        list.querySelectorAll('.btn-accept').forEach(btn => {
            btn.addEventListener('click', function() {
                const taskId = this.getAttribute('data-task-id');
                const res = window.DB.assignTask(taskId, window.DB.getCurrentUser().id);
                if (res.success) {
                    this.textContent = 'Aceita';
                    this.disabled = true;
                    // Recarregar gráfico e possivelmente lista (remove item)
                    renderAvailableTasks();
                    alert('Tarefa aceita! Ela aparecerá em suas atividades.');
                } else {
                    alert('Não foi possível aceitar: ' + res.error);
                }
            });
        });
    }
    
    // ========== MODAL DE CRIAR TAREFA ==========
    
    function openCreateTaskModal() {
        const modal = document.getElementById('modal-create-task');
        if (modal) {
            modal.style.display = 'flex';
        }
    }
    
    function closeCreateTaskModal() {
        const modal = document.getElementById('modal-create-task');
        if (modal) {
            modal.style.display = 'none';
            // Limpar formulário
            document.getElementById('form-create-task').reset();
        }
    }
    
    // Event listeners do modal
    const closeModalBtn = document.getElementById('close-create-task');
    const cancelBtn = document.getElementById('cancel-create-task');
    const formCreateTask = document.getElementById('form-create-task');
    const closeTasksBtn = document.getElementById('close-tasks');
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeCreateTaskModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeCreateTaskModal);
    }

    if (closeTasksBtn) {
        closeTasksBtn.addEventListener('click', closeTasksModal);
    }
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(e) {
        const modalCreate = document.getElementById('modal-create-task');
        const modalTasks = document.getElementById('modal-tasks');
        if (e.target === modalCreate) closeCreateTaskModal();
        if (e.target === modalTasks) closeTasksModal();
    });
    
    // Submit do formulário de criar tarefa
    if (formCreateTask) {
        formCreateTask.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const title = document.getElementById('task-title').value.trim();
            const description = document.getElementById('task-description').value.trim();
            const departmentSelect = document.getElementById('task-department');
            const departmentValue = departmentSelect.value;
            const department = departmentSelect.options[departmentSelect.selectedIndex].text;
            const points = parseInt(document.getElementById('task-points').value);
            
            if (!title || !departmentValue) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            // Criar tarefa usando o DB
            const result = window.DB.createTask({
                title: title,
                description: description,
                department: department,
                departmentValue: departmentValue,
                points: points
            });
            
            if (result.success) {
                alert(`✅ Tarefa criada com sucesso!\\n\\nTodos os usuários do departamento "${department}" foram notificados.`);
                closeCreateTaskModal();
                
                // Recarregar notificações para ver a confirmação
                loadNotifications();
            } else {
                alert(`❌ Erro ao criar tarefa: ${result.error}`);
            }
        });
    }
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