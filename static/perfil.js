document.addEventListener('DOMContentLoaded', function() {
    // Elementos do perfil
    const editProfileBtn = document.getElementById('edit-profile');
    const changeAvatarBtn = document.getElementById('change-avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const largeAvatar = document.getElementById('large-avatar');

    // Dados do usuário (pode ser carregado de uma API)
    let userData = {
        name: "João Silva",
        fullName: "João da Silva Santos",
        role: "Desenvolvedor Front-end",
        position: "Desenvolvedor Front-end Pleno",
        email: "joao.silva@empresa.com",
        department: "Tecnologia",
        hireDate: "15/03/2022",
        phone: "(11) 99999-9999",
        location: "São Paulo, SP"
    };

    // Carregar dados do usuário logado do banco de dados
    if (window.DB) {
        const currentUser = window.DB.getCurrentUser();
        if (currentUser) {
            userData = {
                name: currentUser.name,
                fullName: currentUser.fullName,
                role: currentUser.role || userData.role,
                position: currentUser.position || userData.position,
                email: currentUser.email,
                department: currentUser.department,
                hireDate: new Date(currentUser.registrationDate).toLocaleDateString('pt-BR'),
                phone: currentUser.phone || userData.phone,
                location: currentUser.location || userData.location
            };
        }
    } else {
        // Fallback para localStorage antigo
        const savedUserData = localStorage.getItem('user_data');
        if (savedUserData) {
            try {
                const parsedData = JSON.parse(savedUserData);
                userData.name = parsedData.name || userData.name;
                userData.fullName = parsedData.fullName || userData.fullName;
                userData.email = parsedData.email || userData.email;
                userData.department = parsedData.department || userData.department;
                userData.hireDate = parsedData.registrationDate || userData.hireDate;
            } catch (e) {
                console.error('Erro ao carregar dados do usuário:', e);
            }
        }
    }

    // Carregar dados do usuário
    function loadUserData() {
        // Prioriza o nome armazenado na sessão (login) se existir
        const logged = sessionStorage.user_logged || sessionStorage.getItem('user_logged') || localStorage.remember_user || localStorage.getItem('remember_user');
        if (logged) {
            userData.name = logged;
            userData.fullName = logged;
        }
        
        document.getElementById('profile-name').textContent = userData.name;
        document.getElementById('profile-role').textContent = userData.role;
        document.getElementById('profile-email').textContent = userData.email;
        document.getElementById('info-fullname').textContent = userData.fullName;
        document.getElementById('info-department').textContent = userData.department;
        document.getElementById('info-position').textContent = userData.position;
        document.getElementById('info-hire-date').textContent = userData.hireDate;
        document.getElementById('info-phone').textContent = userData.phone || 'Não informado';
        document.getElementById('info-location').textContent = userData.location || 'Não informado';
        
        // Configurar avatares
        const firstLetter = userData.name.charAt(0).toUpperCase();
        profileAvatar.textContent = firstLetter;
        largeAvatar.textContent = firstLetter;

        // Atualizar estatísticas (usar dados reais do usuário)
        const statsFromDB = window.DB && window.DB.getCurrentUser() ? window.DB.getCurrentUser().stats : null;
        if (statsFromDB) {
            document.querySelector('.stat-item:nth-child(1) .stat-number').textContent = statsFromDB.productivity + '%';
            document.querySelector('.stat-item:nth-child(2) .stat-number').textContent = statsFromDB.tasks;
            document.querySelector('.stat-item:nth-child(3) .stat-number').textContent = statsFromDB.projects;
        }

        // Carregar habilidades (zerado para novos usuários)
        loadSkills();
        
        // Carregar atividades recentes (zerado para novos usuários)
        loadRecentActivities();
    }

    // Carregar habilidades
    function loadSkills() {
        const skillsList = document.querySelector('.skills-list');
        const currentUser = window.DB ? window.DB.getCurrentUser() : null;
        
        if (currentUser && currentUser.skills && currentUser.skills.length > 0) {
            skillsList.innerHTML = '';
            currentUser.skills.forEach(skill => {
                const skillItem = document.createElement('div');
                skillItem.className = 'skill-item';
                skillItem.innerHTML = `
                    <span class="skill-name">${skill.name}</span>
                    <div class="skill-bar">
                        <div class="skill-progress" style="width: ${skill.level}%"></div>
                    </div>
                    <span class="skill-percent">${skill.level}%</span>
                `;
                skillsList.appendChild(skillItem);
            });
        } else {
            // Mostrar mensagem para usuários sem habilidades
            skillsList.innerHTML = '<p style="color: #708090; text-align: center;">Nenhuma habilidade cadastrada ainda.</p>';
        }
    }

    // Carregar atividades recentes
    function loadRecentActivities() {
        const activityList = document.querySelector('.activity-list');
        const currentUser = window.DB ? window.DB.getCurrentUser() : null;
        
        if (currentUser && currentUser.recentActivities && currentUser.recentActivities.length > 0) {
            activityList.innerHTML = '';
            currentUser.recentActivities.forEach(activity => {
                const activityItem = document.createElement('div');
                activityItem.className = 'activity-item';
                activityItem.innerHTML = `
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p>${activity.description}</p>
                        <span>${activity.date}</span>
                    </div>
                `;
                activityList.appendChild(activityItem);
            });
        } else {
            // Mostrar mensagem para usuários sem atividades
            activityList.innerHTML = '<p style="color: #708090; text-align: center;">Nenhuma atividade recente.</p>';
        }
    }

    // Editar perfil
    editProfileBtn.addEventListener('click', function() {
        alert('Funcionalidade de edição do perfil será implementada em breve!');
        // Aqui você pode abrir um modal ou redirecionar para página de edição
    });

    // Alterar avatar
    changeAvatarBtn.addEventListener('click', function() {
        alert('Funcionalidade de alteração de avatar será implementada em breve!');
        // Aqui você pode implementar upload de imagem
    });

    // Inicializar dados do usuário
    loadUserData();

    // Menu ativo
    const menuItems = document.querySelectorAll('.bottom-menu i');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });
});