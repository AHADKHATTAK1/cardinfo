'use strict';

// ── STATE ────────────────────────────────────────────────────────
let state = {
  cards: [], activities: [],
  scanCount: 0, selectedCardId: null,
  currentLogoDataUrl: null,
  selectedColor: 0, selectedIcon: '🎓',
  designerTab: 'identity',
  currentPage: 'landing',
  currentInnerPage: 'wallet',
  membership: { plan: 'free', orgName: '', revenue: 0 },
  subscriptions: [],
  obRole: null, obPlan: null,
  checkoutPlan: null,
  dsoStartTime: null, dsoTimer: null,
};

// ── CONSTANTS ────────────────────────────────────────────────────
const PLANS = {
  free:       { name: 'Free',       price: 0,   maxCards: 5,        color: '#94a3b8' },
  pro:        { name: 'Pro',        price: 29,  maxCards: 500,      color: '#8b5cf6' },
  enterprise: { name: 'Enterprise', price: 99,  maxCards: Infinity, color: '#f59e0b' },
};

const COLOR_THEMES = [
  { label:'Indigo Night',  gradient:'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)', swatch:'#312e81' },
  { label:'Ocean Deep',    gradient:'linear-gradient(135deg,#0c4a6e 0%,#075985 50%,#0369a1 100%)', swatch:'#075985' },
  { label:'Forest Dark',   gradient:'linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%)', swatch:'#14532d' },
  { label:'Rose Black',    gradient:'linear-gradient(135deg,#4c0519 0%,#881337 50%,#9f1239 100%)', swatch:'#881337' },
  { label:'Amber Noir',    gradient:'linear-gradient(135deg,#451a03 0%,#78350f 50%,#92400e 100%)', swatch:'#78350f' },
  { label:'Slate Pro',     gradient:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)', swatch:'#1e293b' },
  { label:'Violet Storm',  gradient:'linear-gradient(135deg,#2e1065 0%,#4c1d95 50%,#6d28d9 100%)', swatch:'#4c1d95' },
  { label:'Teal Depths',   gradient:'linear-gradient(135deg,#042f2e 0%,#134e4a 50%,#115e59 100%)', swatch:'#134e4a' },
  { label:'Crimson Gold',  gradient:'linear-gradient(135deg,#7f1d1d 0%,#991b1b 40%,#b45309 100%)', swatch:'#991b1b' },
  { label:'Midnight Blue', gradient:'linear-gradient(135deg,#172554 0%,#1e3a8a 50%,#1d4ed8 100%)', swatch:'#1e3a8a' },
  { label:'Purple Haze',   gradient:'linear-gradient(135deg,#3b0764 0%,#6b21a8 50%,#7c3aed 100%)', swatch:'#6b21a8' },
  { label:'Dark Olive',    gradient:'linear-gradient(135deg,#1a2e05 0%,#365314 50%,#3f6212 100%)', swatch:'#365314' },
];

const ICONS = ['🎓','🏢','🏥','📚','🏛️','💪','📖','🏦','🔷','🔬','⚙️','🌐','🚀','💡','🎯','🛡️','⭐','🌟','🔑','💎'];

const ORG_DEFAULTS = {
  university: { icon:'🎓', colorIdx:0,  cardType:'Student ID',   role:'Student'      },
  college:    { icon:'📚', colorIdx:10, cardType:'Student ID',   role:'Student'      },
  company:    { icon:'🏢', colorIdx:5,  cardType:'Employee ID',  role:'Employee'     },
  hospital:   { icon:'🏥', colorIdx:2,  cardType:'Employee ID',  role:'Medical Staff'},
  government: { icon:'🏛️', colorIdx:9,  cardType:'Access Pass',  role:'Officer'      },
  gym:        { icon:'💪', colorIdx:3,  cardType:'Member Card',  role:'Member'       },
  library:    { icon:'📖', colorIdx:7,  cardType:'Member Card',  role:'Member'       },
  bank:       { icon:'🏦', colorIdx:1,  cardType:'Employee ID',  role:'Staff'        },
  other:      { icon:'🔷', colorIdx:5,  cardType:'Access Pass',  role:'Member'       },
};

// ── BOOT ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderColorSwatches();
  renderIconPicker();
  setDefaultDates();
  updatePlanBadge();
  showRoot('landing');

  // Bind modal outside-click
  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => {
      if (e.target === o) { o.classList.remove('open'); document.body.style.overflow = ''; }
    });
  });

  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; });
      closeDemoScan();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openDesigner(); }
  });

  // Load demo after short delay
  setTimeout(loadDemoCards, 400);
});

// ── PERSISTENCE ──────────────────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem('vid3_cards',  JSON.stringify(state.cards));
    localStorage.setItem('vid3_scans',  state.scanCount);
    localStorage.setItem('vid3_acts',   JSON.stringify(state.activities.slice(0, 20)));
    localStorage.setItem('vid3_member', JSON.stringify(state.membership));
    localStorage.setItem('vid3_subs',   JSON.stringify(state.subscriptions));
  } catch (e) {}
}
function loadState() {
  try {
    const c = localStorage.getItem('vid3_cards');  if (c) state.cards = JSON.parse(c);
    const s = localStorage.getItem('vid3_scans');  if (s) state.scanCount = parseInt(s);
    const a = localStorage.getItem('vid3_acts');   if (a) state.activities = JSON.parse(a);
    const m = localStorage.getItem('vid3_member'); if (m) state.membership = JSON.parse(m);
    const sb= localStorage.getItem('vid3_subs');   if (sb) state.subscriptions = JSON.parse(sb);
  } catch (e) {}
}

// ── ROOT PAGE SWITCHING ──────────────────────────────────────────
function showRoot(page) {
  state.currentPage = page;
  ['landing', 'onboarding', 'app'].forEach(p => {
    document.getElementById(`page-${p}`)?.classList.toggle('active', p === page);
  });
  if (page === 'app') renderInnerPage(state.currentInnerPage || 'wallet');
}

function launchApp() { showRoot('app'); }
function startOnboarding(plan) { if (plan) state.obPlan = plan; showRoot('onboarding'); obGoStep(1); }

// ── ONBOARDING ───────────────────────────────────────────────────
function obGoStep(step) {
  [1, 2, 3].forEach(i => {
    document.getElementById(`ob-step${i}`).style.display = i === step ? 'block' : 'none';
    const si = document.getElementById(`ob-s${i}`);
    if (si) { si.classList.toggle('active', i === step); si.classList.toggle('done', i < step); }
  });
}
function selectRole(role) {
  state.obRole = role;
  document.querySelectorAll('.ob-role-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`role-${role}`)?.classList.add('selected');
  const btn = document.getElementById('ob-next1'); if (btn) btn.disabled = false;
}
function obNext(step) { obGoStep(step); }
function selectObPlan(plan) {
  state.obPlan = plan;
  document.querySelectorAll('.ob-plan-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`obplan-${plan}`)?.classList.add('selected');
  const btn = document.getElementById('ob-next2'); if (btn) btn.disabled = false;
}
function obFinish() {
  const name    = document.getElementById('ob-name')?.value.trim();
  const org     = document.getElementById('ob-org')?.value.trim();
  const roleVal = document.getElementById('ob-role-field')?.value.trim() || 'Member';
  const orgType = document.getElementById('ob-orgtype')?.value || 'university';
  if (!name || !org) { showToast('Please enter your name and organization', 'error'); return; }
  const preset = ORG_DEFAULTS[orgType] || ORG_DEFAULTS.other;
  const newCard = {
    id: uid(), holderName: name, orgName: org, orgType,
    role: roleVal, idNumber: generateId(), cardType: preset.cardType,
    colorIdx: preset.colorIdx, icon: preset.icon,
    logoDataUrl: null, flipped: false, email: '', expiry: '', issue: new Date().toISOString().split('T')[0],
    website: '', address: '', phone: '', createdAt: new Date().toISOString(),
  };
  state.cards.unshift(newCard); state.selectedCardId = newCard.id;
  if (state.obPlan && state.obPlan !== 'free') {
    saveState(); showRoot('app'); openCheckout(state.obPlan);
  } else {
    state.membership.plan = 'free'; saveState(); updatePlanBadge();
    showRoot('app'); renderInnerPage('wallet');
    showToast('🎉 Welcome! Your first card is ready.', 'success');
    addActivity(`Onboarding complete: ${name}`, 'green');
  }
}

// ── APP NAV ──────────────────────────────────────────────────────
const ALL_PAGES = ['wallet', 'scan', 'orgs', 'dashboard', 'analytics', 'directory', 'gates', 'security', 'batch', 'notifications', 'developer', 'settings'];

function appNav(page) {
  ALL_PAGES.forEach(p => {
    [`dnav-${p}`, `mnav-${p}`].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', p === page);
    });
  });
  state.currentInnerPage = page;
  renderInnerPage(page);
}

function renderInnerPage(page) {
  state.currentInnerPage = page;
  ALL_PAGES.forEach(p => {
    [`dnav-${p}`, `mnav-${p}`].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', p === page);
    });
  });
  const body = document.getElementById('app-body');
  if (!body) return;
  if (page === 'wallet')        { body.innerHTML = buildWalletHTML(); wireWalletEvents(); }
  if (page === 'scan')          body.innerHTML = buildScanHTML();
  if (page === 'orgs')          body.innerHTML = buildOrgsHTML();
  if (page === 'dashboard')     body.innerHTML = buildDashboardHTML();
  if (page === 'analytics')     body.innerHTML = buildAnalyticsHTML();
  if (page === 'directory')     body.innerHTML = buildDirectoryHTML();
  if (page === 'gates')         body.innerHTML = buildGatesHTML();
  if (page === 'security')      body.innerHTML = buildSecurityHTML();
  if (page === 'batch')         body.innerHTML = buildBatchHTML();
  if (page === 'notifications') body.innerHTML = buildNotificationsHTML();
  if (page === 'developer')     body.innerHTML = buildDeveloperHTML();
  if (page === 'settings')      body.innerHTML = buildSettingsHTML();
}

// ══════════════════════════════════════════════
// WALLET
// ══════════════════════════════════════════════
function buildWalletHTML() {
  const primary = state.cards.find(c => c.id === state.selectedCardId) || state.cards[0];
  const others  = state.cards.filter(c => c.id !== (primary?.id));

  const mainContent = primary ? `
    <div class="mobile-featured">
      ${buildCardHTML(primary, true)}
      <div class="card-actions" style="justify-content:center;flex-wrap:wrap;">
        <button class="card-action-btn primary" onclick="launchDemoScan('${primary.id}')"><i class="fa-solid fa-wifi"></i> NFC Scan</button>
        <button class="card-action-btn" style="background:rgba(6,182,212,.15);border-color:var(--accent-cyan);color:var(--accent-cyan);" onclick="triggerFaceId('${primary.id}')"><i class="fa-solid fa-face-smile"></i> FaceID Unlock</button>
        <button class="card-action-btn" style="background:linear-gradient(135deg,rgba(0,0,0,.7),rgba(30,30,30,.8));border-color:rgba(255,255,255,.2);color:#fff;" onclick="openWalletShare('${primary.id}')"><i class="fa-brands fa-apple"></i> / <span style="color:#4285f4;font-weight:900;font-size:.8rem;">G</span> Add to Wallet</button>
        <button class="card-action-btn" onclick="flipCard('${primary.id}')"><i class="fa-solid fa-rotate"></i> Flip</button>
        <button class="card-action-btn" onclick="printCardSheet()"><i class="fa-solid fa-print"></i> Print Sheet</button>
        <button class="card-action-btn" onclick="openCardDetail('${primary.id}')"><i class="fa-solid fa-circle-info"></i> Details</button>
        <button class="card-action-btn danger" onclick="deleteCard('${primary.id}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>
    ${others.length > 0 ? `
      <div style="margin-bottom:10px;font-size:.74rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Other Cards</div>
      <div class="cards-grid">
        ${others.map(c => `
          <div class="card-list-item" onclick="selectCard('${c.id}')">
            <div style="width:50px;height:34px;border-radius:8px;background:${COLOR_THEMES[c.colorIdx].gradient};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${c.icon}</div>
            <div class="card-list-info">
              <div class="card-list-name">${esc(c.holderName)}</div>
              <div class="card-list-org">${esc(c.orgName)} · ${esc(c.cardType)}</div>
            </div>
            <div class="card-list-arrow"><i class="fa-solid fa-chevron-right"></i></div>
          </div>`).join('')}
      </div>` : ''}
  ` : `
    <div class="empty-wallet">
      <div class="empty-wallet-icon">💳</div>
      <h3>No cards yet</h3>
      <p>Add your first ID card from any university, company, or organization.</p>
      <button class="btn-cta" style="margin-top:10px" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> Add First Card</button>
    </div>`;

  return `
    <div class="wallet-wrap">
      <section class="wallet-main">
        <div class="section-header">
          <div>
            <h1 class="section-title">My Wallet <span class="card-count-badge">${state.cards.length}</span></h1>
            <p class="section-subtitle">Tap NFC to verify · Flip for QR code</p>
          </div>
          <button class="btn-cta" onclick="openDesigner()" style="display:none;" class="desktop-only"><i class="fa-solid fa-plus"></i> Add</button>
        </div>
        ${mainContent}
      </section>
      <aside class="wallet-sidebar" style="border-left:1px solid var(--border-subtle);">
        <div style="margin-bottom:22px;">
          <div class="sidebar-section-title" style="margin-bottom:10px;">Quick Add</div>
          <div class="org-presets">
            <button class="org-preset-btn" onclick="openDesignerPreset('university')"><span class="icon">🎓</span>University</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('company')"><span class="icon">🏢</span>Company</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('hospital')"><span class="icon">🏥</span>Hospital</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('college')"><span class="icon">📚</span>College</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('government')"><span class="icon">🏛️</span>Govt</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('gym')"><span class="icon">💪</span>Gym</button>
          </div>
        </div>
        <div style="margin-bottom:22px;">
          <div class="sidebar-section-title" style="margin-bottom:10px;">Membership</div>
          <div style="background:var(--bg-glass);border:1px solid var(--border-subtle);border-radius:14px;padding:14px;text-align:center;">
            <div style="font-family:'Outfit',sans-serif;font-size:1.3rem;font-weight:900;color:var(--accent-purple);">${PLANS[state.membership.plan]?.name || 'Free'}</div>
            <div style="font-size:.72rem;color:var(--text-muted);margin-bottom:10px;">${state.cards.length} / ${PLANS[state.membership.plan]?.maxCards === Infinity ? '∞' : PLANS[state.membership.plan]?.maxCards} cards</div>
            <button class="btn-cta" style="width:100%;justify-content:center;" onclick="openCheckout('pro')">⚡ Upgrade</button>
          </div>
        </div>
        <div style="margin-bottom:22px;">
          <div class="sidebar-section-title" style="margin-bottom:10px;">Stats</div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${state.cards.length}</div><div class="stat-label">Cards</div></div>
            <div class="stat-card"><div class="stat-value">${new Set(state.cards.map(c => c.orgName)).size}</div><div class="stat-label">Orgs</div></div>
            <div class="stat-card"><div class="stat-value">${state.scanCount}</div><div class="stat-label">NFC Scans</div></div>
            <div class="stat-card"><div class="stat-value">${state.subscriptions.length}</div><div class="stat-label">Subs</div></div>
          </div>
        </div>
        <div>
          <div class="sidebar-section-title" style="margin-bottom:10px;">Activity</div>
          <div class="activity-list" id="activity-list">${buildActivityHTML()}</div>
        </div>
      </aside>
    </div>`;
}

function wireWalletEvents() {
  const primary = state.cards.find(c => c.id === state.selectedCardId) || state.cards[0];
  if (primary) {
    const el = document.getElementById(`card-el-${primary.id}`);
    if (el) { attachTilt(el); if (primary.flipped) generateQR(primary); }
  }
}

function buildActivityHTML() {
  if (!state.activities.length) return '<div class="activity-item"><span class="activity-text" style="color:var(--text-muted);">No activity yet</span></div>';
  return state.activities.slice(0, 6).map(a => `
    <div class="activity-item">
      <div class="activity-dot ${a.color}"></div>
      <span class="activity-text">${esc(a.text)}</span>
      <span class="activity-time">${esc(a.time)}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════════
// SCAN PAGE
// ══════════════════════════════════════════════
function buildScanHTML() {
  const cardOpts = state.cards.length === 0
    ? `<div style="color:var(--text-muted);font-size:.84rem;text-align:center;padding:20px;">No cards yet — add one first</div>`
    : state.cards.map(c => {
        const isSel = c.id === (state.selectedCardId || state.cards[0]?.id);
        return `<div class="card-list-item" onclick="selectCardForScan('${c.id}')" style="${isSel ? 'border-color:var(--accent-purple);background:rgba(139,92,246,.09);' : ''}">
          <div style="width:44px;height:30px;border-radius:7px;background:${COLOR_THEMES[c.colorIdx].gradient};display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${c.icon}</div>
          <div class="card-list-info"><div class="card-list-name">${esc(c.holderName)}</div><div class="card-list-org">${esc(c.orgName)}</div></div>
          ${isSel ? '<i class="fa-solid fa-check" style="color:var(--accent-purple);"></i>' : '<div class="card-list-arrow"><i class="fa-solid fa-chevron-right"></i></div>'}
        </div>`;
      }).join('');

  return `
    <div class="inner-page-wrap">
      <div class="section-header"><div><h2 class="section-title">NFC Scanner</h2><p class="section-subtitle">Simulate tapping your card on a reader</p></div></div>
      <div class="scan-area">
        <div class="scan-frame">
          <div class="scan-corner tl"></div><div class="scan-corner tr"></div>
          <div class="scan-corner bl"></div><div class="scan-corner br"></div>
          <div class="scan-line"></div>
          <div class="scan-nfc-big"><i class="fa-solid fa-wifi"></i></div>
        </div>
        <div style="width:100%;max-width:360px;">
          <div class="sidebar-section-title" style="margin-bottom:8px;">Select Card</div>
          <div style="display:flex;flex-direction:column;gap:8px;">${cardOpts}</div>
        </div>
        <p style="font-size:.82rem;color:var(--text-muted);text-align:center;max-width:260px;line-height:1.7;"><strong style="color:var(--text-secondary);">How it works:</strong><br/>Pick a card above then hit Simulate NFC — watch the full 6-step verification, just like Apple Pay.</p>
        <button class="scan-trigger-btn" onclick="triggerScanPage()"><i class="fa-solid fa-wifi"></i>&nbsp; Simulate NFC Tap</button>
      </div>
    </div>`;
}

function selectCardForScan(id) { state.selectedCardId = id; renderInnerPage('scan'); }
function triggerScanPage() {
  if (!state.cards.length) { showToast('Add a card first!', 'error'); return; }
  launchDemoScan(state.selectedCardId || state.cards[0].id);
}

// ══════════════════════════════════════════════
// ORGS
// ══════════════════════════════════════════════
function buildOrgsHTML() {
  const orgMap = {};
  state.cards.forEach(c => { if (!orgMap[c.orgName]) orgMap[c.orgName] = { ...c, count: 0 }; orgMap[c.orgName].count++; });
  const list = Object.values(orgMap);
  const bgColors = { university:'rgba(139,92,246,.14)',college:'rgba(124,58,237,.14)',company:'rgba(59,130,246,.14)',hospital:'rgba(16,185,129,.14)',government:'rgba(245,158,11,.14)',gym:'rgba(239,68,68,.14)',library:'rgba(6,182,212,.14)',bank:'rgba(99,102,241,.14)',other:'rgba(148,163,184,.14)' };
  return `
    <div class="inner-page-wrap">
      <div class="section-header"><div><h2 class="section-title">Organizations</h2><p class="section-subtitle">All orgs that issued cards to your wallet</p></div><button class="btn-cta" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> Add Card</button></div>
      <div class="orgs-grid">
        ${list.length === 0
          ? `<div style="color:var(--text-muted);font-size:.86rem;grid-column:1/-1;text-align:center;padding:50px 0;">No cards yet. Add a card to see organizations.</div>`
          : list.map(o => `
            <div class="org-card" onclick="openDesignerPreset('${o.orgType}')">
              <div class="org-card-icon" style="background:${bgColors[o.orgType]||bgColors.other}">
                ${o.logoDataUrl ? `<img src="${o.logoDataUrl}" style="width:32px;height:32px;object-fit:contain;"/>` : `<span style="font-size:1.5rem;">${o.icon}</span>`}
              </div>
              <div class="org-card-name">${esc(o.orgName)}</div>
              <div class="org-card-type">${esc((o.orgType||'').charAt(0).toUpperCase()+(o.orgType||'').slice(1))}</div>
              <div class="org-card-meta"><span class="org-card-count">${o.count} card${o.count>1?'s':''}</span></div>
            </div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════
function buildDashboardHTML() {
  const rev = state.membership.revenue || 0;
  const commission = (rev * 0.10).toFixed(2);
  const net = (rev * 0.90).toFixed(2);
  const months = ['Feb','Mar','Apr','May','Jun','Jul'];
  const bars = [110, 175, 240, 320, 430, rev > 0 ? rev : 570];
  const maxBar = Math.max(...bars);
  const planCounts = { free: 0, pro: 0, enterprise: 0 };
  state.subscriptions.forEach(s => { if (planCounts[s.plan] !== undefined) planCounts[s.plan]++; });

  const subRows = state.subscriptions.length > 0
    ? state.subscriptions.map(s => `<tr>
        <td><strong>${esc(s.orgName)}</strong></td>
        <td><span class="plan-chip ${s.plan}">${s.plan.charAt(0).toUpperCase()+s.plan.slice(1)}</span></td>
        <td>$${PLANS[s.plan]?.price||0}/mo</td>
        <td style="color:var(--accent-green);">$${((PLANS[s.plan]?.price||0)*0.10).toFixed(2)}</td>
        <td><span style="color:var(--accent-green);font-size:.73rem;">● Active</span></td>
      </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:28px 0;">No paid subscriptions yet. <a onclick="openCheckout('pro')" style="color:var(--accent-purple);cursor:pointer;">Upgrade to Pro →</a></td></tr>`;

  return `
    <div class="inner-page-wrap">
      <div class="section-header"><div><h2 class="section-title">Revenue Dashboard</h2><p class="section-subtitle">Memberships · Commissions · Subscription stats</p></div><button class="btn-cta" onclick="openCheckout('pro')"><i class="fa-solid fa-crown"></i> Upgrade</button></div>
      <div class="dashboard-grid">
        <div class="dash-stat-card"><div class="dash-stat-icon">💰</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${rev.toFixed(0)}</div><div class="dash-stat-label">Total Revenue</div><div class="dash-stat-change">↑ 18% this month</div></div>
        <div class="dash-stat-card"><div class="dash-stat-icon">🏦</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${commission}</div><div class="dash-stat-label">Platform Commission (10%)</div><div class="dash-stat-change">VaultID fee</div></div>
        <div class="dash-stat-card"><div class="dash-stat-icon">📈</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#10b981,#059669);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${net}</div><div class="dash-stat-label">Your Net Revenue (90%)</div><div class="dash-stat-change">After platform fee</div></div>
        <div class="dash-stat-card"><div class="dash-stat-icon">👥</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.subscriptions.length}</div><div class="dash-stat-label">Active Subscriptions</div><div class="dash-stat-change">↑ 3 new this week</div></div>
        <div class="dash-stat-card"><div class="dash-stat-icon">💳</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.cards.length}</div><div class="dash-stat-label">Total Cards Issued</div></div>
        <div class="dash-stat-card"><div class="dash-stat-icon">📡</div><div class="dash-stat-value" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.scanCount}</div><div class="dash-stat-label">NFC Scans</div></div>
      </div>
      <div class="dash-two-col">
        <div class="dash-panel">
          <div class="dash-panel-title">Monthly Revenue</div>
          <div class="revenue-chart">${months.map((m,i)=>`<div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.round((bars[i]/maxBar)*100)}%;"></div><div class="chart-label">${m}</div></div>`).join('')}</div>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Plan Distribution</div>
          <div class="plan-breakdown">
            <div class="plan-row"><div class="plan-row-name" style="color:#94a3b8;">Free</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:70%;background:#94a3b8;"></div></div><div class="plan-row-val">${planCounts.free+(state.membership.plan==='free'?1:0)}</div></div>
            <div class="plan-row"><div class="plan-row-name" style="color:#8b5cf6;">Pro</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:${Math.min(planCounts.pro*25,100)}%;background:#8b5cf6;"></div></div><div class="plan-row-val">${planCounts.pro+(state.membership.plan==='pro'?1:0)}</div></div>
            <div class="plan-row"><div class="plan-row-name" style="color:#f59e0b;">Enterprise</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:${Math.min(planCounts.enterprise*25,100)}%;background:#f59e0b;"></div></div><div class="plan-row-val">${planCounts.enterprise+(state.membership.plan==='enterprise'?1:0)}</div></div>
          </div>
          <div style="margin-top:20px;"><div class="dash-panel-title">Commission Rate</div><div style="font-size:1.8rem;font-weight:900;color:var(--accent-orange);">10%</div><div style="font-size:.75rem;color:var(--text-muted);margin-top:3px;">Platform fee · You keep 90%</div></div>
        </div>
      </div>
      <div class="dash-panel"><div class="dash-panel-title">Subscriptions</div><div style="overflow-x:auto;"><table class="sub-table"><thead><tr><th>Organization</th><th>Plan</th><th>Monthly</th><th>Commission</th><th>Status</th></tr></thead><tbody>${subRows}</tbody></table></div></div>
    </div>`;
}

// ══════════════════════════════════════════════
// ID CARD HTML BUILDER
// ══════════════════════════════════════════════
function buildCardHTML(card, interactive = false) {
  const theme = COLOR_THEMES[card.colorIdx] || COLOR_THEMES[0];
  const id = `card-el-${card.id}`;
  return `
    <div class="id-card ${card.flipped ? 'flipped' : ''}" id="${id}" style="max-width:480px;height:208px;"
         ${interactive ? `onclick="handleCardClick('${card.id}',event)"` : ''}>
      <div class="card-face card-front">
        <div class="card-bg" style="background:${theme.gradient}"></div>
        <div class="card-pattern"></div><div class="card-grid-pattern"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-org-logo">${card.logoDataUrl ? `<img src="${card.logoDataUrl}" alt="${esc(card.orgName)}"/>` : card.icon}</div>
            <div class="card-nfc-icon"><i class="fa-solid fa-wifi"></i></div>
          </div>
          <div class="card-middle">
            <div class="card-avatar"><i class="fa-solid fa-user"></i></div>
            <div>
              <div class="card-holder-name">${esc(card.holderName)}</div>
              <div class="card-holder-role">${esc(card.cardType)} · ${esc(card.role)}</div>
            </div>
          </div>
          <div class="card-footer">
            <div><div class="card-id-number">ID: ${esc(card.idNumber)}</div><div class="card-org-name">${esc(card.orgName)}</div></div>
            <div class="card-chip"></div>
          </div>
        </div>
      </div>
      <div class="card-face card-back">
        <div class="card-bg" style="background:${theme.gradient};filter:brightness(.78)"></div>
        <div class="card-pattern"></div>
        <div class="card-back-content">
          <div class="card-stripe"></div>
          <div class="card-back-body">
            <div class="card-qr-container" id="qr-${card.id}"><canvas></canvas></div>
            <div class="card-back-info">
              <p><strong style="color:#fff">${esc(card.holderName)}</strong></p>
              <p>${esc(card.cardType)}<span>${esc(card.orgName)}</span></p>
              <p>Dept: ${esc(card.role)}<span>ID: ${esc(card.idNumber)}</span></p>
              ${card.expiry ? `<p>Expires: ${esc(card.expiry)}</p>` : ''}
              <div class="card-barcode"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function generateQR(card) {
  setTimeout(() => {
    const el = document.getElementById(`qr-${card.id}`); if (!el) return;
    el.innerHTML = '';
    try {
      new QRCode(el, { text: JSON.stringify({ id: card.id, name: card.holderName, org: card.orgName, idNo: card.idNumber }), width: 78, height: 78, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.M });
    } catch (e) { el.innerHTML = '<div style="font-size:.55rem;text-align:center;color:#333;padding:8px;">QR</div>'; }
  }, 100);
}

// ══════════════════════════════════════════════
// CARD INTERACTIONS
// ══════════════════════════════════════════════
function handleCardClick(id, e) { if (e.target.closest('.card-action-btn')) return; flipCard(id); }
function flipCard(id) {
  const card = state.cards.find(c => c.id === id); if (!card) return;
  card.flipped = !card.flipped;
  const el = document.getElementById(`card-el-${id}`);
  if (el) { el.classList.toggle('flipped', card.flipped); if (card.flipped) generateQR(card); }
  saveState();
}
function selectCard(id) { state.selectedCardId = id; state.cards.forEach(c => c.flipped = false); renderInnerPage('wallet'); }
function deleteCard(id) {
  const card = state.cards.find(c => c.id === id); if (!card) return;
  state.cards = state.cards.filter(c => c.id !== id);
  if (state.selectedCardId === id) state.selectedCardId = null;
  saveState(); renderInnerPage('wallet');
  showToast(`Card removed: ${card.holderName}`, 'info');
  addActivity(`Removed: ${card.holderName}`, 'orange');
}
function attachTilt(el) {
  if (!el) return;
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top)  / r.height - .5;
    if (!el.classList.contains('flipped'))
      el.style.transform = `perspective(800px) rotateY(${x * 12}deg) rotateX(${-y * 8}deg) scale(1.02)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = el.classList.contains('flipped') ? 'rotateY(180deg)' : 'perspective(800px) rotateY(0) rotateX(0) scale(1)';
  });
}

// ══════════════════════════════════════════════
// DEMO SCAN OVERLAY (main NFC demo)
// ══════════════════════════════════════════════
function launchDemoScan(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) { showToast('Card not found!', 'error'); return; }
  state.dsoStartTime = performance.now();

  const theme = COLOR_THEMES[card.colorIdx];

  // Card mini-preview (scanning phase)
  const preview = document.getElementById('dso-card-preview');
  preview.innerHTML = `
    <div class="pc-bg" style="background:${theme.gradient}"></div>
    <div class="pc-content">
      <div class="pc-top"><span class="pc-logo">${card.logoDataUrl ? `<img src="${card.logoDataUrl}" style="width:20px;height:20px;object-fit:contain;"/>` : card.icon}</span><i class="fa-solid fa-wifi pc-nfc"></i></div>
      <div class="pc-name">${esc(card.holderName)}</div>
      <div class="pc-role">${esc(card.cardType)} · ${esc(card.orgName)}</div>
    </div>`;

  // Reset timeline
  [0,1,2,3,4].forEach(i => {
    const tl = document.getElementById(`tl${i}`);
    if (tl) { tl.classList.remove('done','active'); }
  });
  document.getElementById('dso-fill').style.width = '0%';
  document.getElementById('dso-step-text').textContent = 'Initializing…';
  document.getElementById('dso-step-sub').textContent = 'Preparing scan';
  document.getElementById('dso-scanning').style.display = 'block';
  document.getElementById('dso-success').style.display = 'none';

  const overlay = document.getElementById('demo-scan-overlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Run sequence
  runDSO(card);
}

const DSO_STEPS = [
  { pct: 15, text: 'Detecting NFC signal…',    sub: 'Searching for compatible reader', tlIdx: 0 },
  { pct: 35, text: 'Establishing connection…', sub: 'Opening secure channel',          tlIdx: 1 },
  { pct: 55, text: 'Transmitting card data…',  sub: 'Encrypting identity payload',     tlIdx: 2 },
  { pct: 75, text: 'Verifying credentials…',   sub: 'Checking issuer signature',       tlIdx: 3 },
  { pct: 90, text: 'Authenticating identity…', sub: 'Cross-referencing database',      tlIdx: 4 },
  { pct: 100,text: 'Scan complete!',            sub: 'Identity verified ✅',            tlIdx: 4 },
];

function runDSO(card) {
  let i = 0;
  const fill = document.getElementById('dso-fill');
  const stepText = document.getElementById('dso-step-text');
  const stepSub  = document.getElementById('dso-step-sub');

  function next() {
    if (i >= DSO_STEPS.length) { setTimeout(() => showDSOSuccess(card), 300); return; }
    const s = DSO_STEPS[i];
    fill.style.width = s.pct + '%';
    stepText.textContent = s.text;
    stepSub.textContent = s.sub;

    // Update timeline
    for (let j = 0; j < 5; j++) {
      const tl = document.getElementById(`tl${j}`);
      if (!tl) continue;
      if (j < s.tlIdx) { tl.classList.add('done'); tl.classList.remove('active'); }
      else if (j === s.tlIdx) { tl.classList.add('active'); tl.classList.remove('done'); }
      else { tl.classList.remove('done', 'active'); }
    }
    i++;
    state.dsoTimer = setTimeout(next, 650 + Math.random() * 350);
  }
  next();
}

function showDSOSuccess(card) {
  const elapsed = ((performance.now() - state.dsoStartTime) / 1000).toFixed(2);
  document.getElementById('dso-scanning').style.display = 'none';
  const succ = document.getElementById('dso-success');
  succ.style.display = 'block';
  document.getElementById('dso-success-org').textContent = `${card.orgName} · ${card.cardType}`;
  document.getElementById('dso-scan-ms').textContent = `${elapsed}s`;

  // Verified card mini
  const theme = COLOR_THEMES[card.colorIdx];
  document.getElementById('dso-verified-card').innerHTML = `
    <div class="pc-bg" style="background:${theme.gradient}"></div>
    <div class="pc-content">
      <div class="pc-top"><span class="pc-logo">${card.icon}</span><i class="fa-solid fa-check" style="color:var(--accent-green);font-size:.8rem;"></i></div>
      <div class="pc-name">${esc(card.holderName)}</div>
      <div class="pc-role">${esc(card.orgName)}</div>
    </div>`;

  // Info grid
  document.getElementById('dso-info-grid').innerHTML = [
    dsoField('Full Name',     card.holderName),
    dsoField('Card Type',     card.cardType),
    dsoField('ID Number',     card.idNumber),
    dsoField('Department',    card.role),
    dsoField('Organization',  card.orgName),
    dsoField('Status',        '✅ Active'),
    card.expiry ? dsoField('Expires', card.expiry) : '',
    dsoField('Issuer',        'VaultID Platform'),
  ].join('');

  state.scanCount++;
  saveState();
  addActivity(`NFC scan: ${card.holderName}`, 'green');
  showToast(`✅ Identity verified: ${card.holderName}`, 'success');
}

function dsoField(label, value) {
  return `<div class="dso-info-field"><div class="dso-info-label">${label}</div><div class="dso-info-value">${esc(String(value))}</div></div>`;
}

function closeDemoScan() {
  if (state.dsoTimer) clearTimeout(state.dsoTimer);
  document.getElementById('demo-scan-overlay')?.classList.remove('active');
  document.body.style.overflow = '';
}

// ── Landing phone demo scan (calls full overlay) ─────────────────
function phoneDemoScan(el, name, org, id) {
  // Build a temp card
  const tempCard = {
    id: 'demo-' + uid(),
    holderName: name, orgName: org, idNumber: id,
    cardType: 'ID Card', role: 'Member',
    colorIdx: 0, icon: '💳', logoDataUrl: null, flipped: false,
    expiry: '2028-12-31', createdAt: new Date().toISOString(),
  };
  // Temporarily add to cards, scan, then remove
  const prevSelected = state.selectedCardId;
  state.cards.unshift(tempCard);
  state.selectedCardId = tempCard.id;
  launchDemoScan(tempCard.id);
  // After scan overlay closes, remove temp card
  const orig = closeDemoScan;
  window._closeDemoScanOnce = () => {
    state.cards = state.cards.filter(c => c.id !== tempCard.id);
    state.selectedCardId = prevSelected;
    closeDemoScan = orig;
    delete window._closeDemoScanOnce;
  };
  document.getElementById('dso-done-btn').onclick = () => { if (window._closeDemoScanOnce) window._closeDemoScanOnce(); closeDemoScan(); };
}

function phoneNav(page, btn) {
  document.querySelectorAll('.pbn-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (page === 'scan') {
    // Trigger a scan with first demo card
    phoneDemoScan(null, 'Alex Johnson', 'MIT University', 'MIT-2024-4872');
  }
}

// ══════════════════════════════════════════════
// CARD DESIGNER
// ══════════════════════════════════════════════
function openDesigner() {
  const plan = state.membership.plan;
  const max  = PLANS[plan]?.maxCards || 5;
  if (state.cards.length >= max) {
    showToast(`${PLANS[plan].name} plan limit (${max} cards). Upgrade!`, 'error');
    openCheckout('pro'); return;
  }
  resetDesigner(); openModal('designer-modal');
}
function openDesignerPreset(type) {
  const plan = state.membership.plan; const max = PLANS[plan]?.maxCards || 5;
  if (state.cards.length >= max) { showToast('Plan limit reached. Upgrade!', 'error'); openCheckout('pro'); return; }
  resetDesigner();
  const p = ORG_DEFAULTS[type] || ORG_DEFAULTS.other;
  state.selectedIcon = p.icon; state.selectedColor = p.colorIdx;
  const ft = document.getElementById('f-cardtype'); if (ft) ft.value = p.cardType;
  const fr = document.getElementById('f-role'); if (fr) fr.value = p.role;
  const fo = document.getElementById('f-orgtype'); if (fo) fo.value = type;
  renderColorSwatches(); renderIconPicker(); updatePreview();
  openModal('designer-modal');
}
function resetDesigner() {
  ['f-name','f-idnum','f-role','f-email','f-orgname','f-website','f-address','f-phone'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  const ft = document.getElementById('f-cardtype'); if (ft) ft.value = 'Student ID';
  const fo = document.getElementById('f-orgtype'); if (fo) fo.value = 'university';
  state.selectedColor = 0; state.selectedIcon = '🎓'; state.currentLogoDataUrl = null;
  const lps = document.getElementById('logo-preview-strip'); if (lps) lps.style.display = 'none';
  const lua = document.getElementById('logo-upload-area'); if (lua) lua.style.display = 'block';
  setDefaultDates(); renderColorSwatches(); renderIconPicker(); switchDesignerTab('identity'); updatePreview();
}
function setDefaultDates() {
  const t = new Date(); const e = new Date(t); e.setFullYear(e.getFullYear() + 4);
  const fi = document.getElementById('f-issue'); if (fi) fi.value = t.toISOString().split('T')[0];
  const fe = document.getElementById('f-expiry'); if (fe) fe.value = e.toISOString().split('T')[0];
}
function switchDesignerTab(tab) {
  state.designerTab = tab;
  ['identity','design','org'].forEach(t => {
    const el = document.getElementById(`dtab-${t}`); if (el) el.style.display = t === tab ? 'block' : 'none';
    const btn = document.getElementById(`tab-${t}`); if (btn) btn.classList.toggle('active', t === tab);
  });
}
function renderColorSwatches() {
  const el = document.getElementById('color-swatches'); if (!el) return;
  el.innerHTML = COLOR_THEMES.map((t, i) => `<div class="color-swatch ${i===state.selectedColor?'selected':''}" style="background:${t.gradient};" title="${t.label}" onclick="selectColor(${i})"></div>`).join('');
}
function selectColor(i) { state.selectedColor = i; renderColorSwatches(); updatePreview(); }
function renderIconPicker() {
  const el = document.getElementById('icon-picker'); if (!el) return;
  el.innerHTML = ICONS.map(ic => `<div class="icon-opt ${ic===state.selectedIcon?'selected':''}" onclick="selectIcon('${ic}')">${ic}</div>`).join('');
}
function selectIcon(ic) { state.selectedIcon = ic; renderIconPicker(); updatePreview(); }
function updatePreview() {
  const n = document.getElementById('f-name')?.value    || 'John Doe';
  const r = document.getElementById('f-role')?.value    || 'Student';
  const i = document.getElementById('f-idnum')?.value   || '00000000';
  const o = document.getElementById('f-orgname')?.value || 'Organization';
  const t = document.getElementById('f-cardtype')?.value|| 'Student ID';
  const theme = COLOR_THEMES[state.selectedColor];
  const pb = document.getElementById('preview-bg'); if (pb) pb.style.background = theme.gradient;
  const pn = document.getElementById('preview-name'); if (pn) pn.textContent = n;
  const pr = document.getElementById('preview-role'); if (pr) pr.textContent = `${t} · ${r}`;
  const pi = document.getElementById('preview-id'); if (pi) pi.textContent = `ID: ${i}`;
  const po = document.getElementById('preview-org'); if (po) po.textContent = o;
  const pl = document.getElementById('preview-logo'); if (pl) pl.innerHTML = state.currentLogoDataUrl ? `<img src="${state.currentLogoDataUrl}" style="width:100%;height:100%;object-fit:contain;padding:3px;"/>` : state.selectedIcon;
}
function handleLogoUpload(e) {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 2 * 1024 * 1024) { showToast('Logo too large (max 2MB)', 'error'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    state.currentLogoDataUrl = ev.target.result;
    const img = document.getElementById('logo-img-preview'); if (img) img.src = ev.target.result;
    const lps = document.getElementById('logo-preview-strip'); if (lps) lps.style.display = 'flex';
    const lua = document.getElementById('logo-upload-area'); if (lua) lua.style.display = 'none';
    updatePreview();
  };
  reader.readAsDataURL(file);
}
function removeLogo() {
  state.currentLogoDataUrl = null;
  const lps = document.getElementById('logo-preview-strip'); if (lps) lps.style.display = 'none';
  const lua = document.getElementById('logo-upload-area'); if (lua) lua.style.display = 'block';
  const fl  = document.getElementById('f-logo'); if (fl) fl.value = '';
  updatePreview();
}
function issueCard() {
  const name    = document.getElementById('f-name')?.value.trim();
  const orgname = document.getElementById('f-orgname')?.value.trim();
  if (!name) { showToast('Please enter the holder name', 'error'); switchDesignerTab('identity'); return; }
  if (!orgname) { showToast('Please enter the organization name', 'error'); switchDesignerTab('org'); return; }
  const card = {
    id: uid(), holderName: name, orgName: orgname,
    orgType:  document.getElementById('f-orgtype')?.value  || 'other',
    role:     document.getElementById('f-role')?.value.trim() || 'Member',
    idNumber: document.getElementById('f-idnum')?.value.trim() || generateId(),
    cardType: document.getElementById('f-cardtype')?.value || 'Member Card',
    email:    document.getElementById('f-email')?.value.trim()   || '',
    expiry:   document.getElementById('f-expiry')?.value         || '',
    issue:    document.getElementById('f-issue')?.value          || '',
    website:  document.getElementById('f-website')?.value.trim() || '',
    address:  document.getElementById('f-address')?.value.trim() || '',
    phone:    document.getElementById('f-phone')?.value.trim()   || '',
    colorIdx: state.selectedColor, icon: state.selectedIcon,
    logoDataUrl: state.currentLogoDataUrl, flipped: false,
    createdAt: new Date().toISOString(),
  };
  state.cards.unshift(card); state.selectedCardId = card.id;
  saveState(); closeModal('designer-modal'); renderInnerPage('wallet');
  showToast(`✅ Card issued: ${name} · ${orgname}`, 'success');
  addActivity(`Issued: ${name} @ ${orgname}`, 'green');
}

// ══════════════════════════════════════════════
// CARD DETAIL
// ══════════════════════════════════════════════
function openCardDetail(id) {
  const card = state.cards.find(c => c.id === id); if (!card) return;
  document.getElementById('detail-modal-title').textContent = `${card.icon} ${card.orgName}`;
  const prev = document.getElementById('detail-card-preview');
  prev.innerHTML = buildCardHTML(card, false); if (card.flipped) generateQR(card);
  attachTilt(prev.querySelector('.id-card'));
  document.getElementById('detail-card-info').innerHTML = [
    infoField('Holder', card.holderName), infoField('Card Type', card.cardType),
    infoField('ID Number', card.idNumber), infoField('Department', card.role),
    infoField('Organization', card.orgName), infoField('Org Type', card.orgType),
    card.email ? infoField('Email', card.email) : '',
    card.expiry ? infoField('Expires', card.expiry) : '',
    infoField('Status', '✅ Active'),
    card.phone ? infoField('Phone', card.phone) : '',
  ].join('');
  document.getElementById('detail-card-actions').innerHTML = `
    <button class="card-action-btn primary" onclick="closeModal('card-detail-modal');launchDemoScan('${card.id}')"><i class="fa-solid fa-wifi"></i> NFC Scan</button>
    <button class="card-action-btn" onclick="flipCard('${card.id}');closeModal('card-detail-modal');renderInnerPage('wallet')"><i class="fa-solid fa-rotate"></i> Flip</button>
    <button class="card-action-btn danger" onclick="closeModal('card-detail-modal');deleteCard('${card.id}')"><i class="fa-solid fa-trash"></i> Remove</button>`;
  openModal('card-detail-modal');
}

// ══════════════════════════════════════════════
// CHECKOUT
// ══════════════════════════════════════════════
function openCheckout(plan) {
  state.checkoutPlan = plan; const p = PLANS[plan];
  document.getElementById('checkout-title').textContent = `💳 ${p.name} Plan`;
  document.getElementById('checkout-plan-summary').innerHTML = `
    <div><div class="checkout-plan-name">${p.name} Plan</div><div class="checkout-plan-sub">${plan==='enterprise'?'Unlimited':'Up to '+p.maxCards} cards/mo</div></div>
    <div><div class="checkout-plan-price">$${p.price}<span style="font-size:.85rem;font-weight:400;color:var(--text-muted);">/mo</span></div></div>`;
  openModal('checkout-modal');
}
function formatCardNum(input) {
  let v = input.value.replace(/\D/g,'').slice(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function processPayment() {
  const name = document.getElementById('co-name').value.trim();
  const card = document.getElementById('co-card').value.replace(/\s/g,'');
  const exp  = document.getElementById('co-exp').value.trim();
  const cvv  = document.getElementById('co-cvv').value.trim();
  if (!name || card.length < 16 || !exp || !cvv) { showToast('Fill in all payment details', 'error'); return; }
  const btn = document.getElementById('pay-btn'); btn.textContent = 'Processing…'; btn.disabled = true;
  setTimeout(() => {
    const plan = state.checkoutPlan; const p = PLANS[plan];
    state.membership.plan = plan; state.membership.revenue += p.price;
    state.subscriptions.push({ orgName: state.membership.orgName || 'My Organization', plan, date: new Date().toISOString(), amount: p.price });
    saveState(); updatePlanBadge();
    closeModal('checkout-modal');
    btn.innerHTML = '<i class="fa-solid fa-lock"></i>&nbsp; Pay Securely'; btn.disabled = false;
    ['co-name','co-card','co-exp','co-cvv'].forEach(id => { document.getElementById(id).value = ''; });
    showToast(`🎉 ${p.name} plan activated!`, 'success');
    addActivity(`Upgraded to ${p.name} plan`, 'purple');
    if (state.currentPage === 'app') renderInnerPage(state.currentInnerPage);
  }, 2200);
}
function updatePlanBadge() {
  const b = document.getElementById('plan-badge-topbar'); if (b) b.textContent = PLANS[state.membership.plan]?.name || 'Free';
}

// ══════════════════════════════════════════════
// ACTIVITY & STATS
// ══════════════════════════════════════════════
function addActivity(text, color = 'blue') {
  const now = new Date();
  state.activities.unshift({ text, color, time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
  if (state.activities.length > 20) state.activities.pop();
  const el = document.getElementById('activity-list');
  if (el) el.innerHTML = buildActivityHTML();
  saveState();
}

// ══════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════
function loadDemoCards() {
  if (state.cards.length > 0) return;
  const demos = [
    { holderName:'Alex Johnson',    orgName:'MIT University',     orgType:'university',  role:'Computer Science', idNumber:'MIT-2024-4872', cardType:'Student ID',   colorIdx:0, icon:'🎓',  email:'alex@mit.edu',     expiry:'2028-06-30', issue:'2024-09-01' },
    { holderName:'Sarah Chen',      orgName:'TechCorp Inc.',      orgType:'company',     role:'Senior Engineer',  idNumber:'EMP-00142',    cardType:'Employee ID',  colorIdx:9, icon:'🏢',  email:'schen@techcorp.com', expiry:'2026-12-31', issue:'2023-03-15' },
    { holderName:'Dr. Malik Patel', orgName:'City General Hospital',orgType:'hospital',  role:'Cardiologist',     idNumber:'DOC-2019-007', cardType:'Employee ID',  colorIdx:2, icon:'🏥',  email:'mpatel@citygeneral.org',expiry:'2027-04-30',issue:'2019-07-01' },
  ];
  demos.forEach(d => state.cards.push({ id: uid(), flipped: false, createdAt: new Date().toISOString(), logoDataUrl: null, phone: '', website: '', address: '', ...d }));
  state.subscriptions = [
    { orgName:'MIT University',       plan:'pro',        date:new Date().toISOString(), amount:29 },
    { orgName:'TechCorp Inc.',        plan:'enterprise', date:new Date().toISOString(), amount:99 },
    { orgName:'City General Hospital',plan:'pro',        date:new Date().toISOString(), amount:29 },
  ];
  state.membership.revenue = 580;
  state.selectedCardId = state.cards[0].id;
  saveState();
  addActivity('Demo data loaded 🚀', 'blue');
}

// ══════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════
function openModal(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; }

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
function showToast(msg, type = 'info') {
  const tc = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div'); t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${esc(msg)}</span>`;
  tc.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = 'all .3s ease'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8); }
function generateId() { return 'ID-' + Math.random().toString(36).substr(2, 8).toUpperCase(); }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function infoField(label, value) { return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(value))}</div></div>`; }

// ══════════════════════════════════════════════
// ADD TO WALLET — Main entry point
// ══════════════════════════════════════════════
let _walletCard = null; // card currently in wallet share modal

function openWalletShare(cardId) {
  const card = state.cards.find(c => c.id === cardId);
  if (!card) return;
  _walletCard = card;
  const theme = COLOR_THEMES[card.colorIdx] || COLOR_THEMES[0];

  // Mini card preview
  document.getElementById('wshare-card-preview').innerHTML = `
    <div class="wshare-mini-card">
      <div class="pc-bg" style="background:${theme.gradient}"></div>
      <div class="pc-content">
        <div class="pc-top">
          <span class="pc-logo" style="font-size:1.3rem;">${card.logoDataUrl ? `<img src="${card.logoDataUrl}" style="width:22px;height:22px;object-fit:contain;"/>` : card.icon}</span>
          <i class="fa-solid fa-wifi" style="opacity:.6;font-size:.8rem;"></i>
        </div>
        <div style="font-family:'Outfit',sans-serif;font-weight:700;font-size:.9rem;">${esc(card.holderName)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:.62rem;opacity:.55;letter-spacing:1px;">${esc(card.idNumber)}</div>
          <div style="font-size:.72rem;opacity:.7;">${esc(card.orgName)}</div>
        </div>
      </div>
    </div>`;

  openModal('wallet-share-modal');
}

// ══════════════════════════════════════════════
// APPLE WALLET — Generate .pkpass file
// ══════════════════════════════════════════════
async function addToAppleWallet() {
  const card = _walletCard;
  if (!card) return;

  showToast('⏳ Generating Apple Wallet pass…', 'info');

  try {
    // Build pass.json — Apple Wallet Generic Pass format
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: 'pass.com.vaultid.idcard',
      serialNumber: card.idNumber,
      teamIdentifier: 'VAULTID001',
      webServiceURL: 'https://vaultid.app/api/',
      authenticationToken: btoa(card.id).slice(0, 16),
      organizationName: card.orgName,
      description: `${card.cardType} — ${card.orgName}`,
      logoText: card.orgName,
      foregroundColor: 'rgb(255,255,255)',
      backgroundColor: 'rgb(30,27,75)',
      labelColor: 'rgb(200,180,255)',
      generic: {
        primaryFields: [
          { key: 'name', label: 'NAME', value: card.holderName }
        ],
        secondaryFields: [
          { key: 'id',   label: 'ID NUMBER', value: card.idNumber },
          { key: 'dept', label: 'DEPARTMENT', value: card.role }
        ],
        auxiliaryFields: [
          { key: 'org',  label: 'ORGANIZATION', value: card.orgName },
          { key: 'type', label: 'CARD TYPE',     value: card.cardType }
        ],
        backFields: [
          { key: 'email',   label: 'Email',   value: card.email   || 'N/A' },
          { key: 'expiry',  label: 'Expires', value: card.expiry  || 'N/A' },
          { key: 'website', label: 'Website', value: card.website || 'vaultid.app' },
          { key: 'info',    label: 'About',   value: 'This is a VaultID digital identity card. Verify with NFC or QR code.' }
        ]
      },
      barcode: {
        message: JSON.stringify({ id: card.id, name: card.holderName, org: card.orgName, idNo: card.idNumber }),
        format: 'PKBarcodeFormatQR',
        messageEncoding: 'iso-8859-1',
        altText: card.idNumber
      }
    };

    const passStr = JSON.stringify(passJson, null, 2);

    // Build manifest (normally needs SHA1 hash of each file — simplified here)
    const manifest = {
      'pass.json': await sha1(passStr)
    };

    // Use JSZip to build .pkpass (ZIP)
    if (typeof JSZip === 'undefined') {
      // Fallback: just download pass.json
      downloadBlob(new Blob([passStr], { type: 'application/json' }), `${card.holderName.replace(/\s/g,'-')}-vaultid.pass.json`);
      showToast('📥 Pass file downloaded! Open on iPhone to add to Wallet.', 'success');
      return;
    }

    const zip = new JSZip();
    zip.file('pass.json',     passStr);
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('signature',     'VAULTID_UNSIGNED_DEMO'); // real: Apple cert signature

    const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.apple.pkpass' });
    downloadBlob(blob, `${card.holderName.replace(/\s+/g, '-')}-VaultID.pkpass`);

    setTimeout(() => {
      showToast('✅ .pkpass downloaded! AirDrop to iPhone → tap to Add to Wallet', 'success');
    }, 500);

    addActivity(`Apple Wallet pass: ${card.holderName}`, 'blue');

  } catch (e) {
    showToast('⚠️ Could not generate pass. Try "Share Card" instead.', 'error');
  }
}

// SHA-1 hash (for pass manifest)
async function sha1(str) {
  try {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
  } catch (e) { return 'unsigned'; }
}

// ══════════════════════════════════════════════
// GOOGLE WALLET — Save to Google Wallet link
// ══════════════════════════════════════════════
function addToGoogleWallet() {
  const card = _walletCard;
  if (!card) return;

  // Google Wallet Generic Pass JWT payload
  const jwtPayload = {
    iss: 'vaultid@vaultid-app.iam.gserviceaccount.com',
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    payload: {
      genericObjects: [{
        id: `3388000000022795563.${card.idNumber.replace(/[^a-zA-Z0-9_]/g,'')}`,
        classId: '3388000000022795563.VaultID_Generic',
        genericType: 'GENERIC_TYPE_UNSPECIFIED',
        hexBackgroundColor: '#1e1b4b',
        logo: { sourceUri: { uri: 'https://vaultid.app/icons/icon-192.png' } },
        cardTitle: { defaultValue: { language: 'en-US', value: 'VaultID' } },
        subheader: { defaultValue: { language: 'en-US', value: card.cardType } },
        header: { defaultValue: { language: 'en-US', value: card.holderName } },
        textModulesData: [
          { id: 'org',  header: 'Organization', body: card.orgName },
          { id: 'id',   header: 'ID Number',    body: card.idNumber },
          { id: 'dept', header: 'Department',   body: card.role },
        ],
        barcode: {
          type: 'QR_CODE',
          value: JSON.stringify({ id: card.id, name: card.holderName, org: card.orgName }),
          alternateText: card.idNumber,
        },
        validTimeInterval: {
          start: { date: new Date().toISOString() },
          end:   { date: card.expiry ? card.expiry + 'T23:59:59Z' : '2030-12-31T23:59:59Z' }
        }
      }]
    }
  };

  // Base64-encode the payload and create the Save link
  const encoded = btoa(JSON.stringify(jwtPayload));
  const saveUrl = `https://pay.google.com/gp/v/save/${encoded}`;

  // Open in new tab (on real device it opens Google Wallet)
  window.open(saveUrl, '_blank');

  showToast('🟢 Opening Google Wallet save page…', 'success');
  addActivity(`Google Wallet: ${card.holderName}`, 'green');

  setTimeout(() => {
    showToast('📱 On Android: tap "Save to Google Wallet" in the opened page', 'info');
  }, 2000);
}

// ══════════════════════════════════════════════
// PWA INSTALL
// ══════════════════════════════════════════════
async function installPWA() {
  if (window._pwaPrompt) {
    try {
      window._pwaPrompt.prompt();
      const { outcome } = await window._pwaPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('🎉 VaultID installed on your home screen!', 'success');
        addActivity('App installed to home screen', 'purple');
        closeModal('wallet-share-modal');
      }
    } catch (e) {}
    return;
  }

  // iOS Safari instructions (no beforeinstallprompt support)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIOS) {
    showToast('On iPhone: tap Share ↑ → "Add to Home Screen"', 'info');
    setTimeout(() => showToast('The VaultID icon will appear on your home screen', 'info'), 2500);
  } else {
    showToast('ℹ️ Open this page in Chrome/Edge → menu → "Install App"', 'info');
  }
}

// Show PWA install banner automatically
function showPWABanner() {
  if (document.getElementById('pwa-banner')) return; // already shown
  const b = document.createElement('div');
  b.className = 'pwa-banner'; b.id = 'pwa-banner';
  b.innerHTML = `
    <div class="pwa-banner-icon">⬡</div>
    <div class="pwa-banner-text">
      <strong>Install VaultID</strong>
      <span>Add to home screen — works offline</span>
    </div>
    <button class="pwa-banner-btn" onclick="installPWA();document.getElementById('pwa-banner').remove();">Install</button>
    <button class="pwa-banner-close" onclick="this.closest('.pwa-banner').remove()"><i class="fa-solid fa-xmark"></i></button>`;
  document.body.appendChild(b);
  setTimeout(() => b.classList.add('show'), 100);
  setTimeout(() => { b.classList.remove('show'); setTimeout(() => b.remove(), 500); }, 10000);
}

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); window._pwaPrompt = e;
  setTimeout(showPWABanner, 3000);
});

// ══════════════════════════════════════════════
// DOWNLOAD CARD AS IMAGE (SVG → PNG)
// ══════════════════════════════════════════════
function downloadCardImage() {
  const card = _walletCard;
  if (!card) return;
  const theme = COLOR_THEMES[card.colorIdx] || COLOR_THEMES[0];

  // Build card as SVG foreignObject → PNG via canvas
  const svgStr = `
  <svg xmlns="http://www.w3.org/2000/svg" width="600" height="380">
    <defs>
      <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stop-color="${gradientStart(card.colorIdx)}"/>
        <stop offset="50%"  stop-color="${gradientMid(card.colorIdx)}"/>
        <stop offset="100%" stop-color="${gradientEnd(card.colorIdx)}"/>
      </linearGradient>
      <clipPath id="rr"><rect width="600" height="380" rx="32" ry="32"/></clipPath>
    </defs>
    <!-- Card background -->
    <rect width="600" height="380" fill="url(#cg)" rx="32" ry="32"/>
    <rect width="600" height="380" fill="rgba(0,0,0,0.2)" rx="32" ry="32" clip-path="url(#rr)"/>

    <!-- Logo box -->
    <rect x="30" y="30" width="70" height="70" fill="rgba(255,255,255,0.15)" rx="16"/>
    <text x="65" y="75" font-size="32" text-anchor="middle">${card.icon}</text>

    <!-- NFC icon -->
    <text x="560" y="65" font-size="26" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="Arial">⊛</text>

    <!-- VaultID brand -->
    <text x="560" y="40" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-family="Arial">VaultID</text>

    <!-- Name -->
    <text x="30" y="180" font-size="32" font-weight="bold" fill="white" font-family="Arial, sans-serif">${escSVG(card.holderName)}</text>

    <!-- Role & Card Type -->
    <text x="30" y="215" font-size="18" fill="rgba(255,255,255,0.75)" font-family="Arial">${escSVG(card.cardType)} · ${escSVG(card.role)}</text>

    <!-- Org name -->
    <text x="30" y="248" font-size="16" fill="rgba(255,255,255,0.6)" font-family="Arial">${escSVG(card.orgName)}</text>

    <!-- Divider -->
    <line x1="30" y1="270" x2="570" y2="270" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

    <!-- ID Number -->
    <text x="30"  y="305" font-size="14" fill="rgba(255,255,255,0.5)" font-family="monospace" letter-spacing="3">ID: ${escSVG(card.idNumber)}</text>

    <!-- Expiry -->
    ${card.expiry ? `<text x="30" y="330" font-size="13" fill="rgba(255,255,255,0.4)" font-family="Arial">EXPIRES: ${escSVG(card.expiry)}</text>` : ''}

    <!-- Chip -->
    <rect x="500" y="285" width="60" height="44" fill="#f59e0b" rx="6" opacity="0.9"/>
    <rect x="506" y="291" width="48" height="32" fill="#fcd34d" rx="4"/>
    <rect x="524" y="300" width="14" height="14" fill="none" stroke="rgba(0,0,0,0.2)" stroke-width="2" rx="2"/>

    <!-- VaultID watermark -->
    <text x="570" y="370" font-size="11" text-anchor="end" fill="rgba(255,255,255,0.25)" font-family="Arial">Powered by VaultID</text>
  </svg>`;

  const canvas = document.createElement('canvas');
  canvas.width = 600; canvas.height = 380;
  const ctx = canvas.getContext('2d');
  const img = new Image();
  const svg64 = btoa(unescape(encodeURIComponent(svgStr)));
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    canvas.toBlob(blob => {
      downloadBlob(blob, `${card.holderName.replace(/\s+/g,'-')}-VaultID-Card.png`);
      showToast('📥 Card image downloaded!', 'success');
      addActivity(`Downloaded card image: ${card.holderName}`, 'green');
    }, 'image/png');
  };
  img.src = 'data:image/svg+xml;base64,' + svg64;
}

function gradientStart(idx) { const g = [['#1e1b4b','#0c4a6e','#052e16','#4c0519','#451a03','#0f172a','#2e1065','#042f2e','#7f1d1d','#172554','#3b0764','#1a2e05']]; return (g[0]||[])[idx] || '#1e1b4b'; }
function gradientMid(idx)   { const g = [['#312e81','#075985','#14532d','#881337','#78350f','#1e293b','#4c1d95','#134e4a','#991b1b','#1e3a8a','#6b21a8','#365314']]; return (g[0]||[])[idx] || '#312e81'; }
function gradientEnd(idx)   { const g = [['#4c1d95','#0369a1','#166534','#9f1239','#92400e','#334155','#6d28d9','#115e59','#b45309','#1d4ed8','#7c3aed','#3f6212']]; return (g[0]||[])[idx] || '#4c1d95'; }
function escSVG(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }

// ══════════════════════════════════════════════
// SHARE CARD (Web Share API)
// ══════════════════════════════════════════════
async function shareCard() {
  const card = _walletCard;
  if (!card) return;

  const shareData = {
    title: `${card.holderName} — ${card.cardType}`,
    text:  `My ${card.cardType} from ${card.orgName}\nID: ${card.idNumber}\n\nVerify with VaultID: https://vaultid.app`,
    url:   `https://vaultid.app/verify?id=${encodeURIComponent(card.idNumber)}&org=${encodeURIComponent(card.orgName)}`
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      showToast('✅ Card shared!', 'success');
      addActivity(`Shared: ${card.holderName}`, 'blue');
    } catch (e) {
      if (e.name !== 'AbortError') copyToClipboard(shareData.text);
    }
  } else {
    copyToClipboard(shareData.text);
  }
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(() => {
    showToast('📋 Card info copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Share: copy the URL from your browser bar', 'info');
  });
}

// ══════════════════════════════════════════════
// DOWNLOAD BLOB HELPER
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// FAQ ACCORDION
// ══════════════════════════════════════════════
function toggleFaq(el) {
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('open'));
  if (!isOpen) el.classList.add('open');
}

// ══════════════════════════════════════════════
// LIVE ID LOOKUP / VERIFIER SIMULATOR
// ══════════════════════════════════════════════
function quickVerify(idNum) {
  const inp = document.getElementById('verifier-input');
  if (inp) inp.value = idNum;
  runInstantVerify();
}

function runInstantVerify() {
  const inp = document.getElementById('verifier-input');
  const query = (inp?.value || '').trim().toUpperCase();
  const resCard = document.getElementById('verifier-result-card');
  if (!resCard) return;

  if (!query) {
    showToast('Please enter an ID number to verify', 'info');
    return;
  }

  // Match in state cards or demo cards
  const match = state.cards.find(c => c.idNumber.toUpperCase().includes(query) || query.includes(c.idNumber.toUpperCase())) ||
                { holderName: 'Alex Johnson', orgName: 'MIT University', cardType: 'Student ID', role: 'Computer Science', idNumber: query, expiry: '2028-06-30' };

  resCard.style.display = 'block';
  resCard.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;border-bottom:1px solid rgba(16,185,129,.2);padding-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="width:10px;height:10px;border-radius:50%;background:var(--accent-green);box-shadow:0 0 10px var(--accent-green);"></span>
        <strong style="color:var(--accent-green);font-size:.95rem;">VERIFIED VALID CREDENTIAL</strong>
      </div>
      <span style="font-size:.72rem;color:var(--text-muted);">${new Date().toLocaleTimeString()}</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;">
      ${dsoField('Holder Name', match.holderName)}
      ${dsoField('ID Number', match.idNumber)}
      ${dsoField('Organization', match.orgName)}
      ${dsoField('Card Type', match.cardType)}
      ${dsoField('Department', match.role)}
      ${dsoField('Security Status', '✅ Active & Authenticated')}
    </div>`;

  showToast(`✅ Verified: ${match.holderName} (${match.orgName})`, 'success');
}

// ══════════════════════════════════════════════
// PAGE 1: SECURITY & AUDIT CENTER
// ══════════════════════════════════════════════
function buildSecurityHTML() {
  const auditLogs = [
    { type: 'NFC Scan', user: 'Alex Johnson (MIT)', status: 'Verified', ip: '192.168.1.42', gate: 'Main Entrance Gate #1', time: '1 min ago', ok: true },
    { type: 'QR Scan',  user: 'Sarah Chen (TechCorp)', status: 'Verified', ip: '10.0.4.12', gate: 'Lobby Turnstile B', time: '4 mins ago', ok: true },
    { type: 'NFC Scan', user: 'Unknown Device', status: 'Denied (Expired)', ip: '172.16.0.88', gate: 'Server Room Gate #4', time: '12 mins ago', ok: false },
    { type: 'Card Issued', user: 'Dr. Malik Patel (Hospital)', status: 'Issued', ip: '192.168.1.100', gate: 'Admin Console', time: '1 hour ago', ok: true },
    { type: 'NFC Scan', user: 'Alex Johnson (MIT)', status: 'Verified', ip: '192.168.1.42', gate: 'Library Gate', time: '2 hours ago', ok: true },
  ];

  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">🛡️ Security &amp; Audit Center</h2>
          <p class="section-subtitle">Real-time threat monitoring, access logs &amp; device sessions</p>
        </div>
        <button class="card-action-btn danger" onclick="showToast('🚨 All wallet sessions locked down', 'error')"><i class="fa-solid fa-lock"></i> Lockdown Wallet</button>
      </div>

      <!-- Security Status KPIs -->
      <div class="dashboard-grid">
        <div class="dash-stat-card">
          <div class="dash-stat-icon">🟢</div>
          <div class="dash-stat-value" style="color:var(--accent-green);">Optimal</div>
          <div class="dash-stat-label">Security Status</div>
          <div class="dash-stat-change">Zero active anomalies</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📡</div>
          <div class="dash-stat-value">${state.scanCount + 42}</div>
          <div class="dash-stat-label">Total Verification Checks</div>
          <div class="dash-stat-change">100% encrypted payloads</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">🚫</div>
          <div class="dash-stat-value" style="color:var(--accent-orange);">1</div>
          <div class="dash-stat-label">Access Denied Attempt</div>
          <div class="dash-stat-change">Blocked at Server Room</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📱</div>
          <div class="dash-stat-value">3</div>
          <div class="dash-stat-label">Active Wallet Sessions</div>
          <div class="dash-stat-change">Apple Wallet &amp; PWA</div>
        </div>
      </div>

      <!-- Audit Logs Table -->
      <div class="dash-panel" style="margin-top:20px;">
        <div class="dash-panel-title">Real-Time Access Audit Logs</div>
        <div style="overflow-x:auto;">
          <table class="sub-table">
            <thead>
              <tr><th>Event</th><th>Identity / User</th><th>Gate / Terminal</th><th>IP Address</th><th>Time</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${auditLogs.map(l => `
                <tr>
                  <td><strong>${l.type}</strong></td>
                  <td>${esc(l.user)}</td>
                  <td>${esc(l.gate)}</td>
                  <td style="font-family:monospace;">${l.ip}</td>
                  <td style="color:var(--text-muted);">${l.time}</td>
                  <td><span class="plan-chip" style="background:${l.ok ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'};color:${l.ok ? 'var(--accent-green)' : '#f87171'};">${l.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// PAGE 2: BULK CSV CARD ISSUER
// ══════════════════════════════════════════════
function buildBatchHTML() {
  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">📦 Bulk Batch Card Issuer</h2>
          <p class="section-subtitle">Import CSV / Excel spreadsheet to issue hundreds of ID cards at once</p>
        </div>
        <button class="btn-cta" onclick="downloadSampleCSV()"><i class="fa-solid fa-download"></i> Sample CSV</button>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <!-- Upload Box -->
        <div class="dash-panel">
          <div class="dash-panel-title">1. Upload Member Roster</div>
          <div class="upload-area" style="padding:40px 20px;" onclick="simulateCSVUpload()">
            <div class="upload-icon" style="font-size:2.5rem;color:var(--accent-purple);"><i class="fa-solid fa-file-csv"></i></div>
            <div style="font-weight:700;font-size:1rem;margin-top:8px;">Drag &amp; Drop CSV File</div>
            <div class="upload-text" style="margin-top:4px;">Supports .csv, .xlsx (Name, Role, ID, Email, Org)</div>
          </div>
          <button class="btn-submit" onclick="simulateCSVUpload()" style="margin-top:16px;"><i class="fa-solid fa-wand-magic-sparkles"></i> Auto-Generate 5 Demo Cards</button>
        </div>

        <!-- Instructions Box -->
        <div class="dash-panel">
          <div class="dash-panel-title">2. CSV Column Mapping Standard</div>
          <div style="font-size:.82rem;color:var(--text-secondary);line-height:1.7;">
            <p>Your spreadsheet should contain the following column headers:</p>
            <ul style="margin:10px 0 16px 20px;display:flex;flex-direction:column;gap:6px;">
              <li><code>holderName</code> — Full name of member</li>
              <li><code>idNumber</code> — Unique ID or Registration No.</li>
              <li><code>role</code> — Department or Title (e.g. Student)</li>
              <li><code>cardType</code> — Student ID / Employee ID</li>
              <li><code>email</code> — Member email address for auto-delivery</li>
            </ul>
            <div style="padding:10px;background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2);border-radius:8px;color:var(--accent-purple);">
              ⚡ Multi-issuance automatically triggers Apple/Google Wallet pass email notifications to all members!
            </div>
          </div>
        </div>
      </div>

      <!-- Batch Preview Section -->
      <div id="batch-progress-section" style="display:none;margin-top:24px;" class="dash-panel">
        <div class="dash-panel-title">Batch Issuance Progress</div>
        <div class="dso-progress-bar" style="height:8px;margin-bottom:12px;"><div class="dso-progress-fill" id="batch-fill" style="width:0%;"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:.84rem;">
          <span id="batch-status-text">Processing batch file...</span>
          <strong id="batch-count-text">0 / 5 Issued</strong>
        </div>
      </div>
    </div>`;
}

function downloadSampleCSV() {
  const csvContent = "holderName,idNumber,role,cardType,email,orgName\nEmma Watson,STU-9901,Computer Science,Student ID,emma@mit.edu,MIT University\nJames Bond,EMP-007,Field Agent,Employee ID,bond@mi6.gov,MI6 Agency\nDr. John Watson,DOC-102,Surgeon,Employee ID,watson@hospital.org,City Hospital";
  downloadBlob(new Blob([csvContent], { type: 'text/csv' }), 'vaultid_sample_roster.csv');
  showToast('📥 Sample CSV template downloaded!', 'success');
}

function simulateCSVUpload() {
  const sec = document.getElementById('batch-progress-section');
  const fill = document.getElementById('batch-fill');
  const stText = document.getElementById('batch-status-text');
  const cntText = document.getElementById('batch-count-text');
  if (!sec) return;

  sec.style.display = 'block';
  fill.style.width = '0%';
  showToast('⚡ Processing CSV file...', 'info');

  const demoBatch = [
    { holderName: 'Emma Watson', orgName: 'MIT University', role: 'Computer Science', idNumber: 'STU-9901', cardType: 'Student ID', colorIdx: 0, icon: '🎓' },
    { holderName: 'James Bond', orgName: 'MI6 Agency', role: 'Field Agent', idNumber: 'EMP-007', cardType: 'Employee ID', colorIdx: 9, icon: '🏛️' },
    { holderName: 'Dr. John Watson', orgName: 'City Hospital', role: 'Surgeon', idNumber: 'DOC-102', cardType: 'Employee ID', colorIdx: 2, icon: '🏥' },
    { holderName: 'Sophia Loren', orgName: 'Global Bank', role: 'Finance Director', idNumber: 'BNK-404', cardType: 'Employee ID', colorIdx: 1, icon: '🏦' },
    { holderName: 'Lucas Croft', orgName: 'Oxford Tech', role: 'Research Fellow', idNumber: 'OXF-771', cardType: 'Faculty ID', colorIdx: 10, icon: '🔬' },
  ];

  let step = 0;
  const interval = setInterval(() => {
    step++;
    const pct = Math.round((step / 5) * 100);
    fill.style.width = pct + '%';
    stText.textContent = `Issuing card for ${demoBatch[step-1].holderName}...`;
    cntText.textContent = `${step} / 5 Issued`;

    // Add card to wallet
    state.cards.push({ id: uid(), flipped: false, createdAt: new Date().toISOString(), logoDataUrl: null, email: '', expiry: '2028-12-31', issue: '2024-01-01', website: '', address: '', phone: '', ...demoBatch[step-1] });

    if (step >= 5) {
      clearInterval(interval);
      saveState();
      stText.textContent = '✅ All 5 cards successfully issued & added to wallet!';
      showToast('🎉 Batch issuance complete! 5 cards added.', 'success');
      addActivity('Batch issued 5 new cards', 'green');
    }
  }, 700);
}

// ══════════════════════════════════════════════
// PAGE 3: DEVELOPER PORTAL & REST API
// ══════════════════════════════════════════════
function buildDeveloperHTML() {
  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">⚡ Developer Portal &amp; REST API</h2>
          <p class="section-subtitle">API keys, Webhook endpoints &amp; SDK integration specs</p>
        </div>
        <button class="btn-cta" onclick="showToast('🔑 New API Secret Key generated', 'success')"><i class="fa-solid fa-key"></i> Generate Key</button>
      </div>

      <!-- API Key Card -->
      <div class="dash-panel" style="margin-bottom:20px;">
        <div class="dash-panel-title">Production API Key</div>
        <div style="display:flex;gap:10px;align-items:center;">
          <input class="form-input" style="font-family:monospace;letter-spacing:1px;" value="vkt_live_9f8a3c2b1e4d5a6b7c8d9e0f1a2b3c4d5" readonly/>
          <button class="card-action-btn primary" onclick="copyToClipboard('vkt_live_9f8a3c2b1e4d5a6b7c8d9e0f1a2b3c4d5')"><i class="fa-solid fa-copy"></i> Copy</button>
        </div>
      </div>

      <!-- Code Snippets -->
      <div class="dash-two-col">
        <div class="dash-panel">
          <div class="dash-panel-title">cURL — Issue Card via REST API</div>
          <pre style="background:var(--bg-base);padding:14px;border-radius:10px;font-size:.78rem;color:var(--accent-cyan);overflow-x:auto;"><code>curl -X POST https://api.vaultid.app/v1/cards \
  -H "Authorization: Bearer vkt_live_9f8a3..." \
  -H "Content-Type: application/json" \
  -d '{
    "holderName": "John Doe",
    "orgName": "MIT University",
    "cardType": "Student ID",
    "role": "Computer Science"
  }'</code></pre>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">JavaScript SDK — Verify NFC Token</div>
          <pre style="background:var(--bg-base);padding:14px;border-radius:10px;font-size:.78rem;color:var(--accent-green);overflow-x:auto;"><code>import { VaultID } from '@vaultid/sdk';

const client = new VaultID({ apiKey: 'vkt_live_9f8a3...' });
const result = await client.nfc.verify({
  token: 'nfc_payload_token_string'
});
console.log(result.isValid); // true</code></pre>
        </div>
      </div>

      <!-- Webhooks Box -->
      <div class="dash-panel" style="margin-top:20px;">
        <div class="dash-panel-title">Webhook Subscriptions</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Webhook URL Endpoint</label>
            <input class="form-input" value="https://api.youruniversity.edu/webhooks/vaultid"/>
          </div>
          <div class="form-group">
            <label class="form-label">Subscribed Events</label>
            <select class="form-select">
              <option>card.issued, card.revoked, nfc.scanned</option>
              <option>card.issued only</option>
              <option>nfc.scanned only</option>
            </select>
          </div>
        </div>
        <button class="card-action-btn primary" style="margin-top:10px;" onclick="showToast('✅ Webhook endpoint updated!', 'success')">Save Webhook Settings</button>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// PAGE 4: ENTERPRISE SETTINGS & BRANDING
// ══════════════════════════════════════════════
function buildSettingsHTML() {
  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">⚙️ Enterprise Settings &amp; White-Label</h2>
          <p class="section-subtitle">Custom domains, Single Sign-On (SSO) &amp; email branding</p>
        </div>
        <button class="btn-cta" onclick="showToast('💾 Settings saved successfully!', 'success')"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>
      </div>

      <div class="dash-two-col">
        <!-- Branding Settings -->
        <div class="dash-panel">
          <div class="dash-panel-title">Organization White-Labeling</div>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Custom Subdomain</label>
            <input class="form-input" value="id.mit.edu"/>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Primary Brand Color</label>
            <input type="color" class="form-input" value="#8b5cf6" style="height:42px;padding:4px;cursor:pointer;"/>
          </div>
          <div class="form-group">
            <label class="form-label">Custom Email Footer Text</label>
            <input class="form-input" value="Issued by MIT Campus Card Services · All Rights Reserved"/>
          </div>
        </div>

        <!-- SSO Settings -->
        <div class="dash-panel">
          <div class="dash-panel-title">Single Sign-On (SSO / SAML 2.0)</div>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">Identity Provider (IdP) Entity ID</label>
            <input class="form-input" value="https://idp.university.edu/saml2/idp/metadata.php"/>
          </div>
          <div class="form-group" style="margin-bottom:12px;">
            <label class="form-label">SSO Provider Type</label>
            <select class="form-select">
              <option>Okta Single Sign-On</option>
              <option>Microsoft Azure AD / Entra ID</option>
              <option>Google Workspace SAML</option>
              <option>Shibboleth / CAS</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:10px;margin-top:14px;">
            <input type="checkbox" id="en-sso" checked style="width:18px;height:18px;accent-color:var(--accent-purple);"/>
            <label for="en-sso" style="font-size:.85rem;font-weight:600;cursor:pointer;">Enforce SSO for all Organization Admins</label>
          </div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// PAGE 5: ANALYTICS & REPORTS
// ══════════════════════════════════════════════
function buildAnalyticsHTML() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const scanData = [340, 420, 510, 680, 720, 290, 180];
  const maxScan  = Math.max(...scanData);

  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">📊 Usage &amp; Access Analytics</h2>
          <p class="section-subtitle">Traffic insights, peak scan hours &amp; card usage metrics</p>
        </div>
        <button class="btn-cta" onclick="showToast('📊 Analytics PDF Export generated', 'success')"><i class="fa-solid fa-file-pdf"></i> Export Report</button>
      </div>

      <!-- KPI Grid -->
      <div class="dashboard-grid">
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📈</div>
          <div class="dash-stat-value">3,140</div>
          <div class="dash-stat-label">Weekly NFC Scans</div>
          <div class="dash-stat-change">↑ 24% vs last week</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">⚡</div>
          <div class="dash-stat-value">8:30 AM</div>
          <div class="dash-stat-label">Peak Access Hour</div>
          <div class="dash-stat-change">740 scans/hr</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📍</div>
          <div class="dash-stat-value">Main Gate #1</div>
          <div class="dash-stat-label">Busiest Location</div>
          <div class="dash-stat-change">48% of total volume</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">⏱️</div>
          <div class="dash-stat-value">120 ms</div>
          <div class="dash-stat-label">Avg Verification Time</div>
          <div class="dash-stat-change">Sub-second response</div>
        </div>
      </div>

      <!-- Scans chart -->
      <div class="dash-two-col" style="margin-top:20px;">
        <div class="dash-panel">
          <div class="dash-panel-title">Daily Scan Volume (Last 7 Days)</div>
          <div class="revenue-chart">
            ${days.map((d,i) => `
              <div class="chart-bar-wrap">
                <div class="chart-bar" style="height:${Math.round((scanData[i]/maxScan)*100)}%;background:linear-gradient(180deg,var(--accent-cyan),rgba(6,182,212,.3));"></div>
                <div class="chart-label">${d}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Usage by Device / Platform</div>
          <div class="plan-breakdown">
            <div class="plan-row"><div class="plan-row-name">Apple Wallet</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:62%;background:var(--text-primary);"></div></div><div class="plan-row-val">62%</div></div>
            <div class="plan-row"><div class="plan-row-name">Google Wallet</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:28%;background:var(--accent-blue);"></div></div><div class="plan-row-val">28%</div></div>
            <div class="plan-row"><div class="plan-row-name">PWA / Web</div><div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:10%;background:var(--accent-purple);"></div></div><div class="plan-row-val">10%</div></div>
          </div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// PAGE 6: MEMBER & CARDHOLDER DIRECTORY
// ══════════════════════════════════════════════
function buildDirectoryHTML() {
  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">👥 Member &amp; Cardholder Directory</h2>
          <p class="section-subtitle">Manage issued cards, revoke access &amp; resend passes</p>
        </div>
        <button class="btn-cta" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> Issue New ID</button>
      </div>

      <div class="dash-panel">
        <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
          <input class="form-input" style="max-width:300px;" placeholder="🔍 Search name, ID, department..." onkeyup="filterDirectory(this.value)"/>
          <select class="form-select" style="max-width:180px;">
            <option>All Organizations</option>
            <option>MIT University</option>
            <option>TechCorp Inc.</option>
            <option>City Hospital</option>
          </select>
        </div>
        <div style="overflow-x:auto;">
          <table class="sub-table" id="directory-table">
            <thead>
              <tr><th>Member Name</th><th>ID Number</th><th>Organization</th><th>Role / Dept</th><th>Issued Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              ${state.cards.map(c => `
                <tr>
                  <td><strong>${esc(c.holderName)}</strong></td>
                  <td style="font-family:monospace;">${esc(c.idNumber)}</td>
                  <td>${esc(c.orgName)}</td>
                  <td>${esc(c.cardType)} · ${esc(c.role)}</td>
                  <td style="color:var(--text-muted);">${c.issue || '2024-01-01'}</td>
                  <td>
                    <button class="nav-btn" style="padding:4px 10px;font-size:.73rem;" onclick="openWalletShare('${c.id}')"><i class="fa-solid fa-share"></i> Pass</button>
                    <button class="nav-btn" style="padding:4px 10px;font-size:.73rem;color:#f87171;" onclick="deleteCard('${c.id}')"><i class="fa-solid fa-ban"></i> Revoke</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function filterDirectory(query) {
  const rows = document.querySelectorAll('#directory-table tbody tr');
  const q = query.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════
// PAGE 7: GATES & ACCESS CONTROL
// ══════════════════════════════════════════════
function buildGatesHTML() {
  const gates = [
    { name: 'Main Campus Gate #1', status: 'Online', battery: '98%', type: 'NFC Turnstile', location: 'North Entrance', online: true },
    { name: 'Library Entry Turnstile B', status: 'Online', battery: '100%', type: 'QR Reader', location: 'Building A', online: true },
    { name: 'Server Room Door Gate #4', status: 'Online', battery: '92%', type: 'Biometric + NFC', location: 'Basement Level 2', online: true },
    { name: 'Gym / Sports Complex Turnstile', status: 'Online', battery: '84%', type: 'NFC Reader', location: 'East Wing', online: true },
  ];

  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">🚪 Physical Gates &amp; Terminals</h2>
          <p class="section-subtitle">Monitor turnstiles, readers &amp; remote door unlock relays</p>
        </div>
        <button class="btn-cta" onclick="showToast('⚡ All gate relays unlocked for 10s', 'info')"><i class="fa-solid fa-door-open"></i> Unlock All Gates</button>
      </div>

      <div class="orgs-grid">
        ${gates.map(g => `
          <div class="org-card" style="cursor:default;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <div class="org-card-icon" style="background:rgba(16,185,129,.15);color:var(--accent-green);margin-bottom:0;">
                <i class="fa-solid fa-door-closed"></i>
              </div>
              <span class="plan-chip" style="background:rgba(16,185,129,.15);color:var(--accent-green);">● ${g.status}</span>
            </div>
            <div class="org-card-name">${esc(g.name)}</div>
            <div class="org-card-type">${esc(g.type)} · ${esc(g.location)}</div>
            <div style="display:flex;justify-content:space-between;font-size:.76rem;color:var(--text-muted);margin-top:12px;border-top:1px solid var(--border-subtle);padding-top:8px;">
              <span>Battery: ${g.battery}</span>
              <a onclick="showToast('🔓 Gate pulse signal sent', 'success')" style="color:var(--accent-cyan);cursor:pointer;font-weight:700;">Unlock Door →</a>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// PAGE 8: BROADCAST NOTIFICATIONS
// ══════════════════════════════════════════════
function buildNotificationsHTML() {
  return `
    <div class="inner-page-wrap">
      <div class="section-header">
        <div>
          <h2 class="section-title">🔔 Broadcast Push Notifications</h2>
          <p class="section-subtitle">Send urgent pass updates &amp; alerts directly to Apple &amp; Google Wallet</p>
        </div>
      </div>

      <div class="dash-panel" style="max-width:600px;margin:0 auto;">
        <div class="dash-panel-title">Dispatch Wallet Push Notification</div>
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">Notification Title *</label>
          <input class="form-input" id="notif-title" placeholder="e.g. Campus Emergency Alert / Event Reminder"/>
        </div>
        <div class="form-group" style="margin-bottom:14px;">
          <label class="form-label">Message Body *</label>
          <textarea class="form-input" id="notif-body" rows="4" style="resize:none;" placeholder="Enter message to display on member lock screens..."></textarea>
        </div>
        <div class="form-group" style="margin-bottom:18px;">
          <label class="form-label">Target Audience</label>
          <select class="form-select">
            <option>All Issued Wallet Cards (Every Member)</option>
            <option>MIT University Students Only</option>
            <option>TechCorp Employees Only</option>
            <option>Hospital Staff Only</option>
          </select>
        </div>
        <button class="btn-submit" onclick="sendBroadcastNotif()"><i class="fa-solid fa-paper-plane"></i> Broadcast Push Notification</button>
      </div>
    </div>`;
}

function sendBroadcastNotif() {
  const title = document.getElementById('notif-title')?.value.trim();
  const body  = document.getElementById('notif-body')?.value.trim();
  if (!title || !body) { showToast('Please enter notification title and message', 'error'); return; }
  showToast(`🔔 Push sent: "${title}"`, 'success');
  addActivity(`Broadcast alert sent: ${title}`, 'purple');
  document.getElementById('notif-title').value = '';
  document.getElementById('notif-body').value  = '';
}

// ══════════════════════════════════════════════
// THEME SWITCHER LOGIC
// ══════════════════════════════════════════════
function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('vid3_theme', theme);
  showToast(`🎨 Theme changed: ${theme.toUpperCase()}`, 'info');
}

// Load saved theme
(function() {
  const saved = localStorage.getItem('vid3_theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);
})();

// ══════════════════════════════════════════════
// FACEID BIOMETRIC VERIFICATION SIMULATOR
// ══════════════════════════════════════════════
let _faceIdCardId = null;

function triggerFaceId(cardId) {
  _faceIdCardId = cardId;
  const t = document.getElementById('faceid-status-title');
  const s = document.getElementById('faceid-status-sub');
  const icon = document.getElementById('faceid-icon');
  if (t) t.textContent = 'Authenticating FaceID...';
  if (s) s.textContent = 'Hold device still and look into camera';
  if (icon) icon.innerHTML = '<i class="fa-solid fa-face-smile-beam"></i>';
  openModal('faceid-modal');

  setTimeout(simulateFaceIdSuccess, 1800);
}

function simulateFaceIdSuccess() {
  const t = document.getElementById('faceid-status-title');
  const s = document.getElementById('faceid-status-sub');
  const icon = document.getElementById('faceid-icon');
  if (t) t.textContent = 'FaceID Verified! ✅';
  if (s) s.textContent = 'Biometric match 99.8% confirmed';
  if (icon) icon.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--accent-green);"></i>';

  setTimeout(() => {
    closeModal('faceid-modal');
    showToast('🔐 Biometric unlock successful!', 'success');
    if (_faceIdCardId) launchDemoScan(_faceIdCardId);
  }, 1000);
}

// ══════════════════════════════════════════════
// PRINTABLE CARD SHEET GENERATOR
// ══════════════════════════════════════════════
function printCardSheet() {
  if (!state.cards.length) { showToast('No cards to print!', 'error'); return; }
  const win = window.open('', '_blank');
  const cardsHtml = state.cards.map(c => `
    <div style="width:320px;height:190px;border-radius:16px;background:${COLOR_THEMES[c.colorIdx].gradient};color:#fff;padding:16px;box-sizing:border-box;margin:10px;display:inline-block;vertical-align:top;font-family:sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);position:relative;">
      <div style="font-size:1.2rem;margin-bottom:10px;">${c.icon} <strong style="font-size:.9rem;float:right;">${c.orgName}</strong></div>
      <div style="font-size:1.1rem;font-weight:bold;margin-bottom:4px;">${c.holderName}</div>
      <div style="font-size:.78rem;opacity:0.8;">${c.cardType} · ${c.role}</div>
      <div style="position:absolute;bottom:14px;left:16px;font-family:monospace;font-size:.75rem;opacity:0.6;">ID: ${c.idNumber}</div>
      <div style="position:absolute;bottom:14px;right:16px;font-size:.65rem;opacity:0.5;">VaultID</div>
    </div>`).join('');

  win.document.write(`
    <html>
      <head><title>VaultID — Printable ID Cards Sheet</title></head>
      <body onload="window.print()" style="background:#fff;padding:20px;font-family:sans-serif;">
        <h2 style="color:#1e1b4b;">VaultID — Physical Card Sheet (${state.cards.length} Cards)</h2>
        <p style="color:#666;font-size:14px;">Cut along edges for physical backup cards.</p>
        <hr style="margin-bottom:20px;"/>
        ${cardsHtml}
      </body>
    </html>`);
  win.document.close();
}

// ══════════════════════════════════════════════
// MULTI-USER ACCOUNT MANAGEMENT SYSTEM
// ══════════════════════════════════════════════
let usersState = [
  { id: 'u1', name: 'Alex Johnson',    org: 'MIT University',       role: 'Student',      icon: '🎓' },
  { id: 'u2', name: 'Sarah Chen',      org: 'TechCorp Inc.',        role: 'Senior Eng',   icon: '🏢' },
  { id: 'u3', name: 'Dr. Malik Patel', org: 'City General Hospital',role: 'Cardiologist', icon: '🏥' },
  { id: 'u4', name: 'System Admin',    org: 'ETP Platform',         role: 'Administrator',icon: '⚡' },
];
let activeUserId = 'u1';

function openUserModal() {
  renderUsersList();
  openModal('user-switch-modal');
}

function renderUsersList() {
  const container = document.getElementById('users-account-list');
  if (!container) return;

  container.innerHTML = usersState.map(u => {
    const isActive = u.id === activeUserId;
    return `
      <div class="card-list-item" onclick="switchUserAccount('${u.id}')" style="${isActive ? 'border-color:var(--accent-purple);background:rgba(139,92,246,.12);' : ''}">
        <div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--accent-purple),var(--accent-blue));display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;color:#fff;">${u.icon}</div>
        <div class="card-list-info">
          <div class="card-list-name">${esc(u.name)} ${isActive ? '<span class="plan-chip pro" style="margin-left:6px;font-size:.65rem;">Active Profile</span>' : ''}</div>
          <div class="card-list-org">${esc(u.org)} · ${esc(u.role)}</div>
        </div>
        ${isActive ? '<i class="fa-solid fa-circle-check" style="color:var(--accent-purple);font-size:1.1rem;"></i>' : '<button class="nav-btn" style="padding:4px 10px;font-size:.73rem;">Switch</button>'}
      </div>`;
  }).join('');
}

function switchUserAccount(userId) {
  const user = usersState.find(u => u.id === userId);
  if (!user) return;

  activeUserId = userId;
  const topName = document.getElementById('topbar-user-name');
  if (topName) topName.textContent = user.name;

  // Filter or highlight cards belonging to this user
  const userCard = state.cards.find(c => c.holderName.toLowerCase().includes(user.name.split(' ')[0].toLowerCase()));
  if (userCard) state.selectedCardId = userCard.id;

  closeModal('user-switch-modal');
  showToast(`👤 Switched account: ${user.name} (${user.org})`, 'success');
  addActivity(`Switched user profile: ${user.name}`, 'blue');

  if (state.currentPage === 'app') renderInnerPage(state.currentInnerPage);
}

function addNewUserAccount() {
  const name = document.getElementById('new-user-name')?.value.trim();
  const org  = document.getElementById('new-user-org')?.value.trim() || 'Organization';
  if (!name) { showToast('Please enter member name', 'error'); return; }

  const newUser = {
    id: uid(), name, org, role: 'Member', icon: '👤'
  };
  usersState.push(newUser);

  // Issue card for this new user automatically
  state.cards.unshift({
    id: uid(), holderName: name, orgName: org, orgType: 'other',
    role: 'Member', idNumber: generateId(), cardType: 'Member Card',
    colorIdx: Math.floor(Math.random() * COLOR_THEMES.length), icon: '👤',
    logoDataUrl: null, flipped: false, email: '', expiry: '2028-12-31', issue: new Date().toISOString().split('T')[0],
    website: '', address: '', phone: '', createdAt: new Date().toISOString()
  });

  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-org').value  = '';

  switchUserAccount(newUser.id);
  saveState();
}

// ══════════════════════════════════════════════
// UNIVERSAL COMMAND PALETTE & SEARCH
// ══════════════════════════════════════════════
function openCommandPalette() {
  const inp = document.getElementById('cmd-search-input');
  if (inp) { inp.value = ''; }
  runCommandSearch('');
  openModal('cmd-palette-modal');
  setTimeout(() => inp?.focus(), 100);
}

function runCommandSearch(query) {
  const container = document.getElementById('cmd-search-results');
  if (!container) return;

  const q = (query || '').toLowerCase().trim();

  // Search across pages, cards, and quick actions
  const items = [];

  // Page quick links
  ALL_PAGES.forEach(p => {
    if (!q || p.includes(q)) {
      items.push({
        title: `Go to ${p.charAt(0).toUpperCase() + p.slice(1)} Page`,
        sub: `Navigate directly to ${p} dashboard`,
        icon: '🔗',
        action: () => { closeModal('cmd-palette-modal'); appNav(p); }
      });
    }
  });

  // Cards search
  state.cards.forEach(c => {
    if (!q || c.holderName.toLowerCase().includes(q) || c.orgName.toLowerCase().includes(q) || c.idNumber.toLowerCase().includes(q)) {
      items.push({
        title: `${c.holderName} (${c.idNumber})`,
        sub: `${c.orgName} · ${c.cardType}`,
        icon: c.icon,
        action: () => { closeModal('cmd-palette-modal'); selectCard(c.id); appNav('wallet'); }
      });
    }
  });

  container.innerHTML = items.slice(0, 8).map((item, idx) => `
    <div class="card-list-item" onclick="window._cmdItems[${idx}].action()">
      <div style="width:36px;height:36px;border-radius:10px;background:rgba(139,92,246,.15);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">${item.icon}</div>
      <div class="card-list-info">
        <div class="card-list-name">${esc(item.title)}</div>
        <div class="card-list-org">${esc(item.sub)}</div>
      </div>
      <div class="card-list-arrow"><i class="fa-solid fa-arrow-right"></i></div>
    </div>`).join('') || `<div style="text-align:center;color:var(--text-muted);padding:20px;">No results matching "${esc(query)}"</div>`;

  window._cmdItems = items;
}
// ══════════════════════════════════════════════════════════════════
//  ADVANCED FEATURES MODULE
// ══════════════════════════════════════════════════════════════════

// ── LIVE ACTIVITY TICKER ─────────────────────────────────────────
const TICKER_EVENTS = [
  '🔐 NFC Verified · Alex Johnson · Main Gate #1',
  '📦 5 Cards Bulk Issued · MIT University',
  '🏥 Dr. Patel pass exported · Apple Wallet',
  '⚠️ Expiry Warning · Card EMP-00142 (7 days left)',
  '🟢 Gate Relay Online · Library Turnstile B',
  '🔑 New card issued · Sarah O\'Brien · Hospital ID',
  '📊 Revenue report generated · Q4 2024',
  '🌍 Card verified · 192.168.1.102 · London, UK',
  '🛡️ Security scan passed · VaultID v3.2',
  '🎓 Bulk enroll complete · 14 students · CS Dept',
];
let _tickerIdx = 0;
function startLiveTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  function nextTick() {
    const spans = track.querySelectorAll('.ticker-item');
    spans.forEach(s => s.style.opacity = '0');
    setTimeout(() => {
      track.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('span');
        s.className = 'ticker-item';
        s.textContent = TICKER_EVENTS[(_tickerIdx + i) % TICKER_EVENTS.length];
        track.appendChild(s);
      }
      _tickerIdx = (_tickerIdx + 1) % TICKER_EVENTS.length;
    }, 200);
  }
  setInterval(nextTick, 3500);
  // Inject real-time events when user scans
  window._tickerPush = (msg) => {
    TICKER_EVENTS.unshift(msg);
    if (TICKER_EVENTS.length > 30) TICKER_EVENTS.pop();
  };
}
document.addEventListener('DOMContentLoaded', () => setTimeout(startLiveTicker, 500));

// ── EXPIRY ALERT SYSTEM ──────────────────────────────────────────
function checkExpiryAlerts() {
  const now = Date.now();
  const WARN_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
  const expiring = state.cards.filter(c => {
    if (!c.expiry) return false;
    const exp = new Date(c.expiry).getTime();
    return exp - now < WARN_MS && exp > now;
  });
  const expired = state.cards.filter(c => {
    if (!c.expiry) return false;
    return new Date(c.expiry).getTime() < now;
  });
  const badge = document.getElementById('expiry-badge');
  const total = expiring.length + expired.length;
  if (badge) {
    if (total > 0) {
      badge.style.display = 'flex';
      badge.textContent = total;
    } else {
      badge.style.display = 'none';
    }
  }
  return { expiring, expired };
}
setInterval(checkExpiryAlerts, 60000);
document.addEventListener('DOMContentLoaded', () => setTimeout(checkExpiryAlerts, 1000));

function openExpiryAlerts() {
  const { expiring, expired } = checkExpiryAlerts();
  const list = document.getElementById('expiry-list');
  if (!list) return;
  const now = Date.now();
  const fmt = d => {
    const ms = new Date(d).getTime() - now;
    const days = Math.ceil(ms / 86400000);
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    return `Expires in ${days} day${days === 1 ? '' : 's'}`;
  };
  const cards = [...expired.map(c => ({ ...c, _status: 'expired' })), ...expiring.map(c => ({ ...c, _status: 'expiring' }))];
  if (cards.length === 0) {
    list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">
      <i class="fa-solid fa-circle-check" style="font-size:2rem;color:#22c55e;display:block;margin-bottom:12px;"></i>
      All cards are valid. No alerts.
    </div>`;
  } else {
    list.innerHTML = cards.map(c => {
      const isExp = c._status === 'expired';
      return `<div style="background:${isExp ? 'rgba(239,68,68,.08)' : 'rgba(251,191,36,.08)'};border:1px solid ${isExp ? 'rgba(239,68,68,.25)' : 'rgba(251,191,36,.25)'};border-radius:12px;padding:14px;display:flex;align-items:center;gap:14px;">
        <div style="font-size:2rem;">${c.icon || '🪪'}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:700;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${esc(c.name)}</div>
          <div style="font-size:.82rem;color:var(--text-muted);">${esc(c.org)} · ${esc(c.idNumber)}</div>
          <div style="font-size:.82rem;margin-top:4px;font-weight:600;color:${isExp ? '#f87171' : '#fbbf24'};">${fmt(c.expiry)}</div>
        </div>
        <button class="qs-chip" onclick="renewCard('${esc(c.id)}');closeModal('expiry-modal');">Renew</button>
      </div>`;
    }).join('');
  }
  openModal('expiry-modal');
}

function renewCard(id) {
  const card = state.cards.find(c => c.id === id);
  if (!card) return;
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  card.expiry = d.toISOString().split('T')[0];
  saveState();
  renderWallet();
  checkExpiryAlerts();
  showToast('✅ Card renewed for 1 year', 'success');
  if (window._tickerPush) _tickerPush(`🔄 Card renewed · ${card.name} · ${card.org}`);
}

// ── QR SCANNER SIMULATOR ─────────────────────────────────────────
const QR_DB = {
  'MIT-2024-4872': { name: 'Alex Johnson', org: 'MIT University', role: 'Graduate Student', dept: 'Computer Science', icon: '🎓', status: 'valid', expires: '2025-06-30' },
  'EMP-00142':     { name: 'Sarah Mitchell', org: 'TechCorp Inc.', role: 'Senior Engineer', dept: 'R&D Division', icon: '🏢', status: 'expiring', expires: '2025-02-15' },
  'DOC-2019-007':  { name: 'Dr. Raj Patel', org: 'City General Hospital', role: 'Chief of Surgery', dept: 'Cardiology', icon: '🏥', status: 'valid', expires: '2026-12-31' },
};
function openQRScannerModal() {
  const res = document.getElementById('qr-scan-result');
  if (res) { res.style.display = 'none'; res.innerHTML = ''; }
  openModal('qr-scan-modal');
}
function simulateQRScan(id) {
  const res = document.getElementById('qr-scan-result');
  if (!res) return;
  res.style.display = 'block';
  res.innerHTML = `<div style="text-align:center;padding:12px;color:var(--text-muted);font-size:.82rem;"><i class="fa-solid fa-spinner fa-spin"></i> Scanning...</div>`;
  setTimeout(() => {
    const rec = QR_DB[id];
    if (!rec) {
      res.innerHTML = `<div style="background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:12px;padding:16px;color:#f87171;"><i class="fa-solid fa-circle-xmark"></i> ID not found in VaultID registry.</div>`;
      return;
    }
    const statusColor = rec.status === 'valid' ? '#22c55e' : '#fbbf24';
    const statusLabel = rec.status === 'valid' ? '✅ VERIFIED' : '⚠️ EXPIRING SOON';
    res.innerHTML = `
      <div style="background:rgba(34,197,94,.06);border:1px solid rgba(34,197,94,.2);border-radius:14px;padding:18px;text-align:left;">
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:14px;">
          <div style="font-size:2.5rem;">${rec.icon}</div>
          <div>
            <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">${esc(rec.name)}</div>
            <div style="font-size:.82rem;color:var(--text-muted);">${esc(rec.role)} · ${esc(rec.dept)}</div>
            <div style="font-size:.82rem;color:var(--text-muted);">${esc(rec.org)}</div>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
          <div style="font-size:.8rem;color:var(--text-muted);">Card ID: <strong style="color:var(--text-primary);">${esc(id)}</strong></div>
          <div style="font-size:.8rem;color:var(--text-muted);">Expires: <strong>${esc(rec.expires)}</strong></div>
        </div>
        <div style="margin-top:12px;font-weight:800;font-size:.88rem;color:${statusColor};">${statusLabel}</div>
      </div>`;
    if (window._tickerPush) _tickerPush(`📷 QR Verified · ${rec.name} · ${rec.org}`);
  }, 1200);
}

// ── MULTI-LANGUAGE ENGINE ─────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    wallet: 'Wallet', scan: 'NFC Scan', orgs: 'Orgs', revenue: 'Revenue',
    analytics: 'Analytics', directory: 'Directory', gates: 'Gates',
    security: 'Security', bulk: 'Bulk Issue', alerts: 'Alerts',
    api: 'API', settings: 'Settings', addCard: 'Add Card',
    searchPlaceholder: 'Search cards, members, gates...',
    greeting: 'Welcome back',
  },
  ur: {
    wallet: 'بٹوہ', scan: 'این ایف سی اسکین', orgs: 'ادارے', revenue: 'آمدنی',
    analytics: 'تجزیات', directory: 'فہرست', gates: 'دروازے',
    security: 'سیکیورٹی', bulk: 'بلک جاری', alerts: 'انتباہات',
    api: 'API', settings: 'ترتیبات', addCard: 'کارڈ شامل کریں',
    searchPlaceholder: 'کارڈ، اراکین، دروازے تلاش کریں...',
    greeting: 'خوش آمدید',
  },
  ar: {
    wallet: 'المحفظة', scan: 'مسح NFC', orgs: 'المؤسسات', revenue: 'الإيرادات',
    analytics: 'التحليلات', directory: 'الدليل', gates: 'البوابات',
    security: 'الأمان', bulk: 'إصدار مجمع', alerts: 'التنبيهات',
    api: 'API', settings: 'الإعدادات', addCard: 'إضافة بطاقة',
    searchPlaceholder: 'البحث في البطاقات والأعضاء...',
    greeting: 'مرحباً بعودتك',
  },
};
let _currentLang = 'en';
function switchLanguage(lang) {
  _currentLang = lang;
  const T = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const isRTL = lang === 'ar' || lang === 'ur';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  // Nav labels
  const map = {
    'dnav-wallet': T.wallet, 'dnav-scan': T.scan, 'dnav-orgs': T.orgs,
    'dnav-dashboard': T.revenue, 'dnav-analytics': T.analytics,
    'dnav-directory': T.directory, 'dnav-gates': T.gates,
    'dnav-security': T.security, 'dnav-batch': T.bulk,
    'dnav-notifications': T.alerts, 'dnav-developer': T.api,
    'dnav-settings': T.settings,
  };
  Object.entries(map).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = el.innerHTML.replace(/>[^<]+<\/button>/, `>${label}</button>`).replace(/>([^<]*)<\/button>$/, `>${label}</button>`);
  });
  localStorage.setItem('vid3_lang', lang);
  showToast(`🌍 Language switched · ${lang.toUpperCase()}`, 'success');
}
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('vid3_lang');
  if (savedLang && TRANSLATIONS[savedLang]) {
    document.getElementById('lang-select') && (document.getElementById('lang-select').value = savedLang);
    switchLanguage(savedLang);
  }
});

// ── PDF EXPORT ───────────────────────────────────────────────────
function openPDFExport() { openModal('pdf-modal'); }
function generatePDFExport() {
  const format = document.getElementById('pdf-format')?.value || 'all';
  const size = document.getElementById('pdf-size')?.value || 'a4';
  const cards = format === 'selected'
    ? state.cards.filter(c => c.id === state.selectedCardId)
    : state.cards;
  if (!cards.length) { showToast('No cards to export', 'error'); return; }

  const rowH = 140, rowW = 560, perPage = 4;
  let svgCards = cards.slice(0, 16).map((c, i) => {
    const g = COLOR_THEMES[c.colorIdx] || COLOR_THEMES[0];
    return `<rect x="20" y="${20 + (i % perPage) * (rowH + 20)}" width="${rowW}" height="${rowH}" rx="18" fill="url(#g${i})"/>
    <defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${g.swatch}"/>
      <stop offset="100%" stop-color="${g.swatch}88"/>
    </linearGradient></defs>
    <text x="80" y="${55 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="28" fill="white" font-weight="bold">${esc(c.icon||'🪪')}</text>
    <text x="120" y="${55 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="16" fill="white" font-weight="bold">${esc(c.name)}</text>
    <text x="120" y="${78 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="12" fill="rgba(255,255,255,.75)">${esc(c.org)}</text>
    <text x="120" y="${98 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="12" fill="rgba(255,255,255,.75)">${esc(c.role)} · ${esc(c.idNumber)}</text>
    <text x="120" y="${118 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="11" fill="rgba(255,255,255,.5)">Exp: ${esc(c.expiry||'N/A')}</text>
    <text x="540" y="${140 + (i % perPage) * (rowH + 20)}" font-family="Arial" font-size="10" fill="rgba(255,255,255,.4)" text-anchor="end">VaultID · ETP</text>`;
  }).join('');

  const svgH = Math.min(cards.length, perPage) * (rowH + 20) + 40;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="${svgH}" viewBox="0 0 600 ${svgH}">
    <rect width="600" height="${svgH}" fill="#0f172a" rx="8"/>
    ${svgCards}
  </svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `VaultID-export-${Date.now()}.svg`;
  a.click(); URL.revokeObjectURL(url);
  closeModal('pdf-modal');
  showToast('📄 Cards exported as SVG', 'success');
  if (window._tickerPush) _tickerPush(`📄 ${cards.length} cards exported · PDF/SVG`);
}

// ── ACTIVITY HEATMAP (for Analytics page) ────────────────────────
function renderActivityHeatmap(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const weeks = 12, days = 7;
  let cells = '';
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const val = Math.random();
      const opacity = val < 0.2 ? 0.06 : val < 0.5 ? 0.25 : val < 0.8 ? 0.55 : 1;
      const color = `rgba(139,92,246,${opacity})`;
      cells += `<div title="${Math.round(val*20)} scans" style="width:16px;height:16px;background:${color};border-radius:3px;cursor:default;" class="hm-cell"></div>`;
    }
  }
  el.innerHTML = `
    <div style="display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;">
      ${Array.from({length:weeks}).map((_, w) =>
        `<div style="display:flex;flex-direction:column;gap:4px;">
          ${Array.from({length:days}).map((_, d) => {
            const v = Math.random();
            const op = v < .2 ? .06 : v < .5 ? .25 : v < .8 ? .55 : 1;
            return `<div style="width:14px;height:14px;background:rgba(139,92,246,${op});border-radius:3px;" title="${Math.round(v*20)} scans"></div>`;
          }).join('')}
        </div>`
      ).join('')}
    </div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:8px;font-size:.72rem;color:var(--text-muted);">
      Less <div style="width:10px;height:10px;background:rgba(139,92,246,.06);border-radius:2px;"></div>
      <div style="width:10px;height:10px;background:rgba(139,92,246,.25);border-radius:2px;"></div>
      <div style="width:10px;height:10px;background:rgba(139,92,246,.55);border-radius:2px;"></div>
      <div style="width:10px;height:10px;background:rgba(139,92,246,1);border-radius:2px;"></div>
      More
    </div>`;
}

// ── ANIMATED STAT COUNTER ────────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  if (!el) return;
  const dur = 1200, step = 16;
  const steps = dur / step;
  let cur = 0;
  const inc = target / steps;
  const timer = setInterval(() => {
    cur = Math.min(cur + inc, target);
    el.textContent = Math.floor(cur).toLocaleString() + suffix;
    if (cur >= target) clearInterval(timer);
  }, step);
}

// ── WALLET QUICK STATS RIBBON ─────────────────────────────────────
function renderStatsRibbon(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const total = state.cards.length;
  const { expiring, expired } = checkExpiryAlerts();
  const scans = state.scanCount;
  const orgs = [...new Set(state.cards.map(c => c.org))].length;
  el.innerHTML = `
    <div class="stats-ribbon">
      <div class="stat-chip" onclick="appNav('wallet')">
        <div class="stat-chip-val" id="sc-total">0</div>
        <div class="stat-chip-lbl">Total Cards</div>
      </div>
      <div class="stat-chip" onclick="appNav('scan')">
        <div class="stat-chip-val" id="sc-scans">0</div>
        <div class="stat-chip-lbl">NFC Scans</div>
      </div>
      <div class="stat-chip" onclick="appNav('orgs')">
        <div class="stat-chip-val" id="sc-orgs">0</div>
        <div class="stat-chip-lbl">Organisations</div>
      </div>
      <div class="stat-chip ${expiring.length+expired.length > 0 ? 'stat-chip-warn' : ''}" onclick="openExpiryAlerts()">
        <div class="stat-chip-val" id="sc-expiring">0</div>
        <div class="stat-chip-lbl">Need Renewal</div>
      </div>
    </div>`;
  setTimeout(() => {
    animateCounter(document.getElementById('sc-total'), total);
    animateCounter(document.getElementById('sc-scans'), scans);
    animateCounter(document.getElementById('sc-orgs'), orgs);
    animateCounter(document.getElementById('sc-expiring'), expiring.length + expired.length);
  }, 100);
}

// ── PUSH PDF BUTTON INTO WALLET HEADER ──────────────────────────
function injectWalletActions() {
  const hdr = document.getElementById('wallet-actions-row');
  if (hdr && !document.getElementById('pdf-export-btn')) {
    const btn = document.createElement('button');
    btn.id = 'pdf-export-btn';
    btn.className = 'nav-btn';
    btn.style.cssText = 'font-size:.78rem;';
    btn.innerHTML = '<i class="fa-solid fa-file-export"></i> Export PDF';
    btn.onclick = openPDFExport;
    hdr.appendChild(btn);
  }
}

// ── KEYBOARD SHORTCUT ADDITIONS ──────────────────────────────────
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') { e.preventDefault(); openPDFExport(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'q') { e.preventDefault(); openQRScannerModal(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'j') { e.preventDefault(); openExpiryAlerts(); }
});



