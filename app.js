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
function appNav(page) {
  ['wallet', 'scan', 'orgs', 'dashboard'].forEach(p => {
    [`dnav-${p}`, `mnav-${p}`].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', p === page);
    });
  });
  state.currentInnerPage = page;
  renderInnerPage(page);
}

function renderInnerPage(page) {
  state.currentInnerPage = page;
  ['wallet', 'scan', 'orgs', 'dashboard'].forEach(p => {
    [`dnav-${p}`, `mnav-${p}`].forEach(id => {
      document.getElementById(id)?.classList.toggle('active', p === page);
    });
  });
  const body = document.getElementById('app-body');
  if (!body) return;
  if (page === 'wallet')    { body.innerHTML = buildWalletHTML(); wireWalletEvents(); }
  if (page === 'scan')      body.innerHTML = buildScanHTML();
  if (page === 'orgs')      body.innerHTML = buildOrgsHTML();
  if (page === 'dashboard') body.innerHTML = buildDashboardHTML();
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
        <button class="card-action-btn" onclick="flipCard('${primary.id}')"><i class="fa-solid fa-rotate"></i> Flip</button>
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
