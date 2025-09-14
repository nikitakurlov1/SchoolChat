// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    // Form toggle functionality
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registrationForm');
    
    if (showRegisterLink) {
        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginForm.classList.remove('active');
            registrationForm.classList.add('active');
            showRegisterLink.classList.add('hidden');
            showLoginLink.classList.remove('hidden');
        });
    }
    
    if (showLoginLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            registrationForm.classList.remove('active');
            loginForm.classList.add('active');
            showLoginLink.classList.add('hidden');
            showRegisterLink.classList.remove('hidden');
        });
    }
    
    // School selection modal functionality
    const selectSchoolBtn = document.getElementById('selectSchoolBtn');
    const schoolModal = document.getElementById('schoolModal');
    const closeModalBtn = schoolModal.querySelector('.close-modal');
    const schoolItems = schoolModal.querySelectorAll('.school-item');
    const schoolInput = document.getElementById('school');
    
    if (selectSchoolBtn) {
        selectSchoolBtn.addEventListener('click', function() {
            schoolModal.classList.add('active');
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            schoolModal.classList.remove('active');
        });
    }
    
    // Close modal when clicking outside
    schoolModal.addEventListener('click', function(e) {
        if (e.target === schoolModal) {
            schoolModal.classList.remove('active');
        }
    });
    
    // School selection
    schoolItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove selected class from all items
            schoolItems.forEach(i => i.classList.remove('selected'));
            
            // Add selected class to clicked item
            this.classList.add('selected');
            
            // Set school input value
            const schoolName = this.getAttribute('data-school');
            schoolInput.value = schoolName;
            
            // Close modal
            schoolModal.classList.remove('active');
        });
    });
    
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const login = document.getElementById('login').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ login, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token to localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to feed page
                    window.location.href = 'feed.html';
                } else {
                    alert(data.message || 'Помилка входу');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Сталася помилка під час входу');
            }
        });
    }
    
    // Registration form submission
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const grade = document.getElementById('grade').value;
            const login = document.getElementById('regLogin').value;
            const password = document.getElementById('regPassword').value;
            const school = document.getElementById('school').value;
            
            // Check if school is selected
            if (!school) {
                alert('Будь ласка, оберіть школу');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ firstName, lastName, grade, login, password })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    // Save token to localStorage
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    
                    // Redirect to feed page
                    window.location.href = 'feed.html';
                } else {
                    alert(data.message || 'Помилка реєстрації');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Сталася помилка під час реєстрації');
            }
        });
    }
});