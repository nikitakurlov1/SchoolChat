// Create post functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check for JWT token
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    
    const postForm = document.getElementById('postForm');
    const postImage = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const uploadLabel = document.querySelector('.image-upload-label');
    const postType = document.getElementById('postType');
    const postTypeSelect = document.getElementById('postTypeSelect');
    const surveyOptions = document.getElementById('surveyOptions');
    const surveyOptionsContainer = document.getElementById('surveyOptionsContainer');
    const addSurveyOptionBtn = document.getElementById('addSurveyOption');
    
    let selectedFile = null;
    let currentPostType = 'news';
    
    // Custom select functionality
    if (postTypeSelect) {
        const selectTrigger = postTypeSelect.querySelector('.select-trigger');
        const selectOptions = postTypeSelect.querySelector('.select-options');
        const selectValue = postTypeSelect.querySelector('.select-value');
        const options = postTypeSelect.querySelectorAll('.select-option');
        
        // Toggle dropdown
        selectTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            selectTrigger.classList.toggle('active');
            selectOptions.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!postTypeSelect.contains(e.target)) {
                selectTrigger.classList.remove('active');
                selectOptions.classList.remove('active');
            }
        });
        
        // Handle option selection
        options.forEach(option => {
            option.addEventListener('click', function() {
                const value = this.dataset.value;
                const icon = this.dataset.icon;
                const text = this.querySelector('.option-text').textContent;
                
                // Update selected option
                options.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                // Update display
                selectValue.innerHTML = `<span class="option-icon">${icon}</span><span class="option-text">${text}</span>`;
                
                // Update hidden input
                postType.value = value;
                currentPostType = value;
                
                // Show/hide survey options
                if (value === 'survey') {
                    surveyOptions.style.display = 'block';
                } else {
                    surveyOptions.style.display = 'none';
                }
                
                // Close dropdown
                selectTrigger.classList.remove('active');
                selectOptions.classList.remove('active');
            });
        });
        
        // Set initial selection
        options[0].classList.add('selected');
    }
    
    // Add survey option
    if (addSurveyOptionBtn) {
        addSurveyOptionBtn.addEventListener('click', function() {
            const optionCount = surveyOptionsContainer.querySelectorAll('.survey-option').length;
            if (optionCount >= 10) {
                alert('Максимум 10 варіантів відповідей');
                return;
            }
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'survey-option';
            optionDiv.innerHTML = `
                <input type="text" class="survey-option-input" placeholder="Варіант ${optionCount + 1}">
                <button type="button" class="remove-option-btn">×</button>
            `;
            surveyOptionsContainer.appendChild(optionDiv);
            
            // Add event listener to remove button
            const removeBtn = optionDiv.querySelector('.remove-option-btn');
            removeBtn.addEventListener('click', function() {
                if (surveyOptionsContainer.querySelectorAll('.survey-option').length > 2) {
                    optionDiv.remove();
                } else {
                    alert('Потрібно хоча б 2 варіанти відповідей');
                }
            });
        });
        
        // Add event listeners to existing remove buttons
        document.querySelectorAll('.remove-option-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                if (surveyOptionsContainer.querySelectorAll('.survey-option').length > 2) {
                    this.closest('.survey-option').remove();
                } else {
                    alert('Потрібно хоча б 2 варіанти відповідей');
                }
            });
        });
    }
    
    // Image upload functionality
    if (postImage) {
        postImage.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }
    
    // Drag and drop functionality
    if (uploadLabel) {
        uploadLabel.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadLabel.classList.add('drag-over');
        });
        
        uploadLabel.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadLabel.classList.remove('drag-over');
        });
        
        uploadLabel.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadLabel.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                if (file.type.startsWith('image/')) {
                    handleImageUpload(file);
                } else {
                    alert('Будь ласка, виберіть зображення');
                }
            }
        });
    }
    
    // Remove image functionality
    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', function() {
            removeImage();
        });
    }
    
    function handleImageUpload(file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Будь ласка, виберіть зображення');
            return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Розмір зображення не повинен перевищувати 5MB');
            return;
        }
        
        selectedFile = file;
        
        // Create preview
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImg.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadLabel.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
    
    function removeImage() {
        selectedFile = null;
        postImage.value = '';
        imagePreview.style.display = 'none';
        uploadLabel.style.display = 'flex';
    }
    
    if (postForm) {
        postForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const postTypeValue = currentPostType;
            const postContent = document.getElementById('postContent').value;
            const postTitle = document.getElementById('postTitle').value;
            
            // For surveys, validate options
            if (postTypeValue === 'survey') {
                const optionInputs = document.querySelectorAll('.survey-option-input');
                const options = [];
                
                for (let i = 0; i < optionInputs.length; i++) {
                    const optionText = optionInputs[i].value.trim();
                    if (optionText === '') {
                        alert(`Варіант ${i + 1} не може бути порожнім`);
                        return;
                    }
                    options.push(optionText);
                }
                
                // Check for duplicate options
                const uniqueOptions = [...new Set(options)];
                if (uniqueOptions.length !== options.length) {
                    alert('Варіанти відповідей не повинні повторюватися');
                    return;
                }
                
                // Combine title and content
                const fullText = postTitle ? `${postTitle}\n\n${postContent}` : postContent;
                
                try {
                    // Create FormData for file upload
                    const formData = new FormData();
                    formData.append('text', fullText);
                    formData.append('type', postTypeValue);
                    formData.append('surveyOptions', JSON.stringify(options));
                    
                    if (selectedFile) {
                        formData.append('image', selectedFile);
                    }
                    
                    const response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert('Опитування успішно створено!');
                        // Redirect to feed page
                        window.location.href = 'feed.html';
                    } else {
                        alert(data.message || 'Не вдалося створити опитування');
                        if (data.message === 'Invalid or expired token') {
                            localStorage.removeItem('token');
                            window.location.href = 'index.html';
                        }
                    }
                } catch (error) {
                    console.error('Error creating survey:', error);
                    alert('Сталася помилка при створенні опитування');
                }
            } else {
                // Regular post creation
                // Combine title and content
                const fullText = postTitle ? `${postTitle}\n\n${postContent}` : postContent;
                
                try {
                    // Create FormData for file upload
                    const formData = new FormData();
                    formData.append('text', fullText);
                    formData.append('type', postTypeValue);
                    
                    if (selectedFile) {
                        formData.append('image', selectedFile);
                    }
                    
                    const response = await fetch('/api/posts', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok) {
                        alert('Пост успішно створено!');
                        // Redirect to feed page
                        window.location.href = 'feed.html';
                    } else {
                        alert(data.message || 'Не вдалося створити пост');
                        if (data.message === 'Invalid or expired token') {
                            localStorage.removeItem('token');
                            window.location.href = 'index.html';
                        }
                    }
                } catch (error) {
                    console.error('Error creating post:', error);
                    alert('Сталася помилка при створенні поста');
                }
            }
        });
    }
});