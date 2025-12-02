// Sistema de Banco de Dados Local - ConectaHub
// Gerencia usuários, mensagens e dados da aplicação usando localStorage

const DB = {
    // ========== CONFIGURAÇÃO ==========
    STORAGE_KEYS: {
        USERS: 'conectahub_users',
        MESSAGES: 'conectahub_messages',
        CURRENT_USER: 'conectahub_current_user',
        TASKS: 'conectahub_tasks'
    },

    // ========== USUÁRIOS ==========
    
    // Obter todos os usuários
    getAllUsers() {
        const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
        return users ? JSON.parse(users) : [];
    },

    // Salvar lista de usuários
    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    // Criar novo usuário
    createUser(userData) {
        const users = this.getAllUsers();
        
        // Verificar se email já existe
        if (users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, error: 'Email já cadastrado' };
        }

        const newUser = {
            id: this.generateId(),
            fullName: userData.fullName,
            name: userData.fullName.split(' ')[0],
            email: userData.email.toLowerCase(),
            password: userData.password,
            department: userData.department,
            departmentValue: userData.departmentValue,
            role: userData.role || 'Colaborador',
            position: userData.position || 'Novo Colaborador',
            phone: userData.phone || '',
            location: userData.location || '',
            registrationDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            avatar: userData.avatar || null,
            isAdmin: userData.isAdmin || false,
            stats: {
                productivity: 0,
                tasks: 0,
                projects: 0
            },
            skills: [],
            recentActivities: [],
            notifications: []
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, user: newUser };
    },

    // Buscar usuário por campo específico
    findUser(field, value) {
        const users = this.getAllUsers();
        
        // Se apenas um argumento for passado, busca por email/nome
        if (value === undefined) {
            const search = field.toLowerCase();
            return users.find(user => 
                user.email.toLowerCase() === search ||
                user.name.toLowerCase() === search ||
                user.fullName.toLowerCase() === search
            );
        }
        
        // Se dois argumentos, busca pelo campo específico
        if (field === 'id') {
            return users.find(user => user.id === value);
        }
        
        const search = value.toLowerCase();
        return users.find(user => {
            const fieldValue = user[field];
            return fieldValue && fieldValue.toString().toLowerCase() === search;
        });
    },

    // Validar login
    validateLogin(identifier, password) {
        const user = this.findUser(identifier);
        
        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Senha incorreta' };
        }

        // Atualizar último login
        user.lastLogin = new Date().toISOString();
        this.updateUser(user.id, { lastLogin: user.lastLogin });

        return { success: true, user: user };
    },

    // Atualizar usuário
    updateUser(userId, updates) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        users[index] = { ...users[index], ...updates };
        this.saveUsers(users);

        return { success: true, user: users[index] };
    },

    // Deletar usuário
    deleteUser(userId) {
        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        this.saveUsers(filtered);
        return { success: true };
    },

    // ========== SESSÃO ==========

    // Fazer login (criar sessão)
    login(user) {
        sessionStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem('user_logged', user.name);
        sessionStorage.setItem('user_is_admin', user.isAdmin ? 'true' : 'false');
    },

    // Fazer logout
    logout() {
        sessionStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem('user_logged');
        sessionStorage.removeItem('user_is_admin');
    },

    // Obter usuário logado
    getCurrentUser() {
        const user = sessionStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    // Verificar se está logado
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    // Verificar se é admin
    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.isAdmin === true;
    },

    // Criar admin padrão se não existir
    createDefaultAdmin() {
        const users = this.getAllUsers();
        const adminExists = users.find(u => u.email === 'admin@conectahub.com');
        
        if (!adminExists) {
            const adminUser = {
                fullName: 'Administrador',
                email: 'admin@conectahub.com',
                password: 'admin123',
                department: 'Administração',
                departmentValue: 'admin',
                role: 'Administrador',
                position: 'Administrador do Sistema',
                phone: '(00) 00000-0000',
                location: 'Sistema',
                isAdmin: true
            };
            
            const result = this.createUser(adminUser);
            if (result.success) {
                console.log('✅ Usuário admin criado com sucesso!');
                console.log('📧 Email: admin@conectahub.com');
                console.log('🔑 Senha: admin123');
                return result.user;
            }
        } else {
            console.log('ℹ️ Admin já existe no sistema');
        }
        return null;
    },

    // ========== MENSAGENS ==========

    // Obter todas as mensagens
    getAllMessages() {
        const messages = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        return messages ? JSON.parse(messages) : [];
    },

    // Salvar mensagens
    saveMessages(messages) {
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    },

    // Criar nova mensagem
    createMessage(fromUserId, toUserId, content) {
        const messages = this.getAllMessages();
        
        const newMessage = {
            id: this.generateId(),
            fromUserId: fromUserId,
            toUserId: toUserId,
            content: content,
            timestamp: new Date().toISOString(),
            read: false
        };

        messages.push(newMessage);
        this.saveMessages(messages);

        return { success: true, message: newMessage };
    },

    // Obter conversas de um usuário (formato organizado)
    getUserConversations(userId) {
        const messages = this.getAllMessages();
        const users = this.getAllUsers();
        const conversationsMap = {};

        messages.forEach(msg => {
            let otherUserId;
            if (msg.fromUserId === userId) {
                otherUserId = msg.toUserId;
            } else if (msg.toUserId === userId) {
                otherUserId = msg.fromUserId;
            } else {
                return;
            }

            if (!conversationsMap[otherUserId]) {
                conversationsMap[otherUserId] = {
                    otherUserId: otherUserId,
                    messages: []
                };
            }

            // Padronizar formato da mensagem
            conversationsMap[otherUserId].messages.push({
                id: msg.id,
                senderId: msg.fromUserId,
                receiverId: msg.toUserId,
                text: msg.content,
                timestamp: msg.timestamp,
                read: msg.read
            });
        });

        // Ordenar mensagens por data em cada conversa
        Object.values(conversationsMap).forEach(conv => {
            conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        // Retornar array de conversas ordenado pela mensagem mais recente
        return Object.values(conversationsMap).sort((a, b) => {
            const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return new Date(lastB) - new Date(lastA);
        });
    },

    // Marcar mensagens como lidas
    markAsRead(messageId) {
        const messages = this.getAllMessages();
        const msg = messages.find(m => m.id === messageId);
        if (msg) {
            msg.read = true;
            this.saveMessages(messages);
        }
    },

    // ========== TAREFAS ==========

    // Obter todas as tarefas
    getAllTasks() {
        const tasks = localStorage.getItem(this.STORAGE_KEYS.TASKS);
        return tasks ? JSON.parse(tasks) : [];
    },

    // Salvar tarefas
    saveTasks(tasks) {
        localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    },

    // Criar nova tarefa (apenas administradores)
    createTask(taskData) {
        // Verificar se usuário é admin
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            return { success: false, error: 'Apenas administradores podem criar tarefas' };
        }

        // Validar dados obrigatórios
        if (!taskData.title || !taskData.department) {
            return { success: false, error: 'Título e departamento são obrigatórios' };
        }

        const tasks = this.getAllTasks();
        
        const newTask = {
            id: this.generateId(),
            title: taskData.title,
            description: taskData.description || '',
            department: taskData.department,
            departmentValue: taskData.departmentValue,
            createdBy: currentUser.id,
            createdByName: currentUser.fullName,
            createdAt: new Date().toISOString(),
            points: taskData.points || 10,
            status: 'pending', // pending, in_progress, completed
            assignedTo: null
        };

        tasks.push(newTask);
        this.saveTasks(tasks);

        // Notificar todos os usuários do departamento
        this.notifyDepartment(taskData.departmentValue, {
            type: 'new_task',
            taskId: newTask.id,
            title: 'Nova tarefa disponível',
            description: `${taskData.title}`,
            icon: 'fa-clipboard-list'
        });

        return { success: true, task: newTask };
    },

    // Obter tarefas por departamento
    getTasksByDepartment(departmentValue) {
        const tasks = this.getAllTasks();
        return tasks.filter(task => task.departmentValue === departmentValue);
    },

    // Obter tarefas do usuário
    getUserTasks(userId) {
        const tasks = this.getAllTasks();
        return tasks.filter(task => task.assignedTo === userId);
    },

    // Atribuir tarefa a usuário
    assignTask(taskId, userId) {
        const tasks = this.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return { success: false, error: 'Tarefa não encontrada' };
        }

        if (task.assignedTo) {
            return { success: false, error: 'Tarefa já atribuída' };
        }

        task.assignedTo = userId;
        task.status = 'in_progress';
        task.assignedAt = new Date().toISOString();
        
        this.saveTasks(tasks);
        return { success: true, task: task };
    },

    // Completar tarefa
    completeTask(taskId) {
        const tasks = this.getAllTasks();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return { success: false, error: 'Tarefa não encontrada' };
        }

        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        
        this.saveTasks(tasks);

        // Atualizar stats do usuário
        if (task.assignedTo) {
            const user = this.findUser('id', task.assignedTo);
            if (user) {
                const updatedStats = {
                    ...user.stats,
                    tasks: (user.stats.tasks || 0) + 1,
                    productivity: (user.stats.productivity || 0) + task.points
                };
                
                // Adicionar atividade recente
                if (!user.recentActivities) {
                    user.recentActivities = [];
                }
                
                user.recentActivities.unshift({
                    icon: 'fa-solid fa-clipboard-check',
                    description: `Completou a tarefa "${task.title}"`,
                    date: new Date().toLocaleString('pt-BR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                });
                
                // Manter apenas as últimas 10 atividades
                if (user.recentActivities.length > 10) {
                    user.recentActivities = user.recentActivities.slice(0, 10);
                }
                
                this.updateUser(user.id, { 
                    stats: updatedStats,
                    recentActivities: user.recentActivities
                });
                
                // Atualizar sessão se for o usuário atual
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === user.id) {
                    this.login(user);
                }
            }
        }

        return { success: true, task: task };
    },

    // ========== NOTIFICAÇÕES ==========

    // Notificar todos os usuários de um departamento
    notifyDepartment(departmentValue, notificationData) {
        const users = this.getAllUsers();
        const departmentUsers = users.filter(u => u.departmentValue === departmentValue);

        departmentUsers.forEach(user => {
            if (!user.notifications) {
                user.notifications = [];
            }

            const notification = {
                id: this.generateId(),
                type: notificationData.type,
                taskId: notificationData.taskId,
                title: notificationData.title,
                description: notificationData.description,
                icon: notificationData.icon || 'fa-bell',
                timestamp: new Date().toISOString(),
                read: false
            };

            user.notifications.unshift(notification);

            // Manter apenas as últimas 50 notificações
            if (user.notifications.length > 50) {
                user.notifications = user.notifications.slice(0, 50);
            }
        });

        this.saveUsers(users);
    },

    // Marcar notificação como lida
    markNotificationAsRead(notificationId) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, error: 'Usuário não encontrado' };

        const users = this.getAllUsers();
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user || !user.notifications) {
            return { success: false, error: 'Notificações não encontradas' };
        }

        const notification = user.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.saveUsers(users);
            
            // Atualizar sessão
            this.login(user);
            
            return { success: true };
        }

        return { success: false, error: 'Notificação não encontrada' };
    },

    // Marcar todas as notificações como lidas
    markAllNotificationsAsRead() {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return { success: false, error: 'Usuário não encontrado' };

        const users = this.getAllUsers();
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user || !user.notifications) {
            return { success: false, error: 'Notificações não encontradas' };
        }

        user.notifications.forEach(n => n.read = true);
        this.saveUsers(users);
        
        // Atualizar sessão
        this.login(user);
        
        return { success: true };
    },

    // Obter notificações não lidas
    getUnreadNotificationsCount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.notifications) return 0;
        return currentUser.notifications.filter(n => !n.read).length;
    },

    // ========== UTILITÁRIOS ==========

    // Gerar ID único
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Limpar todo o banco de dados
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEYS.USERS);
        localStorage.removeItem(this.STORAGE_KEYS.MESSAGES);
        sessionStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem('user_logged');
    },

    // Exportar dados (para backup)
    exportData() {
        return {
            users: this.getAllUsers(),
            messages: this.getAllMessages(),
            exportDate: new Date().toISOString()
        };
    },

    // Importar dados (de backup)
    importData(data) {
        if (data.users) this.saveUsers(data.users);
        if (data.messages) this.saveMessages(data.messages);
    },

    // Obter estatísticas
    getStats() {
        return {
            totalUsers: this.getAllUsers().length,
            totalMessages: this.getAllMessages().length,
            activeUser: this.getCurrentUser() ? 1 : 0
        };
    },

    // Inicializar com dados de exemplo (opcional)
    seedDatabase() {
        const users = this.getAllUsers();
        
        if (users.length === 0) {
            // Criar alguns usuários exemplo
            const exampleUsers = [
                {
                    fullName: 'João Silva',
                    email: 'joao@conectahub.com',
                    password: '123456',
                    department: 'Tecnologia',
                    departmentValue: 'ti',
                    role: 'Desenvolvedor'
                },
                {
                    fullName: 'Maria Santos',
                    email: 'maria@conectahub.com',
                    password: '123456',
                    department: 'Recursos Humanos',
                    departmentValue: 'rh',
                    role: 'Analista de RH'
                }
            ];

            exampleUsers.forEach(user => this.createUser(user));
            console.log('Banco de dados inicializado com usuários exemplo');
        }
    }
};

// Exportar para uso global
window.DB = DB;

// Criar admin padrão automaticamente ao carregar
DB.createDefaultAdmin();

// Log de inicialização
console.log('Sistema de Banco de Dados ConectaHub carregado');
console.log('Estatísticas:', DB.getStats());
console.log('==================================');
console.log('LOGIN ADMIN PADRÃO:');
console.log('Email: admin@conectahub.com');
console.log('Senha: admin123');
console.log('==================================');
