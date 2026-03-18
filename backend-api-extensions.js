// =======================================================================
// CPD WEBSITE - BACKEND API EXTENSIONS
// Add this code to your existing Railway backend server.js
// =======================================================================

/* 
INSTALLATION STEPS:
1. npm install multer
2. Add these routes to your Express app
3. Deploy to Railway
*/

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// =======================================================================
// IMAGE UPLOAD SETUP
// =======================================================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (/jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Images only'));
        }
    }
});

// =======================================================================
// MONGODB SCHEMAS
// =======================================================================

// District Schema
const districtSchema = new mongoose.Schema({
    number: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    streets: [String],
    boundaries: String,
    commander: String,
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const District = mongoose.model('District', districtSchema);

// Post/News Schema
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    excerpt: String,
    category: { type: String, default: 'news' },
    image: String,
    author: String,
    authorUsername: String,
    status: { type: String, default: 'published' },
    featured: { type: Boolean, default: false },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// =======================================================================
// DISTRICTS API
// =======================================================================

// GET all districts
app.get('/api/districts', async (req, res) => {
    try {
        const districts = await District.find().sort({ number: 1 });
        res.json(districts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single district
app.get('/api/districts/:number', async (req, res) => {
    try {
        const district = await District.findOne({ number: req.params.number });
        if (!district) return res.status(404).json({ message: 'Not found' });
        res.json(district);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE district (Admin only)
app.post('/api/districts', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const district = new District(req.body);
        await district.save();
        res.status(201).json(district);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE district (Admin only)
app.put('/api/districts/:number', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const district = await District.findOne({ number: req.params.number });
        if (!district) return res.status(404).json({ message: 'Not found' });
        
        Object.assign(district, req.body, { updatedAt: Date.now() });
        await district.save();
        res.json(district);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE district (Admin only)
app.delete('/api/districts/:number', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const district = await District.findOneAndDelete({ number: req.params.number });
        if (!district) return res.status(404).json({ message: 'Not found' });
        res.json({ message: 'Deleted', district });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// POSTS/NEWS API
// =======================================================================

// GET all posts
app.get('/api/posts', async (req, res) => {
    try {
        const { category, status, featured, limit } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (featured !== undefined) filter.featured = featured === 'true';
        
        let query = Post.find(filter).sort({ createdAt: -1 });
        if (limit) query = query.limit(parseInt(limit));
        
        const posts = await query;
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Not found' });
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE post (Admin only)
app.post('/api/posts', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const post = new Post({
            ...req.body,
            author: req.user.name,
            authorUsername: req.user.username,
            excerpt: req.body.excerpt || req.body.body.substring(0, 150) + '...'
        });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE post (Admin only)
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Not found' });
        
        Object.assign(post, req.body, { updatedAt: Date.now() });
        await post.save();
        res.json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE post (Admin only)
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        const post = await Post.findByIdAndDelete(req.params.id);
        if (!post) return res.status(404).json({ message: 'Not found' });
        
        // Delete image if exists
        if (post.image && post.image.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, post.image);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        res.json({ message: 'Deleted', post });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// IMAGE UPLOAD API
// =======================================================================

app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    try {
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ message: 'Admin only' });
        }
        if (!req.file) {
            return res.status(400).json({ message: 'No file' });
        }
        res.json({
            url: '/uploads/' + req.file.filename,
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// =======================================================================
// DEPLOYMENT CHECKLIST
// =======================================================================
/*
✅ Install multer: npm install multer
✅ Add these routes to server.js
✅ Create uploads folder
✅ Push to GitHub
✅ Railway will auto-deploy
✅ Test endpoints with Postman or frontend
*/
