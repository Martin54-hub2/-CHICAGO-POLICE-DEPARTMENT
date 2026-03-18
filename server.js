// CPD Department Management - Backend Server
// Node.js + Express + MongoDB

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'cpd-secret-change-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cpd-department';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

// ==================== SCHEMAS ====================

// Officer Schema
const officerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    callsign: { type: String, default: '' },
    rank: { type: String, default: 'Officer' },
    role: { type: String, enum: ['Officer', 'Supervisor', 'Admin'], default: 'Officer' },
    department: { type: String, default: 'Patrol' },
    status: { type: String, default: 'Active' },
    infractions: [{
        reason: String,
        notes: String,
        issuedBy: String,
        date: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});

const Officer = mongoose.model('Officer', officerSchema);

// Report Schema
const reportSchema = new mongoose.Schema({
    reportId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    username: { type: String, required: true },
    officerName: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Update Schema
const updateSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Update = mongoose.model('Update', updateSchema);

// ==================== AUTH MIDDLEWARE ====================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

function requireSupervisorOrAdmin(req, res, next) {
    if (req.user.role !== 'Admin' && req.user.role !== 'Supervisor') {
        return res.status(403).json({ error: 'Supervisor or Admin access required' });
    }
    next();
}

// ==================== ROUTES ====================

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CPD Backend Server Running' });
});

// ===== AUTH ROUTES =====

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Find officer
        const officer = await Officer.findOne({ username });
        if (!officer) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Check password
        const validPassword = await bcrypt.compare(password, officer.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create token
        const token = jwt.sign(
            { 
                username: officer.username, 
                role: officer.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                username: officer.username,
                name: officer.name,
                callsign: officer.callsign,
                rank: officer.rank,
                role: officer.role,
                department: officer.department,
                status: officer.status
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const officer = await Officer.findOne({ username: req.user.username }).select('-password');
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        res.json(officer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== OFFICER ROUTES =====

// Get All Officers (Admin/Supervisor only)
app.get('/api/officers', authenticateToken, requireSupervisorOrAdmin, async (req, res) => {
    try {
        const officers = await Officer.find().select('-password');
        res.json(officers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search Officers
app.get('/api/officers/search', authenticateToken, requireSupervisorOrAdmin, async (req, res) => {
    try {
        const { query } = req.query;
        const officers = await Officer.find({
            $or: [
                { username: { $regex: query, $options: 'i' } },
                { name: { $regex: query, $options: 'i' } },
                { callsign: { $regex: query, $options: 'i' } }
            ]
        }).select('-password');
        res.json(officers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Officer
app.get('/api/officers/:username', authenticateToken, async (req, res) => {
    try {
        const officer = await Officer.findOne({ username: req.params.username }).select('-password');
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        res.json(officer);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Officer (Admin only)
app.post('/api/officers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password, name, callsign, rank, role, department } = req.body;
        
        // Check if username exists
        const exists = await Officer.findOne({ username });
        if (exists) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create officer
        const officer = new Officer({
            username,
            password: hashedPassword,
            name,
            callsign: callsign || '',
            rank: rank || 'Officer',
            role: role || 'Officer',
            department: department || 'Patrol'
        });
        
        await officer.save();
        
        // Return without password
        const officerData = officer.toObject();
        delete officerData.password;
        
        res.status(201).json(officerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Officer (Admin or Supervisor for callsign/rank)
app.put('/api/officers/:username', authenticateToken, requireSupervisorOrAdmin, async (req, res) => {
    try {
        const { name, callsign, rank, role, department, status } = req.body;
        
        const officer = await Officer.findOne({ username: req.params.username });
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        
        // Supervisors can only update callsign and rank
        if (req.user.role === 'Supervisor') {
            if (callsign !== undefined) officer.callsign = callsign;
            if (rank !== undefined) officer.rank = rank;
        } else {
            // Admins can update everything
            if (name !== undefined) officer.name = name;
            if (callsign !== undefined) officer.callsign = callsign;
            if (rank !== undefined) officer.rank = rank;
            if (role !== undefined) officer.role = role;
            if (department !== undefined) officer.department = department;
            if (status !== undefined) officer.status = status;
        }
        
        await officer.save();
        
        const officerData = officer.toObject();
        delete officerData.password;
        
        res.json(officerData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Officer (Admin only)
app.delete('/api/officers/:username', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const result = await Officer.deleteOne({ username: req.params.username });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        res.json({ message: 'Officer deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add Infraction (Admin/Supervisor only)
app.post('/api/officers/:username/infractions', authenticateToken, requireSupervisorOrAdmin, async (req, res) => {
    try {
        const { reason, notes } = req.body;
        
        const officer = await Officer.findOne({ username: req.params.username });
        if (!officer) {
            return res.status(404).json({ error: 'Officer not found' });
        }
        
        officer.infractions.unshift({
            reason,
            notes: notes || '',
            issuedBy: req.user.username,
            date: new Date()
        });
        
        await officer.save();
        
        res.status(201).json(officer.infractions[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== REPORT ROUTES =====

// Get All Reports
app.get('/api/reports', authenticateToken, async (req, res) => {
    try {
        let query = {};
        
        // Officers can only see their own reports
        if (req.user.role === 'Officer') {
            query.username = req.user.username;
        }
        
        const reports = await Report.find(query).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Report
app.post('/api/reports', authenticateToken, async (req, res) => {
    try {
        const { type, location, description } = req.body;
        
        const officer = await Officer.findOne({ username: req.user.username });
        
        const report = new Report({
            reportId: 'R' + Date.now(),
            type,
            location,
            description,
            username: req.user.username,
            officerName: officer.name,
            status: 'pending'
        });
        
        await report.save();
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===== UPDATE ROUTES =====

// Get All Updates
app.get('/api/updates', async (req, res) => {
    try {
        const updates = await Update.find().sort({ createdAt: -1 }).limit(50);
        res.json(updates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Update (Admin only)
app.post('/api/updates', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { title, content } = req.body;
        
        const officer = await Officer.findOne({ username: req.user.username });
        
        const update = new Update({
            title,
            content,
            author: officer.name
        });
        
        await update.save();
        res.status(201).json(update);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== INITIALIZATION ====================

// Create default admin account on first run
async function createDefaultAdmin() {
    try {
        const adminExists = await Officer.findOne({ username: 'AdminPannel' });
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('CPD543', 10);
            const admin = new Officer({
                username: 'AdminPannel',
                password: hashedPassword,
                name: 'System Administrator',
                callsign: 'Admin-1',
                rank: 'Administrator',
                role: 'Admin'
            });
            await admin.save();
            console.log('✅ Default admin created: AdminPannel / CPD543');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚔 CPD Backend Server running on port ${PORT}`);
    createDefaultAdmin();
});
