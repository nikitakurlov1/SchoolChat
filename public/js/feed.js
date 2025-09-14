// Feed page functionality
document.addEventListener('DOMContentLoaded', async function () {
    // Check for JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    const postsContainer = document.querySelector('.posts-container');
    const createPostBtn = document.getElementById('createPostBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const commentsModal = document.getElementById('commentsModal');
    const closeCommentsModal = document.getElementById('closeCommentsModal');
    const commentsList = document.getElementById('commentsList');
    const commentText = document.getElementById('commentText');
    const submitComment = document.getElementById('submitComment');

    let currentPostId = null;
    let currentFilter = 'all';

    // Add event listener to floating create post button
    if (createPostBtn) {
        createPostBtn.addEventListener('click', function () {
            window.location.href = 'create.html';
        });
    }

    // Add event listeners to filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');

            // Get the category to filter by
            currentFilter = this.dataset.category;

            // Fetch and display posts with the selected filter
            fetchPosts(currentFilter);
        });
    });

    // Search functionality
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                searchPosts(searchTerm);
            } else {
                fetchPosts(currentFilter);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                const searchTerm = this.value.trim();
                if (searchTerm) {
                    searchPosts(searchTerm);
                } else {
                    fetchPosts(currentFilter);
                }
            }
        });
    }

    // Comments modal functionality
    if (closeCommentsModal) {
        closeCommentsModal.addEventListener('click', function () {
            commentsModal.classList.remove('active');
        });
    }

    if (commentsModal) {
        commentsModal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }

    if (submitComment) {
        submitComment.addEventListener('click', async function () {
            const text = commentText.value.trim();
            if (text && currentPostId) {
                await addComment(currentPostId, text);
                commentText.value = '';
            }
        });
    }

    // Fetch posts from backend
    async function fetchPosts(type = 'all') {
        try {
            showLoading(true);
            
            // Build the URL with the type parameter
            let url = '/api/posts';
            if (type && type !== 'all') {
                url += `?type=${type}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                displayPosts(data.posts);
            } else {
                console.error('Failed to fetch posts:', data.message);
                if (data.message === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            showLoading(false);
        }
    }

    // Search posts function
    async function searchPosts(searchTerm) {
        try {
            showLoading(true);
            
            const response = await fetch(`/api/posts/search?q=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                displayPosts(data.posts);
            } else {
                console.error('Failed to search posts:', data.message);
            }
        } catch (error) {
            console.error('Error searching posts:', error);
        } finally {
            showLoading(false);
        }
    }

    // Show/hide loading spinner
    function showLoading(show) {
        if (loadingSpinner) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
            } else {
                loadingSpinner.classList.add('hidden');
            }
        }
    }

    // Display posts in the container
    function displayPosts(posts) {
        postsContainer.innerHTML = '';

        if (posts.length === 0) {
            postsContainer.innerHTML = `
                <div class="no-posts">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14,2 14,8 20,8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <p>Немає постів для відображення</p>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            // Determine the category label and class based on post type
            let categoryLabel = '';
            let categoryClass = '';

            switch (post.type) {
                case 'news':
                    categoryLabel = 'Оголошення';
                    categoryClass = 'news';
                    break;
                case 'proposal':
                    categoryLabel = 'Пропозиція';
                    categoryClass = 'proposal';
                    break;
                case 'survey':
                    categoryLabel = 'Опитування';
                    categoryClass = 'survey';
                    break;
                default:
                    categoryLabel = post.type;
                    categoryClass = 'default';
            }

            // Generate initials for avatar fallback
            const initials = `${post.author.firstName.charAt(0)}${post.author.lastName.charAt(0)}`.toUpperCase();
            
            // Create avatar HTML
            const avatarHTML = post.author.avatar ? 
                `<img src="/uploads/${post.author.avatar}" alt="Аватар" class="author-avatar-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                 <div class="author-avatar-fallback" style="display: none;">${initials}</div>` :
                `<div class="author-avatar-fallback">${initials}</div>`;
            
            // Extract title from text (first line or first 50 characters)
            const textLines = post.text.split('\n');
            const title = textLines[0].length > 50 ? textLines[0].substring(0, 50) + '...' : textLines[0];
            const content = textLines.length > 1 ? textLines.slice(1).join('\n') : '';

            const postElement = document.createElement('div');
            postElement.className = 'post';
            
            // Create image HTML if post has image
            const imageHTML = post.image ? `
                <div class="post-image">
                    <img src="${post.image}" alt="Зображення поста" loading="lazy">
                </div>
            ` : '';

            // Create survey HTML if post is a survey
            const surveyHTML = post.type === 'survey' && post.surveyOptions ? `
                <div class="survey-options" data-post-id="${post._id}">
                    ${post.surveyOptions.map((option, index) => `
                        <div class="survey-option-item" data-option-index="${index}">
                            <div class="survey-option-text">
                                <span>${option.text}</span>
                                <span class="survey-option-votes">${option.votes} голосів</span>
                            </div>
                            <div class="survey-progress-bar" style="width: ${getSurveyOptionPercentage(option.votes, post.surveyOptions)}%"></div>
                        </div>
                    `).join('')}
                    <div class="survey-total-votes">
                        Всього голосів: ${getTotalSurveyVotes(post.surveyOptions)}
                    </div>
                </div>
            ` : '';
            
            postElement.innerHTML = `
                <div class="post-header">
                    <div class="post-header-top">
                        <div class="post-category ${categoryClass}-badge">${categoryLabel}</div>
                        <div class="post-author-avatar">${avatarHTML}</div>
                    </div>
                    <div class="post-author-info">
                        <div class="post-author-name">${post.author.firstName} ${post.author.lastName}</div>
                        <div class="post-meta">${post.author.grade} • ${timeAgo(new Date(post.createdAt))}</div>
                    </div>
                    <div class="post-title">${title}</div>
                </div>
                <div class="post-content">
                    <p>${content || post.text}</p>
                </div>
                ${imageHTML}
                ${surveyHTML}
                <div class="post-actions">
                    <button class="action-btn like-btn ${getLikedPosts().has(post._id) ? 'liked' : ''}" data-post-id="${post._id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${post.likes || 0}
                    </button>
                    <button class="action-btn comment-btn" data-post-id="${post._id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${post.comments ? post.comments.length : 0}
                    </button>
                </div>
            `;
            postsContainer.appendChild(postElement);
        });

        // Add event listeners to like buttons
        document.querySelectorAll('.like-btn').forEach(button => {
            button.addEventListener('click', handleLike);
        });

        // Add event listeners to comment buttons
        document.querySelectorAll('.comment-btn').forEach(button => {
            button.addEventListener('click', function () {
                const postId = this.dataset.postId;
                currentPostId = postId;
                openCommentsModal(postId);
            });
        });

        // Add event listeners to survey options
        document.querySelectorAll('.survey-option-item').forEach(option => {
            option.addEventListener('click', function () {
                const postId = this.closest('.survey-options').dataset.postId;
                const optionIndex = parseInt(this.dataset.optionIndex);
                handleSurveyVote(postId, optionIndex);
            });
        });
    }

    // Handle like button click
    async function handleLike(e) {
        const postId = e.target.closest('.like-btn').dataset.postId;

        try {
            const response = await fetch(`/api/posts/${postId}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Update like count
                const likeButton = e.target.closest('.like-btn');
                const likeCount = likeButton.querySelector('svg').nextSibling;
                likeCount.textContent = ` ${data.likes}`;
            } else {
                console.error('Failed to like post:', data.message);
                if (data.message === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Error liking post:', error);
        }
    }
    // Track liked posts in localStorage (by postId)
    function getLikedPosts() {
        return new Set(JSON.parse(localStorage.getItem('likedPosts') || '[]'));
    }

    function setLikedPosts(likedSet) {
        localStorage.setItem('likedPosts', JSON.stringify(Array.from(likedSet)));
    }

    // Handle like/unlike button click
    async function handleLike(e) {
        const likeBtn = e.target.closest('.like-btn');
        const postId = likeBtn.dataset.postId;
        let likedPosts = getLikedPosts();
        const isLiked = likedPosts.has(postId);

        try {
            // Choose endpoint and method based on like state
            const endpoint = isLiked ? `/api/posts/${postId}/unlike` : `/api/posts/${postId}/like`;
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (response.ok) {
                // Update like count and button state
                const likeCount = likeBtn.querySelector('svg').nextSibling;
                likeCount.textContent = ` ${data.likes}`;
                if (isLiked) {
                    likedPosts.delete(postId);
                    likeBtn.classList.remove('liked');
                } else {
                    likedPosts.add(postId);
                    likeBtn.classList.add('liked');
                }
                setLikedPosts(likedPosts);
            } else {
                console.error('Failed to like/unlike post:', data.message);
                if (data.message === 'Invalid or expired token') {
                    localStorage.removeItem('token');
                    window.location.href = 'index.html';
                }
            }
        } catch (error) {
            console.error('Error liking/unliking post:', error);
        }
    }

    // Helper function to format time ago
    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        let interval = seconds / 31536000;
        if (interval > 1) {
            return Math.floor(interval) + " лет назад";
        }

        interval = seconds / 2592000;
        if (interval > 1) {
            return Math.floor(interval) + " месяцев назад";
        }

        interval = seconds / 86400;
        if (interval > 1) {
            return Math.floor(interval) + " дней назад";
        }

        interval = seconds / 3600;
        if (interval > 1) {
            return Math.floor(interval) + " часов назад";
        }

        interval = seconds / 60;
        if (interval > 1) {
            return Math.floor(interval) + " минут назад";
        }

        return Math.floor(seconds) + " секунд назад";
    }

    // Open comments modal and load comments
    async function openCommentsModal(postId) {
        currentPostId = postId;
        commentsModal.classList.add('active');
        await loadComments(postId);
    }

    // Load comments for a post
    async function loadComments(postId) {
        try {
            const response = await fetch(`/api/posts/${postId}/comments`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                displayComments(data.comments);
            } else {
                console.error('Failed to load comments:', data.message);
                commentsList.innerHTML = '<div class="no-comments">Помилка завантаження коментарів</div>';
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            commentsList.innerHTML = '<div class="no-comments">Помилка завантаження коментарів</div>';
        }
    }

    // Display comments in the modal
    function displayComments(comments) {
        if (!comments || comments.length === 0) {
            commentsList.innerHTML = '<div class="no-comments">Ще немає коментарів. Станьте першим!</div>';
            return;
        }

        commentsList.innerHTML = comments.map(comment => {
            const initials = `${comment.author.firstName.charAt(0)}${comment.author.lastName.charAt(0)}`.toUpperCase();
            return `
                <div class="comment">
                    <div class="comment-header">
                        <div class="comment-author-avatar">${initials}</div>
                        <div class="comment-author-info">
                            <div class="comment-author-name">${comment.author.firstName} ${comment.author.lastName}</div>
                            <div class="comment-meta">${comment.author.grade} • ${timeAgo(new Date(comment.createdAt))}</div>
                        </div>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                </div>
            `;
        }).join('');
    }

    // Add a new comment
    async function addComment(postId, text) {
        try {
            const response = await fetch(`/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text })
            });

            const data = await response.json();

            if (response.ok) {
                // Reload comments
                await loadComments(postId);
                // Update comment count in the post
                updateCommentCount(postId);
            } else {
                console.error('Failed to add comment:', data.message);
                alert('Помилка додавання коментаря');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            alert('Помилка додавання коментаря');
        }
    }

    // Update comment count in the post
    function updateCommentCount(postId) {
        const commentBtn = document.querySelector(`[data-post-id="${postId}"].comment-btn`);
        if (commentBtn) {
            const currentCount = parseInt(commentBtn.textContent.trim()) || 0;
            commentBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                ${currentCount + 1}
            `;
        }
    }

    // Helper functions for surveys
    function getSurveyOptionPercentage(votes, allOptions) {
        const totalVotes = getTotalSurveyVotes(allOptions);
        if (totalVotes === 0) return 0;
        return (votes / totalVotes) * 100;
    }

    function getTotalSurveyVotes(surveyOptions) {
        if (!surveyOptions) return 0;
        return surveyOptions.reduce((total, option) => total + (option.votes || 0), 0);
    }

    // Handle survey vote
    async function handleSurveyVote(postId, optionIndex) {
        try {
            const response = await fetch(`/api/posts/${postId}/survey/vote`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ optionIndex })
            });

            const data = await response.json();

            if (response.ok) {
                // Update survey display
                updateSurveyDisplay(postId, data.surveyOptions);
            } else {
                console.error('Failed to vote in survey:', data.message);
                if (data.message === 'You have already voted in this survey') {
                    alert('Ви вже проголосували в цьому опитуванні');
                } else {
                    alert('Помилка голосування в опитуванні');
                }
            }
        } catch (error) {
            console.error('Error voting in survey:', error);
            alert('Помилка голосування в опитуванні');
        }
    }

    // Update survey display after voting
    function updateSurveyDisplay(postId, surveyOptions) {
        const surveyContainer = document.querySelector(`[data-post-id="${postId}"]`);
        if (!surveyContainer) return;

        // Update each option
        surveyOptions.forEach((option, index) => {
            const optionElement = surveyContainer.querySelector(`[data-option-index="${index}"]`);
            if (optionElement) {
                const votesElement = optionElement.querySelector('.survey-option-votes');
                const progressBar = optionElement.querySelector('.survey-progress-bar');
                
                if (votesElement) {
                    votesElement.textContent = `${option.votes} голосів`;
                }
                
                if (progressBar) {
                    progressBar.style.width = `${getSurveyOptionPercentage(option.votes, surveyOptions)}%`;
                }

                // Mark as voted
                optionElement.classList.add('voted');
            }
        });

        // Update total votes
        const totalVotesElement = surveyContainer.querySelector('.survey-total-votes');
        if (totalVotesElement) {
            totalVotesElement.textContent = `Всього голосів: ${getTotalSurveyVotes(surveyOptions)}`;
        }
    }

    // Initial fetch of posts
    await fetchPosts();
});