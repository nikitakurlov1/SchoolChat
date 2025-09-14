// Navbar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check for JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login page if not authenticated
        const publicPages = ['index.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!publicPages.includes(currentPage)) {
            window.location.href = 'index.html';
        }
        return;
    }
    
    // Check if user is on a protected page
    const protectedPages = ['feed.html', 'create.html', 'profile.html'];
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        // Add active class to current nav item
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.getAttribute('href') === currentPage) {
                item.classList.add('active');
            }
        });
    }
});