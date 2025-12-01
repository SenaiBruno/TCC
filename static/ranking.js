document.addEventListener('DOMContentLoaded', function() {
    // Menu navigation
    const menuHome = document.querySelector('.menu-home');
    const menuRanking = document.querySelector('.menu-trophy');
    const menuMessages = document.querySelector('.menu-messages');
    const menuUser = document.querySelector('.menu-user');
    const backLink = document.querySelector('.back-link');

    // Adicionar animação aos rank items
    const rankItems = document.querySelectorAll('.rank-item');
    rankItems.forEach((item, index) => {
        item.style.animation = `slideInUp 0.5s ease ${index * 0.1}s backwards`;
    });

    // Animação para top 3
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
