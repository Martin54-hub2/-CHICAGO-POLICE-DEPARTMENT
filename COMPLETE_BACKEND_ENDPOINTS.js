// ========================================
// COMPLETE BACKEND ENDPOINTS FOR server.js
// Copy all of this into your server.js file
// ========================================

// ========================================
// 0. OFFICERS PROFILE SYSTEM
// ========================================

// Note: Officers schema should already exist in your server.js
// If not, add these fields to your existing Officers schema:
/*
const officerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: String,
  name: String,
  callsign: String,
  rank: String,
  role: String, // 'Admin', 'Supervisor', 'Officer'
  photo: String, // base64 profile photo
  email: String,
  phone: String,
  bio: String,
  emergencyContact: String,
  certifications: String,
  badgeNumber: String,
  joinDate: { type: String, default: () => new Date().toLocaleDateString() },
  dept: { type: String, default: 'Patrol' },
  infractions: [{
    reason: String,
    date: String,
    notes: String,
    issuedBy: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const Officer = mongoose.model('Officer', officerSchema);
*/

// GET officer by username
app.get('/api/officers/:username', authenticate, async (req, res) => {
  try {
    const officer = await Officer.findOne({ username: req.params.username });
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    // Don't send password
    const { password, ...officerData } = officer.toObject();
    res.json(officerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE officer profile (self or admin)
app.put('/api/officers/:username/profile', authenticate, async (req, res) => {
  try {
    // Check permissions
    if (req.user.username !== req.params.username && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Can only edit your own profile' });
    }
    
    const { email, phone, bio, emergencyContact, certifications } = req.body;
    
    const officer = await Officer.findOneAndUpdate(
      { username: req.params.username },
      { email, phone, bio, emergencyContact, certifications },
      { new: true }
    );
    
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    const { password, ...officerData } = officer.toObject();
    res.json(officerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE officer photo (self or admin)
app.put('/api/officers/:username/photo', authenticate, async (req, res) => {
  try {
    // Check permissions
    if (req.user.username !== req.params.username && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Can only edit your own photo' });
    }
    
    const { photo } = req.body;
    
    const officer = await Officer.findOneAndUpdate(
      { username: req.params.username },
      { photo },
      { new: true }
    );
    
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    const { password, ...officerData } = officer.toObject();
    res.json(officerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 1. NEWS SYSTEM
// ========================================

const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String,
  date: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const News = mongoose.model('News', newsSchema);

// GET all news posts
app.get('/api/news', async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE news post (Admin only)
app.post('/api/news', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const { title, content, image } = req.body;
    
    const news = new News({
      title,
      content,
      image: image || '',
      date: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      author: req.user.name
    });
    
    await news.save();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE news post (Admin only)
app.put('/api/news/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const { title, content, image } = req.body;
    const news = await News.findByIdAndUpdate(
      req.params.id,
      { title, content, ...(image && { image }) },
      { new: true }
    );
    
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE news post (Admin only)
app.delete('/api/news/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    await News.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 2. MDT SUSPECT SYSTEM
// ========================================

const suspectSchema = new mongoose.Schema({
  name: String,
  age: Number,
  gender: String,
  race: String,
  address: String,
  description: String,
  mugshot: String,
  license: { type: String, default: 'None' }, // Driver's license status
  foid: { type: String, default: 'None' }, // Firearms license status
  charges: [{
    code: String,
    title: String,
    reason: String,
    date: { type: String, default: () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
    addedBy: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdBy: String,
  createdAt: { type: Date, default: Date.now }
});

const Suspect = mongoose.model('Suspect', suspectSchema);

// SEARCH suspects (all users can search)
app.get('/api/suspects/search', authenticate, async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Search query required' });
    }
    
    const suspects = await Suspect.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { address: { $regex: query, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });
    
    res.json(suspects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all suspects (all users can view)
app.get('/api/suspects', authenticate, async (req, res) => {
  try {
    const suspects = await Suspect.find().sort({ createdAt: -1 });
    res.json(suspects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single suspect by ID
app.get('/api/suspects/:id', authenticate, async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id);
    if (!suspect) {
      return res.status(404).json({ error: 'Suspect not found' });
    }
    res.json(suspect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE suspect (all logged-in users can add)
app.post('/api/suspects', authenticate, async (req, res) => {
  try {
    const { name, age, gender, race, address, description, mugshot, license, foid } = req.body;
    
    const suspect = new Suspect({
      name,
      age,
      gender,
      race,
      address,
      description,
      mugshot: mugshot || '',
      license: license || 'None',
      foid: foid || 'None',
      charges: [],
      createdBy: req.user.name
    });
    
    await suspect.save();
    res.json(suspect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADD charge to suspect (all logged-in users can add)
app.post('/api/suspects/:id/charges', authenticate, async (req, res) => {
  try {
    const { code, title, reason } = req.body;
    
    const suspect = await Suspect.findById(req.params.id);
    if (!suspect) {
      return res.status(404).json({ error: 'Suspect not found' });
    }
    
    suspect.charges.push({
      code,
      title,
      reason,
      addedBy: req.user.name,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      })
    });
    
    await suspect.save();
    res.json(suspect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE suspect (all logged-in users can update)
app.put('/api/suspects/:id', authenticate, async (req, res) => {
  try {
    const { name, age, gender, race, address, description, mugshot, license, foid } = req.body;
    
    const updateData = { 
      name, 
      age, 
      gender, 
      race, 
      address, 
      description,
      ...(mugshot && { mugshot }),
      ...(license && { license }),
      ...(foid && { foid })
    };
    
    const suspect = await Suspect.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!suspect) {
      return res.status(404).json({ error: 'Suspect not found' });
    }
    
    res.json(suspect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE suspect (Admin only)
app.delete('/api/suspects/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    await Suspect.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// REMOVE specific charge from suspect (all logged-in users can remove)
app.delete('/api/suspects/:id/charges/:chargeIndex', authenticate, async (req, res) => {
  try {
    const suspect = await Suspect.findById(req.params.id);
    if (!suspect) {
      return res.status(404).json({ error: 'Suspect not found' });
    }
    
    const chargeIndex = parseInt(req.params.chargeIndex);
    if (chargeIndex < 0 || chargeIndex >= suspect.charges.length) {
      return res.status(400).json({ error: 'Invalid charge index' });
    }
    
    suspect.charges.splice(chargeIndex, 1);
    await suspect.save();
    
    res.json(suspect);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 3. REPORTS SYSTEM
// ========================================

const reportSchema = new mongoose.Schema({
  id: String,
  type: String,
  date: String,
  location: String,
  description: String,
  status: { type: String, default: 'Open' },
  officerName: String,
  officerUsername: String,
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// GET all reports (all users can view)
app.get('/api/reports', authenticate, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET reports by officer
app.get('/api/reports/officer/:username', authenticate, async (req, res) => {
  try {
    const reports = await Report.find({ 
      officerUsername: req.params.username 
    }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE report (all logged-in users can create)
app.post('/api/reports', authenticate, async (req, res) => {
  try {
    const { type, location, description } = req.body;
    
    const report = new Report({
      id: `RPT-${Date.now()}`,
      type,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      location,
      description,
      status: 'Open',
      officerName: req.user.name,
      officerUsername: req.user.username
    });
    
    await report.save();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE report status (Admin/Supervisor only)
app.put('/api/reports/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin' && req.user.role !== 'Supervisor') {
      return res.status(403).json({ error: 'Admin or Supervisor only' });
    }
    
    const { status } = req.body;
    const report = await Report.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    );
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE report (Admin only)
app.delete('/api/reports/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    await Report.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 4. DEPARTMENT UPDATES SYSTEM
// ========================================

const updateSchema = new mongoose.Schema({
  title: String,
  content: String,
  date: String,
  author: String,
  createdAt: { type: Date, default: Date.now }
});

const Update = mongoose.model('Update', updateSchema);

// GET all updates (all users can view)
app.get('/api/updates', authenticate, async (req, res) => {
  try {
    const updates = await Update.find().sort({ createdAt: -1 }).limit(10);
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE update (Admin only)
app.post('/api/updates', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const { title, content } = req.body;
    
    const update = new Update({
      title,
      content,
      date: new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      author: req.user.name
    });
    
    await update.save();
    res.json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE update (Admin only)
app.put('/api/updates/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    const { title, content } = req.body;
    const update = await Update.findByIdAndUpdate(
      req.params.id,
      { title, content },
      { new: true }
    );
    
    if (!update) {
      return res.status(404).json({ error: 'Update not found' });
    }
    
    res.json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE update (Admin only)
app.delete('/api/updates/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Admin only' });
    }
    
    await Update.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// 5. PROFILE SYSTEM
// ========================================

// NOTE: Add these fields to your Officer schema:
// profilePhoto: String,
// bannerPhoto: String,
// bio: String,
// yearsOfService: Number,
// department: String,
// certifications: [String],
// commendations: [String],
// email: String,
// phone: String,
// emergencyContact: String

// UPDATE officer's profile (owner or admin)
app.put('/api/officers/:username/profile', authenticate, async (req, res) => {
  try {
    // Only the officer themselves or an admin can update
    if (req.user.username !== req.params.username && req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    const {
      profilePhoto,
      bannerPhoto,
      bio,
      yearsOfService,
      department,
      certifications,
      commendations,
      email,
      phone,
      emergencyContact
    } = req.body;
    
    const updateData = {};
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (bannerPhoto !== undefined) updateData.bannerPhoto = bannerPhoto;
    if (bio !== undefined) updateData.bio = bio;
    if (yearsOfService !== undefined) updateData.yearsOfService = yearsOfService;
    if (department !== undefined) updateData.department = department;
    if (certifications !== undefined) updateData.certifications = certifications;
    if (commendations !== undefined) updateData.commendations = commendations;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    
    const officer = await Officer.findOneAndUpdate(
      { username: req.params.username },
      { $set: updateData },
      { new: true }
    );
    
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET officer's full profile
app.get('/api/officers/:username/profile', authenticate, async (req, res) => {
  try {
    const officer = await Officer.findOne({ username: req.params.username });
    
    if (!officer) {
      return res.status(404).json({ error: 'Officer not found' });
    }
    
    res.json(officer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
