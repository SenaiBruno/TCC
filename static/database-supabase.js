// Sistema de Banco de Dados com Supabase - ConectaHub
// Versão híbrida: funciona com Supabase (online) ou localStorage (fallback)

const DB = {
    // Modo de operação: 'supabase' ou 'localStorage'
    mode: 'localStorage',
    
    // Chaves de armazenamento local (fallback)
    STORAGE_KEYS: {
        USERS: 'conectahub_users',
        MESSAGES: 'conectahub_messages',
        CURRENT_USER: 'conectahub_current_user',
        TASKS: 'conectahub_tasks'
    },

    // ========== INICIALIZAÇÃO ==========
    
    async init() {
        // Tentar usar Supabase se disponível
        if (window.supabaseClient) {
            this.mode = 'supabase';
            console.log('✅ Modo: Supabase (Online)');
        } else {
            this.mode = 'localStorage';
            console.log('⚠️ Modo: localStorage (Offline)');
            this.createDefaultAdmin();
        }
    },

    // ========== USUÁRIOS ==========
    
    getAllUsers() {
        if (this.mode === 'supabase') {
            // Versão síncrona não suportada em Supabase - usar localStorage como fallback
            console.warn('getAllUsers síncrono não suportado em modo Supabase');
            return [];
        } else {
            const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        }
    },
    
    async getAllUsersAsync() {
        if (this.mode === 'supabase') {
            const { data, error } = await supabaseClient
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Erro ao buscar usuários:', error);
                return [];
            }
            return this.convertUsersFromDB(data);
        } else {
            const users = localStorage.getItem(this.STORAGE_KEYS.USERS);
            return users ? JSON.parse(users) : [];
        }
    },

    saveUsers(users) {
        if (this.mode === 'localStorage') {
            localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
        }
        // Em modo Supabase, não salvamos em lote (usamos operações individuais)
    },

    async createUser(userData) {
        if (this.mode === 'supabase') {
            // Verificar se email já existe
            const { data: existing } = await supabaseClient
                .from('users')
                .select('id')
                .eq('email', userData.email.toLowerCase())
                .single();
            
            if (existing) {
                return { success: false, error: 'Email já cadastrado' };
            }

            const newUser = {
                full_name: userData.fullName,
                name: userData.fullName.split(' ')[0],
                email: userData.email.toLowerCase(),
                password: userData.password,
                department: userData.department,
                department_value: userData.departmentValue,
                role: userData.role || 'Colaborador',
                position: userData.position || 'Novo Colaborador',
                phone: userData.phone || '',
                location: userData.location || '',
                is_admin: userData.isAdmin || false,
                stats: { productivity: 0, tasks: 0, projects: 0 },
                skills: [],
                recent_activities: []
            };

            const { data, error } = await supabaseClient
                .from('users')
                .insert([newUser])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar usuário:', error);
                return { success: false, error: error.message };
            }

            return { success: true, user: this.convertUserFromDB(data) };
        } else {
            // Modo localStorage (código original)
            const users = await this.getAllUsersAsync();
            
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
                stats: { productivity: 0, tasks: 0, projects: 0 },
                skills: [],
                recentActivities: [],
                notifications: []
            };

            users.push(newUser);
            this.saveUsers(users);

            return { success: true, user: newUser };
        }
    },

    async findUser(field, value) {
        if (this.mode === 'supabase') {
            let query = supabaseClient.from('users').select('*');
            
            if (value === undefined) {
                // Busca por email ou nome
                const search = field.toLowerCase();
                const { data } = await query.or(`email.eq.${search},name.ilike.${search},full_name.ilike.${search}`);
                return data && data.length > 0 ? this.convertUserFromDB(data[0]) : null;
            } else {
                // Busca por campo específico
                if (field === 'id') {
                    const { data } = await query.eq('id', value).single();
                    return data ? this.convertUserFromDB(data) : null;
                } else {
                    const { data } = await query.eq(field, value).single();
                    return data ? this.convertUserFromDB(data) : null;
                }
            }
        } else {
            // Modo localStorage (código original)
            const users = await this.getAllUsersAsync();
            
            if (value === undefined) {
                const search = field.toLowerCase();
                return users.find(user => 
                    user.email.toLowerCase() === search ||
                    user.name.toLowerCase() === search ||
                    user.fullName.toLowerCase() === search
                );
            }
            
            if (field === 'id') {
                return users.find(user => user.id === value);
            }
            
            const search = value.toLowerCase();
            return users.find(user => {
                const fieldValue = user[field];
                return fieldValue && fieldValue.toString().toLowerCase() === search;
            });
        }
    },

    async validateLogin(identifier, password) {
        const user = await this.findUser(identifier);
        
        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        if (user.password !== password) {
            return { success: false, error: 'Senha incorreta' };
        }

        // Atualizar último login
        if (this.mode === 'supabase') {
            await supabaseClient
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
        } else {
            user.lastLogin = new Date().toISOString();
            await this.updateUser(user.id, { lastLogin: user.lastLogin });
        }

        return { success: true, user: user };
    },

    async updateUser(userId, updates) {
        if (this.mode === 'supabase') {
            const dbUpdates = this.convertUserToDB(updates);
            
            const { data, error } = await supabaseClient
                .from('users')
                .update(dbUpdates)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atualizar usuário:', error);
                return { success: false, error: error.message };
            }

            return { success: true, user: this.convertUserFromDB(data) };
        } else {
            const users = this.getAllUsers();
            const index = users.findIndex(u => u.id === userId);
            
            if (index === -1) {
                return { success: false, error: 'Usuário não encontrado' };
            }

            users[index] = { ...users[index], ...updates };
            this.saveUsers(users);

            return { success: true, user: users[index] };
        }
    },

    // ========== TAREFAS ==========
    
    getAllTasks() {
        if (this.mode === 'supabase') {
            console.warn('getAllTasks síncrono não suportado em modo Supabase');
            return [];
        } else {
            const tasks = localStorage.getItem(this.STORAGE_KEYS.TASKS);
            return tasks ? JSON.parse(tasks) : [];
        }
    },
    
    async getAllTasksAsync() {
        if (this.mode === 'supabase') {
            const { data, error } = await supabaseClient
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('Erro ao buscar tarefas:', error);
                return [];
            }
            return this.convertTasksFromDB(data);
        } else {
            const tasks = localStorage.getItem(this.STORAGE_KEYS.TASKS);
            return tasks ? JSON.parse(tasks) : [];
        }
    },

    saveTasks(tasks) {
        if (this.mode === 'localStorage') {
            localStorage.setItem(this.STORAGE_KEYS.TASKS, JSON.stringify(tasks));
        }
    },

    async createTask(taskData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.isAdmin) {
            return { success: false, error: 'Apenas administradores podem criar tarefas' };
        }

        if (!taskData.title || !taskData.department) {
            return { success: false, error: 'Título e departamento são obrigatórios' };
        }

        if (this.mode === 'supabase') {
            const newTask = {
                title: taskData.title,
                description: taskData.description || '',
                department: taskData.department,
                department_value: taskData.departmentValue,
                created_by: currentUser.id,
                created_by_name: currentUser.fullName,
                points: taskData.points || 10,
                status: 'pending'
            };

            const { data, error } = await supabaseClient
                .from('tasks')
                .insert([newTask])
                .select()
                .single();

            if (error) {
                console.error('Erro ao criar tarefa:', error);
                return { success: false, error: error.message };
            }

            // Notificar departamento
            await this.notifyDepartment(taskData.departmentValue, {
                type: 'new_task',
                taskId: data.id,
                title: 'Nova tarefa disponível',
                description: taskData.title,
                icon: 'fa-clipboard-list'
            });

            return { success: true, task: this.convertTaskFromDB(data) };
        } else {
            // Modo localStorage (código original)
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
                status: 'pending',
                assignedTo: null
            };

            tasks.push(newTask);
            this.saveTasks(tasks);

            await this.notifyDepartment(taskData.departmentValue, {
                type: 'new_task',
                taskId: newTask.id,
                title: 'Nova tarefa disponível',
                description: taskData.title,
                icon: 'fa-clipboard-list'
            });

            return { success: true, task: newTask };
        }
    },

    async assignTask(taskId, userId) {
        if (this.mode === 'supabase') {
            const { data: task } = await supabaseClient
                .from('tasks')
                .select('*')
                .eq('id', taskId)
                .single();
            
            if (!task) {
                return { success: false, error: 'Tarefa não encontrada' };
            }

            if (task.assigned_to) {
                return { success: false, error: 'Tarefa já atribuída' };
            }

            const { data, error } = await supabaseClient
                .from('tasks')
                .update({
                    assigned_to: userId,
                    status: 'in_progress',
                    assigned_at: new Date().toISOString()
                })
                .eq('id', taskId)
                .select()
                .single();

            if (error) {
                console.error('Erro ao atribuir tarefa:', error);
                return { success: false, error: error.message };
            }

            return { success: true, task: this.convertTaskFromDB(data) };
        } else {
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
        }
    },

    async completeTask(taskId) {
        const tasks = await this.getAllTasksAsync();
        const task = tasks.find(t => t.id === taskId);
        
        if (!task) {
            return { success: false, error: 'Tarefa não encontrada' };
        }

        if (this.mode === 'supabase') {
            const { error } = await supabaseClient
                .from('tasks')
                .update({
                    status: 'completed',
                    completed_at: new Date().toISOString()
                })
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao completar tarefa:', error);
                return { success: false, error: error.message };
            }
        } else {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            this.saveTasks(tasks);
        }

        // Atualizar stats do usuário
        if (task.assignedTo || task.assigned_to) {
            const userId = task.assignedTo || task.assigned_to;
            const user = await this.findUser('id', userId);
            
            if (user) {
                const updatedStats = {
                    ...user.stats,
                    tasks: (user.stats.tasks || 0) + 1,
                    productivity: (user.stats.productivity || 0) + (task.points || 10)
                };
                
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
                
                if (user.recentActivities.length > 10) {
                    user.recentActivities = user.recentActivities.slice(0, 10);
                }
                
                await this.updateUser(userId, { 
                    stats: updatedStats,
                    recentActivities: user.recentActivities
                });
                
                const currentUser = this.getCurrentUser();
                if (currentUser && currentUser.id === userId) {
                    this.login(user);
                }
            }
        }

        return { success: true, task: task };
    },

    // ========== NOTIFICAÇÕES ==========
    
    async notifyDepartment(departmentValue, notificationData) {
        const users = await this.getAllUsersAsync();
        const departmentUsers = users.filter(u => u.departmentValue === departmentValue);

        if (this.mode === 'supabase') {
            const notifications = departmentUsers.map(user => ({
                user_id: user.id,
                type: notificationData.type,
                task_id: notificationData.taskId,
                title: notificationData.title,
                description: notificationData.description,
                icon: notificationData.icon || 'fa-bell'
            }));

            const { error } = await supabaseClient
                .from('notifications')
                .insert(notifications);

            if (error) {
                console.error('Erro ao criar notificações:', error);
            }
        } else {
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

                if (user.notifications.length > 50) {
                    user.notifications = user.notifications.slice(0, 50);
                }
            });

            this.saveUsers(users);
        }
    },

    // ========== CONVERSÃO DE FORMATOS (Snake_case ↔ CamelCase) ==========
    
    convertUserFromDB(dbUser) {
        if (!dbUser) return null;
        return {
            id: dbUser.id,
            fullName: dbUser.full_name,
            name: dbUser.name,
            email: dbUser.email,
            password: dbUser.password,
            department: dbUser.department,
            departmentValue: dbUser.department_value,
            role: dbUser.role,
            position: dbUser.position,
            phone: dbUser.phone,
            location: dbUser.location,
            registrationDate: dbUser.registration_date,
            lastLogin: dbUser.last_login,
            avatar: dbUser.avatar,
            isAdmin: dbUser.is_admin,
            stats: dbUser.stats,
            skills: dbUser.skills,
            recentActivities: dbUser.recent_activities,
            notifications: [] // Carregar separadamente se necessário
        };
    },

    convertUsersFromDB(dbUsers) {
        return dbUsers.map(u => this.convertUserFromDB(u));
    },

    convertUserToDB(user) {
        const dbUser = {};
        if (user.fullName !== undefined) dbUser.full_name = user.fullName;
        if (user.departmentValue !== undefined) dbUser.department_value = user.departmentValue;
        if (user.lastLogin !== undefined) dbUser.last_login = user.lastLogin;
        if (user.isAdmin !== undefined) dbUser.is_admin = user.isAdmin;
        if (user.recentActivities !== undefined) dbUser.recent_activities = user.recentActivities;
        // Copiar campos diretos
        ['name', 'email', 'password', 'department', 'role', 'position', 'phone', 'location', 'avatar', 'stats', 'skills'].forEach(field => {
            if (user[field] !== undefined) dbUser[field] = user[field];
        });
        return dbUser;
    },

    convertTaskFromDB(dbTask) {
        if (!dbTask) return null;
        return {
            id: dbTask.id,
            title: dbTask.title,
            description: dbTask.description,
            department: dbTask.department,
            departmentValue: dbTask.department_value,
            createdBy: dbTask.created_by,
            createdByName: dbTask.created_by_name,
            assignedTo: dbTask.assigned_to,
            status: dbTask.status,
            points: dbTask.points,
            createdAt: dbTask.created_at,
            assignedAt: dbTask.assigned_at,
            completedAt: dbTask.completed_at
        };
    },

    convertTasksFromDB(dbTasks) {
        return dbTasks.map(t => this.convertTaskFromDB(t));
    },

    // ========== SESSÃO (permanece localStorage) ==========
    
    login(user) {
        sessionStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        sessionStorage.setItem('user_logged', user.name);
        sessionStorage.setItem('user_is_admin', user.isAdmin ? 'true' : 'false');
    },

    logout() {
        sessionStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem('user_logged');
        sessionStorage.removeItem('user_is_admin');
    },

    getCurrentUser() {
        const user = sessionStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
        return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    },

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.isAdmin === true;
    },

    async createDefaultAdmin() {
        const users = await this.getAllUsersAsync();
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
            
            const result = await this.createUser(adminUser);
            if (result.success) {
                console.log('✅ Usuário admin criado com sucesso!');
            }
        }
    },

    // ========== UTILITÁRIOS ==========
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Funções adicionais mantidas por compatibilidade
    getAllMessages() {
        const messages = localStorage.getItem(this.STORAGE_KEYS.MESSAGES);
        return messages ? JSON.parse(messages) : [];
    },

    saveMessages(messages) {
        localStorage.setItem(this.STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    },

    async createMessage(fromUserId, toUserId, content) {
        if (this.mode === 'supabase') {
            try {
                const { data, error } = await window.supabaseClient
                    .from('messages')
                    .insert([{
                        from_user_id: fromUserId,
                        to_user_id: toUserId,
                        content: content,
                        read: false
                    }])
                    .select()
                    .single();

                if (error) throw error;

                return { 
                    success: true, 
                    message: {
                        id: data.id,
                        fromUserId: data.from_user_id,
                        toUserId: data.to_user_id,
                        content: data.content,
                        timestamp: data.created_at,
                        read: data.read
                    }
                };
            } catch (error) {
                console.error('Erro ao criar mensagem:', error);
                return { success: false, error: error.message };
            }
        }

        // Fallback localStorage
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

    async getUserConversations(userId) {
        if (this.mode === 'supabase') {
            try {
                const { data: messages, error } = await window.supabaseClient
                    .from('messages')
                    .select('*')
                    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                const conversationsMap = {};

                messages.forEach(msg => {
                    let otherUserId;
                    if (msg.from_user_id === userId) {
                        otherUserId = msg.to_user_id;
                    } else if (msg.to_user_id === userId) {
                        otherUserId = msg.from_user_id;
                    } else {
                        return;
                    }

                    if (!conversationsMap[otherUserId]) {
                        conversationsMap[otherUserId] = {
                            otherUserId: otherUserId,
                            messages: []
                        };
                    }

                    conversationsMap[otherUserId].messages.push({
                        id: msg.id,
                        senderId: msg.from_user_id,
                        receiverId: msg.to_user_id,
                        text: msg.content,
                        timestamp: msg.created_at,
                        read: msg.read
                    });
                });

                Object.values(conversationsMap).forEach(conv => {
                    conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                });

                return Object.values(conversationsMap).sort((a, b) => {
                    const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
                    const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
                    return new Date(lastB) - new Date(lastA);
                });
            } catch (error) {
                console.error('Erro ao carregar conversas:', error);
                return [];
            }
        }

        // Fallback localStorage
        const messages = this.getAllMessages();
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

            conversationsMap[otherUserId].messages.push({
                id: msg.id,
                senderId: msg.fromUserId,
                receiverId: msg.toUserId,
                text: msg.content,
                timestamp: msg.timestamp,
                read: msg.read
            });
        });

        Object.values(conversationsMap).forEach(conv => {
            conv.messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });

        return Object.values(conversationsMap).sort((a, b) => {
            const lastA = a.messages[a.messages.length - 1]?.timestamp || 0;
            const lastB = b.messages[b.messages.length - 1]?.timestamp || 0;
            return new Date(lastB) - new Date(lastA);
        });
    },

    async markAsRead(messageId) {
        if (this.mode === 'supabase') {
            try {
                const { error } = await window.supabaseClient
                    .from('messages')
                    .update({ read: true })
                    .eq('id', messageId);

                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Erro ao marcar mensagem como lida:', error);
                return { success: false, error: error.message };
            }
        }

        // Fallback localStorage
        const messages = this.getAllMessages();
        const msg = messages.find(m => m.id === messageId);
        if (msg) {
            msg.read = true;
            this.saveMessages(messages);
        }
        return { success: true };
    },

    getTasksByDepartment(departmentValue) {
        const tasks = this.getAllTasks();
        return tasks.filter(task => task.departmentValue === departmentValue);
    },

    getUserTasks(userId) {
        const tasks = this.getAllTasks();
        return tasks.filter(task => task.assignedTo === userId);
    },

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
            this.login(user);
            return { success: true };
        }

        return { success: false, error: 'Notificação não encontrada' };
    },

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
        this.login(user);
        
        return { success: true };
    },

    getUnreadNotificationsCount() {
        const currentUser = this.getCurrentUser();
        if (!currentUser || !currentUser.notifications) return 0;
        return currentUser.notifications.filter(n => !n.read).length;
    },

    deleteUser(userId) {
        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        this.saveUsers(filtered);
        return { success: true };
    },

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEYS.USERS);
        localStorage.removeItem(this.STORAGE_KEYS.MESSAGES);
        localStorage.removeItem(this.STORAGE_KEYS.TASKS);
        sessionStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem('user_logged');
    },

    exportData() {
        return {
            users: this.getAllUsers(),
            messages: this.getAllMessages(),
            tasks: this.getAllTasks(),
            exportDate: new Date().toISOString()
        };
    },

    importData(data) {
        if (data.users) this.saveUsers(data.users);
        if (data.messages) this.saveMessages(data.messages);
        if (data.tasks) this.saveTasks(data.tasks);
    },

    getStats() {
        return {
            totalUsers: this.getAllUsers().length,
            totalMessages: this.getAllMessages().length,
            totalTasks: this.getAllTasks().length,
            activeUser: this.getCurrentUser() ? 1 : 0,
            mode: this.mode
        };
    },

    seedDatabase() {
        const users = this.getAllUsers();
        
        if (users.length === 0) {
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

// Inicializar
DB.init().then(() => {
    console.log('Sistema de Banco de Dados ConectaHub carregado');
    console.log('Estatísticas:', DB.getStats());
    console.log('==================================');
    console.log('LOGIN ADMIN PADRÃO:');
    console.log('Email: admin@conectahub.com');
    console.log('Senha: admin123');
    console.log('==================================');
});
