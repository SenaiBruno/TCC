document.addEventListener('DOMContentLoaded', function() {
    // Elementos do perfil
    const editProfileBtn = document.getElementById('edit-profile');
    const changeAvatarBtn = document.getElementById('change-avatar');
    const profileAvatar = document.getElementById('profile-avatar');
    const largeAvatar = document.getElementById('large-avatar');

    // Dados do usuário (pode ser carregado de uma API)
    const userData = {
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
        document.getElementById('info-phone').textContent = userData.phone;
        document.getElementById('info-location').textContent = userData.location;
        
        // Configurar avatares
        const firstLetter = userData.name.charAt(0).toUpperCase();
        profileAvatar.textContent = firstLetter;
        largeAvatar.textContent = firstLetter;
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