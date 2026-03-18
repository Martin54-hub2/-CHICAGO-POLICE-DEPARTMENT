// ========================================
// ADD THESE NEWS ENDPOINTS TO YOUR server.js
// ========================================

// News Schema (add near other schemas)
const newsSchema = new mongoose.Schema({
  title: String,
  content: String,
  image: String, // base64 image data
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
