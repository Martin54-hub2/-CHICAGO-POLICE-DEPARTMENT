// db.js - LocalStorage Database
console.log('[DB] Loading database module...');

const DB = {
  init() {
    console.log('[DB] Initializing database...');
    if (!localStorage.getItem('officers')) {
      const now = new Date().toISOString();
      const defaultOfficers = {
        "AdminPannel": {
          password: "CPD543",
          name: "System Administrator",
          callsign: "Admin-1",
          rank: "Administrator",
          role: "Admin",
          department: "Administration",
          infractions: [],
          certifications: [],
          commendations: [],
          createdAt: now,
          bio: "System Administrator Account",
          email: "admin@cpd.gov",
          phone: "(312) 555-0100"
        },
        "JohnSmith": {
          password: "officer123",
          name: "John Smith",
          callsign: "1-Adam-12",
          rank: "Officer",
          role: "Officer",
          department: "Patrol",
          infractions: [],
          certifications: [],
          commendations: [],
          createdAt: now
        },
        "B.Stafford": {
          password: "super123",
          name: "B. Stafford",
          callsign: "1-King-1",
          rank: "Superintendent",
          role: "Admin",
          department: "Administration",
          infractions: [],
          certifications: [],
          commendations: [],
          createdAt: now
        }
      };
      
      localStorage.setItem('officers', JSON.stringify(defaultOfficers));
      console.log('[DB] Created default officers');
    }
  },
  
  getOfficers() {
    return JSON.parse(localStorage.getItem('officers') || '{}');
  },
  
  saveOfficers(officers) {
    localStorage.setItem('officers', JSON.stringify(officers));
  },
  
  getOfficer(username) {
    const officers = this.getOfficers();
    return officers[username];
  },
  
  updateOfficer(username, data) {
    const officers = this.getOfficers();
    if (officers[username]) {
      officers[username] = { ...officers[username], ...data };
      this.saveOfficers(officers);
      return true;
    }
    return false;
  }
};

console.log('[DB] Database module loaded');
