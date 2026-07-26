/* ============================================================
   VAULTID — APP LOGIC v2
   Landing + Onboarding + Wallet + NFC + Checkout + Dashboard
   ============================================================ */
'use strict';

// ── STATE ──────────────────────────────────────────────────────
let state = {
  cards: [], activities: [],
  scanCount: 0, selectedCardId: null,
  currentLogoDataUrl: null,
  selectedColor: 0, selectedIcon: '🎓',
  designerTab: 'identity',
  nfcTimer: null, nfcTargetCard: null,
  currentPage: 'landing',
  currentInnerPage: 'wallet',
  membership: { plan: 'free', orgName: '', revenue: 0, commissions: [] },
  subscriptions: [],
  obRole: null, obPlan: null,
  checkoutPlan: null,
};

// ── CONSTANTS ──────────────────────────────────────────────────
const PLANS = {
  free:       { name: 'Free',       price: 0,  maxCards: 5,   color: '#94a3b8' },
  pro:        { name: 'Pro',        price: 29, maxCards: 500, color: '#8b5cf6' },
  enterprise: { name: 'Enterprise', price: 99, maxCards: Infinity, color: '#f59e0b' },
};

const COLOR_THEMES = [
  { label: 'Indigo Night',  gradient: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%)', swatch: '#312e81' },
  { label: 'Ocean Deep',    gradient: 'linear-gradient(135deg,#0c4a6e 0%,#075985 50%,#0369a1 100%)', swatch: '#075985' },
  { label: 'Forest Dark',   gradient: 'linear-gradient(135deg,#052e16 0%,#14532d 50%,#166534 100%)', swatch: '#14532d' },
  { label: 'Rose Black',    gradient: 'linear-gradient(135deg,#4c0519 0%,#881337 50%,#9f1239 100%)', swatch: '#881337' },
  { label: 'Amber Noir',    gradient: 'linear-gradient(135deg,#451a03 0%,#78350f 50%,#92400e 100%)', swatch: '#78350f' },
  { label: 'Slate Pro',     gradient: 'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%)', swatch: '#1e293b' },
  { label: 'Violet Storm',  gradient: 'linear-gradient(135deg,#2e1065 0%,#4c1d95 50%,#6d28d9 100%)', swatch: '#4c1d95' },
  { label: 'Teal Depths',   gradient: 'linear-gradient(135deg,#042f2e 0%,#134e4a 50%,#115e59 100%)', swatch: '#134e4a' },
  { label: 'Crimson Gold',  gradient: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 40%,#b45309 100%)', swatch: '#991b1b' },
  { label: 'Midnight Blue', gradient: 'linear-gradient(135deg,#172554 0%,#1e3a8a 50%,#1d4ed8 100%)', swatch: '#1e3a8a' },
  { label: 'Purple Haze',   gradient: 'linear-gradient(135deg,#3b0764 0%,#6b21a8 50%,#7c3aed 100%)', swatch: '#6b21a8' },
  { label: 'Dark Olive',    gradient: 'linear-gradient(135deg,#1a2e05 0%,#365314 50%,#3f6212 100%)', swatch: '#365314' },
];

const ICONS = ['🎓','🏢','🏥','📚','🏛️','💪','📖','🏦','🔷','🔬','⚙️','🌐','🚀','💡','🎯','🛡️','⭐','🌟','🔑','💎'];

const ORG_DEFAULTS = {
  university: { icon:'🎓', colorIdx:0,  cardType:'Student ID',   role:'Student' },
  college:    { icon:'📚', colorIdx:10, cardType:'Student ID',   role:'Student' },
  company:    { icon:'🏢', colorIdx:5,  cardType:'Employee ID',  role:'Employee' },
  hospital:   { icon:'🏥', colorIdx:2,  cardType:'Employee ID',  role:'Medical Staff' },
  government: { icon:'🏛️', colorIdx:9,  cardType:'Access Pass',  role:'Officer' },
  gym:        { icon:'💪', colorIdx:3,  cardType:'Member Card',  role:'Member' },
  library:    { icon:'📖', colorIdx:7,  cardType:'Member Card',  role:'Member' },
  bank:       { icon:'🏦', colorIdx:1,  cardType:'Employee ID',  role:'Staff' },
  other:      { icon:'🔷', colorIdx:5,  cardType:'Access Pass',  role:'Member' },
};

// ── BOOT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderColorSwatches();
  renderIconPicker();
  setDefaultDates();
  updatePlanBadge();

  // Always show landing page first
  showPage('landing');
  addActivity('Welcome to VaultID', 'blue');
});

// ── PERSISTENCE ─────────────────────────────────────────────────
function saveState() {
  try {
    localStorage.setItem('vid2_cards',   JSON.stringify(state.cards));
    localStorage.setItem('vid2_scans',   state.scanCount);
    localStorage.setItem('vid2_acts',    JSON.stringify(state.activities.slice(0,20)));
    localStorage.setItem('vid2_member',  JSON.stringify(state.membership));
    localStorage.setItem('vid2_subs',    JSON.stringify(state.subscriptions));
  } catch(e) {}
}
function loadState() {
  try {
    const c = localStorage.getItem('vid2_cards');   if(c) state.cards = JSON.parse(c);
    const s = localStorage.getItem('vid2_scans');   if(s) state.scanCount = parseInt(s);
    const a = localStorage.getItem('vid2_acts');    if(a) state.activities = JSON.parse(a);
    const m = localStorage.getItem('vid2_member');  if(m) state.membership = JSON.parse(m);
    const sb= localStorage.getItem('vid2_subs');    if(sb) state.subscriptions = JSON.parse(sb);
  } catch(e) {}
}

// ── PAGE ROUTING ────────────────────────────────────────────────
function showPage(page) {
  state.currentPage = page;
  ['landing','onboarding','app'].forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if(el) el.classList.toggle('active', p === page);
  });
  if(page === 'app') {
    renderInnerPage(state.currentInnerPage);
  }
}

function goToApp() {
  showPage('app');
  renderInnerPage('wallet');
}

function startOnboarding(plan) {
  if(plan) state.obPlan = plan;
  showPage('onboarding');
  obGoStep(1);
}

// ── ONBOARDING ──────────────────────────────────────────────────
function obGoStep(step) {
  [1,2,3].forEach(i => {
    const el = document.getElementById(`ob-step${i}`);
    if(el) el.style.display = i===step ? 'block' : 'none';
    const si = document.getElementById(`ob-s${i}`);
    if(si) {
      si.classList.toggle('active', i===step);
      si.classList.toggle('done', i<step);
    }
  });
}

function selectRole(role) {
  state.obRole = role;
  document.querySelectorAll('.ob-role-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`role-${role}`)?.classList.add('selected');
  const btn = document.getElementById('ob-next1');
  if(btn) btn.disabled = false;
}

function obNext(step) {
  if(step === 2 && state.obRole === 'individual') {
    // Skip plan selection for individuals
    obGoStep(3);
    return;
  }
  obGoStep(step);
}

function selectObPlan(plan) {
  state.obPlan = plan;
  document.querySelectorAll('.ob-plan-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById(`obplan-${plan}`)?.classList.add('selected');
  const btn = document.getElementById('ob-next2');
  if(btn) btn.disabled = false;
}

function obFinish() {
  const name    = document.getElementById('ob-name')?.value.trim();
  const org     = document.getElementById('ob-org')?.value.trim();
  const roleVal = document.getElementById('ob-role-field')?.value.trim() || 'Member';
  const orgType = document.getElementById('ob-orgtype')?.value || 'university';

  if(!name || !org) { showToast('Please enter your name and organization','error'); return; }

  const preset = ORG_DEFAULTS[orgType] || ORG_DEFAULTS.other;
  const newCard = {
    id: generateUID(), holderName: name, orgName: org, orgType,
    role: roleVal, idNumber: generateIdNumber(),
    cardType: preset.cardType, colorIdx: preset.colorIdx, icon: preset.icon,
    logoDataUrl: null, flipped: false,
    email:'', expiry:'', issue: new Date().toISOString().split('T')[0],
    website:'', address:'', phone:'',
    createdAt: new Date().toISOString(),
  };
  state.cards.unshift(newCard);
  state.selectedCardId = newCard.id;

  if(state.obPlan && state.obPlan !== 'free') {
    openCheckout(state.obPlan);
  } else {
    state.membership.plan = 'free';
    updatePlanBadge();
  }

  saveState();
  showPage('app');
  renderInnerPage('wallet');
  showToast(`🎉 Welcome! Your first card is ready.`, 'success');
  addActivity(`Onboarding complete: ${name}`, 'green');
}

// ── INNER PAGE SWITCHING ────────────────────────────────────────
function switchPage(page) {
  if(page === 'landing') { showPage('landing'); return; }
  state.currentInnerPage = page;
  ['wallet','orgs','scan','dashboard'].forEach(p => {
    const el = document.getElementById(`inner-${p}`);
    if(el) el.classList.toggle('active', p===page);
    const btn = document.getElementById(`nav-${p}`);
    if(btn) btn.classList.toggle('active', p===page);
  });
  renderInnerPage(page);
}

function renderInnerPage(page) {
  // Activate tab
  ['wallet','orgs','scan','dashboard'].forEach(p => {
    const el = document.getElementById(`inner-${p}`);
    if(el) el.classList.toggle('active', p===page);
    const btn = document.getElementById(`nav-${p}`);
    if(btn) btn.classList.toggle('active', p===page);
  });
  state.currentInnerPage = page;

  if(page==='wallet')    renderWalletPage();
  if(page==='orgs')      renderOrgsPage();
  if(page==='scan')      renderScanPage();
  if(page==='dashboard') renderDashboard();
}

// ══════════════════════════════════════════════
// WALLET PAGE
// ══════════════════════════════════════════════
function renderWalletPage() {
  const el = document.getElementById('inner-wallet');
  el.innerHTML = `
    <div class="main-layout">
      <section class="wallet-section">
        <div class="section-header">
          <div>
            <h1 class="section-title">My Wallet <span class="card-count-badge" id="card-count">${state.cards.length}</span></h1>
            <p class="section-subtitle">Tap a card to NFC scan · Click to flip · Drag to reorder</p>
          </div>
          <button class="card-action-btn" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> New Card</button>
        </div>
        <div class="featured-card-area" id="featured-card-area"></div>
        <div id="cards-grid-section" style="display:none;">
          <div style="font-size:.82rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">All Cards</div>
          <div class="cards-grid" id="cards-grid"></div>
        </div>
      </section>
      <aside class="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-section-title">Quick Add by Type</div>
          <div class="org-presets">
            <button class="org-preset-btn" onclick="openDesignerPreset('university')"><span class="icon">🎓</span>University</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('company')"><span class="icon">🏢</span>Company</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('hospital')"><span class="icon">🏥</span>Hospital</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('college')"><span class="icon">📚</span>College</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('government')"><span class="icon">🏛️</span>Government</button>
            <button class="org-preset-btn" onclick="openDesignerPreset('gym')"><span class="icon">💪</span>Gym/Club</button>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">Membership</div>
          <div style="background:var(--bg-glass);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:16px;text-align:center;">
            <div style="font-family:'Outfit',sans-serif;font-size:1.4rem;font-weight:900;color:var(--accent-purple);" id="plan-display">${PLANS[state.membership.plan]?.name || 'Free'}</div>
            <div style="font-size:.75rem;color:var(--text-muted);margin-bottom:12px;">Current Plan · ${state.cards.length}/${PLANS[state.membership.plan]?.maxCards === Infinity ? '∞' : PLANS[state.membership.plan]?.maxCards} cards</div>
            <button class="card-action-btn primary" style="width:100%;justify-content:center;" onclick="openCheckout('pro')">⚡ Upgrade Plan</button>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">Stats</div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-value" id="stat-total">${state.cards.length}</div><div class="stat-label">Total Cards</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-orgs">${new Set(state.cards.map(c=>c.orgName)).size}</div><div class="stat-label">Organizations</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-scans">${state.scanCount}</div><div class="stat-label">NFC Scans</div></div>
            <div class="stat-card"><div class="stat-value" id="stat-active">${state.cards.length}</div><div class="stat-label">Active</div></div>
          </div>
        </div>
        <div class="sidebar-section">
          <div class="sidebar-section-title">Recent Activity</div>
          <div class="activity-list" id="activity-list"></div>
        </div>
      </aside>
    </div>
  `;
  renderFeaturedCard();
  renderActivityList();
}

function renderFeaturedCard() {
  const area = document.getElementById('featured-card-area');
  if(!area) return;
  if(state.cards.length === 0) {
    area.innerHTML = `
      <div class="empty-wallet">
        <div class="empty-wallet-icon">💳</div>
        <h3>No cards yet</h3>
        <p>Add your first ID card from any university, company, or organization.</p>
        <button class="btn-add-card" style="margin-top:8px" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> Add Card</button>
      </div>`;
    document.getElementById('cards-grid-section').style.display='none';
    return;
  }
  const primary = state.cards.find(c=>c.id===state.selectedCardId) || state.cards[0];
  area.innerHTML = buildCardHTML(primary, true) + `
    <div class="card-actions" style="justify-content:center;">
      <button class="card-action-btn primary" onclick="triggerNfc('${primary.id}')"><i class="fa-solid fa-wifi"></i> NFC Scan</button>
      <button class="card-action-btn" onclick="flipCard('${primary.id}')"><i class="fa-solid fa-rotate"></i> Flip</button>
      <button class="card-action-btn" onclick="openCardDetail('${primary.id}')"><i class="fa-solid fa-circle-info"></i> Details</button>
      <button class="card-action-btn danger" onclick="deleteCard('${primary.id}')"><i class="fa-solid fa-trash"></i></button>
    </div>`;
  attachCardTilt(area.querySelector('.id-card'));

  const gridSec = document.getElementById('cards-grid-section');
  if(state.cards.length > 1) {
    gridSec.style.display='block';
    document.getElementById('cards-grid').innerHTML = state.cards
      .filter(c=>c.id!==primary.id)
      .map(c=>`
        <div class="card-list-item" onclick="selectCard('${c.id}')">
          <div style="width:54px;height:36px;border-radius:7px;background:${COLOR_THEMES[c.colorIdx].gradient};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;">${c.icon}</div>
          <div class="card-list-info">
            <div class="card-list-name">${esc(c.holderName)}</div>
            <div class="card-list-org">${esc(c.orgName)} · ${esc(c.cardType)}</div>
          </div>
          <div class="card-list-arrow"><i class="fa-solid fa-chevron-right"></i></div>
        </div>`).join('');
  } else { gridSec.style.display='none'; }

  if(primary.flipped) generateQR(primary);
}

// ══════════════════════════════════════════════
// ORGANIZATIONS PAGE
// ══════════════════════════════════════════════
function renderOrgsPage() {
  const el = document.getElementById('inner-orgs');
  const orgMap = {};
  state.cards.forEach(c=>{
    if(!orgMap[c.orgName]) orgMap[c.orgName]={...c,cards:[]};
    orgMap[c.orgName].cards.push(c);
  });
  const orgList = Object.values(orgMap);
  const orgColors = {university:'rgba(139,92,246,.15)',college:'rgba(124,58,237,.15)',company:'rgba(59,130,246,.15)',hospital:'rgba(16,185,129,.15)',government:'rgba(245,158,11,.15)',gym:'rgba(239,68,68,.15)',library:'rgba(6,182,212,.15)',bank:'rgba(99,102,241,.15)',other:'rgba(148,163,184,.15)'};

  el.innerHTML = `
    <div class="org-page">
      <div class="section-header">
        <div><h2 class="section-title">Organizations</h2><p class="section-subtitle">All orgs that have issued cards in your wallet</p></div>
        <button class="btn-add-card" onclick="openDesigner()"><i class="fa-solid fa-plus"></i> New Card</button>
      </div>
      <div class="orgs-grid">
        ${orgList.length===0
          ? `<div style="color:var(--text-muted);font-size:.88rem;grid-column:1/-1;text-align:center;padding:60px 0;">No organizations yet. Add a card to get started.</div>`
          : orgList.map(org=>`
            <div class="org-card" onclick="openDesignerPreset('${org.orgType}')">
              <div class="org-card-icon" style="background:${orgColors[org.orgType]||orgColors.other}">
                ${org.logoDataUrl?`<img src="${org.logoDataUrl}" style="width:34px;height:34px;object-fit:contain;"/>`:`<span style="font-size:1.5rem;">${org.icon}</span>`}
              </div>
              <div class="org-card-name">${esc(org.orgName)}</div>
              <div class="org-card-type">${esc(org.orgType.charAt(0).toUpperCase()+org.orgType.slice(1))}</div>
              <div class="org-card-meta">
                <span class="org-card-count">${org.cards.length} card${org.cards.length>1?'s':''}</span>
                ${org.website?`<a href="${org.website}" target="_blank" style="font-size:.74rem;color:var(--accent-blue);">↗ Website</a>`:''}
              </div>
            </div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// SCAN PAGE
// ══════════════════════════════════════════════
function renderScanPage() {
  const el = document.getElementById('inner-scan');
  const cardOptions = state.cards.length===0
    ? `<div style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:20px;">No cards yet — add one first</div>`
    : state.cards.map(c=>{
        const theme = COLOR_THEMES[c.colorIdx];
        const isSel = c.id===(state.selectedCardId||state.cards[0].id);
        return `<div class="card-list-item" onclick="selectCardForScan('${c.id}')" style="${isSel?'border-color:var(--accent-purple);background:rgba(139,92,246,.1);':''}">
          <div style="width:44px;height:30px;border-radius:6px;background:${theme.gradient};display:flex;align-items:center;justify-content:center;font-size:.95rem;flex-shrink:0;">${c.icon}</div>
          <div class="card-list-info"><div class="card-list-name">${esc(c.holderName)}</div><div class="card-list-org">${esc(c.orgName)}</div></div>
          ${isSel?'<i class="fa-solid fa-check" style="color:var(--accent-purple);"></i>':'<div class="card-list-arrow"><i class="fa-solid fa-chevron-right"></i></div>'}
        </div>`;
      }).join('');

  el.innerHTML = `
    <div class="scan-page">
      <div class="section-header"><div><h2 class="section-title">NFC Scanner</h2><p class="section-subtitle">Simulate tapping your card on an NFC reader</p></div></div>
      <div class="scan-area">
        <div class="scan-frame">
          <div class="scan-corner tl"></div><div class="scan-corner tr"></div>
          <div class="scan-corner bl"></div><div class="scan-corner br"></div>
          <div class="scan-line"></div>
          <div class="scan-nfc-big"><i class="fa-solid fa-wifi"></i></div>
        </div>
        <div style="width:100%;max-width:380px;">
          <div class="sidebar-section-title" style="margin-bottom:10px;">Select Card to Scan</div>
          <div style="display:flex;flex-direction:column;gap:8px;">${cardOptions}</div>
        </div>
        <p class="scan-instructions"><strong style="color:var(--text-primary)">How NFC works:</strong><br/>Select a card above, then tap "Simulate NFC" to watch the full verification sequence — just like Apple Pay.</p>
        <button class="scan-trigger-btn" onclick="triggerScanPage()"><i class="fa-solid fa-wifi"></i> &nbsp;Simulate NFC Tap</button>
      </div>
    </div>`;
}

function selectCardForScan(cardId) {
  state.selectedCardId = cardId;
  renderScanPage();
}

function triggerScanPage() {
  if(state.cards.length===0){showToast('Add a card first!','error');return;}
  const card = state.cards.find(c=>c.id===state.selectedCardId)||state.cards[0];
  triggerNfc(card.id);
}

// ══════════════════════════════════════════════
// REVENUE DASHBOARD
// ══════════════════════════════════════════════
function renderDashboard() {
  const el = document.getElementById('inner-dashboard');
  const totalRev = state.membership.revenue || 0;
  const commission = (totalRev * 0.10).toFixed(2);
  const netRev = (totalRev * 0.90).toFixed(2);
  const planCounts = {free:0,pro:0,enterprise:0};
  (state.subscriptions||[]).forEach(s=>{ if(planCounts[s.plan]!==undefined) planCounts[s.plan]++; });

  // Monthly bars (last 6 months)
  const months = ['Feb','Mar','Apr','May','Jun','Jul'];
  const barData = [120,185,240,310,420,totalRev>0?totalRev:580];
  const maxBar = Math.max(...barData);

  const subRows = (state.subscriptions||[]).length > 0
    ? state.subscriptions.map(s=>`
        <tr>
          <td><strong>${esc(s.orgName)}</strong></td>
          <td><span class="plan-chip ${s.plan}">${s.plan.charAt(0).toUpperCase()+s.plan.slice(1)}</span></td>
          <td>$${PLANS[s.plan]?.price || 0}/mo</td>
          <td style="color:var(--accent-green);">$${(PLANS[s.plan]?.price * 0.10).toFixed(2)}</td>
          <td><span style="color:var(--accent-green);font-size:.75rem;">● Active</span></td>
        </tr>`).join('')
    : `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:30px 0;">No paid subscriptions yet. <a onclick="openCheckout('pro')" style="color:var(--accent-purple);cursor:pointer;">Upgrade to Pro →</a></td></tr>`;

  el.innerHTML = `
    <div class="dashboard-page">
      <div class="section-header">
        <div><h2 class="section-title">Revenue Dashboard</h2><p class="section-subtitle">Track membership revenue, commissions, and subscription stats</p></div>
        <button class="btn-add-card" onclick="openCheckout('pro')"><i class="fa-solid fa-crown"></i> Upgrade Plan</button>
      </div>

      <!-- KPI Cards -->
      <div class="dashboard-grid">
        <div class="dash-stat-card">
          <div class="dash-stat-icon">💰</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#8b5cf6,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${totalRev.toFixed(0)}</div>
          <div class="dash-stat-label">Total Revenue</div>
          <div class="dash-stat-change">↑ 18% this month</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">🏦</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#f59e0b,#ef4444);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${commission}</div>
          <div class="dash-stat-label">Platform Commission (10%)</div>
          <div class="dash-stat-change">VaultID platform fee</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📈</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#10b981,#059669);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">$${netRev}</div>
          <div class="dash-stat-label">Your Net Revenue (90%)</div>
          <div class="dash-stat-change">After platform fee</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">👥</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.subscriptions.length}</div>
          <div class="dash-stat-label">Active Subscriptions</div>
          <div class="dash-stat-change">↑ 3 new this week</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">💳</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#ec4899,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.cards.length}</div>
          <div class="dash-stat-label">Total Cards Issued</div>
          <div class="dash-stat-change">Across all organizations</div>
        </div>
        <div class="dash-stat-card">
          <div class="dash-stat-icon">📡</div>
          <div class="dash-stat-value" style="background:linear-gradient(135deg,#06b6d4,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${state.scanCount}</div>
          <div class="dash-stat-label">NFC Scans</div>
          <div class="dash-stat-change">Total lifetime scans</div>
        </div>
      </div>

      <!-- Charts row -->
      <div class="dash-two-col">
        <div class="dash-panel">
          <div class="dash-panel-title">Monthly Revenue</div>
          <div class="revenue-chart">
            ${months.map((m,i)=>`
              <div class="chart-bar-wrap">
                <div class="chart-bar" style="height:${Math.round((barData[i]/maxBar)*100)}%;"></div>
                <div class="chart-label">${m}</div>
              </div>`).join('')}
          </div>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Plan Distribution</div>
          <div class="plan-breakdown">
            <div class="plan-row">
              <div class="plan-row-name" style="color:#94a3b8;">Free</div>
              <div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:${state.cards.length>0?70:0}%;background:#94a3b8;"></div></div>
              <div class="plan-row-val">${planCounts.free + (state.membership.plan==='free'?1:0)}</div>
            </div>
            <div class="plan-row">
              <div class="plan-row-name" style="color:#8b5cf6;">Pro</div>
              <div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:${state.subscriptions.filter(s=>s.plan==='pro').length*20}%;background:#8b5cf6;"></div></div>
              <div class="plan-row-val">${planCounts.pro + (state.membership.plan==='pro'?1:0)}</div>
            </div>
            <div class="plan-row">
              <div class="plan-row-name" style="color:#f59e0b;">Enterprise</div>
              <div class="plan-row-bar-wrap"><div class="plan-row-bar" style="width:${state.subscriptions.filter(s=>s.plan==='enterprise').length*20}%;background:#f59e0b;"></div></div>
              <div class="plan-row-val">${planCounts.enterprise + (state.membership.plan==='enterprise'?1:0)}</div>
            </div>
          </div>
          <div style="margin-top:20px;">
            <div class="dash-panel-title">Commission Rate</div>
            <div style="font-size:2rem;font-weight:900;color:var(--accent-orange);">10%</div>
            <div style="font-size:.78rem;color:var(--text-muted);">VaultID platform fee per transaction<br/>You keep 90% of all membership revenue</div>
          </div>
        </div>
      </div>

      <!-- Subscriptions table -->
      <div class="dash-panel">
        <div class="dash-panel-title">Active Subscriptions</div>
        <div style="overflow-x:auto;">
          <table class="sub-table">
            <thead><tr><th>Organization</th><th>Plan</th><th>Monthly</th><th>Commission</th><th>Status</th></tr></thead>
            <tbody>${subRows}</tbody>
          </table>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════
// CARD BUILDER
// ══════════════════════════════════════════════
function buildCardHTML(card, interactive=false) {
  const theme = COLOR_THEMES[card.colorIdx] || COLOR_THEMES[0];
  const cardId = `card-el-${card.id}`;
  return `
    <div class="id-card ${card.flipped?'flipped':''} active-card nfc-ready" id="${cardId}"
         style="max-width:480px;height:210px;"
         ${interactive?`onclick="handleCardClick('${card.id}',event)"`:''}>
      <div class="card-face card-front">
        <div class="card-bg" style="background:${theme.gradient}"></div>
        <div class="card-pattern"></div>
        <div class="card-grid-pattern"></div>
        <div class="card-content">
          <div class="card-header">
            <div class="card-org-logo">${card.logoDataUrl?`<img src="${card.logoDataUrl}" alt="${esc(card.orgName)}"/>`:`${card.icon}`}</div>
            <div class="card-nfc-icon"><i class="fa-solid fa-wifi"></i></div>
          </div>
          <div class="card-middle">
            <div class="card-avatar"><i class="fa-solid fa-user"></i></div>
            <div class="card-holder-info">
              <div class="card-holder-name">${esc(card.holderName)}</div>
              <div class="card-holder-role">${esc(card.cardType)} · ${esc(card.role)}</div>
            </div>
          </div>
          <div class="card-footer">
            <div>
              <div class="card-id-number">ID: ${esc(card.idNumber)}</div>
              <div class="card-org-name">${esc(card.orgName)}</div>
            </div>
            <div class="card-chip"></div>
          </div>
        </div>
      </div>
      <div class="card-face card-back">
        <div class="card-bg" style="background:${theme.gradient};filter:brightness(.8)"></div>
        <div class="card-pattern"></div>
        <div class="card-back-content">
          <div class="card-stripe"></div>
          <div class="card-back-body">
            <div class="card-qr-container" id="qr-${card.id}"><canvas></canvas></div>
            <div class="card-back-info">
              <p><strong style="color:#fff">${esc(card.holderName)}</strong></p>
              <p>${esc(card.cardType)}<span>${esc(card.orgName)}</span></p>
              <p>Dept: ${esc(card.role)}<span>ID: ${esc(card.idNumber)}</span></p>
              ${card.expiry?`<p>Expires: ${esc(card.expiry)}</p>`:''}
              <div class="card-barcode"></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function generateQR(card) {
  setTimeout(()=>{
    const container = document.getElementById(`qr-${card.id}`);
    if(!container) return;
    container.innerHTML='';
    try {
      new QRCode(container,{text:JSON.stringify({id:card.id,name:card.holderName,org:card.orgName,idNo:card.idNumber,type:card.cardType}),width:82,height:82,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M});
    } catch(e){container.innerHTML='<div style="font-size:.55rem;color:#333;text-align:center;padding:8px;">QR</div>';}
  },100);
}

// ══════════════════════════════════════════════
// CARD INTERACTIONS
// ══════════════════════════════════════════════
function handleCardClick(cardId, event) {
  if(event.target.closest('.card-action-btn')) return;
  flipCard(cardId);
}
function flipCard(cardId) {
  const card = state.cards.find(c=>c.id===cardId);
  if(!card) return;
  card.flipped = !card.flipped;
  const el = document.getElementById(`card-el-${cardId}`);
  if(el) { el.classList.toggle('flipped', card.flipped); if(card.flipped) generateQR(card); }
  saveState();
}
function selectCard(cardId) {
  state.selectedCardId = cardId;
  state.cards.forEach(c=>c.flipped=false);
  renderFeaturedCard();
}
function deleteCard(cardId) {
  const card = state.cards.find(c=>c.id===cardId);
  if(!card) return;
  state.cards = state.cards.filter(c=>c.id!==cardId);
  if(state.selectedCardId===cardId) state.selectedCardId=null;
  saveState(); renderWalletPage();
  showToast(`Card removed: ${card.holderName}`,'info');
  addActivity(`Removed: ${card.holderName}`,'orange');
}

function attachCardTilt(el) {
  if(!el) return;
  el.addEventListener('mousemove',e=>{
    const r=el.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    el.style.transform=`perspective(800px) rotateY(${x*12}deg) rotateX(${-y*8}deg) scale(1.02)`;
  });
  el.addEventListener('mouseleave',()=>{
    el.style.transform=el.classList.contains('flipped')?'rotateY(180deg)':'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
  });
}

// ══════════════════════════════════════════════
// NFC
// ══════════════════════════════════════════════
function triggerNfc(cardId) {
  const card = state.cards.find(c=>c.id===cardId);
  if(!card) return;
  state.nfcTargetCard = card;
  document.getElementById('nfc-scan-name').textContent = card.holderName;
  document.getElementById('nfc-scan-org').textContent  = `${card.orgName} · ${card.cardType}`;
  const mini = document.getElementById('nfc-card-mini');
  mini.style.background = COLOR_THEMES[card.colorIdx].gradient;
  document.getElementById('nfc-scanning-state').style.display='block';
  document.getElementById('nfc-success-state').style.display='none';
  const prog = document.getElementById('nfc-progress');
  prog.style.width='0%';
  document.getElementById('nfc-status-text').textContent='Initializing…';
  document.getElementById('nfc-status-sub').textContent='Hold your device near the reader';
  openModal('nfc-modal');
  runNfcSequence(card);
}

function runNfcSequence(card) {
  const steps=[
    {pct:15,text:'Detecting NFC signal…',    sub:'Searching for compatible reader'},
    {pct:35,text:'Connecting to reader…',    sub:'Establishing secure channel'},
    {pct:55,text:'Transmitting card data…',  sub:'Encrypting identity payload'},
    {pct:75,text:'Verifying credentials…',   sub:'Checking issuer signature'},
    {pct:90,text:'Authenticating identity…', sub:'Cross-referencing database'},
    {pct:100,text:'Complete!',               sub:'Identity confirmed'},
  ];
  let i=0;
  const prog=document.getElementById('nfc-progress');
  function next(){
    if(i>=steps.length){setTimeout(()=>showNfcSuccess(card),300);return;}
    const s=steps[i++];
    prog.style.width=s.pct+'%';
    document.getElementById('nfc-status-text').textContent=s.text;
    document.getElementById('nfc-status-sub').textContent=s.sub;
    state.nfcTimer=setTimeout(next,700+Math.random()*400);
  }
  next();
}

function showNfcSuccess(card) {
  document.getElementById('nfc-scanning-state').style.display='none';
  const sEl=document.getElementById('nfc-success-state');
  sEl.style.display='flex';
  document.getElementById('nfc-success-detail').textContent=`${card.holderName} · ${card.cardType} · ${card.orgName}`;
  document.getElementById('nfc-success-card-info').innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
      ${infoField('Name',card.holderName)}${infoField('ID',card.idNumber)}
      ${infoField('Organization',card.orgName)}${infoField('Card Type',card.cardType)}
      ${card.expiry?infoField('Expires',card.expiry):''}${infoField('Status','✅ Active')}
    </div>`;
  state.scanCount++;
  saveState(); updateStats();
  addActivity(`NFC scan: ${card.holderName}`,'green');
}

function stopNfc(){if(state.nfcTimer)clearTimeout(state.nfcTimer);state.nfcTimer=null;}

// ══════════════════════════════════════════════
// CHECKOUT
// ══════════════════════════════════════════════
function openCheckout(plan) {
  state.checkoutPlan = plan;
  const p = PLANS[plan];
  document.getElementById('checkout-title').textContent = `💳 ${p.name} Plan`;
  document.getElementById('checkout-plan-summary').innerHTML = `
    <div>
      <div class="checkout-plan-name">${p.name} Plan</div>
      <div class="checkout-plan-sub">${plan==='enterprise'?'Unlimited':'Up to '+p.maxCards} ID cards per month</div>
    </div>
    <div>
      <div class="checkout-plan-price">$${p.price}<span style="font-size:.9rem;font-weight:400;color:var(--text-muted);">/mo</span></div>
    </div>`;
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

  if(!name||card.length<16||!exp||!cvv){
    showToast('Please fill in all payment details','error'); return;
  }

  const btn = document.getElementById('pay-btn');
  btn.textContent='Processing…'; btn.disabled=true;

  setTimeout(()=>{
    const plan = state.checkoutPlan;
    const p    = PLANS[plan];
    state.membership.plan = plan;
    state.membership.revenue += p.price;

    // Add to subscriptions log
    state.subscriptions.push({
      orgName: state.membership.orgName || 'My Organization',
      plan, date: new Date().toISOString(), amount: p.price,
    });

    saveState(); updatePlanBadge();
    closeModal('checkout-modal');
    btn.innerHTML='<i class="fa-solid fa-lock"></i>&nbsp; Pay Securely';
    btn.disabled=false;
    ['co-name','co-card','co-exp','co-cvv'].forEach(id=>{document.getElementById(id).value='';});

    showToast(`🎉 ${p.name} plan activated!`, 'success');
    addActivity(`Upgraded to ${p.name} plan`, 'purple');

    if(state.currentInnerPage==='wallet') renderWalletPage();
    if(state.currentInnerPage==='dashboard') renderDashboard();
  }, 2200);
}

function updatePlanBadge() {
  const badge = document.getElementById('plan-badge-topbar');
  if(badge) badge.textContent = PLANS[state.membership.plan]?.name || 'Free';
}

// ══════════════════════════════════════════════
// CARD DESIGNER
// ══════════════════════════════════════════════
function openDesigner() {
  // Check plan card limit
  const plan = state.membership.plan;
  const max  = PLANS[plan]?.maxCards || 5;
  if(state.cards.length >= max) {
    showToast(`${PLANS[plan].name} plan limit reached (${max} cards). Upgrade to add more!`,'error');
    openCheckout('pro');
    return;
  }
  resetDesigner();
  openModal('designer-modal');
}

function openDesignerPreset(type) {
  const plan=state.membership.plan;
  const max=PLANS[plan]?.maxCards||5;
  if(state.cards.length>=max){showToast(`Plan limit reached. Upgrade!`,'error');openCheckout('pro');return;}
  resetDesigner();
  const preset=ORG_DEFAULTS[type]||ORG_DEFAULTS.other;
  state.selectedIcon=preset.icon; state.selectedColor=preset.colorIdx;
  document.getElementById('f-cardtype').value=preset.cardType;
  document.getElementById('f-role').value=preset.role;
  document.getElementById('f-orgtype').value=type;
  renderColorSwatches(); renderIconPicker(); updatePreview();
  openModal('designer-modal');
}

function resetDesigner() {
  ['f-name','f-idnum','f-role','f-email','f-orgname','f-website','f-address','f-phone']
    .forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('f-cardtype').value='Student ID';
  document.getElementById('f-orgtype').value='university';
  state.selectedColor=0; state.selectedIcon='🎓';
  state.currentLogoDataUrl=null;
  const lps=document.getElementById('logo-preview-strip'); if(lps)lps.style.display='none';
  const lua=document.getElementById('logo-upload-area'); if(lua)lua.style.display='block';
  setDefaultDates(); renderColorSwatches(); renderIconPicker();
  switchDesignerTab('identity'); updatePreview();
}

function setDefaultDates() {
  const today=new Date();
  const exp=new Date(today); exp.setFullYear(exp.getFullYear()+4);
  const fi=document.getElementById('f-issue'); if(fi)fi.value=today.toISOString().split('T')[0];
  const fe=document.getElementById('f-expiry'); if(fe)fe.value=exp.toISOString().split('T')[0];
}

function switchDesignerTab(tab) {
  state.designerTab=tab;
  ['identity','design','org'].forEach(t=>{
    const el=document.getElementById(`dtab-${t}`); if(el)el.style.display=t===tab?'block':'none';
    const btn=document.getElementById(`tab-${t}`); if(btn)btn.classList.toggle('active',t===tab);
  });
}

function renderColorSwatches() {
  const el=document.getElementById('color-swatches'); if(!el)return;
  el.innerHTML=COLOR_THEMES.map((t,i)=>`<div class="color-swatch ${i===state.selectedColor?'selected':''}" style="background:${t.gradient};" title="${t.label}" onclick="selectColor(${i})"></div>`).join('');
}
function selectColor(idx){state.selectedColor=idx;renderColorSwatches();updatePreview();}
function renderIconPicker() {
  const el=document.getElementById('icon-picker'); if(!el)return;
  el.innerHTML=ICONS.map(icon=>`<div class="icon-opt ${icon===state.selectedIcon?'selected':''}" onclick="selectIcon('${icon}')">${icon}</div>`).join('');
}
function selectIcon(icon){state.selectedIcon=icon;renderIconPicker();updatePreview();}

function updatePreview() {
  const name=document.getElementById('f-name')?.value||'John Doe';
  const role=document.getElementById('f-role')?.value||'Student';
  const idnum=document.getElementById('f-idnum')?.value||'00000000';
  const orgname=document.getElementById('f-orgname')?.value||'Organization';
  const cardType=document.getElementById('f-cardtype')?.value||'Student ID';
  const theme=COLOR_THEMES[state.selectedColor];
  const pbg=document.getElementById('preview-bg'); if(pbg)pbg.style.background=theme.gradient;
  const pn=document.getElementById('preview-name'); if(pn)pn.textContent=name;
  const pr=document.getElementById('preview-role'); if(pr)pr.textContent=`${cardType} · ${role}`;
  const pi=document.getElementById('preview-id'); if(pi)pi.textContent=`ID: ${idnum}`;
  const po=document.getElementById('preview-org'); if(po)po.textContent=orgname;
  const logoEl=document.getElementById('preview-logo');
  if(logoEl){logoEl.innerHTML=state.currentLogoDataUrl?`<img src="${state.currentLogoDataUrl}" style="width:100%;height:100%;object-fit:contain;padding:4px;"/>`:`${state.selectedIcon}`;}
}

function handleLogoUpload(event) {
  const file=event.target.files[0]; if(!file)return;
  if(file.size>2*1024*1024){showToast('Logo too large (max 2MB)','error');return;}
  const reader=new FileReader();
  reader.onload=e=>{
    state.currentLogoDataUrl=e.target.result;
    const img=document.getElementById('logo-img-preview'); if(img)img.src=e.target.result;
    const lps=document.getElementById('logo-preview-strip'); if(lps)lps.style.display='flex';
    const lua=document.getElementById('logo-upload-area'); if(lua)lua.style.display='none';
    updatePreview();
  };
  reader.readAsDataURL(file);
}

function removeLogo() {
  state.currentLogoDataUrl=null;
  const lps=document.getElementById('logo-preview-strip'); if(lps)lps.style.display='none';
  const lua=document.getElementById('logo-upload-area'); if(lua)lua.style.display='block';
  const fl=document.getElementById('f-logo'); if(fl)fl.value='';
  updatePreview();
}

function issueCard() {
  const name=document.getElementById('f-name')?.value.trim();
  const orgname=document.getElementById('f-orgname')?.value.trim();
  if(!name){showToast('Please enter the holder name','error');switchDesignerTab('identity');return;}
  if(!orgname){showToast('Please enter the organization name','error');switchDesignerTab('org');return;}

  const role=document.getElementById('f-role')?.value.trim()||'Member';
  const idnum=document.getElementById('f-idnum')?.value.trim()||generateIdNumber();
  const cardType=document.getElementById('f-cardtype')?.value||'Member Card';
  const orgtype=document.getElementById('f-orgtype')?.value||'other';
  const email=document.getElementById('f-email')?.value.trim()||'';
  const expiry=document.getElementById('f-expiry')?.value||'';
  const issue=document.getElementById('f-issue')?.value||'';
  const website=document.getElementById('f-website')?.value.trim()||'';
  const address=document.getElementById('f-address')?.value.trim()||'';
  const phone=document.getElementById('f-phone')?.value.trim()||'';

  const newCard={
    id:generateUID(),holderName:name,orgName:orgname,orgType:orgtype,
    role,idNumber:idnum,cardType,email,expiry,issue,website,address,phone,
    colorIdx:state.selectedColor,icon:state.selectedIcon,
    logoDataUrl:state.currentLogoDataUrl,flipped:false,
    createdAt:new Date().toISOString(),
  };
  state.cards.unshift(newCard);
  state.selectedCardId=newCard.id;
  saveState();
  closeModal('designer-modal');
  renderWalletPage();
  showToast(`✅ Card issued: ${name} · ${orgname}`,'success');
  addActivity(`Issued: ${name} @ ${orgname}`,'green');
}

// ══════════════════════════════════════════════
// CARD DETAIL MODAL
// ══════════════════════════════════════════════
function openCardDetail(cardId) {
  const card=state.cards.find(c=>c.id===cardId); if(!card)return;
  document.getElementById('detail-modal-title').textContent=`${card.icon} ${card.orgName}`;
  const prev=document.getElementById('detail-card-preview');
  prev.innerHTML=buildCardHTML(card,false);
  if(card.flipped)generateQR(card);
  attachCardTilt(prev.querySelector('.id-card'));
  document.getElementById('detail-card-info').innerHTML=[
    infoField('Holder Name',card.holderName),infoField('Card Type',card.cardType),
    infoField('ID Number',card.idNumber),infoField('Department',card.role),
    infoField('Organization',card.orgName),infoField('Org Type',card.orgType),
    card.email?infoField('Email',card.email):'',
    card.expiry?infoField('Expires',card.expiry):'',
    card.issue?infoField('Issued',card.issue):'',
    card.phone?infoField('Phone',card.phone):'',
  ].join('');
  document.getElementById('detail-card-actions').innerHTML=`
    <button class="card-action-btn primary" onclick="closeModal('card-detail-modal');triggerNfc('${card.id}')"><i class="fa-solid fa-wifi"></i> NFC Scan</button>
    <button class="card-action-btn" onclick="flipCard('${card.id}');renderWalletPage()"><i class="fa-solid fa-rotate"></i> Flip</button>
    <button class="card-action-btn danger" onclick="closeModal('card-detail-modal');deleteCard('${card.id}')"><i class="fa-solid fa-trash"></i> Remove</button>`;
  openModal('card-detail-modal');
}

// ══════════════════════════════════════════════
// STATS & ACTIVITY
// ══════════════════════════════════════════════
function updateStats() {
  ['stat-total','stat-orgs','stat-scans','stat-active'].forEach(id=>{
    const el=document.getElementById(id); if(!el)return;
    if(id==='stat-total'||id==='stat-active') el.textContent=state.cards.length;
    if(id==='stat-orgs') el.textContent=new Set(state.cards.map(c=>c.orgName)).size;
    if(id==='stat-scans') el.textContent=state.scanCount;
  });
}
function addActivity(text,color='blue'){
  const now=new Date();
  state.activities.unshift({text,color,time:now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
  if(state.activities.length>20)state.activities.pop();
  renderActivityList(); saveState();
}
function renderActivityList(){
  const el=document.getElementById('activity-list'); if(!el)return;
  el.innerHTML=state.activities.slice(0,6).map(a=>`
    <div class="activity-item">
      <div class="activity-dot ${a.color}"></div>
      <span class="activity-text">${esc(a.text)}</span>
      <span class="activity-time">${esc(a.time)}</span>
    </div>`).join('')||'<div class="activity-item"><span class="activity-text" style="color:var(--text-muted);">No activity yet</span></div>';
}

// ══════════════════════════════════════════════
// DEMO DATA
// ══════════════════════════════════════════════
function loadDemoCards() {
  if(state.cards.length>0) return;
  const demos=[
    {holderName:'Alex Johnson',orgName:'MIT University',orgType:'university',role:'Computer Science',idNumber:'MIT-2024-4872',cardType:'Student ID',colorIdx:0,icon:'🎓',email:'alex@mit.edu',expiry:'2028-06-30',issue:'2024-09-01'},
    {holderName:'Sarah Chen',orgName:'TechCorp Inc.',orgType:'company',role:'Senior Engineer',idNumber:'EMP-00142',cardType:'Employee ID',colorIdx:9,icon:'🏢',email:'schen@techcorp.com',expiry:'2026-12-31',issue:'2023-03-15'},
    {holderName:'Dr. Malik Patel',orgName:'City General Hospital',orgType:'hospital',role:'Cardiologist',idNumber:'DOC-2019-007',cardType:'Employee ID',colorIdx:2,icon:'🏥',email:'mpatel@citygeneral.org',expiry:'2027-04-30',issue:'2019-07-01'},
  ];
  demos.forEach(d=>state.cards.push({id:generateUID(),flipped:false,createdAt:new Date().toISOString(),logoDataUrl:null,phone:'',website:'',address:'',...d}));

  // Demo subscriptions
  state.subscriptions=[
    {orgName:'MIT University',plan:'pro',date:new Date().toISOString(),amount:29},
    {orgName:'TechCorp Inc.',plan:'enterprise',date:new Date().toISOString(),amount:99},
    {orgName:'City Hospital',plan:'pro',date:new Date().toISOString(),amount:29},
  ];
  state.membership.revenue=580;

  state.selectedCardId=state.cards[0].id;
  saveState(); addActivity('Demo data loaded','blue');
}

// ══════════════════════════════════════════════
// MODALS
// ══════════════════════════════════════════════
function openModal(id){document.getElementById(id).classList.add('open');document.body.style.overflow='hidden';}
function closeModal(id){document.getElementById(id).classList.remove('open');document.body.style.overflow='';}
document.querySelectorAll('.modal-overlay').forEach(o=>{
  o.addEventListener('click',e=>{if(e.target===o){o.classList.remove('open');document.body.style.overflow='';stopNfc();}});
});

// ══════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════
function showToast(msg,type='info'){
  const tc=document.getElementById('toast-container');
  const icons={success:'✅',error:'❌',info:'ℹ️'};
  const t=document.createElement('div'); t.className=`toast ${type}`;
  t.innerHTML=`<span>${icons[type]}</span><span>${esc(msg)}</span>`;
  tc.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';t.style.transform='translateX(100%)';t.style.transition='all .3s ease';setTimeout(()=>t.remove(),300);},3500);
}

// ══════════════════════════════════════════════
// UTILS
// ══════════════════════════════════════════════
function generateUID(){return Date.now().toString(36)+Math.random().toString(36).substr(2,8);}
function generateIdNumber(){return 'ID-'+Math.random().toString(36).substr(2,8).toUpperCase();}
function esc(str){if(!str)return '';return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function infoField(label,value){return `<div class="detail-field"><div class="detail-field-label">${label}</div><div class="detail-field-value">${esc(String(value))}</div></div>`;}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){document.querySelectorAll('.modal-overlay.open').forEach(m=>{m.classList.remove('open');document.body.style.overflow='';stopNfc();});}
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openDesigner();}
});

setTimeout(loadDemoCards, 300);
