# Chicago Police Department — FiveM Roleplay Website

A fully functional, multi-page CPD website built for FiveM roleplay servers. Styled after the real Chicago Police Department website with working authentication, admin dashboard, and data management.

## 🌐 Pages

| Page | File | Description |
|------|------|-------------|
| Home | `index.html` | Landing page with loading screen, hero cards, service catalog, district search, featured stories |
| Login | `pages/login.html` | Officer portal authentication |
| Profile | `pages/profile.html` | Officer dashboard with photo/banner upload, certifications, commendations |
| Roster | `pages/roster.html` | Full department roster with search & filter |
| Departments | `pages/departments.html` | Bureau & division info with Superintendent spotlight |
| Most Wanted | `pages/most-wanted.html` | Wanted persons & BOLOs with threat levels |
| 10-Codes | `pages/codes.html` | Radio codes, penal codes, NATO phonetic alphabet |
| News | `pages/news.html` | News & announcements with category filter |
| Join CPD | `pages/apply.html` | Full recruitment application form |
| Services | `pages/services.html` | Service catalog (Purchase, Register, Report, Request, Search) |
| Find District | `pages/district.html` | All 22 CPD districts with search |
| Admin Dashboard | `admin/dashboard.html` | Full admin control panel |

## 🔑 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin / Superintendent | `bstafford` | `admin123` |
| Supervisor | `jmartinez` | `super123` |
| Lieutenant | `rwilson` | `lt123` |
| Officer | `klee` | `officer123` |

## ⚙️ Systems

- **Authentication** — Login/logout with session persistence via localStorage
- **Role-Based Permissions** — Admin, Supervisor, and Officer roles with different access levels
- **Photo Upload** — Officers can upload profile photos and banner images
- **Profile Editing** — Edit bio, email, phone (admins can edit department)
- **Certifications & Commendations** — Managed by admins/supervisors
- **Days of Service** — Auto-calculated from account creation date
- **Admin Dashboard** — Manage roster, news, most wanted, and applications
- **Loading Screen** — 1.2s animated splash on homepage
- **Responsive Design** — Mobile-friendly across all pages

## 📁 File Structure

```
cpd-website/
├── index.html              ← Home page
├── README.md
├── css/
│   └── style.css           ← All shared styles
├── js/
│   ├── storage.js          ← localStorage management & seed data
│   ├── auth.js             ← Login/logout/session handling
│   └── main.js             ← Nav, user menu, shared UI
├── images/
│   └── badge.svg           ← CPD star badge
├── pages/
│   ├── login.html
│   ├── profile.html
│   ├── roster.html
│   ├── departments.html
│   ├── most-wanted.html
│   ├── codes.html
│   ├── news.html
│   ├── apply.html
│   ├── services.html
│   └── district.html
└── admin/
    └── dashboard.html      ← Admin control panel
```

## 🚀 Deployment

1. Push to GitHub
2. Enable GitHub Pages (Settings → Pages → Source: main branch)
3. Site will be live at `https://yourusername.github.io/repo-name/`

## 🎨 Color System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0ea5e9` | Buttons, nav bar, accents |
| Dark Blue | `#0284c7` | Hover states |
| Navy | `#1e3a5a` | Headers, dark sections |
| Red | `#b91c1c` | Alerts, top/bottom bars (Chicago flag) |
| Gold | `#d4a843` | Badge accents |

---

*Built for FiveM Roleplay. Not affiliated with the real Chicago Police Department.*
