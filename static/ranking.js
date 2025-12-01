document.addEventListener('DOMContentLoaded', function() {
    // Carregar usuários reais do banco de dados
    loadRankingFromDatabase();

    // Menu navigation
    const menuHome = document.querySelector('.menu-home');
    const menuRanking = document.querySelector('.menu-trophy');
    const menuMessages = document.querySelector('.menu-messages');
    const menuUser = document.querySelector('.menu-user');
    const backLink = document.querySelector('.back-link');

    // Marca o menu ativo
    if (menuRanking) {
        menuRanking.classList.add('active');
    }

    // Adicionar efeito ao botão +
    const plusButton = document.querySelector('.plus');
    if (plusButton) {
        plusButton.addEventListener('click', function() {
            console.log('Abrindo menu de ações rápidas...');
        });
    }

    // Voltar ao clicar em back-link
    if (backLink) {
        backLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'home.html';
        });
    }
});

function loadRankingFromDatabase() {
    if (!window.DB) {
        console.error('Banco de dados não carregado');
        return;
    }

    const users = window.DB.getAllUsers();
    
    if (users.length === 0) {
        document.getElementById('top-three').innerHTML = '<p style="text-align: center; color: #708090; padding: 40px;">Nenhum usuário cadastrado ainda.</p>';
        document.getElementById('ranking-list').innerHTML = '';
        return;
    }

    // Calcular XP baseado nas estatísticas do usuário
    const usersWithXP = users.map(user => ({
        ...user,
        xp: calculateXP(user)
    }));

    // Ordenar por XP
    usersWithXP.sort((a, b) => b.xp - a.xp);

    // Renderizar top 3
    renderTopThree(usersWithXP.slice(0, 3));

    // Renderizar resto do ranking
    renderRankingList(usersWithXP.slice(3));

    // Adicionar animações após renderizar
    setTimeout(() => {
        const rankItems = document.querySelectorAll('.rank-item');
        rankItems.forEach((item, index) => {
            item.style.animation = `slideInUp 0.5s ease ${index * 0.1}s backwards`;
        });

        const rankCards = document.querySelectorAll('.rank-card');
        rankCards.forEach((card, index) => {
            card.style.animation = `slideInUp 0.6s ease ${index * 0.15}s backwards`;
        });

        // Adicionar CSS para animação
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

        // Interatividade ao clicar em rank items
        rankItems.forEach(item => {
            item.addEventListener('click', function() {
                this.style.transform = 'scale(0.98)';
                setTimeout(() => {
                    this.style.transform = 'scale(1)';
                }, 100);
            });
        });
    }, 100);
}

function calculateXP(user) {
    // Calcular XP baseado nas estatísticas
    const stats = user.stats || { productivity: 0, tasks: 0, projects: 0 };
    return (stats.productivity * 5) + (stats.tasks * 10) + (stats.projects * 50);
}

function renderTopThree(topUsers) {
    const topThreeContainer = document.getElementById('top-three');
    topThreeContainer.innerHTML = '';

    if (topUsers.length === 0) {
        topThreeContainer.innerHTML = '<p style="text-align: center; color: #708090; padding: 40px;">Nenhum usuário no ranking.</p>';
        return;
    }

    // Ordem de exibição: 2º, 1º, 3º
    const displayOrder = [
        topUsers[1] || null, // 2º lugar
        topUsers[0] || null, // 1º lugar
        topUsers[2] || null  // 3º lugar
    ];

    const positions = ['rank-second', 'rank-first', 'rank-third'];
    const numbers = [2, 1, 3];

    displayOrder.forEach((user, index) => {
        if (!user) return;

        const rankClass = positions[index];
        const rankNumber = numbers[index];
        const initial = user.name.charAt(0).toUpperCase();

        const card = document.createElement('div');
        card.className = `rank-card ${rankClass}`;
        card.innerHTML = `
            <div class="rank-number">${rankNumber}</div>
            <div class="player-avatar">
                <div class="avatar-circle">
                    ${rankNumber === 1 ? '<i class="fa-solid fa-crown"></i>' : initial}
                </div>
            </div>
            <div class="player-info">
                <h3 class="player-name">${user.name}</h3>
                <p class="player-xp">${user.xp} XP</p>
            </div>
        `;
        topThreeContainer.appendChild(card);
    });
}

function renderRankingList(users) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';

    if (users.length === 0) {
        return;
    }

    users.forEach((user, index) => {
        const position = index + 4; // Começa do 4º lugar
        const initial = user.name.charAt(0).toUpperCase();

        const item = document.createElement('div');
        item.className = 'rank-item';
        item.innerHTML = `
            <div class="rank-position">${position}</div>
            <div class="rank-avatar">
                <div class="avatar-small">${initial}</div>
            </div>
            <div class="rank-details">
                <span class="rank-name">${user.fullName}</span>
                <span class="rank-xp">${user.xp} XP</span>
            </div>
        `;
        rankingList.appendChild(item);
    });
}
