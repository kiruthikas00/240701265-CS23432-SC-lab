// ═══════════════════════════════════════════════════════════
// db.js — Firebase Auth + Firestore Database Layer
// CareerPrep AI
// ═══════════════════════════════════════════════════════════

// ── Firebase globals (shared with app.js via window scope) ───
let db = null, fbAuth = null, fbMode = 'demo'; // 'firebase' | 'demo'

// ── Storage helpers (localStorage + Firestore) ───────────────
const HIST_KEY = 'careerprep_history_v2';

function histLoad() {
  try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); }
  catch(e) { return []; }
}

function histSave(sessions) {
  try { localStorage.setItem(HIST_KEY, JSON.stringify(sessions)); } catch(e) {}
}

function histGetUserKey() {
  return state.user.uid || state.user.email || 'guest';
}

function updateHistoryBadge() {
  const sessions = histLoad().filter(s => s.userKey === histGetUserKey());
  const badge = document.getElementById('historyBadge');
  if (badge) badge.textContent = sessions.length;
}

// ════════════════════════════════════════════════════════════
// 🔥 YOUR FIREBASE CONFIG — paste your project values here
//    Go to Firebase Console → Project Settings → Your apps → SDK setup
// ════════════════════════════════════════════════════════════
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyB2IWXBKTy26d4QByxc38eYRq6O9ol7--w",
  authDomain:        "ai-assisted-recruitment-proces.firebaseapp.com",
  projectId:         "ai-assisted-recruitment-proces",
  storageBucket:     "ai-assisted-recruitment-proces.firebasestorage.app",
  messagingSenderId: "87353355423",
  appId:             "1:87353355423:web:4aee475a6a5f80ba1c86aa",
  measurementId:     "G-NCV984M9N4"
};
// ════════════════════════════════════════════════════════════

// ── Auto-initialize Firebase on page load ───────────────────
(function autoInitFirebase() {
  // Check if the config looks filled in (not still placeholder text)
  const isConfigured = FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.includes('PASTE_YOUR');

  if (isConfigured) {
    try {
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
      fbAuth = firebase.auth();
      db = firebase.firestore();
      fbMode = 'firebase';

      // Skip the setup screen — go straight to landing
      fbAuth.onAuthStateChanged(fbUser => {
        if (fbUser) {
          fbLoadUserAndEnter(fbUser);
        } else {
          showScreen('landing');
        }
      });
    } catch(e) {
      console.error('Firebase init failed:', e.message);
      // Fall back to demo mode silently
      fbMode = 'demo';
      showScreen('landing');
    }
  } else {
    // Config not filled in yet — show setup screen (so devs can paste config)
    // showScreen('fbsetup') is already the default active screen in index.html
  }
})();

// ── Manual connect (still works from the setup screen) ───────
function initFirebase() {
  // Try the hardcoded config first
  const isConfigured = FIREBASE_CONFIG.apiKey &&
    !FIREBASE_CONFIG.apiKey.includes('PASTE_YOUR');

  let config = isConfigured ? FIREBASE_CONFIG : null;

  // If not configured, try reading from the setup form
  if (!config) {
    const raw = document.getElementById('fbConfigInput')?.value?.trim() || '';
    const errEl = document.getElementById('fbConfigErr');
    if (errEl) errEl.style.display = 'none';

    try {
      const cleaned = raw.replace(/(\w+)\s*:/g, '"$1":').replace(/'/g, '"').replace(/,\s*}/g, '}');
      config = JSON.parse(cleaned.startsWith('{') ? cleaned : '{' + cleaned + '}');
    } catch(e) {
      try { config = JSON.parse(raw); } catch(e2) {
        if (errEl) { errEl.textContent = '❌ Invalid config. Paste the full firebaseConfig object.'; errEl.style.display = 'block'; }
        return;
      }
    }
  }

  const required = ['apiKey','authDomain','projectId'];
  const missing = required.filter(k => !config[k]);
  if (missing.length) {
    const errEl = document.getElementById('fbConfigErr');
    if (errEl) { errEl.textContent = '❌ Missing: ' + missing.join(', '); errEl.style.display = 'block'; }
    return;
  }

  try {
    const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(config);
    fbAuth = firebase.auth();
    db = firebase.firestore();
    fbMode = 'firebase';
    showScreen('landing');
    showToast('🔥 Firebase connected!', 'success');
    fbAuth.onAuthStateChanged(fbUser => {
      if (fbUser && fbMode === 'firebase') fbLoadUserAndEnter(fbUser);
    });
  } catch(e) {
    const errEl = document.getElementById('fbConfigErr');
    if (errEl) { errEl.textContent = '❌ Firebase error: ' + e.message; errEl.style.display = 'block'; }
  }
}

function useDemoMode() {
  fbMode = 'demo';
  showScreen('landing');
  showToast('Running in demo mode — login is simulated', 'info');
}

// ── Load user profile from Firestore then enter app ──────────
async function fbLoadUserAndEnter(fbUser) {
  try {
    const doc = await db.collection('users').doc(fbUser.uid).get();
    if (doc.exists) {
      const d = doc.data();
      state.user = {
        uid: fbUser.uid,
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        email: fbUser.email,
        role: d.role || 'Student',
        target: d.target || 'Software Engineer',
        loggedIn: true,
      };
    } else {
      const name = fbUser.displayName || fbUser.email.split('@')[0];
      const parts = name.split(' ');
      state.user = {
        uid: fbUser.uid, firstName: parts[0], lastName: parts.slice(1).join(' ') || '',
        email: fbUser.email, role: 'Student', target: 'Software Engineer', loggedIn: true
      };
      await db.collection('users').doc(fbUser.uid).set({
        firstName: state.user.firstName, lastName: state.user.lastName,
        email: fbUser.email, role: 'Student', target: 'Software Engineer',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    enterApp();
  } catch(e) {
    showToast('Error loading profile: ' + e.message, 'error');
    showScreen('landing');
  }
}

// ── REGISTER ─────────────────────────────────────────────────
async function doRegister() {
  const fname = document.getElementById('reg-fname').value.trim();
  const lname = document.getElementById('reg-lname').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass  = document.getElementById('reg-pass').value;
  const terms = document.getElementById('reg-terms').checked;
  let ok = true;

  ['fname','lname','email','pass'].forEach(f => {
    const el = document.getElementById('err-' + f);
    const inp = document.getElementById('reg-' + f);
    if (el) el.classList.remove('show');
    if (inp) inp.classList.remove('input-err');
  });

  if (!fname) { showErrF('fname','First name is required'); ok=false; }
  if (!lname) { showErrF('lname','Last name is required'); ok=false; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showErrF('email','Enter a valid email'); ok=false; }
  if (!pass || pass.length < 8) { showErrF('pass','Minimum 8 characters'); ok=false; }
  if (!terms) { showToast('Please accept the Terms of Service', 'error'); ok=false; }
  if (!ok) return;

  const btn = document.getElementById('btnRegister');
  btn.classList.add('loading');

  if (fbMode === 'demo') {
    setTimeout(() => {
      btn.classList.remove('loading');
      state.user = {
        firstName: fname, lastName: lname, email,
        role: document.querySelector('input[name="urole"]:checked').value,
        target: document.getElementById('reg-target').value, loggedIn: true
      };
      enterApp();
    }, 1200);
    return;
  }

  try {
    const cred = await fbAuth.createUserWithEmailAndPassword(email, pass);
    const uid = cred.user.uid;
    const role = document.querySelector('input[name="urole"]:checked').value;
    const target = document.getElementById('reg-target').value;
    await db.collection('users').doc(uid).set({
      firstName: fname, lastName: lname, email, role, target,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    await cred.user.updateProfile({ displayName: fname + ' ' + lname });
    state.user = { uid, firstName: fname, lastName: lname, email, role, target, loggedIn: true };
    btn.classList.remove('loading');
    showToast('Account created successfully!', 'success');
    enterApp();
  } catch(e) {
    btn.classList.remove('loading');
    const msgs = {
      'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
    };
    showErrF('email', msgs[e.code] || ('Registration failed: ' + e.message));
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('Please enter your email and password', 'error'); return; }

  const btn = document.getElementById('btnLogin');
  btn.classList.add('loading');

  if (fbMode === 'demo') {
    setTimeout(() => {
      btn.classList.remove('loading');
      const name = email.split('@')[0];
      const cap = n => n.charAt(0).toUpperCase() + n.slice(1);
      state.user = { firstName: cap(name), lastName: '', email, role: 'Student', target: 'Software Engineer', loggedIn: true };
      enterApp();
    }, 1200);
    return;
  }

  try {
    const cred = await fbAuth.signInWithEmailAndPassword(email, pass);
    await fbLoadUserAndEnter(cred.user);
    btn.classList.remove('loading');
  } catch(e) {
    btn.classList.remove('loading');
    const msgs = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/invalid-credential': 'Email or password is incorrect.',
    };
    showToast(msgs[e.code] || ('Login failed: ' + e.message), 'error');
  }
}

// ── GOOGLE LOGIN ──────────────────────────────────────────────
async function doGoogleLogin() {
  if (fbMode === 'demo') { showToast('Connect Firebase to enable Google login', 'info'); return; }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cred = await fbAuth.signInWithPopup(provider);
    await fbLoadUserAndEnter(cred.user);
  } catch(e) {
    if (e.code !== 'auth/popup-closed-by-user') showToast('Google login failed: ' + e.message, 'error');
  }
}

// ── FORGOT PASSWORD ───────────────────────────────────────────
async function doForgotPassword() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) { showToast('Enter your email address first', 'error'); return; }
  if (fbMode === 'demo') { showToast('Connect Firebase to enable password reset', 'info'); return; }
  try {
    await fbAuth.sendPasswordResetEmail(email);
    showToast('✅ Password reset email sent to ' + email, 'success');
  } catch(e) {
    showToast('Reset failed: ' + (e.code === 'auth/user-not-found' ? 'No account with this email' : e.message), 'error');
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
async function doLogout() {
  if (!confirm('Are you sure you want to log out?')) return;
  if (fbMode === 'firebase' && fbAuth) {
    try { await fbAuth.signOut(); } catch(e) {}
  }
  state.user = { firstName:'', lastName:'', email:'', role:'Student', target:'Software Engineer', loggedIn:false };
  state.resume = { score:0, fileName:'', completed:false };
  state.aptitude = { score:0, correct:0, wrong:0, skipped:0, completed:false };
  state.technical = { score:0, mcqScore:0, codeScore:0, debugScore:0, pct:0, completed:false };
  state.gd = { score:0, comm:0, reason:0, lead:0, userMessages:0, completed:false };
  state.interview = { score:0, clarity:0, relevance:0, confidence:0, answers:[], completed:false };
  showScreen('landing');
  showToast('Logged out successfully', 'info');
}

function quickLogin() {
  state.user = { firstName:'Arjun', lastName:'Sharma', email:'arjun@college.edu', role:'Student', target:'Software Engineer', loggedIn:true };
  enterApp();
}

// ── Save session — localStorage + Firestore ──────────────────
async function saveSession(type, data) {
  const entry = {
    id: Date.now() + '_' + Math.random().toString(36).slice(2,7),
    userKey: histGetUserKey(),
    type, ts: Date.now(),
    date: new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    data,
    score: data.score || data.overall || data.pct || 0,
  };

  const sessions = histLoad();
  sessions.unshift(entry);
  const myEntries = sessions.filter(s => s.userKey === histGetUserKey());
  const others = sessions.filter(s => s.userKey !== histGetUserKey());
  histSave([...myEntries.slice(0,200), ...others]);

  if (fbMode === 'firebase' && db && state.user.uid) {
    try {
      await db.collection('users').doc(state.user.uid)
        .collection('sessions').doc(entry.id).set({
          ...entry, serverTs: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch(e) { console.warn('Firestore save failed:', e.message); }
  }
  updateHistoryBadge();
}

// ── Load sessions — Firestore first, localStorage fallback ────
async function loadAllSessions() {
  if (fbMode === 'firebase' && db && state.user.uid) {
    try {
      const snap = await db.collection('users').doc(state.user.uid)
        .collection('sessions').orderBy('ts','desc').limit(200).get();
      if (!snap.empty) {
        const sessions = snap.docs.map(d => d.data());
        const local = histLoad().filter(s => s.userKey !== histGetUserKey());
        histSave([...sessions, ...local]);
        return sessions;
      }
    } catch(e) { console.warn('Firestore load failed, using localStorage:', e.message); }
  }
  return histLoad().filter(s => s.userKey === histGetUserKey());
}

// ── Delete a single session ───────────────────────────────────
async function deleteSession(id) {
  if (!confirm('Delete this session from history?')) return;
  const sessions = histLoad().filter(s => s.id !== id);
  histSave(sessions);
  if (fbMode === 'firebase' && db && state.user.uid) {
    try {
      await db.collection('users').doc(state.user.uid).collection('sessions').doc(id).delete();
    } catch(e) { console.warn('Firestore delete failed:', e.message); }
  }
  renderHistoryPage();
  showToast('Session deleted', 'info');
}

// ── Clear all history ─────────────────────────────────────────
async function clearAllHistory() {
  if (!confirm('Clear ALL session history? This cannot be undone.')) return;
  const sessions = histLoad().filter(s => s.userKey !== histGetUserKey());
  histSave(sessions);
  if (fbMode === 'firebase' && db && state.user.uid) {
    try {
      const snap = await db.collection('users').doc(state.user.uid).collection('sessions').get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    } catch(e) { console.warn('Firestore clear failed:', e.message); }
  }
  renderHistoryPage();
  updateHistoryBadge();
  showToast('History cleared', 'info');
}
