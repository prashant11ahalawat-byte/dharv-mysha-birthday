const express = require('express');
const path = require('path');
const crypto = require('crypto');
const config = require('./config');
const db = require('./db');

const app = express();

// Initialize database
db.initDB();

// Middleware
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Basic Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Helper for cookie parsing
function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

// In-memory admin session storage & rate limiting
const activeSessions = new Map(); // token -> { createdAt }
const loginAttempts = new Map(); // ip -> { count, lastAttempt }

function cleanExpiredSessions() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  for (const [token, data] of activeSessions.entries()) {
    if (now - data.createdAt > maxAge) {
      activeSessions.delete(token);
    }
  }
}
setInterval(cleanExpiredSessions, 60 * 60 * 1000);

// Admin Auth Middleware
function requireAdminAuth(req, res, next) {
  const cookies = parseCookies(req);
  const token = req.headers['x-admin-token'] || cookies.admin_session;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
      return next();
    } else {
      activeSessions.delete(token);
    }
  }

  return res.status(401).json({ error: 'Unauthorized. Please log in with the admin PIN.' });
}

// --------------------------------------------------------------------------
// Public API Routes
// --------------------------------------------------------------------------

// Target Event Timestamp: Thursday, 10 Dec 2026 16:30:00 IST (UTC+05:30)
const EVENT_TIMESTAMP = '2026-12-10T16:30:00+05:30';

app.get('/api/event-info', (req, res) => {
  res.json({
    headline: "You're invited to a MOVIE PARTY",
    tagline: "Two birthdays, one big screen, and all the popcorn you can eat. Come celebrate with us!",
    stars: [
      { name: "Dharv Pratap", role: "Birthday Boy", age: 6, color: "blue" },
      { name: "Mysha", role: "Birthday Girl", age: 9, color: "pink" }
    ],
    details: {
      date: "Thursday, 10 December 2026",
      time: "4:30 – 7:30 PM",
      showType: "evening show",
      venue: "PVR Cinemas, Forum Nexus Mall",
      funIncludes: "Slide & popcorn"
    },
    eventTimestamp: EVENT_TIMESTAMP
  });
});

// Public Wishes Endpoint for Floating Marquee
app.get('/api/wishes', (req, res) => {
  try {
    const dbWishes = db.getPublicWishes() || [];
    // Cheerful default starter wishes to display immediately
    const starterWishes = [
      { name: "Vivaan", message: "Can't wait to slide and watch the movie with Dharv! 🛝🍿" },
      { name: "Ananya & Family", message: "Happy 9th Birthday Mysha! We are so excited! 🎈✨" },
      { name: "Kabir", message: "Happy 6th Birthday Dharv! You are our superhero! ⚡🎬" },
      { name: "Advik & Tanya", message: "Popcorn and big screen movies! Best party ever! 🍿🎂" }
    ];
    res.json({ wishes: dbWishes.length > 0 ? dbWishes : starterWishes });
  } catch (err) {
    res.json({ wishes: [] });
  }
});

// Dynamic iCal (.ics) Calendar Download
app.get('/api/party.ics', (req, res) => {
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dharv & Mysha Birthday Party//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:dharv-mysha-movie-party-2026@pvrplayhouse',
    'DTSTAMP:20261124T000000Z',
    'DTSTART:20261210T110000Z', // 4:30 PM IST = 11:00 UTC
    'DTEND:20261210T140000Z',   // 7:30 PM IST = 14:00 UTC
    'SUMMARY:🎬 Dharv & Mysha Birthday Movie Party! 🍿',
    'DESCRIPTION:Two birthdays, one big screen, in-theatre slide, and all the popcorn you can eat! Celebrating Dharv (6) and Mysha (9) at PVR Playhouse. Grown-ups are welcome too!',
    'LOCATION:PVR Cinemas (Playhouse), 4th Floor, Nexus Koramangala Mall, 21 Hosur Rd, Bengaluru, Karnataka 560095',
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="dharv-mysha-movie-party.ics"');
  res.send(icsData);
});

// Recent submission deduplication cache: name+phone -> timestamp
const recentSubmissions = new Map();

// RSVP Submission Endpoint
app.post('/api/rsvp', (req, res) => {
  try {
    const { name, attending, adults, kids, phone, message } = req.body;

    // Validate Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }
    const cleanName = name.trim().slice(0, 100);

    // Validate Attending choice
    const isAttending = attending === true || attending === 'yes' || attending === '1' || attending === 1;

    let adultsNum = 0;
    let kidsNum = 0;

    if (isAttending) {
      adultsNum = parseInt(adults, 10);
      kidsNum = parseInt(kids, 10);

      if (isNaN(adultsNum) || adultsNum < 0 || adultsNum > 30) {
        return res.status(400).json({ error: 'Please enter a valid number of adults (0 - 30).' });
      }
      if (isNaN(kidsNum) || kidsNum < 0 || kidsNum > 30) {
        return res.status(400).json({ error: 'Please enter a valid number of kids (0 - 30).' });
      }
      if (adultsNum + kidsNum < 1) {
        return res.status(400).json({ error: 'Please indicate at least 1 guest attending (adult or kid).' });
      }
    }

    const cleanPhone = phone ? String(phone).trim().slice(0, 30) : '';
    const cleanMessage = message ? String(message).trim().slice(0, 1000) : '';

    // Prevent accidental double submits within 10 seconds
    const dedupeKey = `${cleanName.toLowerCase()}|${cleanPhone}|${isAttending ? 1 : 0}|${adultsNum}|${kidsNum}`;
    const lastSubmitTime = recentSubmissions.get(dedupeKey);
    const now = Date.now();

    if (lastSubmitTime && (now - lastSubmitTime < 10000)) {
      return res.json({
        success: true,
        alreadyProcessed: true,
        message: `Thank you, ${cleanName}! Your RSVP was already received.`
      });
    }

    recentSubmissions.set(dedupeKey, now);
    // Cleanup old keys occasionally
    if (recentSubmissions.size > 200) {
      for (const [k, t] of recentSubmissions.entries()) {
        if (now - t > 60000) recentSubmissions.delete(k);
      }
    }

    // Persist to database
    const saved = db.addRSVP({
      name: cleanName,
      attending: isAttending,
      adults: adultsNum,
      kids: kidsNum,
      phone: cleanPhone,
      message: cleanMessage
    });

    const responseMsg = isAttending
      ? `Popcorn is ready! Thanks ${cleanName}, we can't wait to see you and your family at PVR Cinemas!`
      : `Thank you for letting us know, ${cleanName}. You will be dearly missed!`;

    return res.status(201).json({
      success: true,
      message: responseMsg,
      data: saved
    });
  } catch (err) {
    console.error('Error saving RSVP:', err);
    return res.status(500).json({ error: 'Something went wrong while saving your RSVP. Please try again.' });
  }
});

// --------------------------------------------------------------------------
// Admin Authentication & Endpoints
// --------------------------------------------------------------------------

// PIN Login
app.post('/api/admin/login', (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  // Rate limiting: 5 failed attempts locks for 30s
  const attemptInfo = loginAttempts.get(clientIp) || { count: 0, lastAttempt: now };
  if (attemptInfo.count >= 5 && now - attemptInfo.lastAttempt < 30000) {
    const waitSec = Math.ceil((30000 - (now - attemptInfo.lastAttempt)) / 1000);
    return res.status(429).json({ error: `Too many failed attempts. Please wait ${waitSec} seconds.` });
  }

  const { pin } = req.body;
  const inputPin = String(pin || '').trim();
  const configuredPin = String(config.ADMIN_PIN).trim();

  if (!inputPin) {
    return res.status(400).json({ error: 'Please enter the admin PIN.' });
  }

  if (inputPin !== configuredPin) {
    attemptInfo.count += 1;
    attemptInfo.lastAttempt = now;
    loginAttempts.set(clientIp, attemptInfo);
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  }

  // Login successful: reset rate limit
  loginAttempts.delete(clientIp);

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, { createdAt: now });

  // Set secure cookie
  res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`);

  return res.json({
    success: true,
    token: token,
    message: 'Authentication successful.'
  });
});

// Check Admin Status
app.get('/api/admin/status', (req, res) => {
  const cookies = parseCookies(req);
  const token = req.headers['x-admin-token'] || cookies.admin_session;

  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    if (Date.now() - session.createdAt < 24 * 60 * 60 * 1000) {
      return res.json({ authenticated: true });
    }
  }
  return res.json({ authenticated: false });
});

// Admin Logout
app.post('/api/admin/logout', (req, res) => {
  const cookies = parseCookies(req);
  const token = req.headers['x-admin-token'] || cookies.admin_session;
  if (token) {
    activeSessions.delete(token);
  }
  res.setHeader('Set-Cookie', `admin_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  res.json({ success: true, message: 'Logged out successfully.' });
});

// Admin Dashboard Data
app.get('/api/admin/data', requireAdminAuth, (req, res) => {
  try {
    const summary = db.getSummaryMetrics();
    const rsvps = db.getAllRSVPs();
    res.json({ summary, rsvps });
  } catch (err) {
    console.error('Error fetching admin data:', err);
    res.status(500).json({ error: 'Failed to retrieve guest list.' });
  }
});

// Admin CSV Export
app.get('/api/admin/export-csv', requireAdminAuth, (req, res) => {
  try {
    const rsvps = db.getAllRSVPs();

    // CSV header row
    const headers = ['ID', 'Name', 'Status', 'Adults', 'Kids', 'Total Guests', 'Phone', 'Wishes / Message', 'Submitted At'];
    
    // Helper to escape CSV cell (RFC 4180 standard)
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = rsvps.map(r => [
      escapeCSV(r.id),
      escapeCSV(r.name),
      escapeCSV(r.attending ? 'Attending' : "Can't Make It"),
      escapeCSV(r.adults),
      escapeCSV(r.kids),
      escapeCSV(r.total_guests),
      escapeCSV(r.phone),
      escapeCSV(r.message),
      escapeCSV(r.created_at)
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\r\n');

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="birthday-movie-rsvps-${dateStr}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    console.error('Error generating CSV:', err);
    res.status(500).send('Error generating CSV export');
  }
});

// Admin Delete RSVP (optional cleanup)
app.delete('/api/admin/rsvp/:id', requireAdminAuth, (req, res) => {
  try {
    const success = db.deleteRSVP(req.params.id);
    if (success) {
      res.json({ success: true, message: 'Entry removed.' });
    } else {
      res.status(404).json({ error: 'Entry not found.' });
    }
  } catch (err) {
    console.error('Error deleting RSVP:', err);
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

// --------------------------------------------------------------------------
// Static Files & Pages
// --------------------------------------------------------------------------

// Specific route for Admin Portal (not linked from public invite)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Digital Invitation Card Preview
app.get('/card', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, 'public')));

// Fallback for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check for Render / Cloud hosts
app.get('/healthz', (req, res) => res.status(200).send('OK'));
app.get('/health', (req, res) => res.status(200).send('OK'));

// Start Server listening on 0.0.0.0
const HOST = '0.0.0.0';
app.listen(config.PORT, HOST, () => {
  console.log(`====================================================`);
  console.log(`🎬 Birthday Party RSVP Website is running!`);
  console.log(`🍿 Public Invitation: http://${HOST}:${config.PORT}/`);
  console.log(`🎟️ Admin Portal:      http://${HOST}:${config.PORT}/admin`);
  console.log(`🔑 Configured Admin PIN: [${config.ADMIN_PIN}] (set via ADMIN_PIN env var)`);
  console.log(`====================================================`);
});
