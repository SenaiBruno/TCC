// Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se é admin
    if (!window.DB || !window.DB.isAdmin()) {
        alert('Acesso negado! Apenas administradores podem acessar esta página.');
        window.location.href = 'login.html';
        return;
    }

    // Criar admin padrão se não existir
    window.DB.createDefaultAdmin();

    // Elementos
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.admin-section');
    const btnLogout = document.getElementById('btn-logout');
    const adminNameEl = document.getElementById('admin-name');
    const searchUsersInput = document.getElementById('search-users');

    // Configurar nome do admin
    const currentUser = window.DB.getCurrentUser();
    if (currentUser) {
        adminNameEl.textContent = currentUser.name;
    }

    // Navegação entre seções
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.classList.contains('nav-back')) return;
            
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            
            // Atualizar menu ativo
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar seção correspondente
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection + '-section').classList.add('active');

            // Carregar dados da seção
            loadSectionData(targetSection);
        });
    });

    // Logout
    btnLogout.addEventListener('click', function() {
        if (confirm('Deseja realmente sair?')) {
            window.DB.logout();
            window.location.href = 'login.html';
        }
    });

    // Carregar dados iniciais
    loadDashboardStats();
    loadUsersTable();

    // Botões de ação
    document.getElementById('btn-clear-db').addEventListener('click', function() {
        if (confirm('ATENÇÃO: Isso irá apagar todos os dados! Deseja continuar?')) {
            window.DB.clearAll();
            alert('Banco de dados limpo com sucesso!');
            location.reload();
        }
    });

    document.getElementById('btn-export-db').addEventListener('click', function() {
        const data = window.DB.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'conectahub_backup_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        alert('Dados exportados com sucesso!');
    });

    document.getElementById('btn-seed-db').addEventListener('click', function() {
        window.DB.seedDatabase();
        alert('Dados de exemplo criados com sucesso!');
        loadDashboardStats();
        loadUsersTable();
    });

    document.getElementById('btn-add-user').addEventListener('click', function() {
        // Modal simples para adicionar usuário
        const name = prompt('Nome completo:');
        if (!name) return;
        
        const email = prompt('Email:');
        if (!email) return;
        
        const password = prompt('Senha:');
        if (!password) return;
        
        const department = prompt('Departamento (Tecnologia, RH, Marketing, etc):');
        if (!department) return;
        
        const result = window.DB.createUser({
            fullName: name,
            email: email,
            password: password,
            department: department,
            departmentValue: department.toLowerCase()
        });
        
        if (result.success) {
            alert('Usuário criado com sucesso!');
            loadUsersTable();
            loadDashboardStats();
        } else {
            alert('Erro: ' + result.error);
        }
    });

    // Busca de usuários
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#users-tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(query) ? '' : 'none';
            });
        });
    }

    // Funções de carregamento de dados
    function loadSectionData(section) {
        switch(section) {
            case 'dashboard':
                loadDashboardStats();
                break;
            case 'users':
                loadUsersTable();
                break;
            case 'messages':
                loadMessagesData();
                break;
        }
    }

    function loadDashboardStats() {
        const stats = window.DB.getStats();
        const users = window.DB.getAllUsers();
        const adminCount = users.filter(u => u.isAdmin).length;
        
        document.getElementById('total-users').textContent = stats.totalUsers;
        document.getElementById('total-messages').textContent = stats.totalMessages;
        document.getElementById('active-users').textContent = stats.activeUser;
        document.getElementById('admin-count').textContent = adminCount;

        // Atividade do sistema
        loadSystemActivity();
    }

    function loadSystemActivity() {
        const users = window.DB.getAllUsers();
        const activityContainer = document.getElementById('system-activity');
        
        if (users.length === 0) {
            activityContainer.innerHTML = '<p style="text-align: center; color: #708090; padding: 20px;">Nenhuma atividade registrada.</p>';
            return;
        }

        // Mostrar últimos usuários registrados
        const recentUsers = users.slice(-5).reverse();
        activityContainer.innerHTML = '';
        
        recentUsers.forEach(user => {
            const date = new Date(user.registrationDate);
            const activityItem = document.createElement('div');
            activityItem.style.cssText = 'padding: 15px; border-left: 3px solid #667eea; margin-bottom: 10px; background: #f8f9fa; border-radius: 5px;';
            activityItem.innerHTML = `
                <strong>${user.fullName}</strong> se registrou no sistema
                <br><small style="color: #7f8c8d;">${date.toLocaleString('pt-BR')}</small>
            `;
            activityContainer.appendChild(activityItem);
        });
    }

    function loadUsersTable() {
        const users = window.DB.getAllUsers();
        const tbody = document.getElementById('users-tbody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Nenhum usuário cadastrado.</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            const date = new Date(user.registrationDate).toLocaleDateString('pt-BR');
            const userType = user.isAdmin 
                ? '<span class="user-badge badge-admin">Admin</span>' 
                : '<span class="user-badge badge-user">Usuário</span>';
            
            row.innerHTML = `
                <td>${user.fullName}</td>
                <td>${user.email}</td>
                <td>${user.department}</td>
                <td>${userType}</td>
                <td>${date}</td>
                <td>
                    <button class="btn-action" onclick="editUser('${user.id}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteUser('${user.id}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function loadMessagesData() {
        const messages = window.DB.getAllMessages();
        const container = document.getElementById('all-messages-list');
        
        if (messages.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhuma mensagem registrada.</p>';
            return;
        }

        container.innerHTML = '';
        messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.style.cssText = 'background: white; padding: 15px; margin-bottom: 10px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);';
            const date = new Date(msg.timestamp).toLocaleString('pt-BR');
            msgDiv.innerHTML = `
                <strong>De:</strong> Usuário ${msg.fromUserId.substring(0, 8)}<br>
                <strong>Para:</strong> Usuário ${msg.toUserId.substring(0, 8)}<br>
                <strong>Mensagem:</strong> ${msg.content}<br>
                <small style="color: #7f8c8d;">${date}</small>
            `;
            container.appendChild(msgDiv);
        });
    }

    // Atualizar data de última atualização
    document.getElementById('last-update').textContent = new Date().toLocaleString('pt-BR');
});

// Funções globais para os botões da tabela
function editUser(userId) {
    const users = window.DB.getAllUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        alert('Usuário não encontrado');
        return;
    }

    // Criar modal para edição completa
    const modalHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 9999; display: flex; align-items: center; justify-content: center;" id="edit-modal">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 90vh; overflow-y: auto;">
                <h2 style="margin-bottom: 20px; color: #2c3e50;">Editar Usuário</h2>
                <form id="edit-user-form">
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Nome Completo:</label>
                        <input type="text" id="edit-fullname" value="${user.fullName}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Email:</label>
                        <input type="email" id="edit-email" value="${user.email}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Departamento:</label>
                        <input type="text" id="edit-department" value="${user.department}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Telefone:</label>
                        <input type="text" id="edit-phone" value="${user.phone || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Localização:</label>
                        <input type="text" id="edit-location" value="${user.location || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">Cargo:</label>
                        <input type="text" id="edit-position" value="${user.position || ''}" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 600;">
                            <input type="checkbox" id="edit-isadmin" ${user.isAdmin ? 'checked' : ''}> É Administrador
                        </label>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" onclick="closeEditModal()" style="padding: 10px 20px; border: none; background: #95a5a6; color: white; border-radius: 5px; cursor: pointer;">Cancelar</button>
                        <button type="submit" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 5px; cursor: pointer;">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('edit-user-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const updates = {
            fullName: document.getElementById('edit-fullname').value,
            name: document.getElementById('edit-fullname').value.split(' ')[0],
            email: document.getElementById('edit-email').value,
            department: document.getElementById('edit-department').value,
            phone: document.getElementById('edit-phone').value,
            location: document.getElementById('edit-location').value,
            position: document.getElementById('edit-position').value,
            isAdmin: document.getElementById('edit-isadmin').checked
        };
        
        const result = window.DB.updateUser(userId, updates);
        
        if (result.success) {
            alert('Usuário atualizado com sucesso!');
            closeEditModal();
            location.reload();
        } else {
            alert('Erro ao atualizar usuário');
        }
    });
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.remove();
}

function deleteUser(userId) {
    if (confirm('Deseja realmente excluir este usuário?')) {
        window.DB.deleteUser(userId);
        alert('Usuário excluído com sucesso!');
        location.reload();
    }
}
