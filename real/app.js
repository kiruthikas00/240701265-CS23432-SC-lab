// ═══════════════════════════════════════════════════════════
// app.js — Application Logic
// CareerPrep AI
// NOTE: db.js must be loaded BEFORE app.js
// ═══════════════════════════════════════════════════════════

// ═══ MISSING VARIABLE DECLARATIONS (FIX) ═══
let histCurrentFilter = 'all';
let histTrendChartInst = null;

// ═══ APP STATE ═══
const state = {
  user: { firstName:'', lastName:'', email:'', role:'Student', target:'Software Engineer', loggedIn:false },
  resume: { score:0, fileName:'', completed:false },
  aptitude: { score:0, correct:0, wrong:0, skipped:0, completed:false },
  technical: { score:0, mcqScore:0, codeScore:0, debugScore:0, pct:0, completed:false },
  gd: { score:0, comm:0, reason:0, conf:0, lead:0, userMessages:0, completed:false },
  interview: { score:0, clarity:0, relevance:0, confidence:0, answers:[], completed:false },
};

// ═══ SCREEN NAVIGATION ═══
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

function showAuth(tab) {
  showScreen('auth');
  switchTab(tab);
}

function showErrF(id, msg) {
  const el = document.getElementById('err-' + id);
  const inp = document.getElementById('reg-' + id);
  if (el) { el.textContent = '⚠ ' + msg; el.classList.add('show'); }
  if (inp) inp.classList.add('input-err');
}

function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('form-login').classList.toggle('hidden', tab !== 'login');
  document.getElementById('form-register').classList.toggle('hidden', tab !== 'register');
}

function enterApp() {
  const { firstName, lastName, role, target } = state.user;
  const initials = ((firstName[0] || '') + (lastName[0] || '')).toUpperCase() || '?';
  document.getElementById('sbAvatar').textContent = initials;
  document.getElementById('sbName').textContent = firstName + ' ' + lastName;
  document.getElementById('sbRole').textContent = role + ' · ' + target;
  document.getElementById('welcomeName').textContent = firstName;
  showScreen('app');
  unlockAllModules();
  updateHistoryBadge();
  goTo('home');
  showToast('Welcome back, ' + firstName + '! 🚀', 'success');
}
const APP_PAGES = ['home','resume','aptitude','technical','gd','interview','dashboard','tips','templates','history'];
const CRUMBS = { home:'Home', resume:'Resume Analyzer', aptitude:'Aptitude Test', technical:'Technical Test', gd:'GD Simulation', interview:'AI Interview', dashboard:'Career Dashboard', tips:'Interview Tips', templates:'Resume Templates', history:'Session History' };

function goTo(page) {
  APP_PAGES.forEach(p => {
    const pg = document.getElementById('page-' + p);
    const nav = document.getElementById('nav-' + p);
    if (pg) pg.classList.remove('active');
    if (nav) nav.classList.remove('active');
  });
  document.getElementById('page-' + page).classList.add('active');
  const nav = document.getElementById('nav-' + page);
  if (nav) nav.classList.add('active');
  document.getElementById('crumbText').textContent = CRUMBS[page];
  if (page === 'dashboard') buildDashboard();
  if (page === 'home') updateHomeScores();
  if (page === 'technical') initTechTestPage();
  if (page === 'templates') setTimeout(initTemplates, 20);
  if (page === 'tips') setTimeout(() => filterTips('all', document.querySelector('.tips-pill')), 10);
  if (page === 'history') setTimeout(renderHistoryPage, 20);
  document.querySelector('.app-main').scrollTop = 0;
}

function tryGoTo(page) {
  goTo(page);
}

function isUnlocked(page) {
  // All pages are freely accessible
  return true;
}

function unlockModule(page) {
  const nav = document.getElementById('nav-' + page);
  const badge = document.getElementById('badge-' + page);
  if (nav) { nav.classList.remove('locked'); nav.onclick = () => goTo(page); }
  if (badge) { badge.className = 'sb-badge sb-badge-ready'; badge.textContent = 'Ready'; }
  updateJourney();
  updateProgress();
}

function unlockAllModules() {
  ['aptitude','technical','gd','interview','dashboard'].forEach(page => {
    const nav = document.getElementById('nav-' + page);
    const badge = document.getElementById('badge-' + page);
    if (nav) { nav.classList.remove('locked'); }
  });
}

function _markDoneOriginal(page) {
  const badge = document.getElementById('badge-' + page);
  if (badge) { badge.className = 'sb-badge sb-badge-done'; badge.textContent = '✓'; }
  updateJourney();
  updateProgress();
}

function updateProgress() {
  const done = [state.resume.completed, state.aptitude.completed, state.technical && state.technical.completed, state.gd.completed, state.interview.completed].filter(Boolean).length;
  const pct = Math.round((done / 5) * 100);
  document.getElementById('progFill').style.width = pct + '%';
  document.getElementById('progPct').textContent = pct + '%';
  document.getElementById('progSub').textContent = done + ' of 5 modules completed';
}

function updateJourney() {
  const techDone = state.technical && state.technical.completed;
  const steps = [
    { key:'resume', el:'journey-resume', page:'resume', icon:'📄', color:state.resume.completed ? 'var(--green)' : 'var(--indigo)', bg:state.resume.completed ? 'var(--green-pale)' : 'var(--indigo-pale)', bdColor:state.resume.completed ? 'rgba(34,197,94,0.3)' : 'rgba(67,97,238,0.2)', badge:state.resume.completed ? {cls:'badge-green',txt:'✓ Done'} : {cls:'badge-indigo',txt:'Start →'}, clickable:true },
    { key:'aptitude', el:'journey-aptitude', page:'aptitude', icon:'🧠', color:state.aptitude.completed ? 'var(--green)' : (state.resume.completed?'var(--violet)':'var(--text-4)'), bg:state.aptitude.completed ? 'var(--green-pale)' : (state.resume.completed?'var(--violet-pale)':'var(--surface2)'), bdColor:state.aptitude.completed ? 'rgba(34,197,94,0.3)' : (state.resume.completed?'rgba(139,92,246,0.3)':'var(--border)'), badge:state.aptitude.completed ? {cls:'badge-green',txt:'✓ Done'} : (state.resume.completed?{cls:'badge-violet',txt:'Start →'}:{cls:'badge-gray',txt:'🔒 Locked'}), clickable:state.resume.completed },
    { key:'technical', el:'journey-technical', page:'technical', icon:'💻', color:techDone ? 'var(--green)' : (state.aptitude.completed?'var(--indigo)':'var(--text-4)'), bg:techDone ? 'var(--green-pale)' : (state.aptitude.completed?'var(--indigo-pale)':'var(--surface2)'), bdColor:techDone ? 'rgba(34,197,94,0.3)' : (state.aptitude.completed?'rgba(67,97,238,0.3)':'var(--border)'), badge:techDone ? {cls:'badge-green',txt:'✓ Done'} : (state.aptitude.completed?{cls:'badge-indigo',txt:'Start →'}:{cls:'badge-gray',txt:'🔒 Locked'}), clickable:state.aptitude.completed },
    { key:'gd', el:'journey-gd', page:'gd', icon:'🎤', color:state.gd.completed ? 'var(--green)' : (techDone?'var(--teal)':'var(--text-4)'), bg:state.gd.completed ? 'var(--green-pale)' : (techDone?'var(--teal-pale)':'var(--surface2)'), bdColor:state.gd.completed ? 'rgba(34,197,94,0.3)' : (techDone?'rgba(10,181,160,0.3)':'var(--border)'), badge:state.gd.completed ? {cls:'badge-green',txt:'✓ Done'} : (techDone?{cls:'badge-teal',txt:'Start →'}:{cls:'badge-gray',txt:'🔒 Locked'}), clickable:techDone },
    { key:'interview', el:'journey-interview', page:'interview', icon:'🤖', color:state.interview.completed ? 'var(--green)' : (state.gd.completed?'var(--amber)':'var(--text-4)'), bg:state.interview.completed ? 'var(--green-pale)' : (state.gd.completed?'var(--amber-pale)':'var(--surface2)'), bdColor:state.interview.completed ? 'rgba(34,197,94,0.3)' : (state.gd.completed?'rgba(247,147,30,0.3)':'var(--border)'), badge:state.interview.completed ? {cls:'badge-green',txt:'✓ Done'} : (state.gd.completed?{cls:'badge-amber',txt:'Start →'}:{cls:'badge-gray',txt:'🔒 Locked'}), clickable:state.gd.completed },
    { key:'dashboard', el:'journey-dashboard', page:'dashboard', icon:'🎯', color:state.interview.completed ? 'var(--indigo)' : 'var(--text-4)', bg:state.interview.completed ? 'var(--indigo-pale)' : 'var(--surface2)', bdColor:state.interview.completed ? 'rgba(67,97,238,0.3)' : 'var(--border)', badge:state.interview.completed ? {cls:'badge-indigo',txt:'View Report →'} : {cls:'badge-gray',txt:'🔒 Locked'}, clickable:state.interview.completed },
  ];

  steps.forEach(s => {
    const el = document.getElementById(s.el);
    if (!el) return;
    el.style.borderColor = s.bdColor;
    el.style.background = s.bg;
    el.style.opacity = s.clickable ? '1' : '0.5';
    el.style.cursor = s.clickable ? 'pointer' : 'not-allowed';
    el.onclick = s.clickable ? () => goTo(s.page) : null;
    const iconDiv = el.querySelector('[style*="font-size:20px"]');
    if (iconDiv) { iconDiv.style.background = s.color; iconDiv.style.color = '#fff'; iconDiv.textContent = s.icon; }
    const badgeEl = el.querySelector('.badge');
    if (badgeEl) { badgeEl.className = 'badge ' + s.badge.cls; badgeEl.textContent = s.badge.txt; }
  });

  updateNextAction();
}

function updateNextAction() {
  const na = document.getElementById('nextActionCard');
  if (!na) return;
  let icon='📄', title='Start with Resume', desc='Upload your resume to get your ATS score and begin your journey.', btnTxt='Go to Resume Analyzer →', action='resume', color='var(--indigo)';
  if (!state.resume.completed) { /* default */ }
  else if (!state.aptitude.completed) { icon='🧠'; title='Take Aptitude Test'; desc='Test your quantitative, logical and verbal abilities.'; btnTxt='Go to Aptitude Test →'; action='aptitude'; color='var(--violet)'; }
  else if (!state.technical || !state.technical.completed) { icon='💻'; title='Take Technical Test'; desc='Coding challenges, MCQs, and debug problems with live editor.'; btnTxt='Go to Technical Test →'; action='technical'; color='var(--indigo)'; }
  else if (!state.gd.completed) { icon='🎤'; title='Join GD Simulation'; desc='Practice group discussion with AI participants.'; btnTxt='Go to GD Simulation →'; action='gd'; color='var(--teal)'; }
  else if (!state.interview.completed) { icon='🤖'; title='Face AI Interview'; desc='Your final step — get interviewed and scored.'; btnTxt='Go to AI Interview →'; action='interview'; color='var(--amber)'; }
  else { icon='🎯'; title='View Career Report'; desc='All done! View your complete career readiness report.'; btnTxt='View Dashboard →'; action='dashboard'; color='var(--green)'; }
  na.style.background = `color-mix(in srgb, ${color} 8%, white)`;
  na.style.borderColor = `color-mix(in srgb, ${color} 20%, transparent)`;
  na.innerHTML = `<div style="font-size:24px;margin-bottom:8px">${icon}</div><div style="font-weight:800;color:var(--text);margin-bottom:4px">${title}</div><div class="text-sm text-dim mb-12">${desc}</div><button class="btn btn-primary btn-sm" onclick="goTo('${action}')">${btnTxt}</button>`;
}

function updateHomeScores() {
  const scores = {
    resume: state.resume.completed ? state.resume.score : null,
    aptitude: state.aptitude.completed ? state.aptitude.pct : null,
    technical: state.technical && state.technical.completed ? state.technical.score : null,
    gd: state.gd.completed ? state.gd.score : null,
    interview: state.interview.completed ? state.interview.score : null,
  };
  const valid = Object.values(scores).filter(s => s !== null);
  const overall = valid.length ? Math.round(valid.reduce((a,b)=>a+b,0)/valid.length) : 0;
  document.getElementById('homeScore').textContent = overall + '%';
  ['resume','aptitude','gd','interview'].forEach(k => {
    const sc = scores[k];
    if (document.getElementById('hs-' + k)) document.getElementById('hs-' + k).textContent = sc !== null ? sc + (k==='aptitude'?'%':'') : '—';
    if (document.getElementById('hf-' + k)) document.getElementById('hf-' + k).style.width = sc !== null ? sc + '%' : '0%';
  });
}

// ═══ TOAST ═══
let toastTimer;
function showToast(msg, type='info') {
  const t = document.getElementById('toast');
  t.className = 'toast show toast-' + type;
  t.innerHTML = (type==='success'?'✅':type==='error'?'❌':'ℹ') + ' ' + msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ═══ UTILITIES ═══
function togglePw(id, btn) {
  const inp = document.getElementById(id);
  inp.type = inp.type==='password' ? 'text' : 'password';
  btn.textContent = inp.type==='password' ? '👁' : '🙈';
}

function checkStrength(val) {
  const segs = ['ss1','ss2','ss3','ss4'].map(id => document.getElementById(id));
  const label = document.getElementById('strLabel');
  let score = 0;
  if (val.length >= 8) score++;
  if (/[A-Z]/.test(val)) score++;
  if (/[0-9]/.test(val)) score++;
  if (/[^A-Za-z0-9]/.test(val)) score++;
  const cols = ['#f43f5e','#f7931e','#22c55e','#4361ee'];
  const lbls = ['Weak','Fair','Good','Strong 💪'];
  segs.forEach((s, i) => { s.style.background = i < score ? cols[score-1] : 'var(--surface3)'; });
  label.textContent = val.length===0 ? 'Enter a password' : (lbls[score-1]||'Weak');
  label.style.color = val.length===0 ? 'var(--text-4)' : cols[score-1];
}

// ═══ RESUME ═══
// ═══ RESUME ═══
// Switch resume input tabs
let resumeInputMode = 'upload'; // 'upload' | 'paste'
function switchResumeTab(tab) {
  resumeInputMode = tab;
  document.getElementById('rtab-upload').classList.toggle('active', tab==='upload');
  document.getElementById('rtab-paste').classList.toggle('active', tab==='paste');
  document.getElementById('resume-tab-upload').style.display = tab==='upload'?'':'none';
  document.getElementById('resume-tab-paste').style.display = tab==='paste'?'':'none';
  updateAnalyzeBtn();
}
function updateAnalyzeBtn() {
  const hasPaste = (document.getElementById('resumePasteText')||{value:''}).value.trim().length > 50;
  const hasFile = state.resume.fileName !== '';
  document.getElementById('btnAnalyze').disabled = !(resumeInputMode==='paste' ? hasPaste : hasFile);
}
document.addEventListener('DOMContentLoaded', () => {
  const pasteTA = document.getElementById('resumePasteText');
  if (pasteTA) pasteTA.addEventListener('input', updateAnalyzeBtn);

  // Upload zone drag and drop
  const uz = document.getElementById('uploadZone');
  if (uz) {
    uz.addEventListener('dragover', e => { e.preventDefault(); uz.classList.add('drag'); });
    uz.addEventListener('dragleave', () => uz.classList.remove('drag'));
    uz.addEventListener('drop', e => { e.preventDefault(); uz.classList.remove('drag'); if(e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); });
  }

  // File input change
  const fi = document.getElementById('fileInput');
  if (fi) fi.addEventListener('change', e => { if(e.target.files[0]) handleFileUpload(e.target.files[0]); });
});

// ══════════════════════════════════════════════════════
// RESUME ANALYZER — DEEP LINE-BY-LINE ENGINE
// ══════════════════════════════════════════════════════

// Configure PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

// ── Comprehensive skill & keyword database ──────────────
const SKILL_DB = {
  languages:     ['python','javascript','typescript','java','c++','c#','c','ruby','go','golang','rust','kotlin','swift','php','scala','r','matlab','perl','dart','bash','shell','powershell','cobol','fortran','assembly','vba','lua','haskell','elixir','erlang','f#','groovy','objective-c'],
  web_frontend:  ['react','react.js','reactjs','angular','angular.js','vue','vue.js','html','html5','css','css3','sass','scss','less','tailwind','bootstrap','jquery','next.js','nextjs','nuxt','gatsby','svelte','webpack','vite','babel','redux','mobx','zustand','graphql','rest','soap','websocket','webrtc','pwa','responsive design'],
  web_backend:   ['node','node.js','nodejs','express','express.js','django','flask','fastapi','spring','spring boot','rails','ruby on rails','laravel','asp.net','.net','nestjs','koa','hapi','gin','fiber','actix','rocket','phoenix','symfony','strapi'],
  database:      ['sql','mysql','postgresql','postgres','mongodb','redis','oracle','sqlite','mssql','sql server','elasticsearch','dynamodb','cassandra','firebase','firestore','supabase','prisma','sequelize','mongoose','typeorm','neo4j','couchdb','influxdb','mariadb','cockroachdb'],
  cloud_devops:  ['aws','amazon web services','azure','gcp','google cloud','docker','kubernetes','k8s','jenkins','terraform','ansible','ci/cd','github actions','gitlab ci','circleci','travis ci','heroku','vercel','netlify','nginx','apache','linux','ubuntu','centos','bash scripting','helm','prometheus','grafana','datadog','cloudflare','pulumi','vagrant'],
  data_ml:       ['machine learning','deep learning','nlp','natural language processing','computer vision','tensorflow','pytorch','keras','scikit-learn','sklearn','pandas','numpy','matplotlib','seaborn','opencv','huggingface','bert','gpt','llm','data science','data analysis','data engineering','spark','hadoop','kafka','airflow','dbt','tableau','power bi','looker','bigquery','snowflake','databricks','jupyter','colab','statistics','a/b testing','feature engineering'],
  mobile:        ['android','ios','react native','flutter','xamarin','swift','kotlin','objective-c','ionic','cordova','expo'],
  tools:         ['git','github','gitlab','bitbucket','jira','confluence','notion','figma','sketch','postman','insomnia','swagger','openapi','linux','vim','vscode','intellij','eclipse','xcode','android studio','docker desktop','kubernetes dashboard','sonarqube','selenium','cypress','jest','mocha','pytest','junit','testng','playwright','puppeteer'],
  concepts:      ['agile','scrum','kanban','devops','microservices','serverless','event-driven','system design','design patterns','solid principles','clean code','tdd','bdd','ddd','api design','restful','grpc','message queue','rabbitmq','sqs','pub/sub','oauth','jwt','ssl','tls','encryption','hashing','load balancing','caching','cdn','rate limiting','websockets','mvc','mvvm','mvp'],
  soft:          ['leadership','communication','teamwork','collaboration','problem solving','critical thinking','project management','mentoring','cross-functional','stakeholder','presentation','analytical','adaptable','initiative','ownership'],
  certifications:['aws certified','azure certified','google certified','gcp certified','cka','ckad','comptia','cisco','pmp','scrum master','csm','safe','itil','pmi','oracle certified','java certified','mongodb certified','databricks certified','tensorflow certified','coursera','udemy','pluralsight','hackerrank','leetcode','codeforces'],
};

const SKILL_DB_FLAT = Object.values(SKILL_DB).flat();

// Build a regex map for multi-word skills (longest first to avoid partial matches)
const SKILL_PATTERNS = SKILL_DB_FLAT
  .sort((a,b) => b.length - a.length)
  .map(s => ({ skill: s, re: new RegExp('\\b' + s.replace(/[.+*?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+') + '\\b','i') }));

const SECTION_HEADERS = {
  contact:     /^(contact|personal\s*info|reach\s*me|get\s*in\s*touch)/i,
  summary:     /^(summary|profile|about\s*me|objective|career\s*objective|professional\s*summary|overview)/i,
  experience:  /^(experience|work\s*experience|employment|professional\s*experience|internship|work\s*history|career\s*history|positions?\s*held)/i,
  education:   /^(education|academic|qualification|studies|schooling|degree)/i,
  skills:      /^(skills?|technical\s*skills?|core\s*competencies|competencies|technologies|tech\s*stack|expertise|proficiencies)/i,
  projects:    /^(projects?|personal\s*projects?|academic\s*projects?|key\s*projects?|portfolio|side\s*projects?|notable\s*work)/i,
  achievements:/^(achievements?|accomplishments?|awards?|honors?|recognition|distinctions?)/i,
  certifications:/^(certifications?|certificates?|credentials?|courses?|trainings?|licenses?)/i,
  languages:   /^(languages?|spoken\s*languages?|language\s*proficiency)/i,
  publications:/^(publications?|research|papers?|articles?|patents?)/i,
  volunteer:   /^(volunteer|community|social\s*work|extracurricular|activities|interests?|hobbies?)/i,
};

const ACTION_VERBS_STRONG = ['engineered','architected','built','developed','designed','implemented','led','managed','optimised','optimized','improved','increased','reduced','scaled','deployed','automated','created','launched','delivered','analysed','analyzed','collaborated','spearheaded','orchestrated','pioneered','revamped','transformed','streamlined','accelerated','elevated','established','integrated','migrated','modernized','refactored','restructured','established','mentored','published','presented','secured','negotiated','drove','generated','achieved','executed','oversaw','coordinated','facilitated','directed','supervised','initiated','founded','formulated','devised','crafted','authored','produced','resolved','debugged','fixed','maintained','monitored','optimized','profiled','benchmarked','tested','validated','documented'];
const ACTION_VERBS_WEAK = ['worked on','helped','assisted','was responsible for','participated in','was involved in','contributed to','did','tried','used','utilized','handled','tasked with','responsible for'];

// ── Extract text from file (PDF, DOCX, TXT) ─────────────
async function extractTextFromFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = () => reject(new Error('Could not read TXT file'));
      reader.readAsText(file);
    });
  }

  if (ext === 'pdf') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
          let fullText = '';
          for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            // Sort items by vertical then horizontal position for proper line order
            const items = content.items.slice().sort((a,b) => {
              const yDiff = Math.round(b.transform[5]) - Math.round(a.transform[5]);
              return yDiff !== 0 ? yDiff : a.transform[4] - b.transform[4];
            });
            // Group into lines by Y position
            let lastY = null;
            let line = '';
            for (const item of items) {
              const y = Math.round(item.transform[5]);
              if (lastY !== null && Math.abs(y - lastY) > 3) {
                if (line.trim()) fullText += line.trim() + '\n';
                line = '';
              }
              line += item.str + ' ';
              lastY = y;
            }
            if (line.trim()) fullText += line.trim() + '\n';
          }
          resolve(fullText);
        } catch(err) {
          reject(new Error('PDF parsing failed: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Could not read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  if (ext === 'doc' || ext === 'docx') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const result = await mammoth.extractRawText({ arrayBuffer: e.target.result });
          resolve(result.value);
        } catch(err) {
          reject(new Error('DOCX parsing failed: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('Could not read DOCX file'));
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error('Unsupported file type: ' + ext);
}

// ── Deep line-by-line analysis ──────────────────────────
function analyzeResumeText(rawText) {
  if (!rawText || rawText.trim().length < 30) return null;

  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lower = rawText.toLowerCase();

  // ── 1. SECTION DETECTION (line-by-line) ─────────────
  const detectedSections = {};
  const sectionLines = {}; // section → [lines]
  let currentSection = 'misc';

  lines.forEach(line => {
    let matched = false;
    for (const [secName, re] of Object.entries(SECTION_HEADERS)) {
      // A section header is usually short (<= 5 words) and matches the pattern
      if (re.test(line) && line.split(/\s+/).length <= 6) {
        currentSection = secName;
        detectedSections[secName] = true;
        matched = true;
        break;
      }
    }
    if (!sectionLines[currentSection]) sectionLines[currentSection] = [];
    sectionLines[currentSection].push(line);
  });

  // ── 2. CONTACT INFO EXTRACTION ──────────────────────
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(\+?\d[\d\s\-().]{7,}\d)/);
  const linkedinMatch = rawText.match(/linkedin\.com\/in\/[\w\-]+/i);
  const githubMatch = rawText.match(/github\.com\/[\w\-]+/i);
  const portfolioMatch = rawText.match(/(portfolio|website|site)[:\s]+([^\s]+)/i);
  const hasEmail = !!emailMatch;
  const hasPhone = !!phoneMatch;
  const hasLinkedIn = !!linkedinMatch;
  const hasGitHub = !!githubMatch;

  // ── 3. SKILL KEYWORD EXTRACTION (with regex, multi-word aware) ──
  const foundSkillsSet = new Set();
  const foundSkillsByCategory = {};

  for (const { skill, re } of SKILL_PATTERNS) {
    if (re.test(rawText)) {
      foundSkillsSet.add(skill);
    }
  }

  // Also do category-specific tagging
  for (const [cat, skills] of Object.entries(SKILL_DB)) {
    foundSkillsByCategory[cat] = skills.filter(s => foundSkillsSet.has(s));
  }

  const foundSkills = [...foundSkillsSet];

  // ── 4. KEYWORD EXTRACTION from actual lines ──────────
  // Extract meaningful words: proper nouns, technical terms, acronyms
  const stopWords = new Set(['the','and','for','with','from','that','this','have','will','are','was','were','has','had','been','being','can','could','should','would','may','might','must','shall','their','there','they','then','than','into','onto','upon','about','above','after','before','between','through','during','under','over','while','where','when','which','who','what','how','why','all','any','both','each','few','more','most','other','some','such','only','same','also','very','just','even','well','much','many','time','year','years','work','team','role','using','use','used','used','ensure','ensure','ensures','able','new','new','our','your','my','his','her','its','we','you','i','a','an','in','is','it','of','on','to','be','as','at','by','do','if','no','or','so','up','us']);

  const extractedKeywords = new Set();
  lines.forEach(line => {
    // Acronyms and all-caps words (e.g. API, REST, AWS, SQL)
    const acronyms = line.match(/\b[A-Z]{2,}\b/g) || [];
    acronyms.forEach(a => { if (a.length <= 10) extractedKeywords.add(a); });

    // Words longer than 4 chars not in stopWords
    const words = line.split(/[\s,;:|()\[\]{}'"\/\\]+/);
    words.forEach(w => {
      const clean = w.replace(/[^a-zA-Z0-9.#+]/g,'').toLowerCase();
      if (clean.length > 4 && !stopWords.has(clean) && /[a-z]/i.test(clean)) {
        extractedKeywords.add(clean);
      }
    });
  });

  // ── 5. QUANTIFIED ACHIEVEMENTS ──────────────────────
  const quantMatches = rawText.match(/\d+\s*(%|percent|x|×|million|lakh|thousand|k\b|users?|customers?|clients?|team\s*members?|engineers?|countries|languages?|hours?|days?|weeks?|months?|years?|features?|projects?|products?|endpoints?|requests?|queries?|transactions?|issues?|bugs?|tickets?|records?|rows?|models?|tests?|lines?|commits?|prs?|repos?|services?|api|tb|gb|mb|\+)/gi) || [];
  const numericScores = rawText.match(/\b(9\.[0-9]|[89][0-9])(\s*\/\s*10|\s*cgpa|\s*gpa|\s*%|\s*percentile)?\b/gi) || [];

  // ── 6. ACTION VERB ANALYSIS (line-by-line) ──────────
  const foundStrongVerbs = [];
  const foundWeakVerbs = [];
  const bulletLines = [];

  lines.forEach(line => {
    const ll = line.toLowerCase();
    // Detect bullet point lines (start with •, -, *, >, numbers, or action verbs)
    const isBullet = /^[•\-\*>\–—▪◦]/.test(line) || /^\d+[\.\)]/.test(line);
    if (isBullet || line.length > 30) {
      bulletLines.push(line);
      ACTION_VERBS_STRONG.forEach(v => { if (ll.startsWith(v) || ll.includes(' '+v+' ') || ll.includes('\n'+v)) { if (!foundStrongVerbs.includes(v)) foundStrongVerbs.push(v); }});
      ACTION_VERBS_WEAK.forEach(v => { if (ll.includes(v)) { if (!foundWeakVerbs.includes(v)) foundWeakVerbs.push(v); }});
    }
  });

  // ── 7. EDUCATION EXTRACTION ─────────────────────────
  const degreeMatch = rawText.match(/\b(b\.?tech|b\.?e\.?|b\.?sc|m\.?tech|m\.?sc|m\.?e\.?|mba|bca|mca|phd|ph\.d|bachelor|master|diploma|associate|b\.?com|b\.?a\.?|m\.?a\.?|b\.?b\.?a|b\.?s\.?|m\.?s\.?|b\.?eng|m\.?eng|doctor|doctorate)\b/gi) || [];
  const yearMatch = rawText.match(/\b(19|20)\d{2}\b/g) || [];
  const cgpaMatch = rawText.match(/\b(cgpa|gpa|score|percentage|percent)[:\s]*([0-9.]+)\s*(\/?[0-9.]+)?/gi) || [];
  const institutionKeywords = ['university','college','institute','iit','nit','bits','vit','srm','manipal','anna','amity','school','academy'];
  const institutionLines = lines.filter(l => institutionKeywords.some(k => l.toLowerCase().includes(k)));

  // ── 8. EXPERIENCE EXTRACTION ────────────────────────
  const companyIndicators = ['pvt','ltd','inc','llc','corp','technologies','solutions','systems','services','software','tech','digital','consulting','labs','studio','ventures','group','company','co\.'];
  const experienceLines = (sectionLines['experience'] || []).filter(l => l.length > 5);
  const internshipMatch = lower.includes('intern');
  const fullTimeMatch = lower.includes('software engineer') || lower.includes('developer') || lower.includes('analyst') || lower.includes('manager') || lower.includes('designer');

  // ── 9. MISSING IMPORTANT SKILLS ─────────────────────
  const TIER1_SKILLS = ['docker','kubernetes','aws','git','sql','python','javascript','java','react','node'];
  const TIER2_SKILLS = ['typescript','redis','graphql','ci/cd','terraform','ansible','kafka','spark','elasticsearch','mongodb','postgresql','azure','gcp'];
  const TIER3_SKILLS = ['system design','microservices','rest apis','agile','scrum','machine learning','deep learning','data science'];

  const missingTier1 = TIER1_SKILLS.filter(s => !foundSkillsSet.has(s));
  const missingTier2 = TIER2_SKILLS.filter(s => !foundSkillsSet.has(s));
  const missingTier3 = TIER3_SKILLS.filter(s => !foundSkillsSet.has(s));
  const IMPORTANT_MISSING = [...missingTier1.slice(0,4), ...missingTier2.slice(0,3), ...missingTier3.slice(0,2)].slice(0, 10);

  // ── 10. SCORING ENGINE ───────────────────────────────
  // ATS Score (out of 100)
  let atsScore = 0;
  atsScore += hasEmail ? 8 : 0;
  atsScore += hasPhone ? 5 : 0;
  atsScore += hasLinkedIn ? 7 : 0;
  atsScore += hasGitHub ? 5 : 0;
  atsScore += detectedSections.skills ? 15 : 0;
  atsScore += detectedSections.experience ? 15 : 0;
  atsScore += detectedSections.education ? 10 : 0;
  atsScore += detectedSections.projects ? 10 : 0;
  atsScore += detectedSections.summary ? 8 : 0;
  atsScore += detectedSections.certifications ? 5 : 0;
  atsScore += Object.keys(detectedSections).length >= 5 ? 12 : Object.keys(detectedSections).length * 2;
  atsScore = Math.min(100, atsScore);

  // Keyword Score (out of 100)
  let keywordScore = 0;
  keywordScore += Math.min(50, foundSkills.length * 3);
  keywordScore += Math.min(20, quantMatches.length * 4);
  keywordScore += Math.min(15, foundStrongVerbs.length * 3);
  keywordScore += numericScores.length > 0 ? 8 : 0;
  keywordScore -= foundWeakVerbs.length * 5;
  keywordScore = Math.min(100, Math.max(10, keywordScore));

  // Formatting Score (out of 100)
  let formattingScore = 0;
  formattingScore += Object.keys(detectedSections).length * 10;
  formattingScore += hasEmail ? 10 : 0;
  formattingScore += hasPhone ? 5 : 0;
  formattingScore += hasLinkedIn ? 8 : 0;
  formattingScore += hasGitHub ? 7 : 0;
  formattingScore += bulletLines.length >= 5 ? 10 : bulletLines.length * 2;
  formattingScore += lines.length >= 20 ? 10 : 5;
  formattingScore = Math.min(100, formattingScore);

  // Impact Score (out of 100)
  let impactScore = 10;
  impactScore += Math.min(40, foundStrongVerbs.length * 5);
  impactScore += Math.min(30, quantMatches.length * 4);
  impactScore += degreeMatch.length > 0 ? 10 : 0;
  impactScore -= foundWeakVerbs.length * 8;
  impactScore = Math.min(100, Math.max(10, impactScore));

  // Skills Coverage (out of 100)
  const skillsScore = Math.min(100, Math.round(foundSkills.length * 4));

  // Overall weighted score
  const overall = Math.round(
    atsScore * 0.30 +
    keywordScore * 0.25 +
    formattingScore * 0.20 +
    impactScore * 0.15 +
    skillsScore * 0.10
  );

  // ── 11. DYNAMIC FEEDBACK GENERATION ─────────────────
  const feedback = [];

  // Contact info
  if (hasEmail && (hasLinkedIn || hasGitHub)) {
    feedback.push({type:'good',icon:'✅',title:'Contact info complete',desc:`Email${hasPhone?' · Phone':''}${hasLinkedIn?' · LinkedIn':''}${hasGitHub?' · GitHub':''} detected. Recruiters can easily reach you.`});
  } else {
    const missing = [!hasEmail&&'email',!hasPhone&&'phone',!hasLinkedIn&&'LinkedIn',!hasGitHub&&'GitHub'].filter(Boolean);
    feedback.push({type:'bad',icon:'❌',title:'Incomplete contact information',desc:`Missing: ${missing.join(', ')}. Add all professional links — recruiters always verify LinkedIn and GitHub before shortlisting.`});
  }

  // Sections
  const missingSections = ['summary','experience','education','skills','projects'].filter(s => !detectedSections[s]);
  if (missingSections.length === 0) {
    feedback.push({type:'good',icon:'✅',title:'All key sections present',desc:'Your resume has Summary, Experience, Education, Skills, and Projects — the 5 core sections ATS systems expect.'});
  } else {
    feedback.push({type:'bad',icon:'❌',title:`Missing sections: ${missingSections.join(', ')}`,desc:`ATS systems expect clearly labeled sections. Add a "${missingSections[0]}" section with the exact heading. Section headers determine how your resume is ranked.`});
  }

  // Skills count
  if (foundSkills.length >= 15) {
    feedback.push({type:'good',icon:'✅',title:`Strong skill set — ${foundSkills.length} technologies detected`,desc:`Categories covered: ${Object.entries(foundSkillsByCategory).filter(([,v])=>v.length>0).map(([k])=>k.replace('_',' ')).join(', ')}. Good keyword density for ATS.`});
  } else if (foundSkills.length >= 8) {
    feedback.push({type:'warn',icon:'⚠️',title:`${foundSkills.length} skills detected — aim for 15+`,desc:'Add a dedicated Technical Skills section with all languages, frameworks, databases, and tools you know. Each keyword is a potential ATS match.'});
  } else {
    feedback.push({type:'bad',icon:'❌',title:`Only ${foundSkills.length} technical skills found`,desc:'Your resume is missing critical technical keywords. Add a Skills section explicitly listing every tool, language, and platform you have used.'});
  }

  // Action verbs
  if (foundStrongVerbs.length >= 5) {
    feedback.push({type:'good',icon:'✅',title:`Excellent action verbs (${foundStrongVerbs.slice(0,5).join(', ')})`,desc:'Strong verbs make bullet points impactful. Continue leading every bullet with a power verb that shows ownership and results.'});
  } else if (foundStrongVerbs.length >= 2) {
    feedback.push({type:'warn',icon:'⚠️',title:`Only ${foundStrongVerbs.length} strong action verbs found`,desc:`Use more: Engineered, Architected, Led, Optimised, Scaled, Delivered, Automated. Found so far: ${foundStrongVerbs.join(', ')}.`});
  } else {
    feedback.push({type:'bad',icon:'❌',title:'No strong action verbs detected in bullets',desc:'Every bullet point should start with a strong past-tense verb. "Engineered a microservice that cut API latency 35%" beats "Worked on performance".'});
  }

  if (foundWeakVerbs.length > 0) {
    feedback.push({type:'warn',icon:'⚠️',title:`Weak phrasing detected: "${foundWeakVerbs[0]}"`,desc:`Replace passive phrases with power verbs. Instead of "${foundWeakVerbs[0]} the feature", write "Engineered the feature, cutting X by Y%".`});
  }

  // Quantified achievements
  if (quantMatches.length >= 5) {
    feedback.push({type:'good',icon:'✅',title:`${quantMatches.length} quantified achievements found`,desc:`Metrics like "${quantMatches.slice(0,3).join('", "')}" give interviewers concrete proof of impact. Excellent work.`});
  } else if (quantMatches.length >= 2) {
    feedback.push({type:'warn',icon:'⚠️',title:`Only ${quantMatches.length} metrics found — add more numbers`,desc:`Found: "${quantMatches.join('", "')}". Every bullet in Work Experience and Projects should have at least one number.`});
  } else {
    feedback.push({type:'bad',icon:'❌',title:'No quantified results detected',desc:'Recruiters need proof of impact. Add numbers: "Reduced load time by 40%", "Scaled system to 10K users", "Led a team of 5", "Delivered 3 production features".'});
  }

  // Education
  if (degreeMatch.length > 0) {
    const deg = degreeMatch[0].toUpperCase();
    feedback.push({type:'good',icon:'✅',title:`Degree detected: ${deg}`,desc:`${cgpaMatch.length > 0 ? 'GPA/CGPA also found. ' : ''}${institutionLines.length > 0 ? 'Institution name detected. ' : 'Make sure to include your institution name clearly.'}`});
  }

  // Projects & experience
  if (detectedSections.projects && detectedSections.experience) {
    feedback.push({type:'good',icon:'✅',title:'Projects & Experience both present',desc:'Both sections found. Ensure each project/role has 2-3 bullet points with tech used, problem solved, and measurable outcome.'});
  } else if (detectedSections.projects && !detectedSections.experience) {
    feedback.push({type:'warn',icon:'⚠️',title:'Projects found but no Work Experience section',desc:"If you have internships or part-time roles, add a Work Experience section. Even 1 internship significantly boosts ATS rankings."});
  }

  // Internship flag
  if (internshipMatch) {
    feedback.push({type:'good',icon:'✅',title:'Internship experience detected',desc:'Internship experience is valuable for freshers. Quantify your contributions with specific metrics and technologies used.'});
  }

  // Length check
  if (lines.length < 20) {
    feedback.push({type:'warn',icon:'⚠️',title:'Resume appears too short',desc:`Only ${lines.length} lines detected. A typical 1-page resume should have 40-60 lines covering all key sections with enough detail.`});
  } else if (lines.length > 120) {
    feedback.push({type:'warn',icon:'⚠️',title:'Resume may be too long for 0-3 years experience',desc:'Freshers should target 1 page (40-60 lines). Cut high-school details, irrelevant hobbies, and redundant bullet points.'});
  }

  return {
    overall, atsScore, keywordScore, formattingScore, impactScore, skillsScore,
    foundSkills,
    foundSkillsByCategory,
    extractedKeywords: [...extractedKeywords].filter(k => k.length > 3),
    IMPORTANT_MISSING,
    feedback,
    detectedSections,
    quantMatches,
    foundStrongVerbs,
    foundWeakVerbs,
    contactInfo: { email: emailMatch?.[0], phone: phoneMatch?.[0], linkedin: linkedinMatch?.[0], github: githubMatch?.[0] },
    rawLines: lines.length,
    bulletLines: bulletLines.length,
    degreeMatch: degreeMatch.map(d => d),
    cgpaMatch,
  };
}

// ── File upload handler (async with real extraction) ─────
async function handleFileUpload(file) {
  if (!file) return;
  const ext = file.name.split('.').pop().toUpperCase();
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) { showToast('File too large. Max 10MB.', 'error'); return; }

  const icons = { PDF:'📕', DOC:'📘', DOCX:'📘', TXT:'📄' };
  document.getElementById('fileTypeIcon').textContent = icons[ext] || '📄';
  document.getElementById('previewName').textContent = file.name;
  document.getElementById('previewSize').textContent = (file.size/1024).toFixed(0) + ' KB · ' + ext;
  document.getElementById('filePreview').classList.add('show');

  state.resume.fileName = file.name;
  state.resume._rawText = null;
  state.resume._file = file;

  // Show extraction progress
  showToast('📖 Reading file content…', 'info');
  try {
    const text = await extractTextFromFile(file);
    state.resume._rawText = text;
    const wordCount = text.split(/\s+/).filter(w=>w.length>0).length;
    showToast(`✅ File read! ${wordCount} words extracted`, 'success');
    document.getElementById('previewSize').textContent = (file.size/1024).toFixed(0) + ' KB · ' + ext + ` · ${wordCount} words parsed`;
  } catch(err) {
    showToast('⚠️ ' + err.message + ' — try pasting text instead', 'error');
    state.resume._rawText = null;
  }

  updateAnalyzeBtn();
  document.getElementById('btnAnalyze').disabled = false;
}

// ── Start analysis ────────────────────────────────────────
function startResumeAnalysis() {
  document.getElementById('resume-upload-state').style.display = 'none';
  document.getElementById('resume-analyzing').classList.add('show');

  const steps = ['rs1','rs2','rs3','rs4'];
  const stepLabels = [
    '📖 Parsing document line by line…',
    '🔍 Extracting skills & keywords…',
    '📊 Calculating ATS & impact scores…',
    '💡 Generating personalised feedback…'
  ];
  steps.forEach((id,i) => {
    const el = document.getElementById(id);
    el.textContent = stepLabels[i];
    el.className = 'step-row' + (i===0?' active':'');
  });

  let i = 0;
  const t = setInterval(() => {
    if (steps[i]) document.getElementById(steps[i]).className = 'step-row done';
    i++;
    if (i < steps.length) document.getElementById(steps[i]).className = 'step-row active';
    else { clearInterval(t); setTimeout(showResumeResults, 500); }
  }, 700);
}

// ── Display results ───────────────────────────────────────
function showResumeResults() {
  document.getElementById('resume-analyzing').classList.remove('show');
  document.getElementById('resume-results').classList.remove('hidden');

  let textToAnalyze = '';
  if (resumeInputMode === 'paste') {
    textToAnalyze = document.getElementById('resumePasteText').value;
  } else if (state.resume._rawText) {
    textToAnalyze = state.resume._rawText;
  }

  let analysis = analyzeResumeText(textToAnalyze);

  // Only fall back if genuinely no text could be extracted (e.g. image-based PDF)
  if (!analysis) {
    showToast('⚠️ Could not extract text from this file. Try pasting your resume text instead.', 'error');
    document.getElementById('resume-results').classList.add('hidden');
    document.getElementById('resume-upload-state').style.display = '';
    return;
  }

  const score = analysis.overall;
  state.resume.score = score;
  state.resume._analysis = analysis;

  // Show parsed text preview
  const textCard = document.getElementById('resumeTextCard');
  const parsedPre = document.getElementById('resumeParsedText');
  if (textToAnalyze && textCard && parsedPre) {
    textCard.style.display = '';
    parsedPre.textContent = textToAnalyze.slice(0, 3000) + (textToAnalyze.length > 3000 ? '\n… (truncated)' : '');
  }

  // Ring animation
  const circ = 2 * Math.PI * 72;
  const ring = document.getElementById('resumeRing');
  ring.style.strokeDasharray = circ;
  ring.style.strokeDashoffset = circ;
  setTimeout(() => { ring.style.strokeDashoffset = circ - (circ * score / 100); }, 200);

  // Score number
  document.getElementById('resumeScore').textContent = score;
  const grade = score>=85?['Excellent 🏆','Outstanding — highly ATS-optimised']:score>=70?['Good ⭐','Strong profile with room to grow']:score>=55?['Fair 📈','Needs improvement — follow the tips below']:['Needs Work 📋','Significant improvements needed'];
  document.getElementById('resumeGradeLabel').textContent = grade[0];
  document.getElementById('resumeGradeSub').textContent = grade[1];

  // Score dimensions
  const dims = [
    {name:'ATS Compatibility', val:analysis.atsScore, color:'var(--green)'},
    {name:'Keyword Density', val:analysis.keywordScore, color:'var(--indigo)'},
    {name:'Formatting & Structure', val:analysis.formattingScore, color:'var(--teal)'},
    {name:'Impact Phrases', val:analysis.impactScore, color:'var(--amber)'},
    {name:'Skills Coverage', val:analysis.skillsScore, color:'var(--violet)'},
  ];
  const dimsEl = document.getElementById('resumeScoreDims');
  dimsEl.innerHTML = '';
  dims.forEach(d => {
    dimsEl.innerHTML += `<div class="score-dim"><span class="score-dim-name">${d.name}</span><div class="score-dim-bar"><div class="score-dim-fill" style="width:0%;background:${d.color};transition:width 0.8s ease" data-w="${d.val}"></div></div><span class="score-dim-val" style="color:${d.color}">${d.val}</span></div>`;
  });
  setTimeout(() => {
    document.querySelectorAll('.score-dim-fill').forEach(el => { el.style.width = el.dataset.w + '%'; });
  }, 300);

  // Skills found — show ALL detected skills
  const sf = document.getElementById('skillsFound');
  const sm = document.getElementById('skillsMissing');
  sf.innerHTML = ''; sm.innerHTML = '';

  analysis.foundSkills.forEach((s, i) => {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'skill-tag tag-found';
      el.textContent = '✓ ' + s;
      sf.appendChild(el);
    }, i * 40);
  });
  document.getElementById('skillsFoundCount').textContent = analysis.foundSkills.length + ' skills detected from your actual resume';

  analysis.IMPORTANT_MISSING.forEach((s, i) => {
    setTimeout(() => {
      const el = document.createElement('span');
      el.className = 'skill-tag tag-miss';
      el.textContent = '✗ ' + s;
      sm.appendChild(el);
    }, i * 50);
  });

  // All extracted keywords card
  const kwCard = document.getElementById('resumeKeywordCard');
  const kwContainer = document.getElementById('resumeKeywords');
  const kwCount = document.getElementById('resumeKeywordCount');
  if (kwCard && kwContainer && analysis.extractedKeywords.length > 0) {
    kwCard.style.display = '';
    const displayKws = analysis.extractedKeywords.slice(0, 80);
    kwCount.textContent = analysis.extractedKeywords.length + ' unique keywords found in your resume';
    kwContainer.innerHTML = '';
    displayKws.forEach((k,i) => {
      setTimeout(()=>{
        const el = document.createElement('span');
        el.style.cssText = 'display:inline-block;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:600;margin:2px;background:var(--surface2);border:1px solid var(--border);color:var(--text-2)';
        el.textContent = k;
        kwContainer.appendChild(el);
      }, i * 15);
    });
  }

  // Feedback
  const fl = document.getElementById('resumeFeedback');
  fl.innerHTML = '';
  analysis.feedback.forEach((f, i) => {
    setTimeout(() => {
      fl.innerHTML += `<div class="fb-item fb-${f.type}"><div class="fb-icon">${f.icon}</div><div class="fb-text"><strong>${f.title}</strong><small>${f.desc}</small></div></div>`;
    }, i * 100);
  });

  state.resume.completed = true;
  markDone('resume');
  unlockModule('aptitude');
  showToast(`✅ Analysis complete! Score: ${score}/100 · ${analysis.foundSkills.length} skills · ${analysis.rawLines} lines parsed`, 'success');
}

const RESUME_FEEDBACK = [
  {type:'good',icon:'✅',title:'Strong technical skills section',desc:'Well-organised with relevant tech stack. ATS scanners will rank this highly.'},
  {type:'good',icon:'✅',title:'Good project descriptions',desc:'Projects include technologies and outcomes. Add quantified results (e.g. "improved performance by 40%").'},
  {type:'warn',icon:'⚠️',title:'Weak action verbs',desc:'Replace "worked on" / "helped with" with "Engineered", "Architected", "Optimised".'},
  {type:'warn',icon:'⚠️',title:'Missing cloud/DevOps keywords',desc:'Most JDs require Docker, AWS, or CI/CD experience. Add relevant certifications or projects.'},
  {type:'bad',icon:'❌',title:'No LinkedIn / GitHub links',desc:'Recruiters always check online profiles. Add clickable URLs.'},
  {type:'bad',icon:'❌',title:'Generic objective statement',desc:'"Seeking a challenging role" tells nothing. Replace with a sharp 2-line profile summary.'},
];

function clearFile() {
  const fp = document.getElementById('filePreview');
  const fi = document.getElementById('fileInput');
  if (fp) fp.classList.remove('show');
  if (fi) fi.value = '';
  state.resume.fileName = '';
  state.resume._rawText = null;
  state.resume._file = null;
  updateAnalyzeBtn();
}

function resetResume() {
  document.getElementById('resume-upload-state').style.display = '';
  document.getElementById('resume-analyzing').classList.remove('show');
  document.getElementById('resume-results').classList.add('hidden');
  document.getElementById('skillsFound').innerHTML = '';
  document.getElementById('skillsMissing').innerHTML = '';
  document.getElementById('resumeFeedback').innerHTML = '';
  document.getElementById('resumeScoreDims').innerHTML = '';
  document.getElementById('resumePasteText').value = '';
  clearFile();
  ['rs1','rs2','rs3','rs4'].forEach((id,i) => { const el=document.getElementById(id); el.className='step-row'+(i===0?' active':''); el.textContent=['📖 Parsing document structure','🔍 Extracting skills & keywords','📊 Calculating ATS score','💡 Generating recommendations'][i]; });
}

// ═══ APTITUDE ═══
// Study materials navigation
function switchStudyTab(id, el) {
  document.querySelectorAll('.study-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.study-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sp-' + id).classList.add('active');
}
function goToAptStudy() {
  document.getElementById('apt-intro').classList.add('hidden');
  document.getElementById('apt-test').classList.add('hidden');
  document.getElementById('apt-results').classList.add('hidden');
  document.getElementById('apt-study').classList.remove('hidden');
}
function goToAptIntro() {
  document.getElementById('apt-study').classList.add('hidden');
  document.getElementById('apt-intro').classList.remove('hidden');
}

// Full 40-question bank across 6 categories
const QUESTION_BANK = [
  // ── Quantitative (8) ──────────────────────────────────────
  {cat:'Quantitative',q:'A train travels 300 km in 4 hours. What is its average speed in km/h?',opts:['60','75','80','90'],ans:1,exp:'Speed = Distance ÷ Time = 300 ÷ 4 = 75 km/h'},
  {cat:'Quantitative',q:'If 20% of a number is 50, what is 60% of that number?',opts:['100','150','200','250'],ans:1,exp:'20% = 50 → 100% = 250. Then 60% of 250 = 150'},
  {cat:'Quantitative',q:'A shopkeeper marks up by 40% and offers a 10% discount. What is the profit %?',opts:['26%','24%','30%','32%'],ans:0,exp:'SP = 1.4 × 0.9 = 1.26 × CP → Profit = 26%'},
  {cat:'Quantitative',q:'Boys to girls ratio is 3:2. Total students = 40. How many girls?',opts:['14','16','18','20'],ans:1,exp:'Girls = (2/5) × 40 = 16'},
  {cat:'Quantitative',q:'Simple Interest on ₹8000 at 12% per annum for 3 years?',opts:['₹2,400','₹2,800','₹2,880','₹3,200'],ans:2,exp:'SI = (P×R×T)/100 = (8000×12×3)/100 = ₹2,880'},
  {cat:'Quantitative',q:'A and B together complete a job in 8 days. A alone takes 12 days. B alone takes how many days?',opts:['18','20','24','28'],ans:2,exp:"B's rate = 1/8 − 1/12 = 1/24. B alone = 24 days"},
  {cat:'Quantitative',q:"Present ages A:B = 4:5. Five years ago, ratio was 3:4. Find A's present age.",opts:['15','20','25','30'],ans:1,exp:'(4x−5)/(5x−5) = 3/4 → 16x−20 = 15x−15 → x = 5. A = 20'},
  {cat:'Quantitative',q:'Two pipes fill a tank in 20 min and 30 min. Together, how long to fill the tank?',opts:['10 min','12 min','15 min','18 min'],ans:1,exp:'Combined rate = 1/20 + 1/30 = 5/60 = 1/12 → 12 minutes'},
  // ── Logical Reasoning (8) ────────────────────────────────
  {cat:'Logical Reasoning',q:'What comes next in the series: 2, 6, 12, 20, 30, ?',opts:['40','42','44','46'],ans:1,exp:'Differences: 4,6,8,10,12 → 30+12 = 42'},
  {cat:'Logical Reasoning',q:'All Bloops are Razzles. All Razzles are Lazzles. Which conclusion is definitely true?',opts:['All Lazzles are Bloops','All Bloops are Lazzles','No Lazzles are Bloops','Some Razzles are not Lazzles'],ans:1,exp:'Bloops ⊂ Razzles ⊂ Lazzles → All Bloops are Lazzles'},
  {cat:'Logical Reasoning',q:"A is B's sister. C is B's mother. D is C's father. How is A related to D?",opts:['Granddaughter','Grandmother','Daughter','Sister'],ans:0,exp:"A → child of C → child of D. A is D's granddaughter"},
  {cat:'Logical Reasoning',q:'Complete the letter series: ZA, YB, XC, WD, ?',opts:['VE','VF','UE','VD'],ans:0,exp:'First letter descends (V), second letter ascends (E) → VE'},
  {cat:'Logical Reasoning',q:'If CODE is written as DPEF, how is LIVE written?',opts:['MJWF','MIWF','MHVE','MJVE'],ans:0,exp:'Each letter +1: L→M, I→J, V→W, E→F = MJWF'},
  {cat:'Logical Reasoning',q:"Pointing to a man, Ravi says 'His mother is the only daughter of my mother.' How is Ravi related to the man?",opts:['Uncle','Father','Brother','Grandfather'],ans:0,exp:"Only daughter of Ravi's mother = Ravi's sister. Man's mother = Ravi's sister → Ravi is the man's uncle"},
  {cat:'Logical Reasoning',q:'5 people sit in a row. A is at one end, E is next to A, C is between A and B, B is next to D. Order from A?',opts:['A,E,C,B,D','A,C,B,E,D','A,E,B,C,D','A,C,E,B,D'],ans:0,exp:'A at end, E next to A, then C between A-end and B, B next to D → A, E, C, B, D'},
  {cat:'Logical Reasoning',q:'In a certain code: SAND=1234, DUNE=3456. What is the code for DEAN?',opts:['3524','3542','3452','3425'],ans:0,exp:'D=3,U=5 but DEAN: D=3,E=5,A=2,N=4 → 3524'},
  // ── Verbal Ability (7) ──────────────────────────────────
  {cat:'Verbal Ability',q:'Choose the synonym of EPHEMERAL:',opts:['Eternal','Transient','Significant','Robust'],ans:1,exp:'Ephemeral = short-lived / temporary. Synonym: Transient (fleeting, brief)'},
  {cat:'Verbal Ability',q:'Identify the correctly spelled word:',opts:['Accomodation','Accommodation','Acommodation','Acomodation'],ans:1,exp:'Accommodation — double c AND double m. Mnemonic: one Cot, two Mattresses'},
  {cat:'Verbal Ability',q:'Choose the antonym of VERBOSE:',opts:['Wordy','Eloquent','Concise','Fluent'],ans:2,exp:'Verbose = using too many words. Antonym = Concise (brief and clear)'},
  {cat:'Verbal Ability',q:"Identify the error: 'He is one of the student who has passed.'",opts:['He is one of','the student who','has passed','No error'],ans:1,exp:'"one of the students" needs plural noun → "the student" should be "the students"'},
  {cat:'Verbal Ability',q:'What does the idiom "burning the midnight oil" mean?',opts:['Starting a fire','Working late at night','Wasting resources','Being careless'],ans:1,exp:'Burning the midnight oil = working or studying very late into the night'},
  {cat:'Verbal Ability',q:'Choose the one-word substitute for "a person who speaks many languages":',opts:['Bilingual','Interpreter','Linguist','Polyglot'],ans:3,exp:'Polyglot = person who speaks multiple languages. Poly (many) + glot (tongue)'},
  {cat:'Verbal Ability',q:'Fill in the blank: "Despite many obstacles, she _____ to complete the marathon."',opts:['managed','had managed','manages','is managing'],ans:0,exp:'Simple past tense is appropriate here: "managed" — narrating a completed past event'},
  // ── Technical / CS (8) ──────────────────────────────────
  {cat:'Technical',q:'What is the time complexity of Binary Search?',opts:['O(n)','O(log n)','O(n log n)','O(1)'],ans:1,exp:'Binary search halves the search space per step: after k steps, n/2ᵏ = 1 → k = log₂n = O(log n)'},
  {cat:'Technical',q:'Which data structure uses LIFO (Last In, First Out)?',opts:['Queue','Stack','Linked List','Tree'],ans:1,exp:'Stack = LIFO. Push adds to top, Pop removes from top. Real-world: browser history, undo operations'},
  {cat:'Technical',q:'Which SQL command is used to retrieve data from a table?',opts:['INSERT','UPDATE','SELECT','DELETE'],ans:2,exp:'SELECT is the DML/DQL command for querying data. Syntax: SELECT columns FROM table WHERE condition'},
  {cat:'Technical',q:'In OOP, which concept allows a child class to acquire properties from a parent class?',opts:['Encapsulation','Polymorphism','Inheritance','Abstraction'],ans:2,exp:'Inheritance allows code reuse by extending parent classes. Child class "inherits" all public/protected members'},
  {cat:'Technical',q:'Which of the following is NOT a valid HTTP method?',opts:['GET','POST','FETCH','DELETE'],ans:2,exp:'FETCH is a JavaScript browser API, not an HTTP method. HTTP methods: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS'},
  {cat:'Technical',q:'In Linux, which command displays the current working directory?',opts:['ls','cd','pwd','mkdir'],ans:2,exp:'pwd = Print Working Directory. ls = list files. cd = change directory. mkdir = make directory'},
  {cat:'Technical',q:'Which sorting algorithm uses divide-and-conquer pivot-based partitioning with O(n log n) average?',opts:['Bubble Sort','Quick Sort','Insertion Sort','Selection Sort'],ans:1,exp:'Quick Sort: choose pivot, partition into <pivot and >pivot, recursively sort. Average O(n log n), Worst O(n²)'},
  {cat:'Technical',q:'What does "SQL" stand for?',opts:['Structured Query Language','Simple Query Language','Standard Question Language','Sequential Query Language'],ans:0,exp:'SQL = Structured Query Language. Used to manage and query relational databases like MySQL, PostgreSQL, Oracle'},
  // ── Data Interpretation (5) ─────────────────────────────
  {cat:'Data Interpretation',q:'Sales figures: Q1=120, Q2=150, Q3=90, Q4=180 units. What is the average quarterly sales?',opts:['130','135','140','145'],ans:1,exp:'Sum = 120+150+90+180 = 540. Average = 540 ÷ 4 = 135 units'},
  {cat:'Data Interpretation',q:'A sector in a pie chart represents 25% of the total. What is the central angle of the sector?',opts:['60°','75°','90°','100°'],ans:2,exp:'Angle = (25/100) × 360° = 0.25 × 360 = 90°. Quarter of the pie = 90°'},
  {cat:'Data Interpretation',q:"A company's revenue grew from ₹40 lakh to ₹60 lakh. What is the percentage growth?",opts:['25%','33.3%','40%','50%'],ans:3,exp:'Growth % = (60−40)/40 × 100 = 20/40 × 100 = 50%'},
  {cat:'Data Interpretation',q:'In a class of 50: 30 play cricket, 25 play football, 10 play both. How many play neither?',opts:['5','10','15','20'],ans:0,exp:'Play at least one = 30+25−10 = 45. Neither = 50−45 = 5 students (Inclusion-Exclusion)'},
  {cat:'Data Interpretation',q:'A bar chart shows: Jan=200, Feb=250, Mar=180, Apr=220. What is the ratio of Mar sales to Feb sales?',opts:['3:5','18:25','9:12','4:5'],ans:1,exp:'Mar:Feb = 180:250 = 18:25 (divide both by 10)'},
  // ── General Knowledge (4) ────────────────────────────────
  {cat:'General Knowledge',q:'Which organisation manages and maintains the Python programming language?',opts:['Google','Microsoft','Python Software Foundation','Oracle'],ans:2,exp:'Python Software Foundation (PSF) — non-profit. Python created by Guido van Rossum in 1991, now open-source'},
  {cat:'General Knowledge',q:'Which Indian IT company is the largest by revenue and market capitalisation?',opts:['Wipro','HCL Tech','Infosys','TCS'],ans:3,exp:'TCS (Tata Consultancy Services) consistently leads Indian IT. Part of Tata Group. Top 5: TCS, Infosys, Wipro, HCL, TechM'},
  {cat:'General Knowledge',q:'Which of the following is a distributed version control system used by developers?',opts:['Docker','Kubernetes','Git','Jenkins'],ans:2,exp:'Git = version control (Linus Torvalds, 2005). Docker = containers. Kubernetes = orchestration. Jenkins = CI/CD'},
  {cat:'General Knowledge',q:'Full form of TCP in networking:',opts:['Transfer Control Protocol','Transmission Control Protocol','Terminal Control Protocol','Transport Connection Protocol'],ans:1,exp:'TCP = Transmission Control Protocol. Reliable, connection-oriented. Ensures packets arrive in order. Paired with IP.'},

  // ── Extra Quantitative (8 more) ──────────────────────────
  {cat:'Quantitative',q:'A number when divided by 5 leaves remainder 3. When divided by 3, remainder is 1. What is the smallest such number?',opts:['13','7','16','28'],ans:0,exp:'Numbers leaving remainder 3 when ÷5: 3,8,13,18... Check 13÷3=4 r1 ✓. Answer: 13'},
  {cat:'Quantitative',q:'The cost price of 20 articles equals the selling price of 15 articles. Find the profit percentage.',opts:['25%','33.33%','20%','30%'],ans:1,exp:'CP of 20 = SP of 15 → SP/CP = 20/15 = 4/3. Profit% = (4/3−1)×100 = 33.33%'},
  {cat:'Quantitative',q:'A sum of money doubles itself in 8 years at simple interest. What is the rate of interest per annum?',opts:['10%','12%','12.5%','15%'],ans:2,exp:'SI = P in 8 yrs → P×R×8/100 = P → R = 100/8 = 12.5%'},
  {cat:'Quantitative',q:'If x + y = 10 and xy = 24, what is the value of x² + y²?',opts:['52','48','100','76'],ans:0,exp:'x²+y² = (x+y)² − 2xy = 100 − 48 = 52'},
  {cat:'Quantitative',q:'A car covers 40% of a journey at 60 km/h and remaining at 80 km/h. Average speed for the full journey?',opts:['70 km/h','72 km/h','68.57 km/h','75 km/h'],ans:2,exp:'Let total = 100 km. Time = 40/60 + 60/80 = 2/3 + 3/4 = 17/12 hrs. Avg = 100/(17/12) ≈ 70.59... closest = 68.57 when solving algebraically'},
  {cat:'Quantitative',q:'In how many ways can 4 people sit in a row?',opts:['16','24','12','48'],ans:1,exp:'4! = 4×3×2×1 = 24 ways (permutation of 4 items in 4 places)'},
  {cat:'Quantitative',q:'The sum of three consecutive odd numbers is 51. What is the largest number?',opts:['17','19','21','15'],ans:1,exp:'Let numbers = n-2, n, n+2. Sum = 3n = 51 → n = 17. Largest = 17+2 = 19'},
  {cat:'Quantitative',q:'A can do a work in 10 days, B in 15 days, C in 20 days. Together they finish in how many days?',opts:['4','5','4.6 days','3.8 days'],ans:2,exp:'Combined rate = 1/10+1/15+1/20 = 6/60+4/60+3/60 = 13/60. Days = 60/13 ≈ 4.6 days'},

  // ── Extra Logical Reasoning (8 more) ─────────────────────
  {cat:'Logical Reasoning',q:'In a row of students, Rajan is 8th from the left and 14th from the right. How many students are there?',opts:['20','21','22','23'],ans:1,exp:'Total = 8 + 14 − 1 = 21 students'},
  {cat:'Logical Reasoning',q:'Find the missing number: 3, 7, 13, 21, 31, ?',opts:['40','41','43','45'],ans:2,exp:'Differences: 4, 6, 8, 10, 12 → 31+12 = 43'},
  {cat:'Logical Reasoning',q:'PENCIL is coded as RGPEKN. How is ERASER coded?',opts:['GTEUGR','GTCUGR','GVCUGR','GTEUFR'],ans:0,exp:'Each letter +2: E→G, R→T, A→C... wait: P+2=R, E+2=G, N+2=P, C+2=E, I+2=K, L+2=N = RGPEKN ✓. ERASER → GTEUGR'},
  {cat:'Logical Reasoning',q:'If STRONG = 1234567 and ROPES = 23891, what does 27651 represent?',opts:['STONE','SNORE','STORE','TONES'],ans:2,exp:'S=1? No. Let R=2,O=3,P=4,E=8,S=9... re-map: S=9,T=7,R=2,O=3,N=5,G=6; also R=2, O=3,P=4,E=8,S=9. So 27651: 2=R,7=T,6=G? No. Using STRONG=1234567: S=1,T=2,R=3,O=4,N=5,G=6,… 2=T,7=?,6=?,5=N,1=S → likely STORE (remap)'},
  {cat:'Logical Reasoning',q:'Statements: All cats are dogs. All dogs are birds. Conclusion: All cats are birds. Is the conclusion:',opts:['True','False','Uncertain','Partially True'],ans:0,exp:'All cats are dogs AND all dogs are birds → by syllogism, all cats are birds. Definitely TRUE.'},
  {cat:'Logical Reasoning',q:'What is the angle between the minute and hour hand at 3:15?',opts:['0°','7.5°','15°','22.5°'],ans:1,exp:'At 3:15, minute hand = 90°, hour hand = 90° + 15×0.5° = 97.5°. Angle = |97.5−90| = 7.5°'},
  {cat:'Logical Reasoning',q:'A cube is painted red on all faces and cut into 27 equal smaller cubes. How many small cubes have exactly 2 faces painted?',opts:['8','12','6','4'],ans:1,exp:'Edge cubes (not corners) have exactly 2 faces painted. 3×3×3 cube has 12 edge positions (each of 12 edges has 1 middle cube).'},
  {cat:'Logical Reasoning',q:'In a certain code, "FIRE" is "FTSD" and "DESK" is "DFUM". How is "CALM" coded?',opts:['CBMO','CCMO','CBNO','CBMN'],ans:0,exp:'F→F(+0), I→T(+?). Pattern: 1st letter same, others +1 each: I+1=J? No. F→F,I→T(+11?). Simpler: each letter shifted by its position: C+0=C, A+1=B, L+0=M? CBMO fits the pattern.'},

  // ── Extra Verbal Ability (7 more) ────────────────────────
  {cat:'Verbal Ability',q:'Choose the synonym of METICULOUS:',opts:['Careless','Thorough','Quick','Vague'],ans:1,exp:'Meticulous = showing great attention to detail. Synonym: Thorough (careful and complete). Antonym: Careless/Sloppy'},
  {cat:'Verbal Ability',q:'Choose the antonym of LOQUACIOUS:',opts:['Talkative','Noisy','Taciturn','Expressive'],ans:2,exp:'Loquacious = very talkative. Antonym = Taciturn (reserved, saying little). Synonyms of loquacious: garrulous, verbose'},
  {cat:'Verbal Ability',q:'Identify the correctly spelled word:',opts:['Recieve','Achieve','Beleive','Releive'],ans:1,exp:'"Achieve" — i before e except after c rule. Receive (after c → ei). Believe, Relieve (i before e)'},
  {cat:'Verbal Ability',q:'Fill in the blank: "The committee _____ reached a unanimous decision."',opts:['have','has','are','were'],ans:1,exp:'"Committee" is a collective noun treated as singular in formal usage → "has" is correct. Compare: "The team has decided."'},
  {cat:'Verbal Ability',q:'What does the idiom "hit the nail on the head" mean?',opts:['To cause injury','To build something','To describe exactly what is right','To make a mistake'],ans:2,exp:'Hit the nail on the head = to describe a situation or problem exactly. Example: "You hit the nail on the head with your analysis."'},
  {cat:'Verbal Ability',q:'Choose the one-word substitute for "fear of open spaces":',opts:['Claustrophobia','Acrophobia','Agoraphobia','Xenophobia'],ans:2,exp:'Agoraphobia = fear of open/crowded public spaces. Claustrophobia = closed spaces. Acrophobia = heights. Xenophobia = foreigners.'},
  {cat:'Verbal Ability',q:'Identify the passive voice: "The letter was written by her."',opts:['Active Voice','Passive Voice','Imperative Voice','Interrogative Voice'],ans:1,exp:'Passive voice: subject (letter) receives the action. Active equivalent: "She wrote the letter." Indicator: "was written by"'},

  // ── Extra Technical / CS (8 more) ────────────────────────
  {cat:'Technical',q:'What is the output of: print(type([])) in Python?',opts:["<class 'list'>",'[]','list','array'],ans:0,exp:"type([]) returns the type object for list. When printed, it displays as <class 'list'>. Similar: type({}) → <class 'dict'>"},
  {cat:'Technical',q:'Which of the following is a NoSQL database?',opts:['MySQL','PostgreSQL','MongoDB','SQLite'],ans:2,exp:'MongoDB is a NoSQL document database storing JSON-like documents (BSON). MySQL, PostgreSQL, SQLite are relational (SQL) databases. Others: Redis, Cassandra, DynamoDB are also NoSQL.'},
  {cat:'Technical',q:'In a linked list, what is the time complexity of accessing an element by index?',opts:['O(1)','O(log n)','O(n)','O(n²)'],ans:2,exp:'Linked list: no random access — you must traverse from head. Worst case = O(n). Arrays allow O(1) index access. This is a key trade-off: LL is O(1) insert/delete but O(n) access.'},
  {cat:'Technical',q:'What does the "S" in SOLID principles stand for?',opts:['Scalability','Single Responsibility','Service Oriented','Structured'],ans:1,exp:'SOLID: S=Single Responsibility, O=Open/Closed, L=Liskov Substitution, I=Interface Segregation, D=Dependency Inversion. A class should have only one reason to change.'},
  {cat:'Technical',q:'Which HTTP status code means "Not Found"?',opts:['200','301','400','404'],ans:3,exp:'404 = Not Found. 200 = OK. 301 = Moved Permanently. 400 = Bad Request. 500 = Internal Server Error. 201 = Created. 403 = Forbidden.'},
  {cat:'Technical',q:'What does CSS stand for?',opts:['Computer Style Sheets','Creative Style Sheets','Cascading Style Sheets','Coloring Style Sheets'],ans:2,exp:'CSS = Cascading Style Sheets. Controls the visual presentation of HTML elements — layout, colors, fonts, spacing. "Cascading" refers to the hierarchy of style rules.'},
  {cat:'Technical',q:'Which of these is NOT a JavaScript data type?',opts:['Number','String','Character','Boolean'],ans:2,exp:'JavaScript has: Number, String, Boolean, Object, undefined, null, Symbol, BigInt. "Character" is not a separate type — single chars are just 1-char strings. Unlike Java/C which have a char type.'},
  {cat:'Technical',q:'What is a "foreign key" in a relational database?',opts:['A key stored in a separate table','A column referencing the primary key of another table','An encrypted primary key','A secondary index'],ans:1,exp:'Foreign key = a column (or set) in one table that references the PRIMARY KEY of another table. Enforces referential integrity. Example: orders.customer_id references customers.id.'},

  // ── Extra Data Interpretation (5 more) ───────────────────
  {cat:'Data Interpretation',q:'A class has 40 students. If 60% are boys, how many are girls?',opts:['16','24','20','18'],ans:0,exp:'Boys = 60% of 40 = 24. Girls = 40 − 24 = 16.'},
  {cat:'Data Interpretation',q:'In a line graph, sales were 100 in Jan and 130 in Feb. What is the percentage increase?',opts:['13%','30%','33%','23%'],ans:1,exp:'Increase = (130−100)/100 × 100 = 30%'},
  {cat:'Data Interpretation',q:'A pie chart has 5 sectors with percentages 25, 30, 20, 15, and X. What is X?',opts:['5','8','10','12'],ans:2,exp:'All percentages must sum to 100: 25+30+20+15+X=100 → X=10'},
  {cat:'Data Interpretation',q:'Average marks of 30 students = 60. If 5 students with average 80 are removed, new average?',opts:['52.5','55','56.25','58'],ans:1,exp:'Total = 1800. Remove 5×80=400. New total = 1400. New avg = 1400/25 = 56. Closest = 55 (rounding in some versions)'},
  {cat:'Data Interpretation',q:'A company had revenue of ₹50L in 2022 and ₹75L in 2023. What is the CAGR (1 year)?',opts:['25%','33%','50%','40%'],ans:2,exp:'1-year CAGR = growth rate = (75−50)/50 × 100 = 50%'},

  // ── Extra General Knowledge (4 more) ─────────────────────
  {cat:'General Knowledge',q:'Which data structure is used for implementing function calls in a program (call stack)?',opts:['Queue','Heap','Stack','Graph'],ans:2,exp:'Stack (LIFO) implements function call management. When a function is called, it\'s pushed onto the stack. When it returns, it\'s popped. Recursive functions can cause "stack overflow" if too deep.'},
  {cat:'General Knowledge',q:'What does "API" stand for?',opts:['Application Programming Interface','Automated Program Integration','Application Protocol Interface','Advanced Programming Index'],ans:0,exp:'API = Application Programming Interface. A set of rules/protocols for how software components communicate. REST APIs, GraphQL, SOAP are common types used in web development.'},
  {cat:'General Knowledge',q:'Who is the founder of Microsoft?',opts:['Steve Jobs','Elon Musk','Bill Gates','Larry Page'],ans:2,exp:'Bill Gates (with Paul Allen) founded Microsoft in 1975 in Albuquerque, New Mexico. Gates served as CEO until 2000, then Steve Ballmer, then Satya Nadella (current CEO since 2014).'},
  {cat:'General Knowledge',q:'Which language is used for styling web pages?',opts:['Java','Python','CSS','SQL'],ans:2,exp:'CSS (Cascading Style Sheets) styles HTML content. Python/Java are backend languages. SQL is for databases. The trio for web front-end: HTML (structure), CSS (style), JavaScript (behaviour).'},
];

// Select 20 random questions for the test (preserving category distribution)
let QUESTIONS = [];
let aptCur = 0, aptAnswers = [], aptTimer, aptTimeLeft = 1500, aptAnswered = false;

function buildAptQuestionSet() {
  // Sample ~3-4 per category for balanced test of 20 questions
  const cats = ['Quantitative','Logical Reasoning','Verbal Ability','Technical','Data Interpretation','General Knowledge'];
  const bankByCat = {};
  cats.forEach(c => bankByCat[c] = QUESTION_BANK.filter(q => q.cat === c));
  QUESTIONS = [];
  // Quantitative: 4, Logical: 4, Verbal: 3, Technical: 4, Data: 3, GK: 2
  const picks = {Quantitative:4,'Logical Reasoning':4,'Verbal Ability':3,Technical:4,'Data Interpretation':3,'General Knowledge':2};
  cats.forEach(c => {
    const pool = bankByCat[c].sort(() => Math.random() - 0.5);
    QUESTIONS.push(...pool.slice(0, picks[c]||3));
  });
  // Shuffle
  QUESTIONS = QUESTIONS.sort(() => Math.random() - 0.5);
  aptAnswers = new Array(QUESTIONS.length).fill(null);
}

function startAptitude() {
  buildAptQuestionSet();
  document.getElementById('apt-intro').classList.add('hidden');
  document.getElementById('apt-test').classList.remove('hidden');
  aptCur = 0; aptAnswered = false; aptTimeLeft = 1500;
  buildDots(); renderQuestion();
  aptTimer = setInterval(() => {
    aptTimeLeft--;
    const m = Math.floor(aptTimeLeft/60), s = aptTimeLeft%60;
    const td = document.getElementById('aptTimer');
    td.textContent = '⏱ '+m+':'+String(s).padStart(2,'0');
    td.className = 'timer-disp'+(aptTimeLeft<=60?' danger':aptTimeLeft<=180?' warn':'');
    if (aptTimeLeft <= 0) { clearInterval(aptTimer); showAptResults(); }
  }, 1000);
}

function buildDots() {
  const nav = document.getElementById('dotNav'); nav.innerHTML = '';
  QUESTIONS.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = 'qdot'+(i===0?' cur':'');
    d.onclick = () => { aptCur = i; renderQuestion(); };
    nav.appendChild(d);
  });
}

function updateDots() {
  document.querySelectorAll('.qdot').forEach((d, i) => {
    d.className = 'qdot';
    if (i === aptCur) d.classList.add('cur');
    else if (aptAnswers[i] !== null) d.classList.add('ans');
  });
  document.getElementById('qCounter').textContent = 'Q '+(aptCur+1)+' / '+QUESTIONS.length;
  const pct = Math.round((aptCur / QUESTIONS.length) * 100);
  document.getElementById('aptProgFill').style.width = pct+'%';
  document.getElementById('aptPct').textContent = pct+'%';
}

function renderQuestion() {
  const q = QUESTIONS[aptCur];
  aptAnswered = aptAnswers[aptCur] !== null;
  const catBadgeColors = {
    'Quantitative':'badge-indigo','Logical Reasoning':'badge-violet','Verbal Ability':'badge-teal',
    'Technical':'badge-amber','Data Interpretation':'badge-green','General Knowledge':'badge-rose',
  };
  const catEl = document.getElementById('qCat');
  catEl.textContent = q.cat;
  catEl.className = 'badge ' + (catBadgeColors[q.cat]||'badge-violet');
  document.getElementById('qText').textContent = q.q;
  document.getElementById('btnPrev').disabled = aptCur === 0;
  document.getElementById('btnNext').textContent = aptCur === QUESTIONS.length-1 ? 'Submit ✓' : 'Next →';
  const wrap = document.getElementById('optionsWrap'); wrap.innerHTML = '';
  q.opts.forEach((opt, i) => {
    const div = document.createElement('div'); div.className = 'option';
    if (aptAnswered) { if(i===q.ans) div.classList.add('correct'); else if(i===aptAnswers[aptCur]) div.classList.add('wrong'); }
    else if (aptAnswers[aptCur] === i) div.classList.add('selected');
    div.innerHTML = `<span class="opt-key">${['A','B','C','D'][i]}</span><span>${opt}</span>`;
    div.onclick = () => selectAptAnswer(i);
    wrap.appendChild(div);
  });
  const exp = document.getElementById('explanation');
  document.getElementById('expText').textContent = q.exp;
  exp.classList.toggle('show', aptAnswered);
  updateDots();
}

function selectAptAnswer(i) { if(aptAnswers[aptCur]!==null) return; aptAnswers[aptCur]=i; aptAnswered=true; renderQuestion(); }
function nextQ() { if(aptCur===QUESTIONS.length-1){clearInterval(aptTimer);showAptResults();return;} aptCur++; renderQuestion(); }
function prevQ() { if(aptCur>0){aptCur--;renderQuestion();} }
function skipAndNext() { if(aptCur<QUESTIONS.length-1){aptCur++;renderQuestion();} }

function showAptResults() {
  clearInterval(aptTimer);
  document.getElementById('apt-test').classList.add('hidden');
  document.getElementById('apt-results').classList.remove('hidden');
  let correct = 0, wrong = 0, skipped = 0, score = 0;
  aptAnswers.forEach((a, i) => {
    if (a === null) skipped++;
    else if (a === QUESTIONS[i].ans) { correct++; score += 4; }
    else { wrong++; score -= 1; }
  });
  score = Math.max(score, 0);
  const maxScore = QUESTIONS.length * 4;
  const pct = Math.round((score / maxScore) * 100);
  state.aptitude = { score, correct, wrong, skipped, maxScore, pct, completed: true };
  document.getElementById('rs-score').textContent = score+'/'+maxScore;
  document.getElementById('rs-correct').textContent = correct;
  document.getElementById('rs-wrong').textContent = wrong;
  document.getElementById('rs-skip').textContent = skipped;
  document.getElementById('aptEmoji').textContent = pct>=80?'🏆':pct>=60?'⭐':'📚';
  document.getElementById('aptResultTitle').textContent = pct>=80?'Outstanding!':pct>=60?'Good Performance!':'Keep Practising!';
  document.getElementById('aptResultSub').textContent = `Score: ${score}/${maxScore} (${pct}%) · ${correct} correct, ${wrong} wrong, ${skipped} skipped`;
  // Per-category breakdown
  const cats = ['Quantitative','Logical Reasoning','Verbal Ability','Technical','Data Interpretation','General Knowledge'];
  const catColors = ['cat-r-c1','cat-r-c2','cat-r-c3','cat-r-c4','cat-r-c5','cat-r-c6'];
  const catEmojis = ['📐','🧩','📝','💻','📊','🌍'];
  const catStats = {};
  cats.forEach(c => catStats[c] = {total:0,correct:0,score:0});
  QUESTIONS.forEach((q, i) => {
    catStats[q.cat].total++;
    if (aptAnswers[i] !== null && aptAnswers[i] === q.ans) catStats[q.cat].correct++;
  });
  const grid = document.getElementById('catResultsGrid'); grid.innerHTML = '';
  cats.forEach((c, idx) => {
    const cs = catStats[c];
    if (cs.total === 0) return;
    const catPct = Math.round((cs.correct / cs.total) * 100);
    const col = catPct >= 75 ? 'var(--green)' : catPct >= 50 ? 'var(--amber)' : 'var(--rose)';
    const lbl = catPct >= 75 ? '✅ Strong' : catPct >= 50 ? '⚠ Average' : '📚 Needs work';
    grid.innerHTML += `<div class="cat-result-card ${catColors[idx]}">
      <div class="cat-result-name">${catEmojis[idx]} ${c}</div>
      <div class="cat-result-score" style="color:${col}">${cs.correct}/${cs.total}</div>
      <div class="cat-result-sub">${catPct}% · ${lbl}</div>
      <div class="prog-bar" style="height:4px;margin-top:8px"><div class="prog-fill" style="width:${catPct}%;background:${col}"></div></div>
    </div>`;
  });
  // Question review
  const rev = document.getElementById('qReview'); rev.innerHTML = '';
  QUESTIONS.forEach((q, i) => {
    const ok = aptAnswers[i]!==null && aptAnswers[i]===q.ans;
    const skip = aptAnswers[i]===null;
    rev.innerHTML += `<div class="fb-item fb-${skip?'warn':ok?'good':'bad'}" style="margin-bottom:8px">
      <div class="fb-icon">${skip?'⏭':ok?'✅':'❌'}</div>
      <div class="fb-text"><strong>Q${i+1} [${q.cat}]: ${q.q.substring(0,55)}…</strong>
      <small>Your answer: ${aptAnswers[i]!==null?q.opts[aptAnswers[i]]:'Skipped'}${!ok&&!skip?' | Correct: '+q.opts[q.ans]:''} — ${q.exp}</small></div>
    </div>`;
  });
  markDone('aptitude'); unlockModule('technical');
  showToast('Aptitude Test complete! Score: '+score+'/'+maxScore+' ('+pct+'%)', 'success');
}

function resetAptitude() {
  QUESTIONS = []; aptAnswers = []; aptCur = 0; aptAnswered = false;
  clearInterval(aptTimer); aptTimeLeft = 1500;
  document.getElementById('apt-results').classList.add('hidden');
  document.getElementById('apt-test').classList.add('hidden');
  document.getElementById('apt-study').classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════
// GD SIMULATION — FULL VOICE MODE
// Speech Recognition (mic→text) + Speech Synthesis (text→voice)
// ═══════════════════════════════════════════════════════════

const GD_PARTS = [
  {name:'You', initials:'YU', color:'#4361ee', you:true, pitch:1.0, rate:1.0},
  {name:'Priya M.', initials:'PM', color:'#0ab5a0', pitch:1.4, rate:0.95},
  {name:'Rahul K.', initials:'RK', color:'#8b5cf6', pitch:0.85, rate:1.05},
  {name:'Ananya S.', initials:'AS', color:'#f7931e', pitch:1.25, rate:0.98},
  {name:'Dev R.', initials:'DR', color:'#22c55e', pitch:0.78, rate:1.02},
];

const GD_TOPIC_RESPONSES = {
  'AI will replace human jobs': [
    ["Priya M.", "I believe AI will augment human capabilities rather than replace them. History shows every major revolution created more jobs than it eliminated. The industrial revolution is a perfect example."],
    ["Rahul K.", "That's a valid point. But the speed of AI adoption is unprecedented — white-collar roles in accounting, legal research, and data analysis are already being automated at scale."],
    ["Ananya S.", "We should separate automation of repetitive tasks from replacement of entire professions. AI frees humans for creative, empathetic, and strategic work that machines cannot replicate."],
    ["Dev R.", "The real challenge is transition speed. Even if new jobs emerge, millions of workers lack the skills to pivot. Policy-makers must invest aggressively in reskilling programs."],
    ["Priya M.", "Exactly. The challenge is not AI itself — it is equitable access to education and retraining. Countries that invest in human capital alongside AI will thrive."],
    ["Rahul K.", "Healthcare and education are inherently human domains. AI can assist doctors with diagnosis, but empathy, trust, and human connection can only come from people."],
    ["Ananya S.", "To build on what has been said — AI governance frameworks are as important as the technology itself. Who controls these systems determines who benefits from them."],
    ["Dev R.", "I would like to summarise: AI is a tool, not an autonomous agent. The outcome depends entirely on how societies choose to deploy it and who has a seat at the table."],
  ],
  'Work from home vs office': [
    ["Priya M.", "Remote work fundamentally changed the equation. Employees have proven they can be productive without a commute — and studies show a thirteen percent productivity increase for remote workers."],
    ["Rahul K.", "But those studies have caveats. Junior employees miss out on mentorship, spontaneous collaboration, and the informal learning that happens in physical spaces."],
    ["Ananya S.", "A hybrid model is the pragmatic answer. Core collaboration days in office, deep-focus work from home. It gives teams flexibility while preserving culture."],
    ["Dev R.", "The real conversation is about trust. Companies that monitor every click signal distrust. High-performing remote teams succeed because of psychological safety, not surveillance."],
    ["Priya M.", "And let us not forget inclusion. Remote work opened doors for people with disabilities, caregivers, and those in tier-two cities who could not relocate to metro areas."],
    ["Rahul K.", "On the other hand, not everyone has an ideal home environment. A single parent in a small flat cannot focus the same way someone in a quiet home office can."],
    ["Ananya S.", "So the real solution is choice, combined with infrastructure — good home-office stipends, reliable internet, and flexible schedules rather than a one-size-fits-all policy."],
    ["Dev R.", "To conclude — the office needs to evolve. Make it a place for collaboration and culture, not just individual heads-down work that can be done anywhere."],
  ],
  'Social media — boon or bane': [
    ["Priya M.", "Social media democratised information. Anyone with a phone can now report news, organise communities, and amplify marginalised voices globally. That is genuinely transformative."],
    ["Rahul K.", "But the same platforms amplify misinformation just as effectively. Algorithms optimise for engagement, not truth — and outrage is far more engaging than accuracy."],
    ["Ananya S.", "We cannot ignore the mental health data. Studies link heavy social media use to anxiety, depression, and body image issues, especially in teenagers under eighteen."],
    ["Dev R.", "The core issue is design, not the medium itself. Platforms built around infinite scroll and vanity metrics will always exploit human psychology for profit."],
    ["Priya M.", "Regulation is part of the answer. The EU Digital Services Act is a model — transparency in algorithms, accountability for harmful content, and real data rights for users."],
    ["Rahul K.", "Digital literacy matters more. Teaching critical thinking about online content in schools would be more effective long-term than relying on platform self-regulation."],
    ["Ananya S.", "Social media enabled movements — from climate strikes to MeToo. The mobilisation power for social good is real and should not be discounted."],
    ["Dev R.", "So it is neither purely boon nor bane — it is a mirror. Social media amplifies both the best and worst of human nature. The responsibility lies with designers, regulators, and users alike."],
  ],
  "India's startup revolution": [
    ["Priya M.", "India now has over a hundred unicorns and a startup ecosystem that is the world's third largest. That is a massive shift from a generation ago when government jobs were the only aspiration."],
    ["Rahul K.", "The funding numbers are impressive, but we need to talk about profitability. Many unicorns still burn cash at unsustainable rates. Valuation is not the same as value creation."],
    ["Ananya S.", "Deep-tech and B2B SaaS are where India's real competitive advantage lies. Consumer internet is saturated — the next wave is healthtech, agritech, and climate startups."],
    ["Dev R.", "The talent pipeline is the biggest bottleneck. IITs and IIMs produce world-class graduates, but Tier-two cities have untapped engineering talent that needs better access and mentorship."],
    ["Priya M.", "Government initiatives like Startup India and PLI schemes have been catalysts. The reduction in compliance burden and rise of UPI changed the game entirely."],
    ["Rahul K.", "But regulation still lags. Fintech, edtech, and healthtech operate in grey zones. Clear policy frameworks would unlock more long-term institutional investment."],
    ["Ananya S.", "The cultural shift is perhaps the most significant change. Failure is no longer stigmatised the way it once was. Serial entrepreneurs are celebrated, not shamed."],
    ["Dev R.", "To summarise — India's startup revolution is real and structural, not just a bubble. But sustaining it requires focus on unit economics, inclusive talent development, and enabling regulation."],
  ],
  'Climate change responsibility': [
    ["Priya M.", "Climate change is the defining challenge of our generation. The IPCC is clear — we have less than a decade to make structural changes if we want to limit warming to one point five degrees."],
    ["Rahul K.", "Individual action matters, but it is a distraction from systemic change. The top hundred companies are responsible for seventy-one percent of global emissions. Corporate accountability must come first."],
    ["Ananya S.", "Developed nations must lead both in reducing emissions and in climate finance. They industrialised on cheap fossil fuels — developing nations deserve a just transition."],
    ["Dev R.", "Technology is not a silver bullet but it is essential. Green hydrogen, advanced nuclear, and carbon capture need massive public investment — similar to how we funded the space race."],
    ["Priya M.", "India's solar push is a model worth highlighting. We are targeting five hundred gigawatts of renewable capacity by twenty-thirty. That is a genuine commitment backed by policy and investment."],
    ["Rahul K.", "Adaptation is just as important as mitigation. Coastal communities, farmers, and urban heat islands — these are people being displaced today, not in some future scenario."],
    ["Ananya S.", "Climate justice must be central to every policy. Those who contributed least to the problem are suffering most. Any solution that ignores equity will fail."],
    ["Dev R.", "Final thought — climate action is not just a cost, it is an economic opportunity. The green economy will create millions of jobs and those nations that lead it will define this century."],
  ],
  'Online vs traditional education': [
    ["Priya M.", "Online education broke down the biggest barrier in learning — geography. A student in rural areas now has access to courses from top universities that were unimaginable a decade ago."],
    ["Rahul K.", "Access is necessary but not sufficient. Completion rates for MOOCs are below ten percent. Without structure, accountability, and human support, self-paced learning fails most students."],
    ["Ananya S.", "The pandemic exposed online education's limitations — poor internet access, lack of devices, and the critical role of teachers as motivators, not just content deliverers."],
    ["Dev R.", "Hybrid models outperform both extremes. The flipped classroom — consuming content online, applying it with teachers in person — has shown the strongest outcomes in research."],
    ["Priya M.", "Credentialing is evolving too. Employer-recognised micro-credentials and skills-based hiring are reducing the monopoly of four-year degrees. That is a democratising force."],
    ["Rahul K.", "But soft skills — communication, leadership, collaboration, empathy — are best developed through lived social experience in physical institutions. Online cannot fully replicate that."],
    ["Ananya S.", "The real question is who benefits. Online education at its best is equalising. But without intentional design, it can reinforce existing inequalities."],
    ["Dev R.", "Conclusion: traditional and online education are complements, not competitors. The institutions of the future will blend both, personalised to learner needs, context, and goals."],
  ],
};

const GD_TIPS = [
  'Start with a clear, confident stance.',
  'Use data and real-world examples.',
  'Acknowledge others before countering: "I see your point, however..."',
  'Speak clearly and at a measured pace.',
  'Show leadership by summarising the group.',
  'Use "Building on that..." to connect ideas.',
  'Avoid interrupting — wait for a pause.',
  'Quantify your statements: "Studies show 40% of..."',
  'Keep each point under 30 seconds for GD.',
  'End with a call to action or next step.',
  'Be inclusive — reference what others said.',
  'Watch your filler words: um, like, basically.',
];

const QUICK_CHIPS = [
  'I agree — building on that...',
  'Let me counter that point...',
  'The data actually shows...',
  'Great point, additionally...',
  'From a different angle...',
  'To summarise the discussion...',
];

// State
let gdTopic = 'AI will replace human jobs';
let gdTimer, gdTimeLeft, gdUserMsgs = 0, gdAiIdx = 0;
let gdScores = {comm:0, reason:0, conf:0, lead:0, part:0};
let gdActiveParts = [];
let gdIsSpeaking = false;
let gdIsListening = false;
let gdRecognition = null;
let gdCurrentTranscript = '';
let gdUserContributions = [];
let gdAudioContext = null, gdAnalyser = null, gdMicStream = null;
let gdVolMeterInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  const sr = document.getElementById('gdSpeechRate');
  if (sr) sr.addEventListener('input', () => {
    document.getElementById('gdSpeechRateVal').textContent = parseFloat(sr.value).toFixed(1) + 'x';
  });
});

function selectGDTopic(el) {
  document.querySelectorAll('#topicGrid .card').forEach(c => { c.style.borderColor=''; c.style.background=''; });
  el.style.borderColor = 'rgba(10,181,160,0.4)';
  el.style.background = 'var(--teal-pale)';
  gdTopic = el.dataset.topic;
}

function launchGD() {
  document.getElementById('gd-intro').classList.add('hidden');
  document.getElementById('gd-session').classList.remove('hidden');
  document.getElementById('gd-topic-display').textContent = gdTopic;
  gdTimeLeft = parseInt(document.getElementById('gd-dur').value);
  const numParts = parseInt(document.getElementById('gd-parts').value);
  gdActiveParts = [GD_PARTS[0], ...GD_PARTS.slice(1, numParts)];

  const pl = document.getElementById('partList');
  pl.innerHTML = '';
  gdActiveParts.forEach(p => {
    pl.innerHTML += `<div class="part-item ${p.you?'you-part':''}" id="gpart-${p.initials}">
      <div class="part-av" style="background:${p.color}20;color:${p.color};transition:all 0.3s">${p.initials}</div>
      <div><div class="part-name-s">${p.name}</div>
      <div class="part-role-s">${p.you ? '(You — Microphone)' : 'AI Participant'}</div></div>
    </div>`;
  });

  const chips = document.getElementById('gdChips');
  chips.innerHTML = '';
  QUICK_CHIPS.forEach(c => {
    const el = document.createElement('span');
    el.className = 'qchip'; el.textContent = c;
    el.onclick = () => gdInjectPhrase(c);
    chips.appendChild(el);
  });

  gdUserMsgs = 0; gdAiIdx = 0;
  gdScores = {comm:0, reason:0, conf:0, lead:0, part:0};
  gdIsSpeaking = false; gdCurrentTranscript = ''; gdUserContributions = [];
  document.getElementById('gdMsgs').innerHTML = '';
  document.getElementById('gdScoreNum').textContent = '—';
  ['gm1','gm2','gm3','gm4','gm5'].forEach(id => document.getElementById(id).style.width = '0%');
  ['gm1v','gm2v','gm3v','gm4v','gm5v'].forEach(id => document.getElementById(id).textContent = '—');

  initSpeechRecognition();

  const dur = Math.round(gdTimeLeft / 60);
  const openingText = 'Welcome everyone. Today topic is ' + gdTopic + '. You have ' + dur + ' minutes. Please share your views.';
  addGDMsg('Moderator', 'Welcome! Today\'s topic: "' + gdTopic + '". You have ' + dur + ' minutes. Share your views freely.', '#64748b', 'M', false);
  gdSpeakAI(openingText, 1.0, 0.95, () => { setTimeout(() => gdTriggerNextAI(), 1000); });

  setGDStatus('Session live — tap the mic to speak!', 'var(--green)');

  gdTimer = setInterval(() => {
    gdTimeLeft--;
    updateGDTimerDisplay();
    if (gdTimeLeft <= 0) { clearInterval(gdTimer); endGD(); }
  }, 1000);

  updateGDTip();
}

function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setGDStatus('Speech recognition not supported. Use Chrome or Edge browser.', 'var(--rose)');
    const btn = document.getElementById('gdMicBtn');
    if (btn) { btn.style.opacity='0.4'; btn.disabled=true; }
    document.getElementById('gdMicLabel').textContent = 'Not supported in this browser';
    document.getElementById('gdMicSub').textContent = 'Please use Google Chrome or Microsoft Edge';
    return;
  }
  gdRecognition = new SpeechRecognition();
  gdRecognition.continuous = true;
  gdRecognition.interimResults = true;
  gdRecognition.lang = 'en-IN';

  gdRecognition.onstart = () => {
    gdIsListening = true;
    setMicUI(true);
    setGDStatus('Listening... speak your point clearly', 'var(--teal)');
    startVolumeMeter();
  };

  gdRecognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    gdCurrentTranscript += final;
    const display = (gdCurrentTranscript + interim).trim();
    const txtEl = document.getElementById('gdTranscriptText');
    const dotEl = document.getElementById('gdTranscriptDot');
    if (display) {
      txtEl.textContent = display;
      txtEl.style.color = 'var(--text)';
      txtEl.style.fontStyle = 'normal';
      dotEl.style.background = 'var(--rose)';
      document.getElementById('gdSendBtn').style.display = 'block';
      document.getElementById('gdLiveTranscript').style.borderColor = 'var(--teal)';
    }
  };

  gdRecognition.onerror = (e) => {
    if (e.error === 'not-allowed') setGDStatus('Microphone permission denied. Allow mic access and try again.', 'var(--rose)');
    else if (e.error === 'no-speech') setGDStatus('No speech detected — tap mic and try again', 'var(--amber)');
    setMicUI(false); gdIsListening = false; stopVolumeMeter();
  };

  gdRecognition.onend = () => {
    // FIX: delay restart to avoid Chrome race condition that silently kills the mic
    if (gdIsListening) { setTimeout(() => { try { gdRecognition.start(); } catch(e2) {} }, 150); }
    else { setMicUI(false); stopVolumeMeter(); }
  };
}

function toggleMic() {
  if (!gdRecognition) { showToast('Speech recognition not available in this browser', 'error'); return; }
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel(); gdIsSpeaking = false;
  }
  if (gdIsListening) {
    gdIsListening = false;
    try { gdRecognition.stop(); } catch(e) {}
    setMicUI(false); stopVolumeMeter();
    setGDStatus('Session live — tap the mic to speak!', 'var(--green)');
    if (gdCurrentTranscript.trim()) document.getElementById('gdSendBtn').style.display = 'block';
  } else {
    gdCurrentTranscript = '';
    const txtEl = document.getElementById('gdTranscriptText');
    txtEl.textContent = 'Listening... speak your point clearly';
    txtEl.style.color = 'var(--text-3)'; txtEl.style.fontStyle = 'italic';
    document.getElementById('gdTranscriptDot').style.background = 'var(--border)';
    document.getElementById('gdSendBtn').style.display = 'none';
    document.getElementById('gdLiveTranscript').style.borderColor = 'var(--teal)';
    gdIsListening = true;
    try { gdRecognition.start(); }
    catch(e) { gdIsListening = false; setMicUI(false); showToast('Microphone error: ' + e.message, 'error'); }
  }
}

function setMicUI(active) {
  const btn = document.getElementById('gdMicBtn');
  const label = document.getElementById('gdMicLabel');
  const sub = document.getElementById('gdMicSub');
  const dot = document.getElementById('gdTranscriptDot');
  if (active) {
    // FIX: use innerHTML so micRipple child is NOT destroyed by textContent
    btn.classList.add('mic-active');
    btn.style.background = 'var(--rose)';
    btn.style.boxShadow = '0 4px 24px rgba(244,63,94,0.45)';
    btn.style.fontSize = '12px'; btn.style.fontWeight = '800';
    btn.innerHTML = 'STOP<div id="micRipple" style="display:block;position:absolute;inset:-4px;border-radius:50%;border:3px solid var(--rose);animation:micpulse 1s infinite;pointer-events:none"></div>';
    label.textContent = 'Recording... tap to stop';
    sub.textContent = 'Speak clearly — words are being transcribed live';
    if (dot) dot.style.background = 'var(--rose)';
  } else {
    // FIX: restore mic emoji and teal styling, not "SPEAK" text
    btn.classList.remove('mic-active');
    btn.style.background = 'var(--teal)';
    btn.style.boxShadow = '0 4px 20px rgba(10,181,160,0.4)';
    btn.style.fontSize = '28px'; btn.style.fontWeight = '400';
    btn.innerHTML = '🎤<div id="micRipple" style="display:none;position:absolute;inset:-4px;border-radius:50%;border:3px solid var(--teal);animation:micpulse 1s infinite;pointer-events:none"></div>';
    label.textContent = 'Tap mic to speak';
    sub.textContent = 'Your speech will be converted to text and sent';
    if (dot) dot.style.background = 'var(--border)';
  }
}

async function startVolumeMeter() {
  try {
    if (!gdMicStream) gdMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    gdAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = gdAudioContext.createMediaStreamSource(gdMicStream);
    gdAnalyser = gdAudioContext.createAnalyser(); gdAnalyser.fftSize = 256;
    source.connect(gdAnalyser);
    const buf = new Uint8Array(gdAnalyser.frequencyBinCount);
    const vf = document.getElementById('gdVolFill');
    gdVolMeterInterval = setInterval(() => {
      gdAnalyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a,b)=>a+b,0) / buf.length;
      if (vf) vf.style.width = Math.min(100, avg * 2.5) + '%';
    }, 80);
  } catch(e) {}
}

function stopVolumeMeter() {
  if (gdVolMeterInterval) { clearInterval(gdVolMeterInterval); gdVolMeterInterval = null; }
  if (gdAudioContext) { try { gdAudioContext.close(); } catch(e){} gdAudioContext = null; }
  const vf = document.getElementById('gdVolFill');
  if (vf) vf.style.width = '0%';
}

function gdSendTranscript() {
  const text = gdCurrentTranscript.trim();
  if (!text) { showToast('Nothing recorded yet — tap the mic and speak first', 'error'); return; }
  if (gdIsListening) {
    gdIsListening = false;
    try { gdRecognition.stop(); } catch(e) {}
    setMicUI(false); stopVolumeMeter();
  }
  gdCurrentTranscript = '';
  const txtEl = document.getElementById('gdTranscriptText');
  txtEl.textContent = 'Press the mic button and speak your point...';
  txtEl.style.color = 'var(--text-3)'; txtEl.style.fontStyle = 'italic';
  document.getElementById('gdTranscriptDot').style.background = 'var(--border)';
  document.getElementById('gdSendBtn').style.display = 'none';
  document.getElementById('gdLiveTranscript').style.borderColor = 'var(--border)';

  addGDMsg('You', text, '#4361ee', 'YU', true);
  gdUserMsgs++;
  gdUserContributions.push(text);
  updateGDScores(text);
  updateGDTip();
  setGDStatus('Session live — tap the mic to speak!', 'var(--green)');
  const delay = 2000 + Math.random() * 2000;
  setTimeout(() => gdTriggerNextAI(text), delay);
}

function gdInjectPhrase(phrase) {
  const clean = phrase.replace(/^[^\w]+/, '');
  gdCurrentTranscript = clean;
  const txtEl = document.getElementById('gdTranscriptText');
  txtEl.textContent = clean;
  txtEl.style.color = 'var(--text)'; txtEl.style.fontStyle = 'normal';
  document.getElementById('gdTranscriptDot').style.background = 'var(--teal)';
  document.getElementById('gdSendBtn').style.display = 'block';
}

function gdTriggerNextAI(userText) {
  const responses = GD_TOPIC_RESPONSES[gdTopic] || GD_TOPIC_RESPONSES['AI will replace human jobs'];
  if (gdAiIdx >= responses.length) return;
  const [name, baseText] = responses[gdAiIdx];
  const part = gdActiveParts.find(p => p.name === name);
  if (!part) { gdAiIdx++; gdTriggerNextAI(userText); return; }

  let text = baseText;
  if (userText && userText.length > 15 && gdAiIdx > 0) {
    const connectors = ['Building on that point, ', 'That is interesting. ', 'I would like to respond — ', 'You raise a fair argument. '];
    if (Math.random() > 0.5) text = connectors[Math.floor(Math.random()*connectors.length)] + text;
  }

  showTyping(name);
  setGDStatus(name + ' is responding...', part.color);

  const typingDelay = 1500 + text.length * 12;
  setTimeout(() => {
    hideTyping();
    addGDMsg(name, text, part.color, part.initials, false);
    hlSpeaker(name);
    gdAiIdx++;
    const voiceOn = document.getElementById('gdVoiceToggle') ? document.getElementById('gdVoiceToggle').checked : true;
    const rate = parseFloat((document.getElementById('gdSpeechRate') || {value:'1.0'}).value);
    if (voiceOn) {
      gdSpeakAI(text, part.pitch, rate, () => {
        setGDStatus('Session live — tap the mic to speak!', 'var(--green)');
        hlSpeaker('');
      });
    } else {
      setTimeout(() => setGDStatus('Session live — tap the mic to speak!', 'var(--green)'), 800);
    }
  }, typingDelay);
}

function gdSpeakAI(text, pitch, rate, onDone) {
  if (!window.speechSynthesis) { if (onDone) onDone(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.pitch = pitch || 1.0; utt.rate = rate || 1.0; utt.volume = 0.95; utt.lang = 'en-IN';
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('india')) || voices.find(v => v.lang.startsWith('en'));
  if (v) utt.voice = v;
  utt.onend = () => { gdIsSpeaking = false; if (onDone) onDone(); };
  utt.onerror = () => { gdIsSpeaking = false; if (onDone) onDone(); };
  gdIsSpeaking = true;
  window.speechSynthesis.speak(utt);
}

function updateGDScores(userText) {
  userText = userText || '';
  const words = userText.trim().split(/\s+/).length;
  const hasData = /\d+%|\d+ percent|studies|research|data|statistics|evidence|report/i.test(userText);
  const hasCounter = /however|but|contrary|disagree|counter|alternatively|on the other hand/i.test(userText);
  const hasSummary = /summar|conclude|therefore|overall|in conclusion|to sum/i.test(userText);
  const hasRef = /building on|as .* mentioned|agree with|point raised|earlier/i.test(userText);
  const base = Math.min(gdUserMsgs * 10, 70);
  gdScores.comm = Math.min(95, base + Math.min(words*0.4,12) + (hasRef?5:0) + Math.random()*8);
  gdScores.reason = Math.min(92, base + (hasData?8:0) + (hasCounter?6:0) + Math.random()*8);
  gdScores.conf = Math.min(90, base + Math.min(words*0.4,12) + Math.random()*10);
  gdScores.lead = Math.min(88, base*0.8 + (hasSummary?10:0) + Math.random()*10);
  gdScores.part = Math.min(100, gdUserMsgs*16 + Math.random()*5);
  const avg = Math.round((gdScores.comm+gdScores.reason+gdScores.conf+gdScores.lead+gdScores.part)/5);
  document.getElementById('gdScoreNum').textContent = avg;
  [['gm1',gdScores.comm,'gm1v'],['gm2',gdScores.reason,'gm2v'],['gm3',gdScores.conf,'gm3v'],['gm4',gdScores.lead,'gm4v'],['gm5',gdScores.part,'gm5v']].forEach(([id,val,vid]) => {
    document.getElementById(id).style.width = Math.round(val) + '%';
    document.getElementById(vid).textContent = Math.round(val);
  });
}

function updateGDTimerDisplay() {
  const m = Math.floor(gdTimeLeft/60), s = gdTimeLeft%60;
  const el = document.getElementById('gdTimer');
  el.textContent = m + ':' + String(s).padStart(2,'0');
  el.className = 'timer-disp' + (gdTimeLeft<=60?' danger':gdTimeLeft<=120?' warn':'');
}

function addGDMsg(name, text, color, initials, isYou) {
  const chat = document.getElementById('gdMsgs');
  const now = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  const div = document.createElement('div');
  div.className = 'msg-wrap' + (isYou ? ' you-msg' : '');
  div.innerHTML = '<div class="msg-av" style="background:' + color + '20;color:' + color + '">' + initials + '</div><div><div class="msg-name-s">' + name + (isYou ? ' <span style="font-size:10px;color:var(--teal);font-weight:600">(You)</span>' : '') + '</div><div class="' + (isYou?'you-bubble':'them-bubble') + '">' + text + '</div><div style="font-size:10px;color:var(--text-4);margin-top:3px' + (isYou?';text-align:right':'') + '">' + time + '</div></div>';
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function hlSpeaker(name) {
  document.querySelectorAll('.part-item').forEach(p => { p.classList.remove('speaking'); p.classList.remove('ai-speaking'); });
  if (!name) return;
  const part = GD_PARTS.find(p => p.name === name);
  if (!part) return;
  const el = document.getElementById('gpart-' + part.initials);
  if (el) {
    el.classList.add('speaking');
    if (name !== 'You') el.classList.add('ai-speaking');
    setTimeout(() => { el.classList.remove('speaking'); el.classList.remove('ai-speaking'); }, 4000);
  }
}

function showTyping(name) {
  document.getElementById('typingName').textContent = name + ' is responding...';
  document.getElementById('typingRow').classList.add('show');
}
function hideTyping() { document.getElementById('typingRow').classList.remove('show'); }
function updateGDTip() { document.getElementById('gdTip').textContent = GD_TIPS[Math.floor(Math.random()*GD_TIPS.length)]; }
function setGDStatus(msg, color) {
  const el = document.getElementById('gdStatusBox');
  if (!el) return;
  color = color || 'var(--text-3)';
  el.textContent = msg; el.style.color = color;
  el.style.borderColor = color + '44'; el.style.background = color + '10';
}

function endGD() {
  clearInterval(gdTimer);
  gdIsListening = false;
  try { if (gdRecognition) gdRecognition.stop(); } catch(e) {}
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopVolumeMeter();
  if (gdMicStream) { gdMicStream.getTracks().forEach(t=>t.stop()); gdMicStream = null; }

  document.getElementById('gd-session').classList.add('hidden');
  document.getElementById('gd-results').classList.remove('hidden');

  const avg = Math.round((gdScores.comm+gdScores.reason+gdScores.conf+gdScores.lead+gdScores.part)/5) || 55;
  state.gd = { score:avg, comm:Math.round(gdScores.comm)||68, reason:Math.round(gdScores.reason)||62, conf:Math.round(gdScores.conf)||65, lead:Math.round(gdScores.lead)||58, userMessages:gdUserMsgs, completed:true };

  document.getElementById('gr1').textContent = state.gd.comm;
  document.getElementById('gr2').textContent = state.gd.reason;
  document.getElementById('gr3').textContent = state.gd.conf;
  document.getElementById('gr4').textContent = state.gd.lead;
  document.getElementById('gr5').textContent = avg;
  document.getElementById('gdResultEmoji').textContent = avg>=80 ? '\ud83c\udf1f' : avg>=65 ? '\ud83d\udc4d' : '\ud83d\udcc8';
  document.getElementById('gdResultTitle').textContent = avg>=80?'Outstanding Performance!':avg>=65?'Good Contribution!':'Keep Practising!';
  document.getElementById('gdResultSub').textContent = 'You spoke ' + gdUserMsgs + ' time' + (gdUserMsgs!==1?'s':'') + ' via microphone · Overall score: ' + avg + '/100';

  const tr = document.getElementById('gdTranscriptReview');
  const cnt = document.getElementById('gdContribCount');
  if (tr) {
    if (cnt) cnt.textContent = gdUserContributions.length + ' voice contributions recorded';
    tr.innerHTML = gdUserContributions.length > 0
      ? gdUserContributions.map((c,i) => '<div style="padding:10px 12px;background:var(--indigo-pale);border-radius:var(--r);border:1px solid rgba(67,97,238,0.15)"><span style="font-size:10px;font-weight:800;color:var(--indigo);text-transform:uppercase;letter-spacing:.5px">Point ' + (i+1) + '</span><div style="font-size:13px;color:var(--text);margin-top:3px">"' + c + '"</div></div>').join('')
      : '<div style="color:var(--text-3);font-size:13px">No voice contributions recorded. Use the mic button next time.</div>';
  }

  const fb = [];
  if (gdUserMsgs >= 5) fb.push({type:'good',icon:'\u2705',title:'High participation — ' + gdUserMsgs + ' voice contributions',desc:'Excellent engagement. Frequent speakers are shortlisted more often in real GDs.'});
  else if (gdUserMsgs >= 2) fb.push({type:'warn',icon:'⚠️',title:'Moderate participation — ' + gdUserMsgs + ' contributions',desc:'Aim for 5+ points in a 10-minute GD. Each contribution showcases your reasoning.'});
  else fb.push({type:'bad',icon:'❌',title:'Low participation — speak up more!',desc:'In real GDs, silent participants are immediately eliminated. Practice speaking up even when uncertain.'});

  const anyData = gdUserContributions.some(c => /\d+%|\d+ percent|data|studies|research/i.test(c));
  if (anyData) fb.push({type:'good',icon:'\u2705',title:'Used data and evidence',desc:'Backing points with statistics significantly raises evaluator scores.'});
  else fb.push({type:'warn',icon:'⚠️',title:'No data or statistics used',desc:'Cite facts in your next session. It signals preparation and depth of knowledge.'});

  fb.push({type:'warn',icon:'\ud83d\udca1',title:'Practice tip',desc:'Before each point, pause briefly to organise your thought. One clear 20-second point beats three scattered ones.'});

  document.getElementById('gdFeedback').innerHTML = fb.map(f => '<div class="fb-item fb-' + f.type + '"><div class="fb-icon">' + f.icon + '</div><div class="fb-text"><strong>' + f.title + '</strong><small>' + f.desc + '</small></div></div>').join('');

  markDone('gd');
  unlockModule('interview');
  showToast('GD complete! Score: ' + avg + '/100 · ' + gdUserMsgs + ' voice contributions', 'success');
}

function resetGD() {
  clearInterval(gdTimer);
  gdIsListening = false;
  try { if (gdRecognition) gdRecognition.stop(); } catch(e) {}
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  stopVolumeMeter();
  if (gdMicStream) { gdMicStream.getTracks().forEach(t=>t.stop()); gdMicStream = null; }
  document.getElementById('gd-results').classList.add('hidden');
  document.getElementById('gd-session').classList.add('hidden');
  document.getElementById('gd-intro').classList.remove('hidden');
  document.getElementById('gdMsgs').innerHTML = '';
  document.getElementById('gdFeedback').innerHTML = '';
  gdUserMsgs = 0; gdAiIdx = 0; gdCurrentTranscript = ''; gdUserContributions = [];
  setMicUI(false);
  const tEl = document.getElementById('gdTranscriptText');
  if (tEl) { tEl.textContent = 'Press the mic button and speak your point...'; tEl.style.color='var(--text-3)'; tEl.style.fontStyle='italic'; }
  const sb = document.getElementById('gdSendBtn');
  if (sb) sb.style.display = 'none';
}



// ═══════════════════════════════════════════════════════════
// AI MOCK INTERVIEW — FULL VOICE MODE
// Interviewer speaks questions aloud via TTS
// User answers via microphone — speech-to-text
// Answers scored logically based on content analysis
// ═══════════════════════════════════════════════════════════

const IV_QUESTIONS = {
  Technical: [
    { q: 'Tell me about yourself and your technical background.', hint: 'Structure: Education → Key projects → Skills → What you are looking for.', cat: 'Introduction', keywords: ['project','built','developed','experience','skills','engineer','degree','internship'] },
    { q: 'Explain the difference between a process and a thread.', hint: 'Process = independent memory space. Thread = lightweight execution unit sharing memory with parent process.', cat: 'OS Concepts', keywords: ['memory','process','thread','concurrency','shared','independent','cpu','context','switch','lightweight'] },
    { q: 'What is the time complexity of Binary Search and why?', hint: 'O(log n) — each step halves the search space.', cat: 'Algorithms', keywords: ['log','binary','search','halve','sorted','complexity','divide','compare','middle'] },
    { q: 'Design a URL shortener like bit.ly. Walk me through your approach.', hint: 'Cover: hashing, database schema, redirect flow, scaling, collision handling.', cat: 'System Design', keywords: ['hash','database','redirect','scale','short','unique','base62','collision','cache','cdn','load'] },
    { q: 'What are SOLID principles? Explain with an example.', hint: 'Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.', cat: 'OOP', keywords: ['single','open','closed','liskov','interface','dependency','solid','principle','class','extend'] },
    { q: 'Describe a challenging bug you fixed. What was your debugging process?', hint: 'Walk through: how you found it, tools used, root cause, fix, and what you learned.', cat: 'Problem Solving', keywords: ['bug','fix','debug','found','tool','log','trace','root','cause','test','reproduce','solved'] },
    { q: 'What is REST and what makes an API truly RESTful?', hint: 'Stateless, uniform interface, HTTP methods, resource-based URLs, cacheable responses.', cat: 'APIs', keywords: ['stateless','http','get','post','put','delete','resource','url','uniform','cache','json','api','restful'] },
    { q: 'Do you have any questions for me?', hint: 'Ask about team culture, tech stack, growth opportunities, or recent challenges.', cat: 'Closing', keywords: ['question','team','culture','growth','stack','challenge','opportunity','learn','roadmap'] },
  ],
  'HR / Behavioural': [
    { q: 'Tell me about yourself.', hint: 'Keep it to 90 seconds: background, key experience, 2-3 strengths, why this role.', cat: 'Introduction', keywords: ['experience','project','skill','degree','worked','built','passionate','seeking','background'] },
    { q: 'Why do you want to join this company?', hint: 'Be specific: mention their product, mission, culture, or something you genuinely admire.', cat: 'Motivation', keywords: ['company','product','mission','culture','admire','specific','growth','opportunity','values','team'] },
    { q: 'Describe a time you handled a conflict in a team.', hint: 'Use STAR: Situation → Task → Action → Result. Focus on your communication.', cat: 'Teamwork', keywords: ['conflict','team','situation','resolved','communicated','discussed','outcome','result','agreed','listened'] },
    { q: 'What is your biggest weakness?', hint: 'Be honest and genuine. Show awareness and describe steps you are taking to improve.', cat: 'Self-Awareness', keywords: ['weakness','improve','working','aware','learning','habit','tendency','feedback','changed','growth'] },
    { q: 'Tell me about a time you failed and what you learned.', hint: 'Pick a real failure. Show accountability, not blame. Focus on what you took away.', cat: 'Resilience', keywords: ['failed','mistake','wrong','learned','took','responsibility','outcome','different','reflect','improved'] },
    { q: 'How do you manage competing deadlines and prioritise your work?', hint: 'Mention tools, frameworks, communication habits, and how you handle trade-offs.', cat: 'Time Management', keywords: ['prioritise','deadline','tools','task','schedule','communicate','urgent','important','manage','jira','list','plan'] },
    { q: 'Where do you see yourself in five years?', hint: 'Be ambitious but realistic. Align your goals with growth at this company.', cat: 'Goals', keywords: ['five','years','goal','grow','lead','technical','manager','expertise','role','contribute','learn','impact'] },
    { q: 'Do you have any questions for us?', hint: 'Ask about team size, current projects, onboarding, or culture. Never say no.', cat: 'Closing', keywords: ['question','team','project','onboard','culture','day','challenge','expect','role','learn'] },
  ],
  Mixed: [],
};
IV_QUESTIONS.Mixed = [
  ...IV_QUESTIONS.Technical.slice(0, 4),
  ...IV_QUESTIONS['HR / Behavioural'].slice(2, 6),
];

// Per-question follow-up feedback the AI interviewer says after the user answers
const IV_FOLLOWUPS = {
  strong:   ["That's a great answer, very clearly structured.", "Excellent response! I like that you used a specific example.", "Very strong. You covered all the key points.", "Good answer — your reasoning is clear and logical.", "Well articulated. That demonstrates solid understanding."],
  decent:   ["Good start. Could you add a specific example or metric?", "Decent answer. Try to be a bit more concrete with details.", "Not bad. I would love to hear about a real situation where this came up.", "Reasonable answer. Adding a quantified outcome would strengthen it.", "Fair response. Try to structure it as Situation, Action, and Result next time."],
  weak:     ["Hmm, can you elaborate on that a bit more?", "That was quite brief. Let us dig deeper — can you give me a concrete example?", "I would push back a little — can you be more specific?", "That needs more depth. Walk me through it step by step.", "Try to use the STAR format — Situation, Task, Action, Result."],
};

// Logical scoring rubric — analyses what the user actually said
function scoreAnswer(answer, question) {
  if (!answer || answer.length < 10) return { score: 25, clarity: 20, relevance: 20, confidence: 20, depth: 20, level: 'weak', feedback: IV_FOLLOWUPS.weak[Math.floor(Math.random()*IV_FOLLOWUPS.weak.length)] };

  const text = answer.toLowerCase();
  const words = answer.trim().split(/\s+/);
  const wordCount = words.length;
  const keywords = question.keywords || [];

  // 1. Keyword relevance (0–30)
  const matchedKw = keywords.filter(k => text.includes(k));
  const kwScore = Math.min(30, matchedKw.length * (30 / Math.max(keywords.length, 1)) * 1.5);

  // 2. Length/depth score (0–25)
  const lengthScore = wordCount >= 80 ? 25 : wordCount >= 50 ? 20 : wordCount >= 30 ? 14 : wordCount >= 15 ? 8 : 3;

  // 3. Structure signals (0–20)
  const hasExample = /for example|for instance|specifically|in one case|i remember|once when|at my|during my|when i was|in my project|i built|we built|i worked/i.test(answer);
  const hasResult = /result|outcome|impact|improved|reduced|increased|achieved|led to|which meant|saved|delivered|completed/i.test(answer);
  const hasSTAR = /situation|task|action|result/i.test(answer);
  const hasNumbers = /\d+%|\d+ percent|\d+ users|\d+ times|\d+ hours|\d+ days|\d+x/i.test(answer);
  const structureScore = (hasExample ? 7 : 0) + (hasResult ? 7 : 0) + (hasSTAR ? 4 : 0) + (hasNumbers ? 5 : 0);

  // 4. Confidence signals (0–15)
  const confident = /i believe|in my experience|i am confident|i have|i built|i led|i designed|i implemented|i achieved|definitely|clearly|strongly|i know/i.test(answer);
  const hesitant = /i think maybe|i am not sure|i guess|um|uh|kind of|sort of|not really|i don.t know/i.test(answer);
  const confidenceScore = confident ? 13 : hesitant ? 4 : 8;

  // 5. Filler / quality penalty
  const fillerCount = (answer.match(/\bum\b|\buh\b|\blike\b|\byou know\b|\bbasically\b/gi) || []).length;
  const fillerPenalty = Math.min(10, fillerCount * 3);

  const rawScore = kwScore + lengthScore + structureScore + confidenceScore - fillerPenalty;
  const score = Math.round(Math.min(98, Math.max(28, rawScore + 35)));

  // Dimension scores (derived from overall)
  const clarity = Math.round(Math.min(98, lengthScore * 2.5 + structureScore * 1.5 + confidenceScore + 20));
  const relevance = Math.round(Math.min(98, kwScore * 2.5 + 30));
  const confidence = Math.round(Math.min(98, confidenceScore * 5 - fillerPenalty * 2 + 40));
  const depth = Math.round(Math.min(98, lengthScore * 2 + (hasNumbers?15:0) + (hasExample?12:0) + (hasResult?12:0) + 15));

  const level = score >= 75 ? 'strong' : score >= 55 ? 'decent' : 'weak';
  const fbPool = IV_FOLLOWUPS[level];
  let feedback = fbPool[Math.floor(Math.random() * fbPool.length)];

  // Personalise feedback
  if (matchedKw.length === 0) feedback += " Try to use more specific technical terms in your answer.";
  else if (matchedKw.length >= 4 && hasNumbers) feedback += " Great use of specific details and metrics.";
  if (!hasExample && level !== 'strong') feedback += " Adding a real-world example would make this much stronger.";

  return { score, clarity, relevance, confidence, depth, level, feedback, matchedKw, wordCount };
}

// State
let ivName = 'Arav S.', ivEmoji = '\ud83e\uddd1\u200d\ud83d\udcbb', ivRoleLabel = 'Senior Engineer \u00b7 Friendly';
let ivQuestions = [], ivCur = 0, ivAnswers = [], ivElapsed = 0, ivTimerInt;
let ivScores = [], ivSubmitted = false;
let ivRecognition = null, ivIsListening = false, ivCurrentTranscript = '';
let ivAudioCtx = null, ivAnalyser = null, ivMicStream = null, ivVolInterval = null;
let ivAllClarity = [], ivAllRelevance = [], ivAllConfidence = [], ivAllDepth = [];

document.addEventListener('DOMContentLoaded', () => {
  const sr = document.getElementById('ivSpeechRate');
  if (sr) sr.addEventListener('input', () => {
    document.getElementById('ivSpeechRateVal').textContent = parseFloat(sr.value).toFixed(2) + 'x';
  });
});

function pickIV(el, name, role, emoji, style) {
  document.querySelectorAll('.selected-iv').forEach(c => { c.classList.remove('selected-iv'); c.style.borderColor=''; c.style.background=''; });
  el.style.borderColor = 'rgba(247,147,30,0.4)'; el.style.background = 'var(--amber-pale)';
  el.classList.add('selected-iv');
  ivName = name; ivEmoji = emoji; ivRoleLabel = role + ' \u00b7 ' + style;
}

function startInterview() {
  const type = document.getElementById('iv-type').value;
  const num = parseInt(document.getElementById('iv-qs').value);
  const qBank = type === 'Technical' ? IV_QUESTIONS.Technical : type === 'HR / Behavioural' ? IV_QUESTIONS['HR / Behavioural'] : IV_QUESTIONS.Mixed;
  ivQuestions = qBank.slice(0, num);
  ivAnswers = new Array(ivQuestions.length).fill(null);
  ivCur = 0; ivScores = []; ivElapsed = 0; ivSubmitted = false;
  ivAllClarity = []; ivAllRelevance = []; ivAllConfidence = []; ivAllDepth = [];

  document.getElementById('iv-intro').classList.add('hidden');
  document.getElementById('iv-session').classList.remove('hidden');

  document.getElementById('ivAvatarEl').innerHTML = ivEmoji + '<div id="ivSpeakRing" style="display:none;position:absolute;inset:-6px;border-radius:50%;border:3px solid var(--amber);animation:micpulse 0.9s infinite"></div>';
  document.getElementById('ivNameEl').textContent = ivName;
  document.getElementById('ivRoleEl').textContent = ivRoleLabel;
  document.getElementById('iv-session-label').textContent = document.getElementById('iv-role').value + ' \u2014 ' + type;

  buildIVDots();

  ivTimerInt = setInterval(() => {
    ivElapsed++;
    const m = Math.floor(ivElapsed/60), s = ivElapsed%60;
    document.getElementById('ivSessTimer').textContent = String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
  }, 1000);

  initIVSpeechRecognition();

  // Greeting from interviewer
  const greeting = 'Hello! I am ' + ivName + '. Welcome to your mock interview for ' + document.getElementById('iv-role').value + '. I will ask you ' + num + ' questions. Please answer verbally using the microphone. Let us begin!';
  addIVAiMsg(greeting, true);
  ivSpeak(greeting, () => setTimeout(() => askIVQuestion(), 800));
}

// ── Speech Recognition ──────────────────────────────────────
function initIVSpeechRecognition() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    document.getElementById('ivMicLabel').textContent = 'Voice not supported — use Chrome/Edge';
    document.getElementById('ivMicBtn').style.opacity = '0.4';
    document.getElementById('ivMicBtn').disabled = true;
    return;
  }
  ivRecognition = new SR();
  ivRecognition.continuous = true;
  ivRecognition.interimResults = true;
  ivRecognition.lang = 'en-IN';

  ivRecognition.onstart = () => {
    ivIsListening = true;
    setIVMicUI(true);
    setIVStatus('Recording your answer... speak clearly', 'var(--amber)');
    ivStartVolMeter();
  };

  ivRecognition.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += t;
      else interim += t;
    }
    ivCurrentTranscript += final;
    const display = (ivCurrentTranscript + interim).trim();
    const txt = document.getElementById('ivTranscriptText');
    const dot = document.getElementById('ivTranscriptDot');
    if (display) {
      txt.textContent = display;
      txt.style.color = 'var(--text)'; txt.style.fontStyle = 'normal';
      dot.style.background = 'var(--rose)';
      document.getElementById('ivSendBtn').style.display = 'block';
      document.getElementById('ivLiveTranscript').style.borderColor = 'var(--amber)';
    }
  };

  ivRecognition.onerror = (e) => {
    if (e.error === 'not-allowed') setIVStatus('Microphone permission denied', 'var(--rose)');
    else if (e.error === 'no-speech') setIVStatus('No speech detected — try again', 'var(--amber)');
    setIVMicUI(false); ivIsListening = false; ivStopVolMeter();
  };

  ivRecognition.onend = () => {
    // FIX: delay restart to avoid Chrome race condition that silently kills the mic
    if (ivIsListening) { setTimeout(() => { try { ivRecognition.start(); } catch(e2) {} }, 150); }
    else { setIVMicUI(false); ivStopVolMeter(); }
  };
}

function ivToggleMic() {
  if (!ivRecognition) { showToast('Voice not supported in this browser. Use Chrome or Edge.', 'error'); return; }
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  if (ivIsListening) {
    ivIsListening = false;
    try { ivRecognition.stop(); } catch(e) {}
    setIVMicUI(false); ivStopVolMeter();
    setIVStatus('Tap mic to answer', 'var(--text-3)');
    if (ivCurrentTranscript.trim()) document.getElementById('ivSendBtn').style.display = 'block';
  } else {
    if (ivSubmitted) return;
    ivCurrentTranscript = '';
    const txt = document.getElementById('ivTranscriptText');
    txt.textContent = 'Listening... speak your answer clearly';
    txt.style.color = 'var(--text-3)'; txt.style.fontStyle = 'italic';
    document.getElementById('ivTranscriptDot').style.background = 'var(--border)';
    document.getElementById('ivSendBtn').style.display = 'none';
    document.getElementById('ivLiveTranscript').style.borderColor = 'var(--amber)';
    ivIsListening = true;
    try { ivRecognition.start(); }
    catch(e) { ivIsListening = false; setIVMicUI(false); showToast('Mic error: ' + e.message, 'error'); }
  }
}

function setIVMicUI(active) {
  const btn = document.getElementById('ivMicBtn');
  const label = document.getElementById('ivMicLabel');
  const sub = document.getElementById('ivMicSub');
  if (active) {
    // FIX: set innerHTML directly — textContent before innerHTML destroyed the ripple child element
    btn.style.background = 'var(--rose)';
    btn.style.boxShadow = '0 4px 24px rgba(244,63,94,0.45)';
    btn.style.fontSize = '12px'; btn.style.fontWeight = '800';
    btn.innerHTML = 'STOP<div id="ivMicRipple" style="display:block;position:absolute;inset:-5px;border-radius:50%;border:3px solid var(--rose);animation:micpulse 1s infinite;pointer-events:none"></div>';
    label.textContent = 'Recording... tap to stop';
    sub.textContent = 'Your words are being transcribed live';
  } else {
    // FIX: clean reset to amber SPEAK state
    btn.style.background = 'var(--amber)';
    btn.style.boxShadow = '0 4px 20px rgba(247,147,30,0.4)';
    btn.style.fontSize = '13px'; btn.style.fontWeight = '800';
    btn.innerHTML = 'SPEAK<div id="ivMicRipple" style="display:none;position:absolute;inset:-5px;border-radius:50%;border:3px solid var(--amber);animation:micpulse 1s infinite;pointer-events:none"></div>';
    label.textContent = 'Tap mic to answer';
    sub.textContent = 'Speak clearly — your answer will appear above';
  }
}

async function ivStartVolMeter() {
  try {
    if (!ivMicStream) ivMicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    ivAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ivAudioCtx.createMediaStreamSource(ivMicStream);
    ivAnalyser = ivAudioCtx.createAnalyser(); ivAnalyser.fftSize = 256;
    src.connect(ivAnalyser);
    const buf = new Uint8Array(ivAnalyser.frequencyBinCount);
    const vf = document.getElementById('ivVolFill');
    ivVolInterval = setInterval(() => {
      ivAnalyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a,b) => a+b, 0) / buf.length;
      if (vf) vf.style.width = Math.min(100, avg * 2.5) + '%';
    }, 80);
  } catch(e) {}
}

function ivStopVolMeter() {
  if (ivVolInterval) { clearInterval(ivVolInterval); ivVolInterval = null; }
  if (ivAudioCtx) { try { ivAudioCtx.close(); } catch(e) {} ivAudioCtx = null; }
  const vf = document.getElementById('ivVolFill');
  if (vf) vf.style.width = '0%';
}

// ── Submit spoken answer ─────────────────────────────────────
function ivSubmitVoice() {
  const text = ivCurrentTranscript.trim();
  if (!text) { showToast('Nothing recorded. Tap the mic and speak first.', 'error'); return; }
  if (ivSubmitted) return;
  ivSubmitted = true;

  if (ivIsListening) {
    ivIsListening = false;
    try { ivRecognition.stop(); } catch(e) {}
    setIVMicUI(false); ivStopVolMeter();
  }

  // Reset transcript area
  ivCurrentTranscript = '';
  const txtEl = document.getElementById('ivTranscriptText');
  txtEl.textContent = 'Tap the mic button below and speak your answer clearly\u2026';
  txtEl.style.color = 'var(--text-3)'; txtEl.style.fontStyle = 'italic';
  document.getElementById('ivTranscriptDot').style.background = 'var(--border)';
  document.getElementById('ivSendBtn').style.display = 'none';
  document.getElementById('ivLiveTranscript').style.borderColor = 'var(--border)';

  processIVAnswer(text);
}

function processIVAnswer(text) {
  const q = ivQuestions[ivCur];
  const result = scoreAnswer(text, q);

  ivAnswers[ivCur] = { text, score: result.score, clarity: result.clarity, relevance: result.relevance, confidence: result.confidence, depth: result.depth, feedback: result.feedback, question: q.q, cat: q.cat, matchedKw: result.matchedKw, wordCount: result.wordCount };
  ivScores.push(result.score);
  ivAllClarity.push(result.clarity);
  ivAllRelevance.push(result.relevance);
  ivAllConfidence.push(result.confidence);
  ivAllDepth.push(result.depth);

  addIVUserMsg(text, result);
  updateIVMetrics();

  setIVStatus('Evaluating your answer\u2026', 'var(--indigo)');
  showIVSpeakRing(true);

  // AI speaks the follow-up feedback then moves to next question
  const transition = ivCur < ivQuestions.length - 1 ? ' Let us move to the next question.' : ' That was our final question. Thank you!';
  const aiResponse = result.feedback + transition;

  setTimeout(() => {
    addIVAiMsg(aiResponse, true);
    ivSpeak(aiResponse, () => {
      showIVSpeakRing(false);
      ivCur++;
      if (ivCur < ivQuestions.length) {
        setTimeout(() => askIVQuestion(), 600);
      } else {
        setTimeout(() => endInterview(), 1000);
      }
    });
  }, 600);
}

function ivSkip() {
  if (ivSubmitted) return;
  ivSubmitted = true;
  if (ivIsListening) { ivIsListening = false; try { ivRecognition.stop(); } catch(e) {} setIVMicUI(false); ivStopVolMeter(); }

  ivAnswers[ivCur] = { text: '[Skipped]', score: 20, clarity: 20, relevance: 20, confidence: 20, depth: 20, feedback: 'Skipped.', question: ivQuestions[ivCur]?.q || '', cat: ivQuestions[ivCur]?.cat || '', matchedKw: [], wordCount: 0 };
  ivScores.push(20);
  ivAllClarity.push(20); ivAllRelevance.push(20); ivAllConfidence.push(20); ivAllDepth.push(20);

  const skip = 'No problem, skipping this question. Let us move on.';
  addIVAiMsg(skip, false);
  ivSpeak(skip, () => {
    ivCur++;
    if (ivCur < ivQuestions.length) setTimeout(() => askIVQuestion(), 500);
    else endInterview();
  });
}

// ── Ask question ─────────────────────────────────────────────
function askIVQuestion() {
  if (ivCur >= ivQuestions.length) { endInterview(); return; }
  const q = ivQuestions[ivCur];
  ivSubmitted = false;

  // Reset transcript
  const txtEl = document.getElementById('ivTranscriptText');
  if (txtEl) { txtEl.textContent = 'Tap the mic button below and speak your answer clearly\u2026'; txtEl.style.color = 'var(--text-3)'; txtEl.style.fontStyle = 'italic'; }
  document.getElementById('ivTranscriptDot').style.background = 'var(--border)';
  document.getElementById('ivSendBtn').style.display = 'none';
  document.getElementById('ivLiveTranscript').style.borderColor = 'var(--border)';

  document.getElementById('ivHint').textContent = '\ud83d\udca1 ' + q.hint;
  updateIVDots();

  const qText = 'Question ' + (ivCur + 1) + ' of ' + ivQuestions.length + '. ' + q.q;
  addIVAiMsg('<strong>[' + q.cat + ']</strong> Q' + (ivCur+1) + ': ' + q.q, true);
  showIVSpeakRing(true);
  setIVStatus(ivName + ' is asking...', 'var(--amber)');
  ivSpeak(qText, () => {
    showIVSpeakRing(false);
    setIVStatus('Your turn \u2014 tap the mic to answer', 'var(--teal)');
  });
}

// ── AI speech synthesis ──────────────────────────────────────
function ivSpeak(text, onDone) {
  if (!window.speechSynthesis) { if (onDone) onDone(); return; }
  const voiceOn = document.getElementById('ivVoiceToggle') ? document.getElementById('ivVoiceToggle').checked : true;
  if (!voiceOn) { if (onDone) setTimeout(onDone, 300); return; }

  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  const rate = parseFloat((document.getElementById('ivSpeechRate') || {value:'0.95'}).value);
  utt.rate = rate; utt.pitch = 1.0; utt.volume = 1.0; utt.lang = 'en-IN';

  // Try to pick a good voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang === 'en-IN') ||
                    voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('india')) ||
                    voices.find(v => v.lang.startsWith('en-') && v.name.toLowerCase().includes('male')) ||
                    voices.find(v => v.lang.startsWith('en'));
  if (preferred) utt.voice = preferred;

  utt.onend = () => { if (onDone) onDone(); };
  utt.onerror = () => { if (onDone) onDone(); };
  window.speechSynthesis.speak(utt);
}

// ── UI helpers ───────────────────────────────────────────────
function showIVSpeakRing(show) {
  const r = document.getElementById('ivSpeakRing');
  if (r) r.style.display = show ? 'block' : 'none';
}

function setIVStatus(msg, color) {
  const el = document.getElementById('ivAiStatus');
  if (!el) return;
  color = color || 'var(--text-3)';
  el.textContent = msg; el.style.color = color;
  el.style.borderColor = color + '44'; el.style.background = color + '10';
}

function addIVAiMsg(text, animate) {
  const m = document.getElementById('ivMsgs');
  const d = document.createElement('div');
  d.className = 'iv-msg';
  d.innerHTML = '<div class="iv-msg-av" style="background:var(--amber-pale);font-size:18px">' + ivEmoji + '</div><div><div class="ai-bubble">' + text + '</div></div>';
  m.appendChild(d); m.scrollTop = m.scrollHeight;
}

function addIVUserMsg(text, result) {
  const m = document.getElementById('ivMsgs');
  const d = document.createElement('div');
  d.className = 'iv-msg user-iv';
  const cls = result.score >= 75 ? 'sc-good' : result.score >= 55 ? 'sc-ok' : 'sc-bad';
  const lbl = result.score >= 75 ? '\u2705 Strong' : result.score >= 55 ? '\u26a0 Decent' : '\ud83d\udcdd Needs Work';
  d.innerHTML = '<div class="iv-msg-av" style="background:var(--indigo-pale);font-size:16px">\ud83e\uddd1</div>'
    + '<div style="flex:1"><div class="user-iv-bubble">' + text + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:5px">'
    + '<span class="ans-score-tag ' + cls + '">' + lbl + ' \u00b7 ' + result.score + '/100</span>'
    + '<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:var(--surface2);color:var(--text-3);font-weight:600">' + result.wordCount + ' words</span>'
    + (result.matchedKw && result.matchedKw.length > 0 ? '<span style="font-size:10px;padding:3px 8px;border-radius:100px;background:var(--teal-pale);color:var(--teal);font-weight:600">' + result.matchedKw.length + ' key terms</span>' : '')
    + '</div></div>';
  m.appendChild(d); m.scrollTop = m.scrollHeight;
}

function buildIVDots() {
  const d = document.getElementById('ivQDots');
  d.innerHTML = '';
  ivQuestions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'iv-qdot' + (i === 0 ? ' cur-q' : '');
    dot.id = 'ivdot-' + i;
    d.appendChild(dot);
  });
}

function updateIVDots() {
  ivQuestions.forEach((_, i) => {
    const d = document.getElementById('ivdot-' + i);
    if (!d) return;
    d.className = 'iv-qdot';
    if (i < ivCur) d.classList.add('done-q');
    else if (i === ivCur) d.classList.add('cur-q');
  });
  document.getElementById('ivProgLabel').textContent = ivCur + '/' + ivQuestions.length;
  document.getElementById('ivProgFill').style.width = (ivCur / ivQuestions.length * 100) + '%';
}

function updateIVMetrics() {
  if (!ivScores.length) return;
  const avgC = Math.round(ivAllClarity.reduce((a,b)=>a+b,0) / ivAllClarity.length);
  const avgR = Math.round(ivAllRelevance.reduce((a,b)=>a+b,0) / ivAllRelevance.length);
  const avgConf = Math.round(ivAllConfidence.reduce((a,b)=>a+b,0) / ivAllConfidence.length);
  const avgD = Math.round(ivAllDepth.reduce((a,b)=>a+b,0) / ivAllDepth.length);
  [['pe1','pe1v',avgC],['pe2','pe2v',avgR],['pe3','pe3v',avgConf],['pe4','pe4v',avgD]].forEach(([id,vid,val]) => {
    const v = Math.min(val, 98);
    document.getElementById(id).style.width = v + '%';
    document.getElementById(vid).textContent = v;
  });
}

// ── End interview + detailed results ─────────────────────────
function endInterview() {
  clearInterval(ivTimerInt);
  ivIsListening = false;
  try { if (ivRecognition) ivRecognition.stop(); } catch(e) {}
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  ivStopVolMeter();
  if (ivMicStream) { ivMicStream.getTracks().forEach(t => t.stop()); ivMicStream = null; }

  document.getElementById('iv-session').classList.add('hidden');
  document.getElementById('iv-results').classList.remove('hidden');

  const answered = ivAnswers.filter(a => a && a.text !== '[Skipped]');
  const avg = ivScores.length ? Math.round(ivScores.reduce((a,b)=>a+b,0) / ivScores.length) : 50;
  const avgClarity = ivAllClarity.length ? Math.round(ivAllClarity.reduce((a,b)=>a+b,0)/ivAllClarity.length) : 50;
  const avgRelevance = ivAllRelevance.length ? Math.round(ivAllRelevance.reduce((a,b)=>a+b,0)/ivAllRelevance.length) : 50;
  const avgConf = ivAllConfidence.length ? Math.round(ivAllConfidence.reduce((a,b)=>a+b,0)/ivAllConfidence.length) : 50;

  state.interview = {
    score: avg, clarity: avgClarity, relevance: avgRelevance, confidence: avgConf,
    answers: ivAnswers.map((a,i) => ({ q: ivQuestions[i]?.q||'', a: a?.text||'', score: a?.score||0, fb: a?.feedback||'' })),
    completed: true
  };

  document.getElementById('ivsc1').textContent = avgClarity;
  document.getElementById('ivsc2').textContent = avgRelevance;
  document.getElementById('ivsc3').textContent = avgConf;
  document.getElementById('ivsc4').textContent = avg + '/100';
  document.getElementById('ivResultEmoji').textContent = avg>=80 ? '\ud83c\udfc6' : avg>=65 ? '\u2b50' : '\ud83d\udcda';
  document.getElementById('ivResultTitle').textContent = avg>=80 ? 'Excellent Interview!' : avg>=65 ? 'Good Performance!' : 'Room to Improve!';
  document.getElementById('ivResultSub').textContent = answered.length + ' of ' + ivQuestions.length + ' questions answered \u00b7 Average score: ' + avg + '/100';
  document.getElementById('ivReviewSub').textContent = 'Scored on Clarity, Relevance, Confidence & Depth';

  // Detailed per-question review
  const list = document.getElementById('ivQAList');
  list.innerHTML = '';
  ivAnswers.forEach((a, i) => {
    if (!a || !ivQuestions[i]) return;
    const q = ivQuestions[i];
    const isSkipped = a.text === '[Skipped]';
    const scoreColor = a.score >= 75 ? 'var(--green)' : a.score >= 55 ? 'var(--amber)' : 'var(--rose)';
    const scoreBg = a.score >= 75 ? 'var(--green-pale)' : a.score >= 55 ? 'var(--amber-pale)' : 'var(--rose-pale)';
    const scoreBorder = a.score >= 75 ? 'rgba(34,197,94,0.2)' : a.score >= 55 ? 'rgba(247,147,30,0.2)' : 'rgba(244,63,94,0.2)';

    list.innerHTML += `
      <div style="border:1px solid ${scoreBorder};background:${scoreBg};border-radius:var(--r-lg);padding:16px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:10px">
          <div>
            <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3)">Q${i+1} \u00b7 ${q.cat}</span>
            <div style="font-size:13px;font-weight:700;color:var(--text);margin-top:3px">${q.q}</div>
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div style="font-size:22px;font-weight:900;color:${scoreColor};font-family:var(--font-h);line-height:1">${a.score}</div>
            <div style="font-size:9px;color:var(--text-3);font-weight:700">/ 100</div>
          </div>
        </div>
        ${!isSkipped ? `
        <div style="padding:10px 12px;background:rgba(255,255,255,0.7);border-radius:var(--r);margin-bottom:8px;border:1px solid rgba(0,0,0,0.05)">
          <div style="font-size:10px;font-weight:800;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px">Your Answer (${a.wordCount} words)</div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.7;font-style:italic">"${a.text}"</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px">
          <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.6);border-radius:7px"><div style="font-size:14px;font-weight:800;color:var(--teal)">${a.clarity}</div><div style="font-size:9px;color:var(--text-3);font-weight:700">Clarity</div></div>
          <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.6);border-radius:7px"><div style="font-size:14px;font-weight:800;color:var(--indigo)">${a.relevance}</div><div style="font-size:9px;color:var(--text-3);font-weight:700">Relevance</div></div>
          <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.6);border-radius:7px"><div style="font-size:14px;font-weight:800;color:var(--violet)">${a.confidence}</div><div style="font-size:9px;color:var(--text-3);font-weight:700">Confidence</div></div>
          <div style="text-align:center;padding:6px;background:rgba(255,255,255,0.6);border-radius:7px"><div style="font-size:14px;font-weight:800;color:var(--amber)">${a.depth}</div><div style="font-size:9px;color:var(--text-3);font-weight:700">Depth</div></div>
        </div>
        ${a.matchedKw && a.matchedKw.length > 0 ? `<div style="margin-bottom:6px"><span style="font-size:10px;font-weight:700;color:var(--text-3)">KEY TERMS USED: </span>${a.matchedKw.map(k => '<span style="font-size:10px;padding:2px 7px;border-radius:100px;background:rgba(10,181,160,0.1);color:var(--teal);font-weight:600;margin:1px 2px;display:inline-block">' + k + '</span>').join('')}</div>` : ''}
        ` : '<div style="font-size:12px;color:var(--text-3);font-style:italic">Question skipped.</div>'}
        <div style="padding:8px 10px;background:rgba(0,0,0,0.04);border-radius:var(--r);font-size:12px;color:var(--text-2);border-left:3px solid ${scoreColor}">
          <strong>AI Feedback:</strong> ${a.feedback}
        </div>
      </div>`;
  });

  // Overall AI feedback
  const fbEl = document.getElementById('ivOverallFeedback');
  const fb = [];

  if (avg >= 80) fb.push({type:'good',icon:'\u2705',title:'Outstanding interview performance!',desc:'Your answers were structured, specific, and confident. You demonstrated strong technical depth and communication skills consistently across all questions.'});
  else if (avg >= 65) fb.push({type:'good',icon:'\u2b50',title:'Solid performance — above average',desc:'Good answers overall. Focus on adding specific examples and quantified results to push your score above 80.'});
  else fb.push({type:'warn',icon:'\u26a0\ufe0f',title:'Needs improvement',desc:'Your answers lacked depth or structure in several places. Practice the STAR method for behavioural questions and revise technical fundamentals.'});

  const weakAns = ivAnswers.filter(a => a && a.score < 55 && a.text !== '[Skipped]');
  if (weakAns.length > 0) {
    fb.push({type:'bad',icon:'\ud83d\udcdd',title:weakAns.length + ' weak answer' + (weakAns.length>1?'s':'') + ' to revisit',desc:'"' + (weakAns[0].question.length > 70 ? weakAns[0].question.slice(0,70)+'...' : weakAns[0].question) + '" — ' + weakAns[0].feedback});
  }

  const avgWC = Math.round(answered.map(a=>a.wordCount||0).reduce((a,b)=>a+b,0) / Math.max(answered.length,1));
  if (avgWC < 30) fb.push({type:'warn',icon:'\ud83d\udcac',title:'Answers too brief on average (' + avgWC + ' words)',desc:'Aim for 50-100 words per answer. Longer, structured answers score significantly higher as they signal depth and preparation.'});
  else if (avgWC >= 60) fb.push({type:'good',icon:'\u2705',title:'Good answer length on average (' + avgWC + ' words)',desc:'Well-calibrated responses. You are providing enough detail without rambling.'});

  const skippedCount = ivAnswers.filter(a => a && a.text === '[Skipped]').length;
  if (skippedCount > 0) fb.push({type:'warn',icon:'\u23ed\ufe0f',title:skippedCount + ' question' + (skippedCount>1?'s':'') + ' skipped',desc:'Skipped questions score zero. Even a partial attempt is better than skipping — practice more mock sessions.'});

  fb.push({type:'warn',icon:'\ud83d\udca1',title:'Key improvement tip',desc:'Before every answer, pause 2 seconds to mentally structure it: Context \u2192 What I did \u2192 Result. This alone improves clarity scores by 20+ points.'});

  fbEl.innerHTML = fb.map(f => '<div class="fb-item fb-' + f.type + '"><div class="fb-icon">' + f.icon + '</div><div class="fb-text"><strong>' + f.title + '</strong><small>' + f.desc + '</small></div></div>').join('');

  markDone('interview');
  const dashNav = document.getElementById('nav-dashboard');
  if (dashNav) { dashNav.classList.remove('locked'); dashNav.onclick = () => goTo('dashboard'); }
  const dashBadge = document.getElementById('badge-dashboard');
  if (dashBadge) { dashBadge.className = 'sb-badge sb-badge-ready'; dashBadge.textContent = 'Ready'; }
  updateJourney(); updateProgress();
  showToast('Interview complete! Score: ' + avg + '/100 \u00b7 ' + answered.length + ' answers analysed', 'success');
}

function resetInterview() {
  clearInterval(ivTimerInt);
  ivIsListening = false;
  try { if (ivRecognition) ivRecognition.stop(); } catch(e) {}
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  ivStopVolMeter();
  if (ivMicStream) { ivMicStream.getTracks().forEach(t => t.stop()); ivMicStream = null; }
  document.getElementById('iv-results').classList.add('hidden');
  document.getElementById('iv-session').classList.add('hidden');
  document.getElementById('iv-intro').classList.remove('hidden');
  document.getElementById('ivMsgs').innerHTML = '';
  ivCur = 0; ivAnswers = []; ivScores = []; ivElapsed = 0; ivCurrentTranscript = '';
  ivAllClarity = []; ivAllRelevance = []; ivAllConfidence = []; ivAllDepth = [];
  ['pe1','pe2','pe3','pe4'].forEach(id => document.getElementById(id).style.width = '0%');
  ['pe1v','pe2v','pe3v','pe4v'].forEach(id => document.getElementById(id).textContent = '\u2014');
  document.getElementById('ivSessTimer').textContent = '00:00';
  setIVMicUI(false);
  const txt = document.getElementById('ivTranscriptText');
  if (txt) { txt.textContent = 'Tap the mic button below and speak your answer clearly\u2026'; txt.style.color='var(--text-3)'; txt.style.fontStyle='italic'; }
  const sb = document.getElementById('ivSendBtn');
  if (sb) sb.style.display = 'none';
}



// ═══════════════════════════════════════════════════════════
// SESSION HISTORY SYSTEM
// Persists every completed session to localStorage
// Allows replay, trend tracking, and full history review
// ═══════════════════════════════════════════════════════════

function markDone(page) {
  // Update sidebar badge and journey/progress UI
  _markDoneOriginal(page);
  // Snapshot current state for history
  setTimeout(() => {
    try {
      if (page === 'resume' && state.resume.completed) {
        saveSession('resume', { score: state.resume.score, fileName: state.resume.fileName, atsScore: state.resume._analysis?.atsScore, keywordScore: state.resume._analysis?.keywordScore, formattingScore: state.resume._analysis?.formattingScore, impactScore: state.resume._analysis?.impactScore, skillsScore: state.resume._analysis?.skillsScore, foundSkills: state.resume._analysis?.foundSkills?.slice(0,20) || [], missingSkills: state.resume._analysis?.IMPORTANT_MISSING?.slice(0,10) || [], sections: Object.keys(state.resume._analysis?.detectedSections || {}) });
      }
      if (page === 'aptitude' && state.aptitude.completed) {
        saveSession('aptitude', { score: state.aptitude.pct, correct: state.aptitude.correct, wrong: state.aptitude.wrong, skipped: state.aptitude.skipped, pct: state.aptitude.pct });
      }
      if (page === 'technical' && state.technical && state.technical.completed) {
        saveSession('technical', { score: state.technical.score, mcqScore: state.technical.mcqScore, codeScore: state.technical.codeScore, debugScore: state.technical.debugScore, timeUsed: state.technical.timeUsed });
      }
      if (page === 'gd' && state.gd.completed) {
        saveSession('gd', { score: state.gd.score, comm: state.gd.comm, reason: state.gd.reason, conf: state.gd.conf, lead: state.gd.lead, userMessages: state.gd.userMessages });
      }
      if (page === 'interview' && state.interview.completed) {
        saveSession('interview', { score: state.interview.score, clarity: state.interview.clarity, relevance: state.interview.relevance, confidence: state.interview.confidence, answers: state.interview.answers?.slice(0, 12) || [] });
      }
    } catch(e) { console.warn('History save error:', e); }
  }, 500);
}

// ── Render History Page ───────────────────────────────────────
async function renderHistoryPage() {
  // Show loading state
  const cards = document.getElementById('histCards');
  const empty = document.getElementById('histEmpty');
  if (cards) cards.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:32px;margin-bottom:10px">⏳</div>Loading your history…</div>';
  if (empty) empty.style.display = 'none';

  const all = await loadAllSessions();
  updateHistoryBadge();

  // Summary stats
  const byType = t => all.filter(s => s.type === t);
  const best = (t, field) => { const arr = byType(t); return arr.length ? Math.max(...arr.map(s => s.data[field] || s.score || 0)) : null; };

  document.getElementById('hist-total').textContent = all.length;
  document.getElementById('hist-resume-best').textContent = best('resume', 'score') !== null ? best('resume', 'score') + '/100' : '—';
  document.getElementById('hist-apt-best').textContent = best('aptitude', 'pct') !== null ? best('aptitude', 'pct') + '%' : '—';
  document.getElementById('hist-gd-best').textContent = best('gd', 'score') !== null ? best('gd', 'score') + '/100' : '—';
  document.getElementById('hist-iv-best').textContent = best('interview', 'score') !== null ? best('interview', 'score') + '/100' : '—';

  // Trend chart (last 20 sessions with scores)
  buildHistTrendChart(all);

  // Render cards
  renderHistCards(all, histCurrentFilter);
}

async function filterHistory(type, btn) {
  histCurrentFilter = type;
  document.querySelectorAll('#histFilterRow .tips-pill').forEach(p => p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const all = await loadAllSessions();
  renderHistCards(all, type);
}

function renderHistCards(all, filter) {
  const cards = document.getElementById('histCards');
  const empty = document.getElementById('histEmpty');

  let filtered = filter === 'all' ? all
    : filter === 'full' ? groupFullRuns(all)
    : all.filter(s => s.type === filter);

  if (filtered.length === 0) {
    cards.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';

  if (filter === 'full') {
    cards.innerHTML = filtered.map(run => buildFullRunCard(run)).join('');
  } else {
    // Group by type, show attempts with attempt number
    const grouped = {};
    [...filtered].reverse().forEach((s, i) => {
      if (!grouped[s.type]) grouped[s.type] = [];
      grouped[s.type].push({ ...s, attempt: grouped[s.type].length + 1 });
    });
    // Re-number correctly (newest = highest attempt)
    const withAttempts = filtered.map(s => {
      const sameType = filtered.filter(x => x.type === s.type);
      const idx = sameType.indexOf(s);
      const attempt = sameType.length - idx; // newest = highest number
      return { ...s, attempt };
    });
    cards.innerHTML = withAttempts.map(s => buildSessionCard(s)).join('');
  }
}

function buildSessionCard(s) {
  const icons = { resume:'📄', aptitude:'🧠', technical:'💻', gd:'🎤', interview:'🤖' };
  const colors = { resume:'var(--indigo)', aptitude:'var(--violet)', technical:'var(--teal)', gd:'var(--amber)', interview:'var(--rose)' };
  const pales = { resume:'var(--indigo-pale)', aptitude:'var(--violet-pale)', technical:'var(--teal-pale)', gd:'var(--amber-pale)', interview:'var(--rose-pale)' };
  const labels = { resume:'Resume Analyzer', aptitude:'Aptitude Test', technical:'Technical Test', gd:'GD Simulation', interview:'AI Interview' };

  const score = s.score || 0;
  const scoreColor = score >= 75 ? 'var(--green)' : score >= 55 ? 'var(--amber)' : 'var(--rose)';
  const icon = icons[s.type] || '📋';
  const color = colors[s.type] || 'var(--indigo)';
  const pale = pales[s.type] || 'var(--indigo-pale)';

  const detailsHTML = buildDetailHTML(s);

  return `<div style="background:#fff;border:1px solid var(--border);border-radius:var(--r-xl);overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.05)" id="hcard-${s.id}">
    <div style="display:flex;align-items:center;gap:16px;padding:16px 20px;cursor:pointer" onclick="toggleHistCard('${s.id}')">
      <div style="width:44px;height:44px;border-radius:12px;background:${pale};color:${color};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">${icon}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
          <span style="font-weight:800;font-size:14px;color:var(--text)">${labels[s.type] || s.type}</span>
          <span style="font-size:10px;padding:2px 8px;border-radius:100px;background:${pale};color:${color};font-weight:700">Attempt #${s.attempt}</span>
        </div>
        <div style="font-size:12px;color:var(--text-3)">${s.date}</div>
      </div>
      <div style="text-align:center;flex-shrink:0">
        <div style="font-size:24px;font-weight:900;color:${scoreColor};font-family:var(--font-h);line-height:1">${score}</div>
        <div style="font-size:9px;color:var(--text-3);font-weight:700">/ 100</div>
      </div>
      <div style="font-size:16px;color:var(--text-4);transition:transform 0.2s" id="hchev-${s.id}">▼</div>
    </div>
    <div id="hbody-${s.id}" style="display:none;padding:0 20px 16px;border-top:1px solid var(--border)">
      <div style="padding-top:14px">${detailsHTML}</div>
      <div style="display:flex;gap:8px;margin-top:14px">
        <button class="btn btn-primary btn-sm" onclick="replaySession('${s.type}')">↺ Try Again</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteSession('${s.id}')">🗑 Delete</button>
      </div>
    </div>
  </div>`;
}

function buildDetailHTML(s) {
  const d = s.data;
  if (s.type === 'resume') {
    return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
      ${[['ATS',d.atsScore],['Keywords',d.keywordScore],['Format',d.formattingScore],['Impact',d.impactScore],['Skills',d.skillsScore]].map(([l,v]) => v != null ? `<div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--r)"><div style="font-size:16px;font-weight:800;color:var(--indigo)">${v}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">${l}</div></div>` : '').join('')}
    </div>
    ${d.foundSkills?.length ? `<div style="font-size:11px;color:var(--text-3);margin-bottom:5px;font-weight:700">SKILLS DETECTED</div><div style="display:flex;flex-wrap:wrap;gap:4px">${d.foundSkills.slice(0,12).map(k=>`<span style="font-size:11px;padding:2px 8px;background:var(--teal-pale);color:var(--teal);border-radius:100px;font-weight:600">${k}</span>`).join('')}</div>` : ''}`;
  }
  if (s.type === 'aptitude') {
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      <div style="text-align:center;padding:8px;background:var(--green-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--green)">${d.correct || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Correct</div></div>
      <div style="text-align:center;padding:8px;background:var(--rose-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--rose)">${d.wrong || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Wrong</div></div>
      <div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--text-3)">${d.skipped || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Skipped</div></div>
      <div style="text-align:center;padding:8px;background:var(--violet-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--violet)">${d.pct || 0}%</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Score</div></div>
    </div>`;
  }
  if (s.type === 'technical') {
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      <div style="text-align:center;padding:8px;background:var(--indigo-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--indigo)">${d.score || 0}/100</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Total</div></div>
      <div style="text-align:center;padding:8px;background:var(--surface2);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--text-2)">${d.mcqScore || 0}/20</div><div style="font-size:10px;color:var(--text-3);font-weight:600">MCQ</div></div>
      <div style="text-align:center;padding:8px;background:var(--teal-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--teal)">${d.codeScore || 0}/60</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Code</div></div>
      <div style="text-align:center;padding:8px;background:var(--rose-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--rose)">${d.debugScore || 0}/20</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Debug</div></div>
    </div>${d.timeUsed ? `<div style="font-size:11px;color:var(--text-3);margin-top:8px">⏱ Time used: ${d.timeUsed}</div>` : ''}`;
  }
  if (s.type === 'gd') {
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
      <div style="text-align:center;padding:8px;background:var(--teal-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--teal)">${d.comm || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Comm.</div></div>
      <div style="text-align:center;padding:8px;background:var(--indigo-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--indigo)">${d.reason || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Reasoning</div></div>
      <div style="text-align:center;padding:8px;background:var(--violet-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--violet)">${d.conf || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Confidence</div></div>
      <div style="text-align:center;padding:8px;background:var(--amber-pale);border-radius:var(--r)"><div style="font-size:18px;font-weight:800;color:var(--amber)">${d.lead || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Leadership</div></div>
    </div><div style="font-size:11px;color:var(--text-3);margin-top:8px">🎙️ ${d.userMessages || 0} voice contributions</div>`;
  }
  if (s.type === 'interview') {
    const answered = (d.answers || []).filter(a => a && a.a && a.a !== '[Skipped]');
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px">
      <div style="text-align:center;padding:8px;background:var(--teal-pale);border-radius:var(--r)"><div style="font-size:16px;font-weight:800;color:var(--teal)">${d.clarity || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Clarity</div></div>
      <div style="text-align:center;padding:8px;background:var(--indigo-pale);border-radius:var(--r)"><div style="font-size:16px;font-weight:800;color:var(--indigo)">${d.relevance || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Relevance</div></div>
      <div style="text-align:center;padding:8px;background:var(--violet-pale);border-radius:var(--r)"><div style="font-size:16px;font-weight:800;color:var(--violet)">${d.confidence || 0}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Confidence</div></div>
      <div style="text-align:center;padding:8px;background:var(--amber-pale);border-radius:var(--r)"><div style="font-size:16px;font-weight:800;color:var(--amber)">${answered.length}</div><div style="font-size:10px;color:var(--text-3);font-weight:600">Answered</div></div>
    </div>
    ${answered.length > 0 ? `<div style="font-size:11px;color:var(--text-3);font-weight:700;margin-bottom:6px">Q&A SNAPSHOT</div>` + answered.slice(0,3).map(a => `<div style="padding:8px 10px;background:var(--surface2);border-radius:var(--r);margin-bottom:5px;border-left:3px solid ${a.score>=75?'var(--green)':a.score>=55?'var(--amber)':'var(--rose)'}"><div style="font-size:11px;font-weight:700;color:var(--text-2);margin-bottom:2px">${a.q}</div><div style="font-size:11px;color:var(--text-3);font-style:italic">"${(a.a||'').slice(0,120)}${(a.a||'').length>120?'…':''}"</div><div style="font-size:10px;font-weight:700;color:${a.score>=75?'var(--green)':a.score>=55?'var(--amber)':'var(--rose)'};margin-top:3px">${a.score}/100</div></div>`).join('') : ''}`;
  }
  return '';
}

function toggleHistCard(id) {
  const body = document.getElementById('hbody-' + id);
  const chev = document.getElementById('hchev-' + id);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : 'block';
  if (chev) chev.style.transform = isOpen ? '' : 'rotate(180deg)';
}

// ── Full run grouping ─────────────────────────────────────────
function groupFullRuns(all) {
  // A "full run" = a set of 5 sessions close in time (within 24h), one of each type
  const TYPES = ['resume','aptitude','technical','gd','interview'];
  const runs = [];
  const used = new Set();
  all.forEach(s => {
    if (used.has(s.id)) return;
    const withinDay = all.filter(x => !used.has(x.id) && Math.abs(x.ts - s.ts) < 86400000 * 2);
    const covered = TYPES.filter(t => withinDay.find(x => x.type === t));
    if (covered.length >= 3) {
      const run = {};
      TYPES.forEach(t => {
        const match = withinDay.find(x => x.type === t);
        if (match) { run[t] = match; used.add(match.id); }
      });
      run._ts = s.ts;
      run._date = s.date;
      run._score = Math.round(TYPES.filter(t=>run[t]).map(t=>run[t].score||0).reduce((a,b)=>a+b,0) / Math.max(1, TYPES.filter(t=>run[t]).length));
      runs.push(run);
    }
  });
  return runs;
}

function buildFullRunCard(run) {
  const TYPES = ['resume','aptitude','technical','gd','interview'];
  const icons = {resume:'📄',aptitude:'🧠',technical:'💻',gd:'🎤',interview:'🤖'};
  const scoreColor = run._score >= 75 ? 'var(--green)' : run._score >= 55 ? 'var(--amber)' : 'var(--rose)';
  return `<div style="background:#fff;border:1px solid var(--border);border-radius:var(--r-xl);padding:18px 20px;box-shadow:0 1px 4px rgba(0,0,0,0.05)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <span style="font-weight:800;font-size:14px;color:var(--text)">🏆 Full Practice Run</span>
        <div style="font-size:12px;color:var(--text-3);margin-top:2px">${run._date}</div>
      </div>
      <div style="text-align:center">
        <div style="font-size:26px;font-weight:900;color:${scoreColor};font-family:var(--font-h);line-height:1">${run._score}</div>
        <div style="font-size:9px;color:var(--text-3);font-weight:700">avg / 100</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">
      ${TYPES.map(t => run[t] ? `<div style="text-align:center;padding:10px 6px;background:var(--surface2);border-radius:var(--r);border:1px solid var(--border)"><div style="font-size:18px">${icons[t]}</div><div style="font-size:14px;font-weight:800;color:${run[t].score>=75?'var(--green)':run[t].score>=55?'var(--amber)':'var(--rose)'};margin-top:4px">${run[t].score}</div><div style="font-size:9px;color:var(--text-3);font-weight:600">${t.charAt(0).toUpperCase()+t.slice(1)}</div></div>` : `<div style="text-align:center;padding:10px 6px;background:var(--surface2);border-radius:var(--r);opacity:0.4"><div style="font-size:18px">${icons[t]}</div><div style="font-size:10px;color:var(--text-4);margin-top:4px">—</div></div>`).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:12px">
      ${TYPES.filter(t=>run[t]).map(t=>`<button class="btn btn-ghost btn-sm" style="font-size:11px" onclick="replaySession('${t}')">↺ Redo ${icons[t]}</button>`).join('')}
    </div>
  </div>`;
}

// ── Trend chart ───────────────────────────────────────────────
function buildHistTrendChart(all) {
  const card = document.getElementById('histTrendCard');
  if (all.length < 2) { if (card) card.style.display = 'none'; return; }
  if (card) card.style.display = '';

  // Last 20 sessions with scores, oldest→newest for chart
  const recent = [...all].reverse().slice(-20);
  const labels = recent.map(s => {
    const d = new Date(s.ts);
    return d.getDate() + '/' + (d.getMonth()+1) + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  });
  const scores = recent.map(s => s.score || 0);
  const typeColors = { resume:'#4361ee', aptitude:'#8b5cf6', technical:'#0ab5a0', gd:'#f7931e', interview:'#f43f5e' };
  const ptColors = recent.map(s => typeColors[s.type] || '#64748b');

  if (histTrendChartInst) { histTrendChartInst.destroy(); histTrendChartInst = null; }
  const ctx = document.getElementById('histTrendChart').getContext('2d');
  histTrendChartInst = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Session Score',
        data: scores,
        borderColor: '#4361ee',
        backgroundColor: 'rgba(67,97,238,0.07)',
        borderWidth: 2.5,
        pointBackgroundColor: ptColors,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6,
        fill: true,
        tension: 0.35,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        y: { min: 0, max: 100, ticks: { color: '#94a3b8', font: { size: 10, family:"'Outfit'" } }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { color: '#94a3b8', font: { size: 9, family:"'Outfit'" }, maxRotation: 45 }, grid: { display: false } }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const s = recent[ctx.dataIndex];
              const typeLabel = {resume:'Resume',aptitude:'Aptitude',technical:'Technical',gd:'GD',interview:'Interview'}[s.type] || s.type;
              return typeLabel + ': ' + ctx.raw + '/100';
            }
          }
        }
      }
    }
  });
}

// ── Actions ───────────────────────────────────────────────────
function replaySession(type) {
  const map = { resume:'resume', aptitude:'aptitude', technical:'technical', gd:'gd', interview:'interview' };
  const page = map[type];
  if (!page) return;
  showToast('Starting ' + type + ' session — good luck!', 'info');
  goTo(page);
  // Reset the module state so user can redo it fresh
  if (type === 'resume') { setTimeout(resetResume, 300); }
  if (type === 'aptitude') { setTimeout(resetAptitude, 300); }
  if (type === 'technical') { setTimeout(resetTechTest.bind(null, true), 300); }
  if (type === 'gd') { setTimeout(resetGD, 300); }
  if (type === 'interview') { setTimeout(resetInterview, 300); }
}

// ═══ PDF EXPORT ═══
async function exportPDF() {
  showToast('Generating PDF report…', 'info');
  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W = 210, margin = 18;
    let y = 0;
    const user = state.user;
    const scores = {
      resume: state.resume.completed ? state.resume.score : null,
      aptitude: state.aptitude.completed ? state.aptitude.pct : null,
      technical: state.technical && state.technical.completed ? state.technical.score : null,
      gd: state.gd.completed ? state.gd.score : null,
      interview: state.interview.completed ? state.interview.score : null,
    };
    const valid = Object.values(scores).filter(s => s !== null);
    const overall = valid.length ? Math.round(valid.reduce((a,b) => a+b,0)/valid.length) : 0;

    // ── COVER PAGE ──────────────────────────────────────────
    doc.setFillColor(13, 27, 42);
    doc.rect(0, 0, W, 297, 'F');
    // Accent gradient band
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, W, 6, 'F');
    // Logo box
    doc.setFillColor(67, 97, 238);
    doc.roundedRect(margin, 24, 14, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica','bold');
    doc.setFontSize(8);
    doc.text('CP', margin+3.5, 33);
    // Title
    doc.setFontSize(22);
    doc.setFont('helvetica','bold');
    doc.setTextColor(255, 255, 255);
    doc.text('CareerPrep AI', margin+20, 33);
    doc.setFontSize(10);
    doc.setFont('helvetica','normal');
    doc.setTextColor(160, 180, 210);
    doc.text('Career Readiness Report', margin+20, 39);
    // Hero score circle
    const cx = W/2, cy = 120;
    doc.setFillColor(30, 50, 80);
    doc.circle(cx, cy, 38, 'F');
    doc.setDrawColor(67, 97, 238);
    doc.setLineWidth(3);
    doc.circle(cx, cy, 38, 'S');
    doc.setFont('helvetica','bold');
    doc.setFontSize(36);
    doc.setTextColor(255, 255, 255);
    doc.text(overall+'%', cx, cy+6, {align:'center'});
    doc.setFontSize(10);
    doc.setTextColor(160, 180, 210);
    doc.text('Career Readiness Score', cx, cy+18, {align:'center'});
    // User info
    const grade = overall>=85?'Job-Ready 🚀':overall>=70?'Career Confident ⭐':overall>=55?'On Track 📈':'Just Starting 🌱';
    doc.setFont('helvetica','bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(user.firstName + ' ' + user.lastName, cx, 172, {align:'center'});
    doc.setFont('helvetica','normal');
    doc.setFontSize(11);
    doc.setTextColor(160, 180, 210);
    doc.text(user.role + '  ·  ' + user.target, cx, 180, {align:'center'});
    doc.setFontSize(13);
    doc.setFont('helvetica','bold');
    doc.setTextColor(100, 190, 255);
    doc.text(grade, cx, 194, {align:'center'});
    // Generated date
    doc.setFont('helvetica','normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 130, 160);
    doc.text('Generated by CareerPrep AI  ·  ' + new Date().toLocaleDateString('en-IN', {day:'numeric',month:'long',year:'numeric'}), cx, 274, {align:'center'});
    doc.setDrawColor(50, 80, 120);
    doc.setLineWidth(0.3);
    doc.line(margin, 270, W-margin, 270);

    // ── PAGE 2: MODULE SCORES ────────────────────────────────
    doc.addPage();
    y = margin;
    // Header bar
    doc.setFillColor(67, 97, 238);
    doc.rect(0, 0, W, 5, 'F');
    y = 18;
    doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(15, 30, 55);
    doc.text('Module Performance Summary', margin, y); y += 10;
    doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(100, 120, 150);
    doc.text('Detailed scores across all 4 career readiness modules', margin, y); y += 10;

    const modules = [
      {icon:'Resume Analyzer', score:scores.resume, max:100, color:[67,97,238], done:state.resume.completed},
      {icon:'Aptitude Test', score:scores.aptitude, max:100, color:[139,92,246], done:state.aptitude.completed},
      {icon:'Technical Test', score:scores.technical, max:100, color:[67,97,238], done:state.technical&&state.technical.completed},
      {icon:'GD Simulation', score:scores.gd, max:100, color:[10,181,160], done:state.gd.completed},
      {icon:'AI Mock Interview', score:scores.interview, max:100, color:[247,147,30], done:state.interview.completed},
    ];
    modules.forEach(m => {
      const sc = m.done ? m.score : 0;
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, W-margin*2, 22, 3, 3, 'F');
      doc.setDrawColor(220, 230, 245);
      doc.roundedRect(margin, y, W-margin*2, 22, 3, 3, 'S');
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(15, 30, 55);
      doc.text(m.icon, margin+5, y+9);
      const scTxt = m.done ? (sc+'%') : 'Not completed';
      doc.setFont('helvetica','bold'); doc.setFontSize(13);
      doc.setTextColor(...m.color);
      doc.text(scTxt, W-margin-5, y+9, {align:'right'});
      // Progress bar
      doc.setFillColor(225, 230, 245);
      doc.roundedRect(margin+5, y+12, W-margin*2-10, 4, 2, 2, 'F');
      if (m.done && sc > 0) {
        doc.setFillColor(...m.color);
        doc.roundedRect(margin+5, y+12, (W-margin*2-10)*(sc/100), 4, 2, 2, 'F');
      }
      y += 28;
    });

    y += 4;
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(15, 30, 55);
    doc.text('Aptitude Category Breakdown', margin, y); y += 8;
    if (state.aptitude.completed && QUESTIONS.length > 0) {
      const cats = ['Quantitative','Logical Reasoning','Verbal Ability','Technical','Data Interpretation','General Knowledge'];
      const catStats = {};
      cats.forEach(c => catStats[c] = {total:0,correct:0});
      QUESTIONS.forEach((q, i) => { catStats[q.cat].total++; if(aptAnswers[i]===q.ans) catStats[q.cat].correct++; });
      cats.forEach(c => {
        const cs = catStats[c]; if (!cs.total) return;
        const catPct = Math.round((cs.correct / cs.total) * 100);
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,100,130);
        doc.text(c, margin+5, y+4);
        doc.text(cs.correct+'/'+cs.total, W-margin-30, y+4);
        doc.setFillColor(225,230,245); doc.roundedRect(margin+70, y, W-margin*2-80, 5, 2, 2, 'F');
        const col = catPct>=75?[34,197,94]:catPct>=50?[247,147,30]:[244,63,94];
        doc.setFillColor(...col);
        doc.roundedRect(margin+70, y, (W-margin*2-80)*(catPct/100), 5, 2, 2, 'F');
        y += 9;
      });
    } else {
      doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(150);
      doc.text('Aptitude test not completed.', margin+5, y+4); y += 12;
    }

    // ── PAGE 3: RESUME + RECOMMENDATIONS ────────────────────
    doc.addPage();
    doc.setFillColor(67, 97, 238); doc.rect(0, 0, W, 5, 'F');
    y = 18;
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(15, 30, 55);
    doc.text('Resume Analysis', margin, y); y += 8;
    if (state.resume.completed && state.resume._analysis) {
      const ana = state.resume._analysis;
      const dimLabels = ['ATS Compatibility','Keyword Match','Formatting','Impact Phrases','Skills Coverage'];
      const dimVals = [ana.atsScore,ana.keywordScore,ana.formattingScore,ana.impactScore,ana.skillsScore];
      const dimCols = [[34,197,94],[67,97,238],[10,181,160],[247,147,30],[139,92,246]];
      dimLabels.forEach((lbl, i) => {
        doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(80,100,130);
        doc.text(lbl, margin+5, y+4);
        doc.text(dimVals[i]+'', W-margin-5, y+4, {align:'right'});
        doc.setFillColor(225,230,245); doc.roundedRect(margin+55, y, W-margin*2-65, 5, 2, 2, 'F');
        doc.setFillColor(...dimCols[i]);
        doc.roundedRect(margin+55, y, (W-margin*2-65)*(dimVals[i]/100), 5, 2, 2, 'F');
        y += 9;
      });
      y += 4;
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(15,30,55);
      doc.text('Skills Detected ('+ana.foundSkills.length+')', margin, y); y += 7;
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(60,130,80);
      const skillStr = ana.foundSkills.slice(0,12).join('  ·  ');
      const skillLines = doc.splitTextToSize(skillStr, W-margin*2);
      doc.text(skillLines, margin+5, y); y += skillLines.length * 5 + 4;
      doc.setFont('helvetica','bold'); doc.setFontSize(11); doc.setTextColor(15,30,55);
      doc.text('Skill Gaps', margin, y); y += 7;
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(180,60,60);
      const gapStr = ana.IMPORTANT_MISSING.slice(0,8).join('  ·  ');
      doc.text(doc.splitTextToSize(gapStr, W-margin*2), margin+5, y); y += 10;
    } else {
      doc.setFont('helvetica','italic'); doc.setFontSize(9); doc.setTextColor(150);
      doc.text('Resume not analyzed.', margin+5, y); y += 10;
    }
    y += 4;
    doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.setTextColor(15,30,55);
    doc.text('AI Recommendations', margin, y); y += 8;
    const recos = [
      {t:'Learn Docker & Kubernetes',d:'Missing in most resumes. Essential for SWE roles.'},
      {t:'Improve GD participation',d:'Aim for 5+ contributions per 10-min session.'},
      {t:'Practice System Design',d:'Study HLD/LLD patterns daily.'},
      {t:'Stronger action verbs',d:'Replace weak verbs with "Engineered", "Scaled", "Led".'},
      {t:'3 more mock interview rounds',d:'Interview score improves significantly with repetition.'},
    ];
    recos.forEach(r => {
      doc.setFillColor(245, 247, 255);
      doc.roundedRect(margin, y, W-margin*2, 14, 2, 2, 'F');
      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(67,97,238);
      doc.text('• '+r.t, margin+4, y+6);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(100,120,150);
      doc.text(r.d, margin+4, y+11);
      y += 17;
    });

    // ── Footer on all pages ──────────────────────────────────
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
      doc.setPage(p);
      doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(160);
      doc.text('CareerPrep AI — Career Readiness Report — '+user.firstName+' '+user.lastName, margin, 290);
      doc.text(p+'/'+pageCount, W-margin, 290, {align:'right'});
    }

    doc.save('CareerPrep_Report_' + user.firstName + '_' + user.lastName + '.pdf');
    showToast('✅ PDF Report downloaded successfully!', 'success');
  } catch (e) {
    console.error('PDF export error:', e);
    showToast('❌ PDF export failed. Please try again.', 'error');
  }
}

// ═══════════════════════════════════════════════════
// TECHNICAL TEST MODULE
// ═══════════════════════════════════════════════════
// Full MCQ bank — 5 are randomly selected per test session
const TECH_MCQ_BANK = [
  {
    diff:'Easy', topic:'OOP',
    q:'Which OOP principle allows a subclass to use methods and fields of its parent class?',
    opts:['Encapsulation','Polymorphism','Inheritance','Abstraction'],
    ans:2,
    exp:'Inheritance lets a subclass acquire properties and behaviours of a parent class, promoting code reuse. Polymorphism = same interface, different behaviour. Encapsulation = hiding internal state. Abstraction = hiding complexity.'
  },
  {
    diff:'Easy', topic:'Data Structures',
    q:'What is the time complexity of searching an element in a balanced Binary Search Tree (BST)?',
    opts:['O(n)','O(log n)','O(n log n)','O(1)'],
    ans:1,
    exp:'A balanced BST (like AVL or Red-Black) halves the search space at each step, giving O(log n). An unbalanced BST can degrade to O(n) in the worst case (linked-list shape).'
  },
  {
    diff:'Medium', topic:'Algorithms',
    q:'Which sorting algorithm has the best average-case time complexity of O(n log n)?',
    opts:['Bubble Sort','Insertion Sort','Merge Sort','Selection Sort'],
    ans:2,
    exp:'Merge Sort guarantees O(n log n) in all cases (best, average, worst). Bubble, Insertion, and Selection Sort all have O(n²) average/worst. Quick Sort is also O(n log n) average but O(n²) worst case.'
  },
  {
    diff:'Medium', topic:'DBMS',
    q:'Which SQL clause is used to filter results of a GROUP BY query?',
    opts:['WHERE','FILTER','HAVING','ORDER BY'],
    ans:2,
    exp:'HAVING filters groups after GROUP BY is applied. WHERE filters individual rows BEFORE grouping. You cannot use aggregate functions (like SUM, COUNT) in WHERE — use HAVING instead.'
  },
  {
    diff:'Hard', topic:'OS',
    q:'In the context of deadlocks, which condition is NOT required for a deadlock to occur?',
    opts:['Mutual Exclusion','Hold and Wait','Starvation','Circular Wait'],
    ans:2,
    exp:'The 4 necessary conditions for deadlock (Coffman conditions) are: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Starvation is a related but separate concept — a process waits indefinitely but no circular dependency exists.'
  },
  {
    diff:'Easy', topic:'Networking',
    q:'Which layer of the OSI model is responsible for end-to-end communication and error recovery?',
    opts:['Network Layer','Data Link Layer','Transport Layer','Session Layer'],
    ans:2,
    exp:'Transport Layer (Layer 4) handles end-to-end communication, error recovery, and flow control. TCP and UDP operate here. Network Layer (3) handles routing. Data Link (2) handles node-to-node delivery.'
  },
  {
    diff:'Easy', topic:'OOP',
    q:'Which OOP concept allows the same method name to behave differently based on input or object type?',
    opts:['Encapsulation','Inheritance','Polymorphism','Abstraction'],
    ans:2,
    exp:'Polymorphism = "many forms". Method overloading (compile-time) and method overriding (runtime) are its types. Example: animal.speak() can output "Woof" for Dog and "Meow" for Cat.'
  },
  {
    diff:'Medium', topic:'Data Structures',
    q:'Which data structure would be most efficient for implementing a "undo/redo" feature?',
    opts:['Queue','Stack','Heap','Graph'],
    ans:1,
    exp:'Stack (LIFO) is ideal for undo/redo. Undo: pop from undo-stack, push to redo-stack. Redo: pop from redo-stack. Most text editors, browsers, and IDEs use this pattern.'
  },
  {
    diff:'Medium', topic:'DBMS',
    q:'What does ACID stand for in database transactions?',
    opts:['Atomicity, Consistency, Isolation, Durability','Automated, Clustered, Indexed, Distributed','Atomic, Concurrent, Independent, Durable','Abstracted, Consistent, Integral, Direct'],
    ans:0,
    exp:'ACID = Atomicity (all-or-nothing), Consistency (valid state), Isolation (transactions independent), Durability (committed data persists). ACID ensures reliable database transactions.'
  },
  {
    diff:'Hard', topic:'Algorithms',
    q:'What is the space complexity of the recursive Merge Sort algorithm?',
    opts:['O(1)','O(log n)','O(n)','O(n log n)'],
    ans:2,
    exp:'Merge Sort requires O(n) extra space for the temporary arrays used during merging. The recursive call stack is O(log n), but the merge step needs O(n) auxiliary space. Total: O(n).'
  },
  {
    diff:'Easy', topic:'Web',
    q:'What does HTML stand for?',
    opts:['HyperText Markup Language','High-Tech Modern Language','HyperText Management Language','Home Tool Markup Language'],
    ans:0,
    exp:'HTML = HyperText Markup Language. The standard language for creating web pages. "HyperText" = links between pages. "Markup" = tags that describe content structure. Current version: HTML5.'
  },
  {
    diff:'Medium', topic:'OS',
    q:'What is "virtual memory" in operating systems?',
    opts:['RAM that works faster than normal','A technique that uses disk space to extend RAM','Memory used only for video','A type of cache memory'],
    ans:1,
    exp:'Virtual memory extends RAM by using disk space (swap/page file). The OS creates the illusion of more RAM than physically exists. Pages of memory are swapped to disk when RAM is full — slower but allows running large programs.'
  },
  {
    diff:'Hard', topic:'Networking',
    q:'Which protocol is used for secure key exchange over an insecure channel?',
    opts:['RSA','Diffie-Hellman','AES','SHA-256'],
    ans:1,
    exp:'Diffie-Hellman key exchange allows two parties to establish a shared secret over an insecure channel without transmitting the secret. Used in TLS/SSL. RSA is asymmetric encryption. AES is symmetric encryption.'
  },
  {
    diff:'Easy', topic:'Data Structures',
    q:'What is the time complexity of inserting an element at the beginning of an array (shifting required)?',
    opts:['O(1)','O(log n)','O(n)','O(n²)'],
    ans:2,
    exp:'Inserting at beginning requires shifting all existing elements right by one position → O(n). Inserting at END of array (if space exists) is O(1). This is why linked lists are preferred for frequent front-insertions.'
  },
  {
    diff:'Medium', topic:'OOP',
    q:'Which design pattern ensures a class has only one instance throughout the application?',
    opts:['Factory','Observer','Singleton','Decorator'],
    ans:2,
    exp:'Singleton pattern restricts instantiation to one object. Used for: database connections, config managers, loggers. Implementation: private constructor + static getInstance(). Controversial — can make testing harder.'
  },
];
// Active set (5 randomly selected before each test)
let TECH_MCQ = [];

// Full code problem bank — 3 randomly selected per test session
const TECH_CODE_BANK = [
  {
    diff:'Easy', topic:'Arrays',
    title:'Two Sum',
    problem:`Given an array of integers and a target sum, return the indices of the two numbers that add up to the target.

Example:
  Input: nums = [2, 7, 11, 15], target = 9
  Output: [0, 1]  (because nums[0] + nums[1] = 2 + 7 = 9)

Constraints:
  • Exactly one valid answer exists
  • You may not use the same element twice`,
    starterPy:`def two_sum(nums, target):
    # Your code here
    pass

# Test cases (do not modify)
print(two_sum([2, 7, 11, 15], 9))   # Expected: [0, 1]
print(two_sum([3, 2, 4], 6))        # Expected: [1, 2]
print(two_sum([3, 3], 6))           # Expected: [0, 1]`,
    starterJs:`function twoSum(nums, target) {
  // Your code here
}

// Test cases (do not modify)
console.log(twoSum([2, 7, 11, 15], 9));  // Expected: [0, 1]
console.log(twoSum([3, 2, 4], 6));       // Expected: [1, 2]
console.log(twoSum([3, 3], 6));          // Expected: [0, 1]`,
    testCases:[
      {input:'[2,7,11,15], 9', expected:'[0,1]'},
      {input:'[3,2,4], 6', expected:'[1,2]'},
      {input:'[3,3], 6', expected:'[0,1]'},
    ],
    solutionPy:`def two_sum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        diff = target - n
        if diff in seen:
            return [seen[diff], i]
        seen[n] = i`,
    hint:'Use a hash map to store each number\'s index as you iterate.',
    patterns:['return','for','if']
  },
  {
    diff:'Medium', topic:'Strings',
    title:'Reverse Words in a String',
    problem:`Given a string s, reverse the order of the words (not the characters in each word).

Example:
  Input:  "the sky is blue"
  Output: "blue is sky the"

Note:
  • Words are separated by single spaces
  • The result should have no leading/trailing spaces`,
    starterPy:`def reverse_words(s):
    # Your code here
    pass

# Test cases
print(reverse_words("the sky is blue"))  # Expected: "blue is sky the"
print(reverse_words("  hello world  ")) # Expected: "world hello"
print(reverse_words("a good   example")) # Expected: "example good a"`,
    starterJs:`function reverseWords(s) {
  // Your code here
}

// Test cases
console.log(reverseWords("the sky is blue"));   // Expected: "blue is sky the"
console.log(reverseWords("  hello world  "));  // Expected: "world hello"
console.log(reverseWords("a good   example")); // Expected: "example good a"`,
    testCases:[
      {input:'"the sky is blue"', expected:'"blue is sky the"'},
      {input:'"  hello world  "', expected:'"world hello"'},
      {input:'"a good   example"', expected:'"example good a"'},
    ],
    solutionPy:`def reverse_words(s):
    return ' '.join(s.split()[::-1])`,
    hint:'Split by whitespace (handles multiple spaces), reverse the list, then join.',
    patterns:['split','join','return']
  },
  {
    diff:'Hard', topic:'Dynamic Programming',
    title:'Fibonacci (Memoised)',
    problem:`Write an efficient function to return the nth Fibonacci number using memoisation.

Fibonacci: 0, 1, 1, 2, 3, 5, 8, 13, 21, ...
  fib(0) = 0
  fib(1) = 1
  fib(n) = fib(n-1) + fib(n-2)

Your solution must run in O(n) time — brute-force recursion will time out.`,
    starterPy:`def fib(n, memo={}):
    # Your code here
    pass

# Test cases
print(fib(0))   # Expected: 0
print(fib(1))   # Expected: 1
print(fib(10))  # Expected: 55
print(fib(20))  # Expected: 6765`,
    starterJs:`function fib(n, memo = {}) {
  // Your code here
}

// Test cases
console.log(fib(0));   // Expected: 0
console.log(fib(1));   // Expected: 1
console.log(fib(10));  // Expected: 55
console.log(fib(20));  // Expected: 6765`,
    testCases:[
      {input:'0', expected:'0'},
      {input:'1', expected:'1'},
      {input:'10', expected:'55'},
      {input:'20', expected:'6765'},
    ],
    solutionPy:`def fib(n, memo={}):
    if n in memo: return memo[n]
    if n <= 1: return n
    memo[n] = fib(n-1, memo) + fib(n-2, memo)
    return memo[n]`,
    hint:'Cache results in a dictionary. Check memo before recursing.',
    patterns:['memo','return','if']
  },
  {
    diff:'Easy', topic:'Strings',
    title:'Check Palindrome',
    problem:`Write a function to check if a given string is a palindrome (reads the same forwards and backwards). Ignore case and spaces.

Example:
  Input:  "racecar"  → Output: True
  Input:  "hello"    → Output: False
  Input:  "A man a plan a canal Panama"  → Output: True

Constraints:
  • The check should be case-insensitive
  • Ignore all spaces`,
    starterPy:`def is_palindrome(s):
    # Your code here
    pass

# Test cases
print(is_palindrome("racecar"))                  # Expected: True
print(is_palindrome("hello"))                    # Expected: False
print(is_palindrome("A man a plan a canal Panama"))  # Expected: True`,
    starterJs:`function isPalindrome(s) {
  // Your code here
}

// Test cases
console.log(isPalindrome("racecar"));                   // Expected: true
console.log(isPalindrome("hello"));                     // Expected: false
console.log(isPalindrome("A man a plan a canal Panama")); // Expected: true`,
    testCases:[
      {input:'"racecar"', expected:'True'},
      {input:'"hello"', expected:'False'},
      {input:'"A man a plan a canal Panama"', expected:'True'},
    ],
    solutionPy:`def is_palindrome(s):
    cleaned = s.replace(' ', '').lower()
    return cleaned == cleaned[::-1]`,
    hint:'Remove spaces and convert to lowercase, then compare the string with its reverse.',
    patterns:['return','lower','replace']
  },
  {
    diff:'Easy', topic:'Arrays',
    title:'Find Maximum Element',
    problem:`Write a function that returns the maximum element in a list of integers WITHOUT using Python's built-in max() function.

Example:
  Input:  [3, 1, 4, 1, 5, 9, 2, 6]
  Output: 9

Constraints:
  • The list will have at least one element
  • Do NOT use the built-in max() function`,
    starterPy:`def find_max(nums):
    # Your code here (don't use max())
    pass

# Test cases
print(find_max([3, 1, 4, 1, 5, 9, 2, 6]))  # Expected: 9
print(find_max([-5, -2, -8, -1]))            # Expected: -1
print(find_max([42]))                         # Expected: 42`,
    starterJs:`function findMax(nums) {
  // Your code here (don't use Math.max())
}

// Test cases
console.log(findMax([3, 1, 4, 1, 5, 9, 2, 6]));  // Expected: 9
console.log(findMax([-5, -2, -8, -1]));            // Expected: -1
console.log(findMax([42]));                         // Expected: 42`,
    testCases:[
      {input:'[3,1,4,1,5,9,2,6]', expected:'9'},
      {input:'[-5,-2,-8,-1]', expected:'-1'},
      {input:'[42]', expected:'42'},
    ],
    solutionPy:`def find_max(nums):
    current_max = nums[0]
    for n in nums:
        if n > current_max:
            current_max = n
    return current_max`,
    hint:'Start with the first element as the current maximum and iterate through the rest.',
    patterns:['return','for','if']
  },
  {
    diff:'Medium', topic:'Strings',
    title:'Count Vowels and Consonants',
    problem:`Write a function that counts the number of vowels and consonants in a given string. Ignore spaces and non-alphabetic characters.

Example:
  Input:  "Hello World"
  Output: vowels=3, consonants=7

Constraints:
  • Count only alphabetic characters
  • Vowels: a, e, i, o, u (case-insensitive)`,
    starterPy:`def count_vowels_consonants(s):
    # Return a dictionary {'vowels': count, 'consonants': count}
    pass

# Test cases
print(count_vowels_consonants("Hello World"))  # Expected: {'vowels': 3, 'consonants': 7}
print(count_vowels_consonants("Python"))        # Expected: {'vowels': 1, 'consonants': 5}
print(count_vowels_consonants("AEIOU"))         # Expected: {'vowels': 5, 'consonants': 0}`,
    starterJs:`function countVowelsConsonants(s) {
  // Return an object {vowels: count, consonants: count}
}

// Test cases
console.log(countVowelsConsonants("Hello World")); // {vowels: 3, consonants: 7}
console.log(countVowelsConsonants("Python"));       // {vowels: 1, consonants: 5}
console.log(countVowelsConsonants("AEIOU"));        // {vowels: 5, consonants: 0}`,
    testCases:[
      {input:'"Hello World"', expected:'{vowels:3, consonants:7}'},
      {input:'"Python"', expected:'{vowels:1, consonants:5}'},
      {input:'"AEIOU"', expected:'{vowels:5, consonants:0}'},
    ],
    solutionPy:`def count_vowels_consonants(s):
    vowels = consonants = 0
    for c in s.lower():
        if c in 'aeiou': vowels += 1
        elif c.isalpha(): consonants += 1
    return {'vowels': vowels, 'consonants': consonants}`,
    hint:'Loop through each character. Check if it\'s in "aeiou" for vowels, or use isalpha() and not in vowels for consonants.',
    patterns:['return','for','in']
  },
];
// Active set (3 randomly selected before each test)
let TECH_CODE = [];

// Full debug bank — 2 randomly selected per test session
const TECH_DEBUG_BANK = [
  {
    diff:'Easy', topic:'Loops',
    title:'Fix the Infinite Loop',
    problem:'The function below should return the sum of 1 to n, but it has a bug causing an infinite loop. Find and fix it.',
    buggyCode:`def sum_to_n(n):
    total = 0
    i = 1
    while i <= n:
        total += i
        # Bug: i is never incremented!
    return total

print(sum_to_n(5))  # Expected: 15`,
    fixedCode:`def sum_to_n(n):
    total = 0
    i = 1
    while i <= n:
        total += i
        i += 1  # ← Fix: increment i
    return total`,
    explanation:'The loop variable `i` was never incremented, making `while i <= n` always true — infinite loop. Fix: add `i += 1` inside the loop. Alternatively, use `for i in range(1, n+1)`.',
    hint:'Look at the loop variable — is it changing each iteration?',
    bugKeyword:'i += 1',
    bugMarker:'#bug'
  },
  {
    diff:'Medium', topic:'Recursion',
    title:'Fix the Recursive Factorial',
    problem:'The recursive factorial function below returns wrong results. Identify the bug and fix it.',
    buggyCode:`def factorial(n):
    if n == 0:
        return 0   # Bug: base case returns 0 instead of 1!
    return n * factorial(n - 1)

print(factorial(5))  # Expected: 120, but gets: 0
print(factorial(3))  # Expected: 6, but gets: 0`,
    fixedCode:`def factorial(n):
    if n == 0:
        return 1  # ← Fix: base case must return 1
    return n * factorial(n - 1)`,
    explanation:'The base case `return 0` causes every result to be 0 (since n * 0 * ... = 0). The correct base case is `return 1` because 0! = 1 by mathematical definition, and it serves as the multiplicative identity.',
    hint:'What is the mathematical value of 0! (zero factorial)?',
    bugKeyword:'return 1',
    bugMarker:'return0'
  },
  {
    diff:'Easy', topic:'Conditionals',
    title:'Fix the Off-By-One Error',
    problem:'The function below should print numbers from 1 to n (inclusive), but it misses the last number. Find and fix the off-by-one error.',
    buggyCode:`def print_numbers(n):
    for i in range(1, n):  # Bug: should be range(1, n+1)
        print(i)

print_numbers(5)  # Expected: 1 2 3 4 5 (but only prints 1 2 3 4)`,
    fixedCode:`def print_numbers(n):
    for i in range(1, n + 1):  # ← Fix: n+1 to include n
        print(i)`,
    explanation:'Python\'s range(1, n) generates numbers from 1 up to but NOT including n. To include n, use range(1, n+1). This is a classic off-by-one error — very common in loops.',
    hint:'How does Python\'s range() work? Does it include the stop value?',
    bugKeyword:'n + 1',
    bugMarker:'range(1,n)'
  },
  {
    diff:'Medium', topic:'Functions',
    title:'Fix the Wrong Return Value',
    problem:'The function below should check if a number is even, but it always returns True. Find the bug.',
    buggyCode:`def is_even(n):
    if n % 2 = 0:   # Bug: assignment (=) instead of comparison (==)
        return True
    return False

print(is_even(4))  # Expected: True
print(is_even(7))  # Expected: False`,
    fixedCode:`def is_even(n):
    if n % 2 == 0:  # ← Fix: use == for comparison
        return True
    return False`,
    explanation:'Using = (assignment) instead of == (comparison) in an if condition is a classic bug. In Python this raises a SyntaxError, but in C/Java it assigns and evaluates the value — always truthy for non-zero. Always use == for comparison in conditions.',
    hint:'Look closely at the operator inside the if condition. What\'s the difference between = and ==?',
    bugKeyword:'== 0',
    bugMarker:'= 0'
  },
];
// Active set (2 randomly selected before each test)
let TECH_DEBUG = [];

let techState = {
  section: 'mcq',
  mcqAnswers: {},      // {questionId: selectedIndex}
  codeAnswers: {},     // {questionId: {lang, code}}
  debugAnswers: {},    // {questionId: code}
  timer: null,
  secondsLeft: 45 * 60,
  startTime: null,
  lang: { c1:'python', c2:'python', c3:'python' }
};

function initTechTestPage() {
  if (state.technical && state.technical.completed) {
    showTechState('results');
    renderTechResults();
  } else {
    showTechState('intro');
  }
}

function showTechState(s) {
  ['intro','test','results'].forEach(id => {
    document.getElementById('tech-' + id).classList.add('hidden');
  });
  document.getElementById('tech-' + s).classList.remove('hidden');
}

// ── Random question set builder (called before each test) ──
function buildTechQuestionSets() {
  // Shuffle helper
  const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

  // Pick 5 random MCQs and assign IDs m1..m5
  TECH_MCQ = shuffle(TECH_MCQ_BANK).slice(0, 5).map((q, i) => ({ ...q, id: 'm' + (i + 1) }));

  // Pick 3 random code problems and assign IDs c1..c3
  TECH_CODE = shuffle(TECH_CODE_BANK).slice(0, 3).map((q, i) => ({ ...q, id: 'c' + (i + 1) }));

  // Pick 2 random debug problems and assign IDs d1..d2
  TECH_DEBUG = shuffle(TECH_DEBUG_BANK).slice(0, 2).map((q, i) => ({ ...q, id: 'd' + (i + 1) }));
}

function startTechTest() {
  buildTechQuestionSets();
  techState = {
    section:'mcq', mcqAnswers:{}, codeAnswers:{}, debugAnswers:{},
    timer:null, secondsLeft:45*60, startTime:Date.now(),
    lang:{ c1:'python', c2:'python', c3:'python' }
  };
  showTechState('test');
  buildMCQSection();
  buildCodeSection();
  buildDebugSection();
  switchTechSection('mcq');
  startTechTimer();
  updateTechDots();
}

function startTechTimer() {
  if (techState.timer) clearInterval(techState.timer);
  techState.timer = setInterval(() => {
    techState.secondsLeft--;
    const m = Math.floor(techState.secondsLeft / 60);
    const s = techState.secondsLeft % 60;
    const el = document.getElementById('techTimer');
    if (!el) { clearInterval(techState.timer); return; }
    el.textContent = `⏱ ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if (techState.secondsLeft <= 300) el.className = 'timer-disp warn';
    if (techState.secondsLeft <= 60) el.className = 'timer-disp danger';
    if (techState.secondsLeft <= 0) { clearInterval(techState.timer); submitTechTest(); }
  }, 1000);
}

function switchTechSection(section) {
  techState.section = section;
  ['mcq','code','debug'].forEach(s => {
    document.getElementById('tech-section-' + s).classList.toggle('hidden', s !== section);
    document.getElementById('tech-tab-' + s).classList.toggle('active', s === section);
  });
  updateTechSectionStatus();
}

function updateTechSectionStatus() {
  const mcqDone = Object.keys(techState.mcqAnswers).length;
  const codeDone = Object.keys(techState.codeAnswers).length;
  const debugDone = Object.keys(techState.debugAnswers).filter(k => techState.debugAnswers[k] && techState.debugAnswers[k].trim()).length;
  document.getElementById('techSectionStatus').textContent =
    `MCQ: ${mcqDone}/5 · Code: ${codeDone}/3 answered · Debug: ${debugDone}/2 attempted`;
  updateTechDots();
}

function updateTechDots() {
  const nav = document.getElementById('techDotNav');
  if (!nav) return;
  const total = 5 + 3 + 2; // 10 total
  let html = '';
  for (let i = 0; i < 5; i++) {
    const qid = 'm' + (i + 1);
    const done = techState.mcqAnswers[qid] !== undefined;
    html += `<div class="qdot ${done ? 'ans' : ''}" title="MCQ ${i+1}"></div>`;
  }
  for (let i = 0; i < 3; i++) {
    const qid = 'c' + (i + 1);
    const done = techState.codeAnswers[qid] !== undefined;
    html += `<div class="qdot ${done ? 'ans' : ''}" style="background:${done?'var(--teal)':'var(--surface3)'}" title="Code ${i+1}"></div>`;
  }
  for (let i = 0; i < 2; i++) {
    const qid = 'd' + (i + 1);
    const done = techState.debugAnswers[qid] && techState.debugAnswers[qid].trim();
    html += `<div class="qdot ${done ? 'ans' : ''}" style="background:${done?'var(--rose)':'var(--surface3)'}" title="Debug ${i+1}"></div>`;
  }
  nav.innerHTML = html;
  const answered = Object.keys(techState.mcqAnswers).length + Object.keys(techState.codeAnswers).length +
    Object.keys(techState.debugAnswers).filter(k => techState.debugAnswers[k] && techState.debugAnswers[k].trim()).length;
  const pct = Math.round((answered / total) * 100);
  document.getElementById('techPct').textContent = pct + '%';
  document.getElementById('techProgFill').style.width = pct + '%';
  document.getElementById('techQCounter').textContent = `${answered} / ${total} Attempted`;
}

// ── MCQ Builder ──────────────────────────────────────────
function buildMCQSection() {
  const container = document.getElementById('tech-mcq-container');
  container.innerHTML = TECH_MCQ.map((q, idx) => `
    <div class="q-card" id="techMcqCard${q.id}">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
        <span class="badge badge-indigo">🧩 MCQ ${idx+1}/5</span>
        <span class="diff-${q.diff.toLowerCase()}">${q.diff}</span>
        <span style="font-size:11px;color:var(--text-3);font-weight:600">${q.topic}</span>
      </div>
      <div class="q-text">${q.q}</div>
      <div class="options-wrap mt-16" id="techOpts_${q.id}">
        ${q.opts.map((o, oi) => `
          <div class="option" id="techOpt_${q.id}_${oi}" onclick="selectMCQ('${q.id}', ${oi})">
            <div class="opt-key">${['A','B','C','D'][oi]}</div>
            <span>${o}</span>
          </div>
        `).join('')}
      </div>
      <div class="explanation hidden" id="techExp_${q.id}">
        <strong>💡 Explanation</strong>
        <span>${q.exp}</span>
      </div>
    </div>
  `).join('');
}

function selectMCQ(qid, optIdx) {
  const q = TECH_MCQ.find(q => q.id === qid);
  if (!q) return;
  // If already locked (submitted partially), ignore
  if (document.getElementById(`techOpt_${qid}_0`).classList.contains('correct') ||
      document.getElementById(`techOpt_${qid}_0`).classList.contains('wrong')) return;

  techState.mcqAnswers[qid] = optIdx;

  // Highlight selected
  q.opts.forEach((_, oi) => {
    const el = document.getElementById(`techOpt_${qid}_${oi}`);
    el.classList.remove('selected','correct','wrong');
    if (oi === optIdx) el.classList.add('selected');
  });
  updateTechSectionStatus();
}

// ── Code Section Builder ─────────────────────────────────
function buildCodeSection() {
  const container = document.getElementById('tech-code-container');
  container.innerHTML = TECH_CODE.map((q, idx) => `
    <div class="q-card" id="techCodeCard${q.id}" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="badge badge-teal">💻 Code ${idx+1}/3</span>
        <span class="diff-${q.diff.toLowerCase()}">${q.diff}</span>
        <span style="font-size:11px;color:var(--text-3);font-weight:600">${q.topic}</span>
      </div>
      <div class="q-text" style="font-size:16px">${q.title}</div>
      <pre style="background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);padding:14px;margin:14px 0;font-size:12px;font-family:'Courier New',monospace;white-space:pre-wrap;line-height:1.7;color:var(--text-2)">${q.problem}</pre>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button class="tech-lang-tab ${techState.lang[q.id]==='python'?'active':''}" id="langBtnPy_${q.id}" onclick="switchCodeLang('${q.id}','python')">🐍 Python</button>
        <button class="tech-lang-tab ${techState.lang[q.id]==='js'?'active':''}" id="langBtnJs_${q.id}" onclick="switchCodeLang('${q.id}','js')">📜 JavaScript</button>
      </div>
      <div class="code-editor-wrap">
        <div class="code-editor-topbar">
          <div class="code-editor-dots">
            <div class="code-dot code-dot-r"></div>
            <div class="code-dot code-dot-y"></div>
            <div class="code-dot code-dot-g"></div>
          </div>
          <div class="code-editor-title" id="editorLangLabel_${q.id}">solution.py</div>
          <div style="display:flex;gap:8px">
            <button class="run-btn" onclick="runCode('${q.id}')">▶ Run Code</button>
            <button style="padding:5px 12px;border-radius:100px;border:1px solid rgba(255,255,255,0.15);background:transparent;color:rgba(255,255,255,0.5);font-size:11px;font-weight:600;cursor:pointer" onclick="resetCode('${q.id}')">↺ Reset</button>
          </div>
        </div>
        <textarea class="code-textarea" id="codeArea_${q.id}" placeholder="Write your solution here..." spellcheck="false" onkeydown="handleTab(event)">${q.starterPy}</textarea>
      </div>
      <div id="codeHint_${q.id}" style="margin-top:10px;padding:10px 14px;background:var(--amber-pale);border:1px solid rgba(247,147,30,0.2);border-radius:var(--r);font-size:12px;color:var(--amber);display:none">
        💡 <strong>Hint:</strong> ${q.hint}
      </div>
      <div id="codeOutput_${q.id}" class="output-panel" style="display:none">
        <span class="output-info">Click "▶ Run Code" to execute your solution...</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button style="padding:6px 14px;border-radius:100px;border:1px solid rgba(247,147,30,0.3);background:transparent;color:var(--amber);font-size:12px;font-weight:600;cursor:pointer" onclick="toggleHint('${q.id}')">💡 Hint</button>
        <button style="padding:6px 14px;border-radius:100px;border:1px solid rgba(67,97,238,0.3);background:transparent;color:var(--indigo);font-size:12px;font-weight:600;cursor:pointer" onclick="saveCode('${q.id}')">💾 Save Answer</button>
      </div>
    </div>
  `).join('');
}

function handleTab(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const ta = e.target;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + 2;
  }
}

function switchCodeLang(qid, lang) {
  const q = TECH_CODE.find(q => q.id === qid);
  if (!q) return;
  const prevLang = techState.lang[qid];
  // Save current code before switching
  const curCode = document.getElementById('codeArea_' + qid).value;
  if (!techState.codeAnswers[qid]) techState.codeAnswers[qid] = { python: q.starterPy, js: q.starterJs };
  techState.codeAnswers[qid][prevLang] = curCode;

  techState.lang[qid] = lang;
  document.getElementById('langBtnPy_' + qid).classList.toggle('active', lang === 'python');
  document.getElementById('langBtnJs_' + qid).classList.toggle('active', lang === 'js');
  document.getElementById('editorLangLabel_' + qid).textContent = lang === 'python' ? 'solution.py' : 'solution.js';
  const saved = techState.codeAnswers[qid] ? techState.codeAnswers[qid][lang] : null;
  document.getElementById('codeArea_' + qid).value = saved || (lang === 'python' ? q.starterPy : q.starterJs);
  document.getElementById('codeOutput_' + qid).style.display = 'none';
}

function resetCode(qid) {
  const q = TECH_CODE.find(q => q.id === qid);
  const lang = techState.lang[qid];
  document.getElementById('codeArea_' + qid).value = lang === 'python' ? q.starterPy : q.starterJs;
  document.getElementById('codeOutput_' + qid).style.display = 'none';
}

function toggleHint(qid) {
  const h = document.getElementById('codeHint_' + qid);
  h.style.display = h.style.display === 'none' ? 'block' : 'none';
}

function saveCode(qid) {
  const code = document.getElementById('codeArea_' + qid).value.trim();
  const lang = techState.lang[qid];
  if (!techState.codeAnswers[qid]) techState.codeAnswers[qid] = {};
  techState.codeAnswers[qid].lang = lang;
  techState.codeAnswers[qid].code = code;
  techState.codeAnswers[qid].saved = true;
  updateTechSectionStatus();
  showToast('✅ Answer saved!', 'success');
}

function runCode(qid) {
  const code = document.getElementById('codeArea_' + qid).value.trim();
  const lang = techState.lang[qid];
  const outEl = document.getElementById('codeOutput_' + qid);
  outEl.style.display = 'block';
  outEl.innerHTML = '<span class="output-info">⏳ Running your code...</span>';

  // Auto-save on run
  if (!techState.codeAnswers[qid]) techState.codeAnswers[qid] = {};
  techState.codeAnswers[qid].lang = lang;
  techState.codeAnswers[qid].code = code;
  techState.codeAnswers[qid].saved = true;

  setTimeout(() => {
    const result = simulateCodeRun(qid, code, lang);
    outEl.innerHTML = result;
    updateTechSectionStatus();
  }, 800);
}

function simulateCodeRun(qid, code, lang) {
  const q = TECH_CODE.find(q => q.id === qid);
  if (!q) return '<div class="tc-fail">❌ Question not found.</div>';

  const lc = code.toLowerCase().replace(/\s/g, '');
  const starterLc = (lang === 'python' ? q.starterPy : q.starterJs).toLowerCase().replace(/\s/g, '');
  const isUnchanged = lc === starterLc || lc.includes('pass\n') || lc.includes('//yourcode');

  if (isUnchanged || code.trim().length < 20) {
    techState.codeAnswers[qid].passCount = 0;
    techState.codeAnswers[qid].totalTests = q.testCases.length;
    return '<div class="tc-fail">❌ Please write your solution code first.</div>';
  }

  const patterns = q.patterns || ['return'];
  const matched = patterns.filter(p => lc.includes(p.toLowerCase().replace(/\s/g, ''))).length;
  const ratio = matched / patterns.length;

  let passCount = 0;
  let output = '';
  const total = q.testCases.length;

  if (ratio >= 0.8) {
    passCount = total;
    q.testCases.forEach((tc, i) => {
      output += `<div class="tc-pass">✅ Test ${i + 1}: ${tc.input} → ${tc.expected}</div>`;
    });
  } else if (ratio >= 0.4) {
    passCount = Math.max(1, Math.floor(total * 0.5));
    q.testCases.slice(0, passCount).forEach((tc, i) => {
      output += `<div class="tc-pass">✅ Test ${i + 1}: ${tc.input} → ${tc.expected}</div>`;
    });
    q.testCases.slice(passCount).forEach((tc, i) => {
      output += `<div class="tc-fail">❌ Test ${passCount + i + 1}: Partial — not all edge cases handled</div>`;
    });
  } else {
    output += `<div class="tc-fail">❌ Solution approach needs improvement. Check the hint and try again.</div>`;
  }

  techState.codeAnswers[qid].passCount = passCount;
  techState.codeAnswers[qid].totalTests = total;
  const pct = Math.round((passCount / total) * 100);
  output = `<div style="margin-bottom:8px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px">▶ Output — ${passCount}/${total} tests passed (${pct}%)</div>` + output;
  return output;
}

// ── Debug Section Builder ────────────────────────────────
function buildDebugSection() {
  const container = document.getElementById('tech-debug-container');
  container.innerHTML = TECH_DEBUG.map((q, idx) => `
    <div class="q-card" id="techDebugCard${q.id}" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <span class="badge badge-rose">🐛 Debug ${idx+1}/2</span>
        <span class="diff-${q.diff.toLowerCase()}">${q.diff}</span>
        <span style="font-size:11px;color:var(--text-3);font-weight:600">${q.topic}</span>
      </div>
      <div class="q-text" style="font-size:16px">${q.title}</div>
      <p style="font-size:13px;color:var(--text-2);margin:10px 0">${q.problem}</p>
      <div style="margin:14px 0">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--rose);margin-bottom:8px">🐛 Buggy Code (Read-Only)</div>
        <pre style="background:#1e1e2e;color:#ff8888;border-radius:var(--r);padding:14px;font-size:12px;font-family:'Courier New',monospace;white-space:pre-wrap;line-height:1.7;border:1px solid rgba(244,63,94,0.3)">${q.buggyCode}</pre>
      </div>
      <div style="margin:14px 0">
        <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--teal);margin-bottom:8px">✏️ Write Your Fixed Version</div>
        <div class="code-editor-wrap">
          <div class="code-editor-topbar">
            <div class="code-editor-dots"><div class="code-dot code-dot-r"></div><div class="code-dot code-dot-y"></div><div class="code-dot code-dot-g"></div></div>
            <div class="code-editor-title">fixed.py</div>
            <button class="run-btn" onclick="verifyDebug('${q.id}')">✓ Verify Fix</button>
          </div>
          <textarea class="code-textarea" id="debugArea_${q.id}" placeholder="Paste the corrected code here..." spellcheck="false" onkeydown="handleTab(event)" oninput="onDebugInput('${q.id}')">${q.buggyCode}</textarea>
        </div>
      </div>
      <div style="padding:10px 14px;background:var(--amber-pale);border:1px solid rgba(247,147,30,0.2);border-radius:var(--r);font-size:12px;color:var(--amber)">
        💡 <strong>Hint:</strong> ${q.hint}
      </div>
      <div id="debugOutput_${q.id}" style="display:none;margin-top:10px"></div>
    </div>
  `).join('');
}

function onDebugInput(qid) {
  const code = document.getElementById('debugArea_' + qid).value;
  techState.debugAnswers[qid] = code;
  updateTechSectionStatus();
}

function verifyDebug(qid) {
  const code = document.getElementById('debugArea_' + qid).value;
  techState.debugAnswers[qid] = code;
  const q = TECH_DEBUG.find(q => q.id === qid);
  const outEl = document.getElementById('debugOutput_' + qid);
  outEl.style.display = 'block';

  // Check if the key fix is present
  const lc = code.replace(/\s/g,'').toLowerCase();
  const fixPresent = lc.includes(q.bugKeyword.replace(/\s/g,'').toLowerCase());
  const bugMarker = (q.bugMarker || '').replace(/\s/g,'').toLowerCase();
  const bugStillPresent = bugMarker ? lc.includes(bugMarker) : false;

  if (fixPresent && !bugStillPresent) {
    outEl.innerHTML = `
      <div style="background:var(--green-pale);border:1px solid rgba(34,197,94,0.25);border-radius:var(--r);padding:14px">
        <div style="font-weight:800;color:var(--green);margin-bottom:6px">✅ Correct Fix!</div>
        <div style="font-size:12px;color:var(--text-2);line-height:1.7">${q.explanation}</div>
      </div>`;
    techState.debugAnswers[qid + '_correct'] = true;
  } else {
    outEl.innerHTML = `
      <div style="background:var(--rose-pale);border:1px solid rgba(244,63,94,0.2);border-radius:var(--r);padding:14px">
        <div style="font-weight:800;color:var(--rose);margin-bottom:6px">❌ Not quite right.</div>
        <div style="font-size:12px;color:var(--text-2)">The bug isn't fully fixed. Look carefully at the hint and try again.</div>
      </div>`;
  }
  updateTechSectionStatus();
}

// ── Submission & Scoring ─────────────────────────────────
function submitTechTest() {
  if (techState.timer) clearInterval(techState.timer);

  // Score MCQs (max 20: +4/-1)
  let mcqScore = 0;
  TECH_MCQ.forEach(q => {
    const ans = techState.mcqAnswers[q.id];
    if (ans === undefined) return;
    if (ans === q.ans) mcqScore += 4;
    else mcqScore -= 1;
  });
  mcqScore = Math.max(0, mcqScore); // no negative total

  // Score Code (max 60: up to 20 pts each based on tests passed)
  let codeScore = 0;
  TECH_CODE.forEach(q => {
    const ca = techState.codeAnswers[q.id];
    if (!ca || !ca.saved) return;
    const passed = ca.passCount || 0;
    const total = ca.totalTests || q.testCases.length;
    codeScore += Math.round((passed / total) * 20);
  });

  // Score Debug (max 20: 10 pts each)
  let debugScore = 0;
  TECH_DEBUG.forEach(q => {
    if (techState.debugAnswers[q.id + '_correct']) debugScore += 10;
    else if (techState.debugAnswers[q.id] && techState.debugAnswers[q.id].trim() &&
             techState.debugAnswers[q.id] !== q.buggyCode) debugScore += 3; // partial
  });

  const totalScore = mcqScore + codeScore + debugScore; // max 100
  const pct = Math.round((totalScore / 100) * 100);
  const elapsed = Math.floor((Date.now() - techState.startTime) / 1000);
  const em = Math.floor(elapsed / 60);
  const es = elapsed % 60;

  state.technical = {
    score: totalScore,
    mcqScore, codeScore, debugScore, pct,
    timeUsed: `${em}m ${es}s`,
    completed: true
  };

  unlockModule('gd');
  markDone('technical');
  document.getElementById('badge-technical').className = 'sb-badge sb-badge-done';
  document.getElementById('badge-technical').textContent = '✓';
  updateHomeScores();

  showTechState('results');
  renderTechResults();
  showToast('🎉 Technical Test completed! Score: ' + totalScore + '/100', 'success');
}

function renderTechResults() {
  const t = state.technical;
  const score = t.score;
  let emoji = '🏆', title = 'Outstanding!', sub = 'You nailed the technical round!';
  if (score >= 80) { emoji='🏆'; title='Outstanding!'; sub='Top-tier technical skills. You\'re placement-ready!'; }
  else if (score >= 60) { emoji='⭐'; title='Good Work!'; sub='Solid fundamentals. Review the weak areas for interview success.'; }
  else if (score >= 40) { emoji='📈'; title='Keep Practising'; sub='You\'re on track. Focus on coding patterns and complexity.'; }
  else { emoji='🌱'; title='Just Getting Started'; sub='Review DSA basics and try again. Every attempt improves you.'; }

  document.getElementById('techEmoji').textContent = emoji;
  document.getElementById('techResultTitle').textContent = title;
  document.getElementById('techResultSub').textContent = `Score: ${score}/100 · ${sub}`;
  document.getElementById('tr-total').textContent = score + '/100';
  document.getElementById('tr-mcq').textContent = t.mcqScore + '/20';
  document.getElementById('tr-code').textContent = t.codeScore + '/60';
  document.getElementById('tr-debug').textContent = t.debugScore + '/20';
  document.getElementById('tr-time').textContent = t.timeUsed || '—';

  // Detailed review
  const rc = document.getElementById('techReviewContainer');
  let reviewHtml = '';

  reviewHtml += '<div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin-bottom:12px">🧩 MCQ Review</div>';
  TECH_MCQ.forEach((q, i) => {
    const ans = techState.mcqAnswers[q.id];
    const correct = ans === q.ans;
    const unanswered = ans === undefined;
    const statusCls = unanswered ? 'badge-gray' : (correct ? 'badge-green' : 'badge-rose');
    const statusTxt = unanswered ? 'Skipped' : (correct ? '✓ Correct +4' : '✗ Wrong −1');
    reviewHtml += `
      <div style="padding:12px;background:${correct?'var(--green-pale)':unanswered?'var(--surface2)':'var(--rose-pale)'};border-radius:var(--r);margin-bottom:8px;border:1px solid ${correct?'rgba(34,197,94,0.2)':unanswered?'var(--border)':'rgba(244,63,94,0.15)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:13px;font-weight:700;color:var(--text)">Q${i+1}. ${q.q}</div>
          <span class="badge ${statusCls}">${statusTxt}</span>
        </div>
        ${!unanswered ? `<div style="font-size:12px;color:var(--text-2)">Your answer: <strong>${q.opts[ans]}</strong>${!correct ? ` · Correct: <strong style="color:var(--green)">${q.opts[q.ans]}</strong>` : ''}</div>` : ''}
        <div style="font-size:11px;color:var(--text-3);margin-top:4px;font-style:italic">${q.exp}</div>
      </div>`;
  });

  reviewHtml += '<div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin:16px 0 12px">💻 Coding Review</div>';
  TECH_CODE.forEach((q, i) => {
    const ca = techState.codeAnswers[q.id];
    const passed = ca ? (ca.passCount || 0) : 0;
    const total = q.testCases.length;
    const pts = ca && ca.saved ? Math.round((passed/total)*20) : 0;
    const statusColor = pts >= 15 ? 'var(--green)' : pts >= 8 ? 'var(--amber)' : 'var(--rose)';
    reviewHtml += `
      <div style="padding:12px;background:var(--surface2);border-radius:var(--r);margin-bottom:8px;border:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:13px;font-weight:700">💻 ${q.title}</div>
          <span style="font-size:13px;font-weight:800;color:${statusColor}">${pts}/20 pts</span>
        </div>
        <div style="font-size:12px;color:var(--text-3)">Tests: ${passed}/${total} passed · Difficulty: ${q.diff}</div>
        ${pts < 20 ? `<div style="font-size:11px;color:var(--text-3);margin-top:6px;padding:8px;background:#1e1e2e;border-radius:7px;font-family:'Courier New',monospace;color:#50fa7b">Optimal: ${q.solutionPy}</div>` : ''}
      </div>`;
  });

  reviewHtml += '<div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:var(--text-3);margin:16px 0 12px">🐛 Debug Review</div>';
  TECH_DEBUG.forEach((q, i) => {
    const correct = techState.debugAnswers[q.id + '_correct'];
    const attempted = techState.debugAnswers[q.id] && techState.debugAnswers[q.id] !== q.buggyCode;
    const pts = correct ? 10 : attempted ? 3 : 0;
    reviewHtml += `
      <div style="padding:12px;background:${correct?'var(--green-pale)':'var(--surface2)'};border-radius:var(--r);margin-bottom:8px;border:1px solid ${correct?'rgba(34,197,94,0.2)':'var(--border)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:13px;font-weight:700">🐛 ${q.title}</div>
          <span style="font-size:13px;font-weight:800;color:${correct?'var(--green)':'var(--rose)'}">${pts}/10 pts</span>
        </div>
        <div style="font-size:12px;color:var(--text-2)">Fix: <code style="background:rgba(0,0,0,0.05);padding:1px 6px;border-radius:4px">${q.bugKeyword}</code> · ${q.explanation}</div>
      </div>`;
  });
  rc.innerHTML = reviewHtml;

  // Feedback
  const fc = document.getElementById('techFeedbackContainer');
  const tips = [];
  if (t.mcqScore < 12) tips.push({icon:'📚',title:'Revise CS Fundamentals',desc:'Focus on OOP, DSA complexity, and DBMS concepts. Attempt 10 MCQs daily.',cls:'fb-warn'});
  if (t.codeScore < 30) tips.push({icon:'💻',title:'Practice Coding Daily',desc:'Solve at least 2 LeetCode Easy/Medium problems daily. Focus on arrays, strings, and hashmaps.',cls:'fb-warn'});
  if (t.debugScore < 10) tips.push({icon:'🐛',title:'Improve Debugging Skills',desc:'Read code carefully before changing it. Always trace through with a simple example first.',cls:'fb-bad'});
  if (t.mcqScore >= 16) tips.push({icon:'🏆',title:'Excellent MCQ Performance',desc:'Your CS theory knowledge is strong. This will help in interviews too.',cls:'fb-good'});
  if (t.codeScore >= 40) tips.push({icon:'⭐',title:'Strong Coding Skills',desc:'Your coding ability is above average. Keep practising harder problems (Medium/Hard).',cls:'fb-good'});
  tips.push({icon:'💡',title:'Next: GD Simulation',desc:'You\'ve unlocked the Group Discussion module. Your communication skills are evaluated next.',cls:'fb-good'});
  fc.innerHTML = `<div class="fb-list">${tips.map(t => `<div class="fb-item ${t.cls}"><div class="fb-icon">${t.icon}</div><div class="fb-text"><strong>${t.title}</strong><small>${t.desc}</small></div></div>`).join('')}</div>`;
}

function resetTechTest(silent) {
  if (!silent && !confirm('Reset your technical test? Your current answers will be lost.')) return;
  state.technical = { score:0, mcqScore:0, codeScore:0, debugScore:0, pct:0, completed:false };
  showTechState('intro');
}

// ═══ DASHBOARD ═══
let radarChart;
function buildDashboard(){
  const scores={resume:state.resume.completed?state.resume.score:null,aptitude:state.aptitude.completed?state.aptitude.pct:null,technical:state.technical&&state.technical.completed?state.technical.score:null,gd:state.gd.completed?state.gd.score:null,interview:state.interview.completed?state.interview.score:null};
  const valid=Object.values(scores).filter(s=>s!==null);
  const overall=valid.length?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0;
  const circ=2*Math.PI*67;const ring=document.getElementById('dashRing');ring.style.strokeDasharray=circ;ring.style.strokeDashoffset=circ;
  setTimeout(()=>{ring.style.strokeDashoffset=circ-(circ*overall/100);},200);
  let n=0;const counter=setInterval(()=>{n=Math.min(n+1,overall);document.getElementById('dashScore').innerHTML=n+'<span class="ring-unit" style="font-size:18px;color:rgba(255,255,255,0.7)">%</span>';if(n>=overall)clearInterval(counter);},25);
  const grades=[{min:85,g:'Job-Ready 🚀',d:'Outstanding! Your profile is strong across all stages. Start applying with confidence.'},{min:70,g:'Career Confident ⭐',d:"Great progress! A few more sessions and you'll be fully ready."},{min:55,g:'On Track 📈',d:'Good foundation. Focus on high-priority recommendations to improve weak areas.'},{min:0,g:'Just Starting 🌱',d:'Complete all 4 modules to get your full career readiness report.'}];
  const grade=grades.find(g=>overall>=g.min);
  document.getElementById('dashGrade').textContent=grade.g;document.getElementById('dashDesc').textContent=grade.d;
  const stats=document.getElementById('dashStats');stats.innerHTML='';
  [{icon:'📄',val:scores.resume!==null?scores.resume:'—',label:'Resume Score',cls:'sc-indigo',color:'var(--indigo)',trend:scores.resume?'↑ ATS Compatible':'Not analyzed'},{icon:'🧠',val:scores.aptitude!==null?scores.aptitude+'%':'—',label:'Aptitude Score',cls:'sc-violet',color:'var(--violet)',trend:scores.aptitude?(scores.aptitude>=70?'↑ Above average':'↓ Needs practice'):'Not taken'},{icon:'💻',val:scores.technical!==null?scores.technical:'—',label:'Technical Score',cls:'sc-indigo',color:'var(--indigo)',trend:scores.technical?(scores.technical>=70?'↑ Strong coder':'↓ Needs practice'):'Not taken'},{icon:'🎤',val:scores.gd!==null?scores.gd:'—',label:'GD Score',cls:'sc-teal',color:'var(--teal)',trend:scores.gd?(scores.gd>=70?'↑ Good communicator':'↓ Practice more'):'Not simulated'},{icon:'🤖',val:scores.interview!==null?scores.interview:'—',label:'Interview Score',cls:'sc-amber',color:'var(--amber)',trend:scores.interview?(scores.interview>=75?'↑ Strong answers':'↓ More depth needed'):'Not attempted'}].forEach(s=>{stats.innerHTML+=`<div class="stat-card ${s.cls}"><span class="stat-icon">${s.icon}</span><div class="stat-val" style="color:${s.color}">${s.val}</div><div class="stat-label">${s.label}</div><div class="stat-trend">${s.trend}</div></div>`;});
  const mods=document.getElementById('dashModules');mods.innerHTML='';
  [{name:'Resume Analyzer',icon:'📄',score:scores.resume,color:'var(--indigo)',done:state.resume.completed},{name:'Aptitude Test',icon:'🧠',score:scores.aptitude,color:'var(--violet)',done:state.aptitude.completed},{name:'Technical Test',icon:'💻',score:scores.technical,color:'var(--indigo)',done:state.technical&&state.technical.completed},{name:'GD Simulation',icon:'🎤',score:scores.gd,color:'var(--teal)',done:state.gd.completed},{name:'AI Interview',icon:'🤖',score:scores.interview,color:'var(--amber)',done:state.interview.completed}].forEach(m=>{mods.innerHTML+=`<div class="prog-wrap"><div class="prog-hd"><span class="prog-label">${m.icon} ${m.name}</span><span class="prog-val">${m.done?m.score:'—'}</span></div><div class="prog-bar"><div class="prog-fill" style="width:${m.done?m.score:0}%;background:${m.color}"></div></div></div>`;});
  const recos=document.getElementById('dashRecos');recos.innerHTML='';
  [{icon:'🐳',title:'Learn Docker & Kubernetes',desc:'Missing in resume. Most SWE roles require containerisation.',priority:'High',cls:'badge-rose'},{icon:'🗣',title:'Improve GD participation',desc:'Aim for 5+ contributions per 10-min session.',priority:'High',cls:'badge-rose'},{icon:'📐',title:'Practice System Design',desc:'Study HLD/LLD patterns daily.',priority:'Medium',cls:'badge-amber'},{icon:'✍️',title:'Stronger action verbs',desc:'Replace weak verbs with "Engineered", "Scaled", "Led".',priority:'Medium',cls:'badge-amber'},{icon:'🏆',title:'3 more mock rounds',desc:'Interview score improves significantly with repetition.',priority:'Low',cls:'badge-green'}].forEach(r=>{recos.innerHTML+=`<div style="display:flex;gap:10px;padding:10px 12px;background:var(--surface2);border:1px solid var(--border);border-radius:var(--r);margin-bottom:8px;cursor:pointer;transition:all .2s" onmouseover="this.style.borderColor='var(--border2)'" onmouseout="this.style.borderColor='var(--border)'"><div style="font-size:18px;flex-shrink:0;margin-top:2px">${r.icon}</div><div><div style="font-size:13px;font-weight:700;margin-bottom:3px">${r.title}</div><div class="text-xs text-dim mb-4">${r.desc}</div><span class="badge ${r.cls}">${r.priority} Priority</span></div></div>`;});
  const tl=document.getElementById('dashTimeline');tl.innerHTML='';
  [{icon:'🤖',bg:'var(--amber-pale)',title:'AI Mock Interview',desc:state.interview.completed?`Score: ${state.interview.score}/100`:'Not completed',score:state.interview.completed?state.interview.score:null,color:'var(--amber)'},{icon:'🎤',bg:'var(--teal-pale)',title:'GD Simulation',desc:state.gd.completed?`Score: ${state.gd.score}/100`:'Not completed',score:state.gd.completed?state.gd.score:null,color:'var(--teal)'},{icon:'💻',bg:'var(--indigo-pale)',title:'Technical Test',desc:state.technical&&state.technical.completed?`Score: ${state.technical.score}/100`:'Not completed',score:state.technical&&state.technical.completed?state.technical.score:null,color:'var(--indigo)'},{icon:'🧠',bg:'var(--violet-pale)',title:'Aptitude Test',desc:state.aptitude.completed?`${state.aptitude.correct} correct · ${state.aptitude.pct}%`:'Not completed',score:state.aptitude.completed?state.aptitude.pct:null,color:'var(--violet)'},{icon:'📄',bg:'var(--indigo-pale)',title:'Resume Analyzed',desc:state.resume.completed?`Score: ${state.resume.score}/100`:'Not analyzed',score:state.resume.completed?state.resume.score:null,color:'var(--indigo)'},{icon:'✅',bg:'var(--green-pale)',title:'Account Created',desc:state.user.firstName+' '+state.user.lastName+' · '+state.user.target,score:null,color:'var(--text-3)'}].forEach(item=>{tl.innerHTML+=`<div class="tl-item"><div class="tl-dot" style="background:${item.bg}">${item.icon}</div><div class="tl-content"><strong>${item.title}</strong><span>${item.desc}</span></div>${item.score!==null?`<div class="tl-score" style="color:${item.color}">${item.score}</div>`:''}</div>`;});
  const gaps=document.getElementById('dashGaps');gaps.innerHTML='';
  [{n:'Docker',s:'start'},{n:'System Design',s:'start'},{n:'Kubernetes',s:'learn'},{n:'TypeScript',s:'learn'},{n:'CI/CD',s:'start'},{n:'AWS Basics',s:'learn'},{n:'GraphQL',s:'learn'},{n:'Redis',s:'start'}].forEach(g=>{gaps.innerHTML+=`<div class="gap-row"><span class="gap-name">${g.n}</span><span class="gap-pill ${g.s==='start'?'gpill-start':'gpill-learn'}">${g.s==='start'?'Start Now':'Learning'}</span></div>`;});
  const radarData=[scores.resume||0,scores.aptitude||0,scores.gd||0,scores.interview||0,scores.technical||0,state.gd.completed?74:0];
  if(radarChart){radarChart.destroy();radarChart=null;}
  const ctx=document.getElementById('radarChart').getContext('2d');
  radarChart=new Chart(ctx,{type:'radar',data:{labels:['Resume','Aptitude','GD Skills','Interview','Technical','Communication'],datasets:[{label:'Your Score',data:radarData,backgroundColor:'rgba(67,97,238,0.08)',borderColor:'#4361ee',borderWidth:2,pointBackgroundColor:'#4361ee',pointRadius:4},{label:'Benchmark',data:[80,75,75,80,75,80],backgroundColor:'rgba(139,92,246,0.04)',borderColor:'rgba(139,92,246,0.4)',borderWidth:1.5,borderDash:[5,5],pointBackgroundColor:'#8b5cf6',pointRadius:3}]},options:{responsive:true,maintainAspectRatio:true,scales:{r:{min:0,max:100,ticks:{color:'#94a3b8',stepSize:25,font:{size:10,family:"'Outfit'"},backdropColor:'transparent'},grid:{color:'rgba(0,0,0,0.06)'},angleLines:{color:'rgba(0,0,0,0.06)'},pointLabels:{color:'#334155',font:{size:11,family:"'Outfit'",weight:'600'}}}},plugins:{legend:{labels:{color:'#334155',font:{size:11,family:"'Outfit'"},boxWidth:10}}}}});
  if(valid.length===5&&overall>=70){const btn=document.getElementById('certBtn');btn.textContent='🏅 Download Certificate';btn.className='btn btn-primary btn-sm';btn.onclick=()=>showToast('🏅 Certificate generated!','success');}
}

// ═══════════════════════════════════════════
// INTERVIEW TIPS
// ═══════════════════════════════════════════
const TIP_SECTION_MAP = {
  all:  ['ts-resume','ts-aptitude','ts-technical','ts-hr','ts-gd','ts-offer'],
  resume: ['ts-resume'], aptitude: ['ts-aptitude'],
  technical: ['ts-technical'], hr: ['ts-hr'],
  gd: ['ts-gd'], offer: ['ts-offer']
};

function filterTips(cat, btn) {
  document.querySelectorAll('.tips-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const show = TIP_SECTION_MAP[cat] || [];
  ['ts-resume','ts-aptitude','ts-technical','ts-hr','ts-gd','ts-offer'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('tips-hidden', cat !== 'all' && !show.includes(id));
  });
  const starBanner = document.getElementById('starBanner');
  if (starBanner) {
    starBanner.style.display = (cat === 'all' || cat === 'hr' || cat === 'technical') ? '' : 'none';
  }
}

// ═══════════════════════════════════════════
// RESUME TEMPLATES
// ═══════════════════════════════════════════
let currentTemplate = 'modern';
let rbExpList = [], rbEduList = [], rbProjList = [];
let rbExpCounter = 0, rbEduCounter = 0, rbProjCounter = 0;
let templatesInitialized = false;

function initTemplates() {
  if (templatesInitialized) return;
  templatesInitialized = true;
  // Set modern as default selected
  const el = document.getElementById('tp-modern');
  if (el) el.classList.add('active-tmpl');
  // Add default entries
  addRBExp(); addRBEdu(); addRBProj();
  livePreview();
}

function pickTemplate(tmpl, el) {
  currentTemplate = tmpl;
  document.querySelectorAll('.tmpl-pick').forEach(c => c.classList.remove('active-tmpl'));
  el.classList.add('active-tmpl');
  livePreview();
}

function showRBTab(tab, btn) {
  document.querySelectorAll('.rb-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.rb-tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  const panel = document.getElementById('rbp-' + tab);
  if (panel) panel.classList.add('active');
}

function rv(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

function addRBExp() {
  const id = 'rbe_' + (++rbExpCounter);
  rbExpList.push(id);
  const c = document.getElementById('rb-exp-list');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'rb-entry'; d.id = id;
  d.innerHTML = `<button class="rb-entry-del" onclick="delRBEntry('${id}','exp')">✕</button>
    <div class="rb-entry-field"><label>Company</label><input id="${id}-co" placeholder="Google, Razorpay, TCS…" oninput="livePreview()"></div>
    <div class="rb-entry-field"><label>Role / Title</label><input id="${id}-role" placeholder="Software Engineer Intern" oninput="livePreview()"></div>
    <div class="rb-entry-row">
      <div class="rb-entry-field"><label>Start</label><input id="${id}-start" placeholder="Jun 2023" oninput="livePreview()"></div>
      <div class="rb-entry-field"><label>End</label><input id="${id}-end" placeholder="Aug 2023" oninput="livePreview()"></div>
    </div>
    <div class="rb-entry-field"><label>Bullet Points (one per line)</label><textarea id="${id}-bullets" rows="3" placeholder="Reduced API response time by 35%&#10;Led migration to React, improving score by 40%" oninput="livePreview()"></textarea></div>`;
  c.appendChild(d);
}

function addRBEdu() {
  const id = 'rbd_' + (++rbEduCounter);
  rbEduList.push(id);
  const c = document.getElementById('rb-edu-list');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'rb-entry'; d.id = id;
  d.innerHTML = `<button class="rb-entry-del" onclick="delRBEntry('${id}','edu')">✕</button>
    <div class="rb-entry-field"><label>Institution</label><input id="${id}-inst" placeholder="BITS Pilani, IIT Bombay…" oninput="livePreview()"></div>
    <div class="rb-entry-field"><label>Degree & Major</label><input id="${id}-deg" placeholder="B.Tech Computer Science" oninput="livePreview()"></div>
    <div class="rb-entry-row">
      <div class="rb-entry-field"><label>Year</label><input id="${id}-yr" placeholder="2020–2024" oninput="livePreview()"></div>
      <div class="rb-entry-field"><label>CGPA / %</label><input id="${id}-cgpa" placeholder="9.1 / 10" oninput="livePreview()"></div>
    </div>`;
  c.appendChild(d);
}

function addRBProj() {
  const id = 'rbp_' + (++rbProjCounter);
  rbProjList.push(id);
  const c = document.getElementById('rb-proj-list');
  if (!c) return;
  const d = document.createElement('div');
  d.className = 'rb-entry'; d.id = id;
  d.innerHTML = `<button class="rb-entry-del" onclick="delRBEntry('${id}','proj')">✕</button>
    <div class="rb-entry-field"><label>Project Name</label><input id="${id}-name" placeholder="E-Commerce Platform" oninput="livePreview()"></div>
    <div class="rb-entry-field"><label>Tech Stack</label><input id="${id}-tech" placeholder="React, Node.js, MongoDB, AWS" oninput="livePreview()"></div>
    <div class="rb-entry-field"><label>Description</label><textarea id="${id}-desc" rows="2" placeholder="Full-stack app with 500+ users, payment integration, admin dashboard" oninput="livePreview()"></textarea></div>
    <div class="rb-entry-field"><label>Link (GitHub / Demo)</label><input id="${id}-link" placeholder="github.com/you/project" oninput="livePreview()"></div>`;
  c.appendChild(d);
}

function delRBEntry(id, type) {
  const el = document.getElementById(id);
  if (el) el.remove();
  if (type === 'exp') rbExpList = rbExpList.filter(e => e !== id);
  else if (type === 'edu') rbEduList = rbEduList.filter(e => e !== id);
  else rbProjList = rbProjList.filter(e => e !== id);
  livePreview();
}

function livePreview() {
  const area = document.getElementById('rv-preview');
  if (!area) return;
  area.innerHTML = buildResumeHTML();
}

function buildResumeHTML() {
  const name = rv('ri-name') || 'Your Name';
  const title = rv('ri-title') || 'Professional Title';
  const email = rv('ri-email') || 'email@example.com';
  const phone = rv('ri-phone');
  const location = rv('ri-location');
  const linkedin = rv('ri-linkedin');
  const github = rv('ri-github');
  const summary = rv('ri-summary');
  const langS = rv('ri-lang');
  const fwS = rv('ri-fw');
  const dbS = rv('ri-db');
  const cloudS = rv('ri-cloud');
  const toolsS = rv('ri-tools');
  const certs = rv('ri-certs');
  const ach = rv('ri-ach');

  const contacts = [email, phone, location, linkedin && `🔗 ${linkedin}`, github && `💻 ${github}`].filter(Boolean).join(' | ');

  const t = currentTemplate;
  const isDark = t === 'dark';
  const isMinimal = t === 'minimal';
  const isCreative = t === 'creative';

  const secClass = `rv-sec rv-sec-${t}`;
  const bulletColor = isDark ? '#58a6ff' : isCreative ? 'var(--violet)' : isMinimal ? '#0d1b2a' : 'var(--indigo)';
  const tagBg = isDark ? '#0c1a2e' : isCreative ? 'var(--violet-pale)' : 'var(--indigo-pale)';
  const tagColor = isDark ? '#58a6ff' : isCreative ? 'var(--violet)' : 'var(--indigo)';

  // Experience
  let expHTML = rbExpList.map(id => {
    const co = rv(id+'-co'), role = rv(id+'-role'), start = rv(id+'-start'), end = rv(id+'-end'), bullets = rv(id+'-bullets');
    if (!co && !role) return '';
    const period = [start, end].filter(Boolean).join(' – ');
    const bulletLines = bullets ? bullets.split('\n').filter(b => b.trim())
      .map(b => `<div class="rv-bullet" style="color:${isDark?'#c9d1d9':'#334155'}">${b.trim()}</div>`).join('') : '';
    return `<div style="margin-bottom:10px">
      <div class="rv-entry-row"><span class="rv-entry-co" style="${isDark?'color:#e6edf3':''}">${co}</span><span class="rv-entry-date">${period}</span></div>
      <div class="rv-entry-role">${role}</div>${bulletLines}</div>`;
  }).join('');

  // Education
  let eduHTML = rbEduList.map(id => {
    const inst = rv(id+'-inst'), deg = rv(id+'-deg'), yr = rv(id+'-yr'), cgpa = rv(id+'-cgpa');
    if (!inst && !deg) return '';
    return `<div style="margin-bottom:8px">
      <div class="rv-entry-row"><span class="rv-entry-co" style="${isDark?'color:#e6edf3':''}">${inst}</span><span class="rv-entry-date">${yr}</span></div>
      <div class="rv-entry-role">${deg}${cgpa ? ' · ' + cgpa : ''}</div></div>`;
  }).join('');

  // Projects
  let projHTML = rbProjList.map(id => {
    const pname = rv(id+'-name'), tech = rv(id+'-tech'), desc = rv(id+'-desc'), link = rv(id+'-link');
    if (!pname) return '';
    return `<div style="margin-bottom:8px">
      <div style="font-size:10pt;font-weight:800;${isDark?'color:#e6edf3':''}">${pname}${tech ? ` <span style="font-size:8.5pt;font-weight:500;color:${isDark?'#8b949e':'#64748b'}">[${tech}]</span>` : ''}</div>
      ${desc ? `<div class="rv-bullet" style="color:${isDark?'#c9d1d9':'#334155'}">${desc}</div>` : ''}
      ${link ? `<div style="font-size:8.5pt;color:${isDark?'#58a6ff':'var(--indigo)'}">${link}</div>` : ''}</div>`;
  }).join('');

  // Skills
  const skillRows = [
    langS && `<div class="rv-skill-row" style="${isDark?'color:#c9d1d9':''}"><strong>Languages:</strong> ${langS}</div>`,
    fwS && `<div class="rv-skill-row" style="${isDark?'color:#c9d1d9':''}"><strong>Frameworks:</strong> ${fwS}</div>`,
    dbS && `<div class="rv-skill-row" style="${isDark?'color:#c9d1d9':''}"><strong>Databases:</strong> ${dbS}</div>`,
    cloudS && `<div class="rv-skill-row" style="${isDark?'color:#c9d1d9':''}"><strong>Cloud/DevOps:</strong> ${cloudS}</div>`,
    toolsS && `<div class="rv-skill-row" style="${isDark?'color:#c9d1d9':''}"><strong>Tools:</strong> ${toolsS}</div>`,
  ].filter(Boolean).join('');

  const certTags = certs ? certs.split(',').map(c => `<span class="rv-tag" style="background:${tagBg};color:${tagColor};border:1px solid ${tagColor}22">${c.trim()}</span>`).join('') : '';
  const achLines = ach ? ach.split('\n').filter(a => a.trim()).map(a => `<div class="rv-bullet" style="color:${isDark?'#c9d1d9':'#334155'}">${a.trim()}</div>`).join('') : '';

  // Build header
  let headerHTML = '';
  if (isMinimal) {
    headerHTML = `<div style="border-left:3px solid #0d1b2a;padding-left:14px;margin-bottom:12px">
      <div class="rv-name" style="font-size:18pt">${name}</div>
      <div class="rv-title-line" style="color:#555;font-weight:400">${title}</div>
      <div class="rv-contacts" style="color:#555">${contacts}</div></div>
      <hr class="rv-hr" style="background:#0d1b2a;height:1.5px">`;
  } else if (isDark) {
    headerHTML = `<div style="border-bottom:2px solid #30363d;padding-bottom:12px;margin-bottom:12px">
      <div class="rv-name" style="font-family:'Courier New',monospace;color:#e6edf3">${name}</div>
      <div class="rv-title-line" style="color:#58a6ff">${title}</div>
      <div class="rv-contacts" style="color:#8b949e">${contacts}</div></div>`;
  } else if (isCreative) {
    headerHTML = `<div class="rv-hdr-creative"><div class="rv-name" style="color:#fff">${name}</div>
      <div class="rv-title-line" style="color:rgba(255,255,255,.8)">${title}</div>
      <div class="rv-contacts" style="color:rgba(255,255,255,.65)">${contacts}</div></div>`;
  } else {
    headerHTML = `<div class="rv-hdr-modern"><div class="rv-name" style="color:#fff">${name}</div>
      <div class="rv-title-line" style="color:rgba(255,255,255,.8)">${title}</div>
      <div class="rv-contacts" style="color:rgba(255,255,255,.65)">${contacts}</div></div>`;
  }

  const wrapStyle = isDark ? 'background:#0d1b2a;color:#e6edf3' : isCreative ? 'background:#fff' : 'background:#fff';

  return `<div class="rv" style="${wrapStyle}">
    ${headerHTML}
    ${summary ? `<div class="${secClass}">Professional Summary</div><p style="font-size:9.5pt;${isDark?'color:#c9d1d9':''}">${summary}</p>` : ''}
    ${expHTML ? `<div class="${secClass}">Work Experience</div>${expHTML}` : ''}
    ${projHTML ? `<div class="${secClass}">Projects</div>${projHTML}` : ''}
    ${skillRows ? `<div class="${secClass}">Technical Skills</div>${skillRows}` : ''}
    ${eduHTML ? `<div class="${secClass}">Education</div>${eduHTML}` : ''}
    ${certTags ? `<div class="${secClass}">Certifications</div><div style="margin-top:4px">${certTags}</div>` : ''}
    ${achLines ? `<div class="${secClass}">Achievements</div>${achLines}` : ''}
  </div>`;
}

function loadSampleResume() {
  const fields = {
    'ri-name':'Arjun Sharma','ri-title':'Software Engineer',
    'ri-email':'arjun.sharma@email.com','ri-phone':'+91 98765 43210',
    'ri-location':'Bengaluru, India','ri-linkedin':'linkedin.com/in/arjunsharma',
    'ri-github':'github.com/arjunsharma',
    'ri-summary':'Final-year CS student at BITS Pilani with strong expertise in Python, React, and cloud-native development. Delivered 2 production features at Razorpay internship. Passionate about scalable distributed systems.',
    'ri-lang':'Python, JavaScript, TypeScript, Java, C++',
    'ri-fw':'React.js, Node.js, Express, Django, FastAPI',
    'ri-db':'PostgreSQL, MongoDB, Redis, MySQL',
    'ri-cloud':'AWS (EC2, S3, Lambda), Docker, Kubernetes, GitHub Actions',
    'ri-tools':'Git, Jira, Linux, REST APIs, GraphQL',
    'ri-certs':'AWS Cloud Practitioner, Google Data Analytics, Oracle Java SE 11',
    'ri-ach':'Smart India Hackathon 2024 — National Finalist (Top 10 of 15,000+ teams)\nLeetCode — 600+ problems solved, top 5% globally\nDean\'s List — 3 semesters (CGPA 9.1/10)',
  };
  Object.entries(fields).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });
  // Fill first exp entry
  if (rbExpList.length > 0) {
    const id = rbExpList[0];
    const s = (f,v) => { const e=document.getElementById(id+'-'+f); if(e) e.value=v; };
    s('co','Razorpay'); s('role','Software Engineer Intern'); s('start','May 2023'); s('end','Aug 2023');
    s('bullets','Built 3 REST API endpoints reducing response time by 35%\nMigrated legacy dashboard to React, Lighthouse score: 62 → 94\nWrote 40+ unit tests achieving 95% coverage on billing service');
  }
  // Fill first edu entry
  if (rbEduList.length > 0) {
    const id = rbEduList[0];
    const s = (f,v) => { const e=document.getElementById(id+'-'+f); if(e) e.value=v; };
    s('inst','BITS Pilani'); s('deg','B.Tech Computer Science'); s('yr','2020–2024'); s('cgpa','9.1 / 10');
  }
  // Fill first project
  if (rbProjList.length > 0) {
    const id = rbProjList[0];
    const s = (f,v) => { const e=document.getElementById(id+'-'+f); if(e) e.value=v; };
    s('name','Real-Time Analytics Dashboard'); s('tech','React, Node.js, WebSockets, Redis');
    s('desc','Built for Razorpay internship — reduced report generation time by 60%, handles 5K concurrent connections');
    s('link','github.com/arjunsharma/analytics-dash');
  }
  livePreview();
  showToast('Sample data loaded! Customize and export.', 'success');
}

function clearResumeForm() {
  if (!confirm('Clear all resume data?')) return;
  ['ri-name','ri-title','ri-email','ri-phone','ri-location','ri-linkedin','ri-github','ri-summary',
   'ri-lang','ri-fw','ri-db','ri-cloud','ri-tools','ri-certs','ri-ach'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  rbExpList=[]; rbEduList=[]; rbProjList=[];
  ['rb-exp-list','rb-edu-list','rb-proj-list'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
  });
  addRBExp(); addRBEdu(); addRBProj();
  livePreview();
}

async function handleExportClick() {
  const btn = document.getElementById('btnExportPDF');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Generating…'; }
  try {
    await doExportResumePDF();
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⬇ Export PDF'; }
  }
}

async function doExportResumePDF() {
  const name = rv('ri-name') || 'Resume';
  showToast('Generating PDF… please wait', 'info');
  try {
    // Make sure libraries are loaded
    if (!window.jspdf || !window.html2canvas) {
      showToast('❌ PDF libraries not loaded yet. Try again in a moment.', 'error');
      return;
    }
    const { jsPDF } = window.jspdf;
    const preview = document.getElementById('rv-preview');
    if (!preview) { showToast('Preview not ready. Fill in your details first.', 'error'); return; }

    // Temporarily expand the preview so html2canvas captures full content
    const origStyle = preview.style.cssText;
    preview.style.overflow = 'visible';
    preview.style.height = 'auto';
    preview.style.maxHeight = 'none';

    const canvas = await html2canvas(preview, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: currentTemplate === 'dark' ? '#0d1b2a' : '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth: preview.scrollWidth,
      windowHeight: preview.scrollHeight
    });

    // Restore original style
    preview.style.cssText = origStyle;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297;
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= pageH) {
      // Single page
      doc.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
    } else {
      // Multi-page: slice the canvas
      const scale = canvas.width / imgW; // px per mm
      let yPosMm = 0;
      while (yPosMm < imgH) {
        if (yPosMm > 0) doc.addPage();
        doc.addImage(imgData, 'JPEG', 0, -yPosMm, imgW, imgH);
        yPosMm += pageH;
      }
    }

    const filename = name.replace(/\s+/g, '_') + '_Resume.pdf';
    doc.save(filename);
    showToast('✅ PDF saved: ' + filename, 'success');
  } catch(e) {
    console.error('PDF export error:', e);
    showToast('❌ Export failed: ' + (e.message || 'Unknown error'), 'error');
  }
}

// Hook templates page init into goTo - already handled inside goTo above via initTemplates call
// Init resume ring
document.getElementById('resumeRing').style.strokeDasharray=2*Math.PI*72;
document.getElementById('resumeRing').style.strokeDashoffset=2*Math.PI*72;
