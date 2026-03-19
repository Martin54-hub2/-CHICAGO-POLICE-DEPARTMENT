/* =============================================
   storage.js — localStorage Management
   Handles all data: officers, news, wanted, applications
   ============================================= */

const CPD = {
  /* --- Keys --- */
  KEYS: {
    OFFICERS: 'cpd_officers',
    CURRENT_USER: 'cpd_currentUser',
    NEWS: 'cpd_news',
    WANTED: 'cpd_wanted',
    APPLICATIONS: 'cpd_applications',
    BOLOS: 'cpd_bolos',
  },

  /* --- Init: seed data if first visit --- */
  init() {
    if (!localStorage.getItem(this.KEYS.OFFICERS)) {
      this.seedOfficers();
    }
    if (!localStorage.getItem(this.KEYS.NEWS)) {
      this.seedNews();
    }
    if (!localStorage.getItem(this.KEYS.WANTED)) {
      this.seedWanted();
    }
    if (!localStorage.getItem(this.KEYS.APPLICATIONS)) {
      localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify([]));
    }
  },

  /* ===================
     OFFICER CRUD
     =================== */
  getOfficers() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.OFFICERS)) || []; }
    catch { return []; }
  },

  saveOfficers(officers) {
    localStorage.setItem(this.KEYS.OFFICERS, JSON.stringify(officers));
  },

  getOfficerByUsername(username) {
    return this.getOfficers().find(o => o.username.toLowerCase() === username.toLowerCase());
  },

  getOfficerById(id) {
    return this.getOfficers().find(o => o.id === id);
  },

  updateOfficer(id, updates) {
    const officers = this.getOfficers();
    const idx = officers.findIndex(o => o.id === id);
    if (idx === -1) return false;
    officers[idx] = { ...officers[idx], ...updates };
    this.saveOfficers(officers);
    // Also update currentUser if it's the same person
    const current = this.getCurrentUser();
    if (current && current.id === id) {
      this.setCurrentUser(officers[idx]);
    }
    return true;
  },

  addOfficer(officer) {
    const officers = this.getOfficers();
    officer.id = 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    officer.createdAt = Date.now();
    officer.certifications = officer.certifications || [];
    officer.commendations = officer.commendations || [];
    officer.photo = officer.photo || '';
    officer.banner = officer.banner || '';
    officer.bio = officer.bio || '';
    officer.email = officer.email || '';
    officer.phone = officer.phone || '';
    officer.status = officer.status || 'Active';
    officers.push(officer);
    this.saveOfficers(officers);
    return officer;
  },

  removeOfficer(id) {
    const officers = this.getOfficers().filter(o => o.id !== id);
    this.saveOfficers(officers);
  },

  /* ===================
     SESSION
     =================== */
  getCurrentUser() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.CURRENT_USER)); }
    catch { return null; }
  },

  setCurrentUser(user) {
    localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem(this.KEYS.CURRENT_USER);
  },

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },

  /* ===================
     NEWS CRUD
     =================== */
  getNews() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.NEWS)) || []; }
    catch { return []; }
  },

  saveNews(news) {
    localStorage.setItem(this.KEYS.NEWS, JSON.stringify(news));
  },

  addNewsItem(item) {
    const news = this.getNews();
    item.id = 'news_' + Date.now();
    item.date = item.date || new Date().toISOString();
    news.unshift(item);
    this.saveNews(news);
    return item;
  },

  removeNewsItem(id) {
    const news = this.getNews().filter(n => n.id !== id);
    this.saveNews(news);
  },

  /* ===================
     WANTED CRUD
     =================== */
  getWanted() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.WANTED)) || []; }
    catch { return []; }
  },

  saveWanted(wanted) {
    localStorage.setItem(this.KEYS.WANTED, JSON.stringify(wanted));
  },

  addWantedPerson(person) {
    const wanted = this.getWanted();
    person.id = 'wanted_' + Date.now();
    person.dateAdded = new Date().toISOString();
    wanted.unshift(person);
    this.saveWanted(wanted);
    return person;
  },

  removeWantedPerson(id) {
    const wanted = this.getWanted().filter(w => w.id !== id);
    this.saveWanted(wanted);
  },

  /* ===================
     APPLICATIONS CRUD
     =================== */
  getApplications() {
    try { return JSON.parse(localStorage.getItem(this.KEYS.APPLICATIONS)) || []; }
    catch { return []; }
  },

  saveApplications(apps) {
    localStorage.setItem(this.KEYS.APPLICATIONS, JSON.stringify(apps));
  },

  addApplication(app) {
    const apps = this.getApplications();
    app.id = 'app_' + Date.now();
    app.date = new Date().toISOString();
    app.status = 'Pending';
    apps.unshift(app);
    this.saveApplications(apps);
    return app;
  },

  updateApplication(id, updates) {
    const apps = this.getApplications();
    const idx = apps.findIndex(a => a.id === id);
    if (idx === -1) return false;
    apps[idx] = { ...apps[idx], ...updates };
    this.saveApplications(apps);
    return true;
  },

  /* ===================
     HELPERS
     =================== */
  getDaysOfService(createdAt) {
    return Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  },

  hasPermission(action) {
    const user = this.getCurrentUser();
    if (!user) return false;
    const role = user.role;
    switch (action) {
      case 'manage_certs':
      case 'manage_commendations':
        return role === 'admin' || role === 'supervisor';
      case 'edit_department':
      case 'manage_roster':
      case 'manage_news':
      case 'manage_wanted':
      case 'manage_applications':
      case 'admin_dashboard':
        return role === 'admin';
      default:
        return false;
    }
  },

  /* ===================
     SEED DATA
     =================== */
  seedOfficers() {
    const officers = [
      {
        id: 'off_admin_001',
        username: 'bstafford',
        password: 'admin123',
        firstName: 'B.',
        lastName: 'Stafford',
        rank: 'Superintendent',
        badge: '0001',
        department: 'Office of the Superintendent',
        role: 'admin',
        status: 'Active',
        bio: 'Superintendent of the Chicago Police Department, committed to serving and protecting the people of Chicago.',
        email: 'superintendent@chicagopd.gov',
        phone: '(312) 555-0001',
        photo: '',
        banner: '',
        certifications: ['Executive Leadership', 'Crisis Management', 'Use of Force Policy'],
        commendations: ['Distinguished Service Medal', 'Meritorious Service Award', 'Leadership Excellence Award'],
        createdAt: Date.now() - (365 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'off_sup_001',
        username: 'jmartinez',
        password: 'super123',
        firstName: 'J.',
        lastName: 'Martinez',
        rank: 'Deputy Superintendent',
        badge: '0102',
        department: 'Bureau of Detectives',
        role: 'supervisor',
        status: 'Active',
        bio: 'Deputy Superintendent overseeing the Bureau of Detectives.',
        email: 'jmartinez@chicagopd.gov',
        phone: '(312) 555-0102',
        photo: '',
        banner: '',
        certifications: ['Criminal Investigations', 'Forensic Analysis', 'Leadership Training'],
        commendations: ['Investigator of the Year', 'Unit Meritorious Award'],
        createdAt: Date.now() - (300 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'off_lt_001',
        username: 'rwilson',
        password: 'lt123',
        firstName: 'R.',
        lastName: 'Wilson',
        rank: 'Lieutenant',
        badge: '1247',
        department: 'Bureau of Patrol — District 1',
        role: 'supervisor',
        status: 'Active',
        bio: 'Watch Commander for District 1 — Central.',
        email: 'rwilson@chicagopd.gov',
        phone: '(312) 555-1247',
        photo: '',
        banner: '',
        certifications: ['Field Training Officer', 'SWAT Certified', 'De-Escalation'],
        commendations: ['Bravery Award'],
        createdAt: Date.now() - (200 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'off_sgt_001',
        username: 'tchen',
        password: 'sgt123',
        firstName: 'T.',
        lastName: 'Chen',
        rank: 'Sergeant',
        badge: '2456',
        department: 'Bureau of Patrol — District 7',
        role: 'supervisor',
        status: 'Active',
        bio: 'Patrol Sergeant, District 7 — Englewood.',
        email: 'tchen@chicagopd.gov',
        phone: '(312) 555-2456',
        photo: '',
        banner: '',
        certifications: ['Field Training Officer', 'Community Policing'],
        commendations: ['Department Commendation'],
        createdAt: Date.now() - (180 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'off_ofc_001',
        username: 'klee',
        password: 'officer123',
        firstName: 'K.',
        lastName: 'Lee',
        rank: 'Police Officer',
        badge: '5678',
        department: 'Bureau of Patrol — District 1',
        role: 'officer',
        status: 'Active',
        bio: 'Patrol officer serving the Central district.',
        email: 'klee@chicagopd.gov',
        phone: '(312) 555-5678',
        photo: '',
        banner: '',
        certifications: ['Firearms Qualified', 'First Aid/CPR'],
        commendations: [],
        createdAt: Date.now() - (90 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'off_ofc_002',
        username: 'apatel',
        password: 'officer123',
        firstName: 'A.',
        lastName: 'Patel',
        rank: 'Police Officer',
        badge: '5901',
        department: 'Bureau of Patrol — District 11',
        role: 'officer',
        status: 'Active',
        bio: 'Patrol officer, District 11 — Harrison.',
        email: 'apatel@chicagopd.gov',
        phone: '(312) 555-5901',
        photo: '',
        banner: '',
        certifications: ['Firearms Qualified', 'First Aid/CPR', 'Traffic Enforcement'],
        commendations: ['Honorable Mention'],
        createdAt: Date.now() - (60 * 24 * 60 * 60 * 1000),
      },
    ];
    this.saveOfficers(officers);
  },

  seedNews() {
    const news = [
      {
        id: 'news_001',
        title: 'CPD DUI Saturation Patrol — 4th (South Chicago) District',
        content: 'The Chicago Police Department will be conducting a DUI Saturation Patrol in the 4th District to combat impaired driving and improve road safety.',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Public Affairs',
        category: 'Operations',
      },
      {
        id: 'news_002',
        title: 'CPD DUI Saturation Patrol — 25th (Lincoln) District',
        content: 'Officers will conduct targeted enforcement operations to reduce DUI incidents in the Lincoln District area.',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Public Affairs',
        category: 'Operations',
      },
      {
        id: 'news_003',
        title: 'Community Engagement Initiative Launch',
        content: 'The CPD is launching a new community engagement initiative to strengthen relationships between officers and the neighborhoods they serve.',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Community Policing',
        category: 'Community',
      },
      {
        id: 'news_004',
        title: 'New Officer Training Academy Class Begins',
        content: 'A new class of recruits has started training at the CPD Academy. We welcome these future officers to the force.',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        author: 'Training Division',
        category: 'Training',
      },
    ];
    this.saveNews(news);
  },

  seedWanted() {
    const wanted = [
      {
        id: 'wanted_001',
        name: 'Marcus "Ghost" Rivera',
        alias: 'Ghost',
        charges: 'Armed Robbery, Assault with a Deadly Weapon',
        description: 'Male, 6\'1", 190 lbs, black hair, brown eyes. Tattoo on left forearm.',
        threat: 'High',
        lastSeen: 'District 11 — Harrison',
        dateAdded: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wanted_002',
        name: 'Janice Kowalski',
        alias: '',
        charges: 'Grand Theft Auto, Evading Police',
        description: 'Female, 5\'6", 140 lbs, blonde hair, blue eyes.',
        threat: 'Medium',
        lastSeen: 'District 1 — Central',
        dateAdded: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'wanted_003',
        name: 'DeShawn Carter',
        alias: 'Smoke',
        charges: 'Drug Trafficking, Illegal Firearms Possession',
        description: 'Male, 5\'10", 175 lbs, black hair, brown eyes. Scar above right eye.',
        threat: 'High',
        lastSeen: 'District 7 — Englewood',
        dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
    this.saveWanted(wanted);
  },
};

// Auto-init on load
CPD.init();
