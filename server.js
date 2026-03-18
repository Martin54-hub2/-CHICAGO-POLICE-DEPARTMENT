// =======================================================================
// COMPLETE CPD BACKEND - ALL FEATURES
// Replace your entire server.js with this or add the new sections
// =======================================================================

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

// =======================================================================
// FILE UPLOAD SETUP
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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi/;
        if (allowed.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos allowed'));
        }
    }
});

app.use('/uploads', express.static('uploads'));

// =======================================================================
// SCHEMAS
// =======================================================================

// User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: String,
    callsign: String,
    role: { type: String, enum: ['Officer', 'Supervisor', 'Admin'], default: 'Officer' },
    subdivision: String,
    badgeNumber: String,
    department: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

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
    createdAt: { type: Date, default: Date.now }
});

const District = mongoose.model('District', districtSchema);

// Subdivision Schema (SWAT, Gangs & Drugs, etc.)
const subdivisionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    abbreviation: String,
    description: String,
    commander: String,
    memberCount: { type: Number, default: 0 },
    requirements: String,
    icon: String,
    createdAt: { type: Date, default: Date.now }
});

const Subdivision = mongoose.model('Subdivision', subdivisionSchema);

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
    createdAt: { type: Date, default: Date.now }
});

const Post = mongoose.model('Post', postSchema);

// Infraction Schema (Enhanced with media)
const infractionSchema = new mongoose.Schema({
    officerUsername: { type: String, required: true },
    officerName: String,
    reason: { type: String, required: true },
    details: String,
    severity: { type: String, enum: ['Minor', 'Moderate', 'Severe'], default: 'Moderate' },
    issuedBy: String,
    issuedByUsername: String,
    media: [String], // Array of image/video URLs
    status: { type: String, enum: ['Active', 'Resolved', 'Dismissed'], default: 'Active' },
    createdAt: { type: Date, default: Date.now }
});

const Infraction = mongoose.model('Infraction', infractionSchema);

// Chicago Penal Code Schema
const penalCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: String,
    category: String,
    jailTime: String,
    fine: Number,
    severity: { type: String, enum: ['Misdemeanor', 'Felony'], default: 'Misdemeanor' }
});

const PenalCode = mongoose.model('PenalCode', penalCodeSchema);

// Charges/Arrest Schema (MDT System)
const chargeSchema = new mongoose.Schema({
    suspectName: { type: String, required: true },
    suspectDOB: String,
    suspectAddress: String,
    mugshot: String,
    charges: [{
        code: String,
        title: String,
        jailTime: String,
        fine: Number
    }],
    totalJailTime: String,
    totalFine: Number,
    arrestingOfficer: String,
    arrestingOfficerUsername: String,
    arrestDate: { type: Date, default: Date.now },
    notes: String,
    evidence: [String], // Images/videos
    status: { type: String, enum: ['Arrested', 'Booked', 'Released', 'Court'], default: 'Arrested' },
    createdAt: { type: Date, default: Date.now }
});

const Charge = mongoose.model('Charge', chargeSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    reportId: String,
    type: String,
    description: String,
    officerUsername: String,
    status: String,
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Update Schema
const updateSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: String,
    createdAt: { type: Date, default: Date.now }
});

const Update = mongoose.model('Update', updateSchema);

// =======================================================================
// AUTH MIDDLEWARE
// =======================================================================
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin only' });
    }
    next();
}

function requireSupervisor(req, res, next) {
    if (req.user.role !== 'Admin' && req.user.role !== 'Supervisor') {
        return res.status(403).json({ message: 'Supervisor or Admin required' });
    }
    next();
}

// =======================================================================
// AUTH ROUTES
// =======================================================================
app.post('/api/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = new User({
            username: req.body.username,
            password: hashedPassword,
            name: req.body.name,
            callsign: req.body.callsign,
            role: req.body.role || 'Officer',
            subdivision: req.body.subdivision,
            badgeNumber: req.body.badgeNumber,
            department: req.body.department
        });
        await user.save();
        res.status(201).json({ message: 'User created' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.body.username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) return res.status(401).json({ message: 'Invalid password' });
        
        const token = jwt.sign(
            { username: user.username, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            token,
            user: {
                username: user.username,
                name: user.name,
                role: user.role,
                callsign: user.callsign,
                subdivision: user.subdivision,
                badgeNumber: user.badgeNumber
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// DISTRICTS API
// =======================================================================
app.get('/api/districts', async (req, res) => {
    try {
        const districts = await District.find().sort({ number: 1 });
        res.json(districts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/districts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const district = new District(req.body);
        await district.save();
        res.status(201).json(district);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/districts/:number', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const district = await District.findOneAndUpdate(
            { number: req.params.number },
            req.body,
            { new: true }
        );
        res.json(district);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/districts/:number', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await District.findOneAndDelete({ number: req.params.number });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// SUBDIVISIONS API
// =======================================================================
app.get('/api/subdivisions', async (req, res) => {
    try {
        const subdivisions = await Subdivision.find();
        res.json(subdivisions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/subdivisions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const subdivision = new Subdivision(req.body);
        await subdivision.save();
        res.status(201).json(subdivision);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/subdivisions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const subdivision = await Subdivision.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(subdivision);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/subdivisions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await Subdivision.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// POSTS API
// =======================================================================
app.get('/api/posts', async (req, res) => {
    try {
        const { category, status, featured, limit } = req.query;
        const filter = {};
        if (category) filter.category = category;
        if (status) filter.status = status;
        if (featured) filter.featured = featured === 'true';
        
        let query = Post.find(filter).sort({ createdAt: -1 });
        if (limit) query = query.limit(parseInt(limit));
        
        const posts = await query;
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/posts', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const post = new Post({
            ...req.body,
            author: req.user.name,
            authorUsername: req.user.username
        });
        await post.save();
        res.status(201).json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(post);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/posts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// INFRACTIONS API (Enhanced with media)
// =======================================================================
app.get('/api/infractions', authenticateToken, async (req, res) => {
    try {
        const { username, status } = req.query;
        const filter = {};
        if (username) filter.officerUsername = username;
        if (status) filter.status = status;
        
        const infractions = await Infraction.find(filter).sort({ createdAt: -1 });
        res.json(infractions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/infractions', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const infraction = new Infraction({
            ...req.body,
            issuedBy: req.user.name,
            issuedByUsername: req.user.username
        });
        await infraction.save();
        res.status(201).json(infraction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/infractions/:id', authenticateToken, requireSupervisor, async (req, res) => {
    try {
        const infraction = await Infraction.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(infraction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =======================================================================
// CHICAGO PENAL CODES API
// =======================================================================
app.get('/api/penal-codes', async (req, res) => {
    try {
        const codes = await PenalCode.find().sort({ code: 1 });
        res.json(codes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/penal-codes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const code = new PenalCode(req.body);
        await code.save();
        res.status(201).json(code);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =======================================================================
// CHARGES/MDT API
// =======================================================================
app.get('/api/charges', authenticateToken, async (req, res) => {
    try {
        const { suspectName, status } = req.query;
        const filter = {};
        if (suspectName) filter.suspectName = new RegExp(suspectName, 'i');
        if (status) filter.status = status;
        
        const charges = await Charge.find(filter).sort({ createdAt: -1 });
        res.json(charges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/charges', authenticateToken, async (req, res) => {
    try {
        const charge = new Charge({
            ...req.body,
            arrestingOfficer: req.user.name,
            arrestingOfficerUsername: req.user.username
        });
        await charge.save();
        res.status(201).json(charge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.put('/api/charges/:id', authenticateToken, async (req, res) => {
    try {
        const charge = await Charge.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(charge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =======================================================================
// FILE UPLOAD API
// =======================================================================
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file' });
        res.json({ url: '/uploads/' + req.file.filename });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/upload-multiple', authenticateToken, upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files' });
        }
        const urls = req.files.map(file => '/uploads/' + file.filename);
        res.json({ urls });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// USERS API
// =======================================================================
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/:username', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/users/:username', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findOneAndUpdate(
            { username: req.params.username },
            req.body,
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/users/:username', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await User.findOneAndDelete({ username: req.params.username });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// =======================================================================
// REPORTS & UPDATES API
// =======================================================================
app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
        const reports = await Report.find().sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/reports', authenticateToken, async (req, res) => {
    try {
        const report = new Report({
            ...req.body,
            reportId: 'RPT-' + Date.now(),
            officerUsername: req.user.username
        });
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/updates', async (req, res) => {
    try {
        const updates = await Update.find().sort({ createdAt: -1 }).limit(10);
        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/updates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const update = new Update({
            ...req.body,
            author: req.user.name
        });
        await update.save();
        res.status(201).json(update);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// =======================================================================
// HEALTH CHECK
// =======================================================================
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

// =======================================================================
// START SERVER
// =======================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
