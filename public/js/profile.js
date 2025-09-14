// Profile page functionality
document.addEventListener('DOMContentLoaded', async function() {
    // Check for JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    let currentUser = null;
    
    // Fetch user profile data
    async function fetchProfile() {
        try {
            const response = await fetch('/api/profile', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                currentUser = data.user;
                displayProfile(data.user);
                await loadUserPosts();
                await loadUserComments();
                await loadUserStats();
            } else {
                console.error('Failed to fetch profile:', data.message);
                if (data.message === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                    return;
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }
    
    // Display user profile
    function displayProfile(user) {
        const userName = document.getElementById('userName');
        const userGrade = document.getElementById('userGrade');
        const points = document.getElementById('points');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        
        if (userName) userName.textContent = `${user.firstName} ${user.lastName}`;
        if (userGrade) userGrade.textContent = user.grade;
        if (points) points.textContent = Math.round(user.points || 0);
        
        // Display avatar
        if (user.avatar) {
            const avatarImg = document.createElement('img');
            avatarImg.src = `/uploads/${user.avatar}`;
            avatarImg.alt = 'Аватарка';
            avatarImg.onerror = () => {
                avatarImg.style.display = 'none';
                avatarPlaceholder.style.display = 'block';
            };
            avatarPlaceholder.style.display = 'none';
            document.getElementById('profileAvatar').insertBefore(avatarImg, avatarPlaceholder);
        } else {
            avatarPlaceholder.style.display = 'block';
        }
    }
    
    // Load user posts
    async function loadUserPosts() {
        try {
            const response = await fetch('/api/posts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await response.json();
            
            if (response.ok) {
                const userPosts = data.posts.filter(post => post.author._id === currentUser._id);
                displayUserPosts(userPosts);
            } else {
                console.error('Failed to fetch posts:', data.message);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
    }
    
    // Display user posts
    function displayUserPosts(posts) {
        const container = document.getElementById('userPostsContainer');
        const loading = document.getElementById('postsLoading');
        
        if (loading) loading.remove();
        
        if (posts.length === 0) {
            container.innerHTML = '<div class="loading">У вас поки що немає постів</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post">
                <div class="post-header">
                    <div class="post-author-avatar">
                        ${currentUser.avatar ? 
                            `<img src="${currentUser.avatar.startsWith('/') ? currentUser.avatar.substring(1) : currentUser.avatar}" alt="Аватарка" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <div class="avatar-placeholder" style="display: none;">${currentUser.firstName[0]}${currentUser.lastName[0]}</div>` :
                            `<div class="avatar-placeholder">${currentUser.firstName[0]}${currentUser.lastName[0]}</div>`
                        }
                    </div>
                    <div class="post-author-info">
                        <div class="post-author-name">${currentUser.firstName} ${currentUser.lastName}</div>
                        <div class="post-meta">${currentUser.grade} • ${formatTimeAgo(post.createdAt)}</div>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.text}</p>
                    ${post.image ? `<img src="${post.image.startsWith('/') ? post.image.substring(1) : post.image}" alt="Зображення поста" class="post-image">` : ''}
                </div>
                <div class="post-actions">
                    <button class="action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${post.likes || 0}
                    </button>
                    <button class="action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${post.comments ? post.comments.length : 0}
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Load user comments
    async function loadUserComments() {
        try {
            const response = await fetch('/api/comments/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch comments:', response.status, errorText);
                const container = document.getElementById('userCommentsContainer');
                const loading = document.getElementById('commentsLoading');
                if (loading) loading.remove();
                if (container) container.innerHTML = '<div class="loading">Помилка завантаження коментарів</div>';
                return;
            }
            
            const data = await response.json();
            displayUserComments(data.comments);
        } catch (error) {
            console.error('Error fetching comments:', error);
            const container = document.getElementById('userCommentsContainer');
            const loading = document.getElementById('commentsLoading');
            if (loading) loading.remove();
            if (container) container.innerHTML = '<div class="loading">Помилка завантаження коментарів</div>';
        }
    }
    
    // Display user comments
    function displayUserComments(comments) {
        const container = document.getElementById('userCommentsContainer');
        const loading = document.getElementById('commentsLoading');
        
        if (loading) loading.remove();
        
        if (comments.length === 0) {
            container.innerHTML = '<div class="loading">У вас поки що немає коментарів</div>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="post">
                <div class="post-header">
                    <div class="post-author-avatar">
                        ${comment.post.author.avatar ? 
                            `<img src="${comment.post.author.avatar.startsWith('/') ? comment.post.author.avatar.substring(1) : comment.post.author.avatar}" alt="Аватарка" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <div class="avatar-placeholder" style="display: none;">${comment.post.author.firstName[0]}${comment.post.author.lastName[0]}</div>` :
                            `<div class="avatar-placeholder">${comment.post.author.firstName[0]}${comment.post.author.lastName[0]}</div>`
                        }
                    </div>
                    <div class="post-author-info">
                        <div class="post-author-name">${comment.post.author.firstName} ${comment.post.author.lastName}</div>
                        <div class="post-meta">${comment.post.author.grade} • ${formatTimeAgo(comment.post.createdAt)}</div>
                    </div>
                </div>
                <div class="post-content">
                    <p>${comment.post.text}</p>
                    ${comment.post.image ? `<img src="${comment.post.image.startsWith('/') ? comment.post.image.substring(1) : comment.post.image}" alt="Зображення поста" class="post-image">` : ''}
                </div>
                <div class="post-content" style="border-top: var(--glass-border); margin-top: 1rem; padding-top: 1rem;">
                    <p><strong>Ваш коментар:</strong> ${comment.text}</p>
                </div>
                <div class="post-actions">
                    <button class="action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${comment.post.likes || 0}
                    </button>
                    <button class="action-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${comment.post.comments ? comment.post.comments.length : 0}
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Load user statistics
    async function loadUserStats() {
        try {
            const response = await fetch('/api/profile/stats', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch stats:', response.status, errorText);
                return;
            }
            
            const data = await response.json();
            updateStats(data.stats);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }
    
    // Update statistics display
    function updateStats(stats) {
        const postsCount = document.getElementById('postsCount');
        const commentsCount = document.getElementById('commentsCount');
        const likesCount = document.getElementById('likesCount');
        
        if (postsCount) postsCount.textContent = stats.postsCount || 0;
        if (commentsCount) commentsCount.textContent = stats.commentsCount || 0;
        if (likesCount) likesCount.textContent = stats.likesCount || 0;
    }
    
    // Format time ago
    function formatTimeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'щойно';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} хв тому`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} год тому`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн тому`;
        return `${Math.floor(diffInSeconds / 2592000)} міс тому`;
    }
    
    // Avatar upload functionality
    function setupAvatarUpload() {
        const avatarInput = document.getElementById('avatarInput');
        const addPhotoBtn = document.getElementById('addPhotoBtn');
        
        if (addPhotoBtn) {
            addPhotoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (avatarInput) {
                    avatarInput.click();
                }
            });
        }
        
        if (avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                // Validate file size (max 5MB)
                if (file.size > 5 * 1024 * 1024) {
                    alert('Розмір файлу не повинен перевищувати 5MB');
                    return;
                }
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    alert('Будь ласка, виберіть зображення');
                    return;
                }
                
                const formData = new FormData();
                formData.append('avatar', file);
                
                try {
                    const response = await fetch('/api/profile/avatar', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        // Update avatar display
                        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
                        const existingImg = document.querySelector('.profile-avatar img');
                        
                        if (existingImg) {
                            existingImg.src = `/uploads/${data.avatar}`;
                        } else {
                            const avatarImg = document.createElement('img');
                            avatarImg.src = `/uploads/${data.avatar}`;
                            avatarImg.alt = 'Аватарка';
                            avatarImg.onerror = () => {
                                avatarImg.style.display = 'none';
                                avatarPlaceholder.style.display = 'block';
                            };
                            avatarPlaceholder.style.display = 'none';
                            document.getElementById('profileAvatar').insertBefore(avatarImg, avatarPlaceholder);
                        }
                        
                        alert('Аватарку успішно оновлено!');
                    } else {
                        alert('Помилка при завантаженні аватарки: ' + data.message);
                    }
                } catch (error) {
                    console.error('Error uploading avatar:', error);
                    alert('Помилка при завантаженні аватарки');
                }
            });
        }
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Logout button
        const logoutButton = document.getElementById('logoutBtn');
        if (logoutButton) {
            logoutButton.addEventListener('click', function() {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
            });
        }
        
        // Edit profile button
        
        // Setup avatar upload
        setupAvatarUpload();
    }
    
    // Initialize
    setupEventListeners();
    await fetchProfile();
});