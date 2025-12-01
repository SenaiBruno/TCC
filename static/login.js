document.addEventListener('DOMContentLoaded', function() {
    // ========== LOGIN FORM ==========
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const rememberCheckbox = document.getElementById('remember');

    // Toggle password visibility no login
    if (togglePassword) {
        togglePassword.addEventListener('click', function(e) {
            e.preventDefault();
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Validar e enviar login form
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Limpar erros anteriores
            clearErrors();

            // Validações
            let isValid = true;

            if (!usernameInput.value.trim()) {
                showError('username-error', 'Usuário ou email é obrigatório');
                isValid = false;
            }

            if (!passwordInput.value) {
                showError('password-error', 'Senha é obrigatória');
                isValid = false;
            } else if (passwordInput.value.length < 6) {
                showError('password-error', 'Senha deve ter no mínimo 6 caracteres');
                isValid = false;
            }

            if (isValid) {
                // Simular login bem-sucedido
                mostrarSpinner('loginBtn');
                
                setTimeout(() => {
                    // Salvar preferência "lembrar-me"
                    if (rememberCheckbox.checked) {
                        localStorage.setItem('remember_user', usernameInput.value);
                    }

                    // Salvar sessão
                    sessionStorage.setItem('user_logged', usernameInput.value);
                    
                    // Redirecionar para home
                    window.location.href = 'home.html';
                }, 1000);
            }
        });

        // Verificar se tem usuário salvo
        const savedUser = localStorage.getItem('remember_user');
        if (savedUser) {
            usernameInput.value = savedUser;
            rememberCheckbox.checked = true;
        }
    }

    // ========== CADASTRO FORM ==========
    const cadastroForm = document.getElementById('cadastroForm');
    const fullnameInput = document.getElementById('fullname');
    const emailInput = document.getElementById('email');
    const departmentInput = document.getElementById('department');
    const senhaInput = document.getElementById('senha');
    const confirmaSenhaInput = document.getElementById('confirmaSenha');
    const termsCheckbox = document.getElementById('terms');
    const togglePassword1 = document.getElementById('togglePassword1');
    const togglePassword2 = document.getElementById('togglePassword2');
    const strengthBar = document.getElementById('strengthBar');

    // Toggle password visibility no cadastro
    if (togglePassword1) {
        togglePassword1.addEventListener('click', function(e) {
            e.preventDefault();
            const icon = this.querySelector('i');
            if (senhaInput.type === 'password') {
                senhaInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                senhaInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    if (togglePassword2) {
        togglePassword2.addEventListener('click', function(e) {
            e.preventDefault();
            const icon = this.querySelector('i');
            if (confirmaSenhaInput.type === 'password') {
                confirmaSenhaInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                confirmaSenhaInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }

    // Validar força da senha em tempo real
    if (senhaInput) {
        senhaInput.addEventListener('input', function() {
            const strength = calculatePasswordStrength(this.value);
            if (strengthBar) {
                strengthBar.style.width = strength + '%';
                
                if (strength < 30) {
                    strengthBar.style.backgroundColor = '#e74c3c';
                } else if (strength < 60) {
                    strengthBar.style.backgroundColor = '#f39c12';
                } else {
                    strengthBar.style.backgroundColor = '#27ae60';
                }
            }
        });
    }

    // Validar e enviar cadastro form
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Limpar erros anteriores
            clearErrors();

            // Validações
            let isValid = true;

            // Validar nome
            if (!fullnameInput.value.trim()) {
                showError('fullname-error', 'Nome completo é obrigatório');
                isValid = false;
            } else if (fullnameInput.value.trim().split(' ').length < 2) {
                showError('fullname-error', 'Digite seu nome completo');
                isValid = false;
            }

            // Validar email
            if (!emailInput.value.trim()) {
                showError('email-error', 'Email é obrigatório');
                isValid = false;
            } else if (!isValidEmail(emailInput.value)) {
                showError('email-error', 'Email inválido');
                isValid = false;
            }

            // Validar departamento
            if (!departmentInput.value) {
                showError('department-error', 'Selecione um departamento');
                isValid = false;
            }

            // Validar senha
            if (!senhaInput.value) {
                showError('senha-error', 'Senha é obrigatória');
                isValid = false;
            } else if (senhaInput.value.length < 8) {
                showError('senha-error', 'Senha deve ter no mínimo 8 caracteres');
                isValid = false;
            } else if (!isStrongPassword(senhaInput.value)) {
                showError('senha-error', 'Senha deve conter maiúsculas, minúsculas, números e caracteres especiais');
                isValid = false;
            }

            // Validar confirmação de senha
            if (senhaInput.value !== confirmaSenhaInput.value) {
                showError('confirmaSenha-error', 'As senhas não conferem');
                isValid = false;
            }

            // Validar termos
            if (!termsCheckbox.checked) {
                showError('terms-error', 'Você deve concordar com os termos');
                isValid = false;
            }

            if (isValid) {
                mostrarSpinner('cadastroBtn');
                
                setTimeout(() => {
                    // Simulação de sucesso
                    alert('Cadastro realizado com sucesso! Redirecionando para login...');
                    window.location.href = 'login.html';
                }, 1000);
            }
        });
    }

    // ========== FUNÇÕES AUXILIARES ==========
    function clearErrors() {
        document.querySelectorAll('.error-msg').forEach(msg => {
            msg.classList.remove('show');
            msg.textContent = '';
        });
    }

    function showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    function isValidEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    function isStrongPassword(password) {
        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        return hasUppercase && hasLowercase && hasNumbers && hasSpecialChar;
    }

    function calculatePasswordStrength(password) {
        let strength = 0;

        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        if (/[a-z]/.test(password)) strength += 15;
        if (/[A-Z]/.test(password)) strength += 15;
        if (/[0-9]/.test(password)) strength += 20;
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 20;

        return Math.min(strength, 100);
    }

    function mostrarSpinner(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processando...';
            button.disabled = true;

            setTimeout(() => {
                button.innerHTML = originalContent;
                button.disabled = false;
            }, 3000);
        }
    }
});
