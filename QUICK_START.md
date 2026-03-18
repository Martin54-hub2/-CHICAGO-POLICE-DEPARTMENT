# 🚀 QUICK START - CPD WEBSITE CMS DEPLOYMENT

## ⚡ 5-MINUTE SETUP CHECKLIST

This is your fast-track guide to getting the CMS running. Full details in INTEGRATION_GUIDE.md.

---

## ✅ BACKEND (Railway) - 5 STEPS

```bash
# 1. Install package
npm install multer

# 2. Open server.js and add the code from backend-api-extensions.js
#    (Copy/paste the entire file after your existing routes)

# 3. Commit and push
git add .
git commit -m "Add CMS features"
git push

# 4. Wait 2 minutes for Railway to deploy

# 5. Test: Visit https://your-app.up.railway.app/api/districts
#    Should return: []
```

**✅ Backend Done!**

---

## ✅ FRONTEND (GitHub) - 4 STEPS

```bash
# 1. Open your index.html

# 2. Find <div id="admin-page" class="page">
#    Replace the ENTIRE admin-page div with code from:
#    admin-panel-enhanced.html

# 3. Find <script> section (near bottom of file)
#    Add ALL the code from cms-functions.js
#    (Paste it after your existing functions)

# 4. Commit and push to GitHub
git add index.html
git commit -m "Add CMS admin panel"
git push
```

**✅ Frontend Done!**

---

## 🎯 TESTING - 3 STEPS

### Test 1: Login
1. Go to your GitHub Pages URL
2. Click "Portal Login"
3. Login: `AdminPannel` / `CPD543`
4. Click your name → "Admin Panel"
5. **✅ You should see tabs: Officers | Districts | News & Posts | Updates**

### Test 2: Create District
1. Click "Districts" tab
2. Click "+ Add District"
3. Fill in:
   - Number: `15`
   - Name: `Southside`
   - Streets: `Main St` (press Enter) `Oak Ave`
4. Click "Save District"
5. **✅ District appears in list**

### Test 3: Create Post
1. Click "News & Posts" tab
2. Click "+ New Post"
3. Fill in:
   - Title: `Test Post`
   - Category: `news`
   - Content: `This is a test post.`
4. Click "Publish Post"
5. **✅ Post appears in list**

---

## 🐛 QUICK FIXES

### "Failed to load districts"
- Check Railway backend is running
- Check browser console for errors
- Verify API_URL in your frontend matches your Railway URL

### "403 Forbidden"
- Make sure you're logged in as Admin
- Try logging out and back in (token expired)

### "Can't upload images"
- Make sure `uploads` folder exists on Railway
- Check Railway logs for errors
- Verify you're logged in as Admin

---

## 📊 WHAT YOU CAN DO NOW

✅ Create/edit/delete districts  
✅ Create/edit/delete news posts  
✅ Upload images to posts  
✅ Manage officers (existing feature)  
✅ Post department updates (existing feature)  
✅ Everything saves to MongoDB  
✅ Everyone sees the same data  

---

## 🎉 NEXT STEPS

Once basics work:

1. **Add Sample Data** - Use sample-data.json to create test content
2. **Customize Design** - Match your brand colors/fonts
3. **Add Public Display** - Show posts/districts on public pages
4. **Enhance Features**:
   - Post scheduling
   - Draft system
   - Image gallery
   - Search functionality
   - Public district finder

---

## 📞 TROUBLESHOOTING

**Problem:** Backend won't deploy  
**Fix:** Check Railway logs, verify multer is installed

**Problem:** Frontend shows old admin panel  
**Fix:** Hard refresh (Ctrl+Shift+R), clear cache

**Problem:** Images won't display  
**Fix:** Check image URLs start with `/uploads/`, verify Railway serves static files

---

## 🎯 SUCCESS = ALL 3 TESTS PASS

If you can:
- ✅ Login and see admin tabs
- ✅ Create a district
- ✅ Create a post

**You're done! The CMS is working! 🚀**

Now customize and add more content. The system is production-ready.

---

**Full documentation in INTEGRATION_GUIDE.md**
