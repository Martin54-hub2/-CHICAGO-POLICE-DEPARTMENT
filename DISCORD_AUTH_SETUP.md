# Chicago City Police Department - Discord Authentication Setup

## Test Login Credentials

**Badge Number:** 1001  
**Password:** test123  
**Callsign:** 1-Adam-12  
**Rank:** Officer  
**Name:** John Smith  

## How It Works

The login portal currently uses localStorage for demonstration. Here's how to connect it to your Discord bot for real authentication:

### Option 1: Discord Bot Integration (Recommended)

**Backend Setup:**
1. Create a Discord bot with your server
2. Set up a web API endpoint (Node.js/Python/PHP)
3. Store officer credentials in a database linked to Discord IDs

**Authentication Flow:**
```
1. Officer enters badge number + password
2. Website sends credentials to your API
3. API checks database (Discord ID + credentials)
4. API returns officer data (name, rank, callsign)
5. Website stores session and shows dashboard
```

**API Endpoint Example (Node.js):**
```javascript
// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { badgeNumber, password } = req.body;
    
    // Check your database
    const officer = await db.findOfficer(badgeNumber, password);
    
    if (officer) {
        res.json({
            success: true,
            officer: {
                name: officer.name,
                badge: officer.badgeNumber,
                rank: officer.rank,
                callsign: officer.callsign,
                discordId: officer.discordId
            }
        });
    } else {
        res.json({ success: false, message: "Invalid credentials" });
    }
});
```

### Option 2: Discord Command Setup

**In your Discord server, create commands:**

`!register [badge] [callsign]` - Links Discord ID to badge number  
`!setpassword [password]` - Sets officer's portal password  
`!resetpassword [badge]` - Admin command to reset passwords  

**Database Structure:**
```json
{
    "discordId": "123456789",
    "badgeNumber": "1001",
    "callsign": "1-Adam-12",
    "rank": "Officer",
    "name": "John Smith",
    "password": "hashed_password",
    "active": true
}
```

### Option 3: Simple JSON File (For Testing)

Create `officers.json`:
```json
[
    {
        "badge": "1001",
        "password": "test123",
        "name": "John Smith",
        "rank": "Officer",
        "callsign": "1-Adam-12"
    },
    {
        "badge": "2001",
        "password": "supervisor",
        "name": "B.Stafford",
        "rank": "Superintendent",
        "callsign": "1-King-1"
    }
]
```

## Updating the Website Code

Replace the `handleLogin` function in the HTML with this:

```javascript
async function handleLogin(event) {
    event.preventDefault();
    
    const badge = document.querySelector('input[type="text"]').value;
    const password = document.querySelector('input[type="password"]').value;
    
    // FOR PRODUCTION: Call your API
    /*
    const response = await fetch('YOUR_API_URL/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeNumber: badge, password: password })
    });
    
    const data = await response.json();
    
    if (data.success) {
        localStorage.setItem('officer', JSON.stringify(data.officer));
        showDashboard(data.officer);
    } else {
        alert('Invalid credentials');
    }
    */
    
    // FOR TESTING: Use local credentials
    const testOfficers = {
        "1001": { password: "test123", name: "John Smith", rank: "Officer", callsign: "1-Adam-12" },
        "2001": { password: "supervisor", name: "B.Stafford", rank: "Superintendent", callsign: "1-King-1" }
    };
    
    if (testOfficers[badge] && testOfficers[badge].password === password) {
        const officer = { badge, ...testOfficers[badge] };
        localStorage.setItem('officer', JSON.stringify(officer));
        showDashboard(officer);
    } else {
        alert('Invalid badge number or password');
    }
    
    return false;
}
```

## Security Recommendations

1. **NEVER store passwords in plain text**
2. **Use HTTPS for all API calls**
3. **Hash passwords with bcrypt or similar**
4. **Implement rate limiting on login attempts**
5. **Use JWT tokens for session management**
6. **Log all login attempts**

## Discord Bot Example Commands

```javascript
// When officer uses !register command
client.on('messageCreate', async message => {
    if (message.content.startsWith('!register')) {
        const [cmd, badge, callsign] = message.content.split(' ');
        
        // Save to database
        await db.createOfficer({
            discordId: message.author.id,
            badgeNumber: badge,
            callsign: callsign,
            name: message.author.username
        });
        
        message.reply(`✅ Registered! Badge: ${badge}, Callsign: ${callsign}`);
    }
});
```

## Next Steps

1. Choose your authentication method
2. Set up your backend/Discord bot
3. Update the website JavaScript with your API endpoint
4. Test with multiple officers
5. Deploy and enjoy!

## Support

Need help setting this up? Join our Discord: https://discord.gg/7vQEJnaD
