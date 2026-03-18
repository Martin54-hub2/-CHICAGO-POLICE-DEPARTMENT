// =========================================================================
// CMS JAVASCRIPT FUNCTIONS
// Add this to your index.html <script> section (after your existing functions)
// =========================================================================

// -------------------------------------------------------------------------
// ADMIN TAB SWITCHING
// -------------------------------------------------------------------------
function switchAdminTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`admin-tab-${tabName}`).classList.add('active');
    
    // Set active tab button
    event.target.classList.add('active');
    
    // Load content for the tab
    if (tabName === 'districts') loadDistrictsList();
    if (tabName === 'posts') loadPostsList();
}

// =========================================================================
// DISTRICTS MANAGEMENT
// =========================================================================

// Load all districts
async function loadDistrictsList() {
    try {
        const districts = await apiCall('/api/districts');
        const container = document.getElementById('districtsList');
        
        if (!districts.length) {
            container.innerHTML = '<div class="empty-state">No districts yet. Click "+ Add District" to create one.</div>';
            return;
        }
        
        container.innerHTML = districts.map(district => `
            <div class="district-card">
                <div class="card-header">
                    <div>
                        <div class="card-title">District ${district.number} - ${district.name}</div>
                        <div class="card-meta">
                            ${district.commander ? `<span>👮 ${district.commander}</span>` : ''}
                            ${district.phone ? `<span>📞 ${district.phone}</span>` : ''}
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editDistrict(${district.number})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deleteDistrict(${district.number})">Delete</button>
                    </div>
                </div>
                ${district.description ? `<p style="color:#6b7280;margin-bottom:.5rem">${district.description}</p>` : ''}
                ${district.streets && district.streets.length ? `
                    <div style="margin-top:1rem">
                        <strong style="font-size:.875rem">Streets:</strong>
                        <p style="font-size:.875rem;color:#6b7280">${district.streets.join(', ')}</p>
                    </div>
                ` : ''}
                ${district.boundaries ? `<p style="font-size:.875rem;color:#6b7280;margin-top:.5rem"><strong>Boundaries:</strong> ${district.boundaries}</p>` : ''}
                ${district.address ? `<p style="font-size:.875rem;color:#6b7280;margin-top:.5rem">📍 ${district.address}</p>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load districts:', error);
        alert('Failed to load districts');
    }
}

// Save new district
async function saveDistrict(e) {
    e.preventDefault();
    const form = e.target;
    
    const districtData = {
        number: parseInt(form.number.value),
        name: form.name.value,
        description: form.description.value,
        streets: form.streets.value.split('\n').map(s => s.trim()).filter(Boolean),
        boundaries: form.boundaries.value,
        commander: form.commander.value,
        phone: form.phone.value,
        address: form.address.value
    };
    
    try {
        await apiCall('/api/districts', {
            method: 'POST',
            body: JSON.stringify(districtData)
        });
        
        closeModal('addDistrictModal');
        form.reset();
        alert('District created!');
        await loadDistrictsList();
    } catch (error) {
        alert(error.message || 'Failed to create district');
    }
    
    return false;
}

// Edit district
async function editDistrict(number) {
    try {
        const district = await apiCall(`/api/districts/${number}`);
        
        document.getElementById('editDistrictNumber').value = district.number;
        document.getElementById('editDistrictName').value = district.name;
        document.getElementById('editDistrictDescription').value = district.description || '';
        document.getElementById('editDistrictStreets').value = (district.streets || []).join('\n');
        document.getElementById('editDistrictBoundaries').value = district.boundaries || '';
        document.getElementById('editDistrictCommander').value = district.commander || '';
        document.getElementById('editDistrictPhone').value = district.phone || '';
        document.getElementById('editDistrictAddress').value = district.address || '';
        
        openModal('editDistrictModal');
    } catch (error) {
        alert('Failed to load district');
    }
}

// Update district
async function updateDistrict(e) {
    e.preventDefault();
    const number = document.getElementById('editDistrictNumber').value;
    
    const districtData = {
        name: document.getElementById('editDistrictName').value,
        description: document.getElementById('editDistrictDescription').value,
        streets: document.getElementById('editDistrictStreets').value.split('\n').map(s => s.trim()).filter(Boolean),
        boundaries: document.getElementById('editDistrictBoundaries').value,
        commander: document.getElementById('editDistrictCommander').value,
        phone: document.getElementById('editDistrictPhone').value,
        address: document.getElementById('editDistrictAddress').value
    };
    
    try {
        await apiCall(`/api/districts/${number}`, {
            method: 'PUT',
            body: JSON.stringify(districtData)
        });
        
        closeModal('editDistrictModal');
        alert('District updated!');
        await loadDistrictsList();
    } catch (error) {
        alert(error.message || 'Failed to update district');
    }
    
    return false;
}

// Delete district
async function deleteDistrict(number) {
    if (!confirm(`Delete District ${number}? This cannot be undone.`)) return;
    
    try {
        await apiCall(`/api/districts/${number}`, {
            method: 'DELETE'
        });
        
        alert('District deleted');
        await loadDistrictsList();
    } catch (error) {
        alert(error.message || 'Failed to delete district');
    }
}

// =========================================================================
// POSTS/NEWS MANAGEMENT
// =========================================================================

// Load all posts
async function loadPostsList() {
    try {
        const posts = await apiCall('/api/posts');
        const container = document.getElementById('postsList');
        
        if (!posts.length) {
            container.innerHTML = '<div class="empty-state">No posts yet. Click "+ New Post" to create one.</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-card">
                <div class="card-header">
                    <div style="display:flex;align-items:start">
                        ${post.image ? `<img src="${API_URL}${post.image}" class="post-image" alt="${post.title}">` : ''}
                        <div>
                            <div class="card-title">${post.title}</div>
                            <div class="card-meta">
                                <span class="status-badge status-${post.category}">${post.category}</span>
                                <span>✍️ ${post.author}</span>
                                <span>📅 ${new Date(post.createdAt).toLocaleDateString()}</span>
                                ${post.featured ? '<span style="color:#d97706">⭐ Featured</span>' : ''}
                            </div>
                            <p style="color:#6b7280;margin-top:.75rem;font-size:.9rem">${post.excerpt}</p>
                        </div>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-sm btn-primary" onclick="editPost('${post._id}')">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="deletePost('${post._id}')">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load posts:', error);
        alert('Failed to load posts');
    }
}

// Save new post
async function savePost(e) {
    e.preventDefault();
    const form = e.target;
    
    const postData = {
        title: form.title.value,
        body: form.body.value,
        category: form.category.value,
        image: form.image.value,
        featured: form.featured.checked,
        tags: form.tags.value.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
        await apiCall('/api/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        });
        
        closeModal('addPostModal');
        form.reset();
        document.getElementById('postImageUrl').value = '';
        alert('Post published!');
        await loadPostsList();
    } catch (error) {
        alert(error.message || 'Failed to create post');
    }
    
    return false;
}

// Edit post
async function editPost(id) {
    try {
        const post = await apiCall(`/api/posts/${id}`);
        
        document.getElementById('editPostId').value = post._id;
        document.getElementById('editPostTitle').value = post.title;
        document.getElementById('editPostCategory').value = post.category;
        document.getElementById('editPostImageUrl').value = post.image || '';
        document.getElementById('editPostBody').value = post.body;
        document.getElementById('editPostFeatured').checked = post.featured;
        document.getElementById('editPostTags').value = (post.tags || []).join(', ');
        
        openModal('editPostModal');
    } catch (error) {
        alert('Failed to load post');
    }
}

// Update post
async function updatePost(e) {
    e.preventDefault();
    const id = document.getElementById('editPostId').value;
    
    const postData = {
        title: document.getElementById('editPostTitle').value,
        body: document.getElementById('editPostBody').value,
        category: document.getElementById('editPostCategory').value,
        image: document.getElementById('editPostImageUrl').value,
        featured: document.getElementById('editPostFeatured').checked,
        tags: document.getElementById('editPostTags').value.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    try {
        await apiCall(`/api/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        });
        
        closeModal('editPostModal');
        alert('Post updated!');
        await loadPostsList();
    } catch (error) {
        alert(error.message || 'Failed to update post');
    }
    
    return false;
}

// Delete post
async function deletePost(id) {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    
    try {
        await apiCall(`/api/posts/${id}`, {
            method: 'DELETE'
        });
        
        alert('Post deleted');
        await loadPostsList();
    } catch (error) {
        alert(error.message || 'Failed to delete post');
    }
}

// =========================================================================
// IMAGE UPLOAD HANDLING
// =========================================================================

// Trigger file upload for new post
function uploadPostImage() {
    document.getElementById('postImageFile').click();
}

// Handle new post image upload
async function handlePostImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        
        document.getElementById('postImageUrl').value = data.url;
        alert('Image uploaded!');
    } catch (error) {
        alert(error.message || 'Failed to upload image');
    }
}

// Trigger file upload for edit post
function uploadEditPostImage() {
    document.getElementById('editPostImageFile').click();
}

// Handle edit post image upload
async function handleEditPostImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Upload failed');
        }
        
        document.getElementById('editPostImageUrl').value = data.url;
        alert('Image uploaded!');
    } catch (error) {
        alert(error.message || 'Failed to upload image');
    }
}

// =========================================================================
// PUBLIC SITE FUNCTIONS (Display posts/districts on public pages)
// =========================================================================

// Load featured posts on home page
async function loadFeaturedPosts() {
    try {
        const posts = await apiCall('/api/posts?featured=true&limit=3');
        // Render featured posts on your home page
        console.log('Featured posts:', posts);
    } catch (error) {
        console.error('Failed to load featured posts:', error);
    }
}

// Load all news posts on news page
async function loadNewsPagePosts() {
    try {
        const posts = await apiCall('/api/posts?category=news&status=published');
        const container = document.getElementById('newsPostsList'); // You'll need to add this div
        
        if (container && posts.length) {
            container.innerHTML = posts.map(post => `
                <div class="update-item">
                    ${post.image ? `<img src="${API_URL}${post.image}" style="width:100%;max-height:200px;object-fit:cover;border-radius:6px;margin-bottom:1rem" alt="${post.title}">` : ''}
                    <strong>${post.title}</strong>
                    <small>${new Date(post.createdAt).toLocaleDateString()} - ${post.author}</small>
                    <p>${post.body}</p>
                    ${post.tags && post.tags.length ? `<div style="margin-top:.5rem">${post.tags.map(tag => `<span class="status-badge" style="margin-right:.5rem">${tag}</span>`).join('')}</div>` : ''}
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Failed to load news posts:', error);
    }
}

// Load district finder/map
async function loadDistrictFinder() {
    try {
        const districts = await apiCall('/api/districts');
        // Render districts on a public-facing district finder page
        console.log('Districts:', districts);
    } catch (error) {
        console.error('Failed to load districts:', error);
    }
}

// =========================================================================
// INTEGRATION NOTES
// =========================================================================

/*
1. Add these functions to your <script> section
2. Call loadDistrictsList() when Districts tab is clicked
3. Call loadPostsList() when Posts tab is clicked
4. Call loadNewsPagePosts() when news page loads
5. Add <div id="newsPostsList"></div> to your news page where posts should display
6. Customize the HTML rendering to match your design
*/
