# ⬡ VaultID — Digital Identity Wallet Platform

> A universal digital ID wallet where **universities, companies, hospitals, colleges, gyms** and any organization can design and issue custom ID cards — displayed like **Apple Pay / Google Pay** with **NFC scanning animations**.

🔗 **Live Demo:** Open `index.html` in any browser — no server needed!

---

## ✨ Features

| Feature | Description |
|---|---|
| 🌐 **Landing Page** | Public-facing hero page with features, how-it-works, and pricing |
| 🧭 **Onboarding Wizard** | 3-step guided setup for new users |
| 🎨 **Live Card Designer** | WYSIWYG card builder with 12 color themes, 20 icons, logo upload |
| 💳 **Apple/Google Pay UI** | Stacked wallet with 3D card tilt and fan-out |
| 📡 **NFC Scan Animation** | Animated ripple rings → scanning progress → verified |
| 🔄 **Card Flip** | Front (ID photo/logo) ↔ Back (QR code + barcode) |
| 🏢 **Multi-Organization** | University, Company, Hospital, Government, Gym, Bank... |
| 💰 **Membership Plans** | Free ($0), Pro ($29/mo), Enterprise ($99/mo) |
| 💳 **Checkout System** | Simulated payment with card form |
| 📊 **Revenue Dashboard** | MRR, commissions, plan breakdown, subscription table |
| 💾 **Persistent Storage** | localStorage — cards survive browser refresh |
| 📱 **Fully Responsive** | Mobile-first, works on any device |

---

## 💰 Membership Plans

| Plan | Price | Cards | Features |
|---|---|---|---|
| **Free** | $0/mo | 5 cards | Basic designer, QR, NFC |
| **Pro** | $29/mo | 500 cards | Logo upload, analytics, support |
| **Enterprise** | $99/mo | ∞ Unlimited | White-label, API, priority support |

> **Platform Commission:** VaultID retains **10%** of all membership revenue. Organizations keep **90%**.

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/AHADKHATTAK1/cardinfo.git
cd cardinfo

# Open in browser (no server needed)
# Windows:
start index.html

# Mac:
open index.html

# Linux:
xdg-open index.html
```

---

## 📂 Project Structure

```
cardinfo/
├── index.html      # App shell — Landing, Onboarding, Wallet, Modals
├── style.css       # Full design system — dark mode, glassmorphism, animations
├── app.js          # App logic — routing, cards, NFC, checkout, dashboard
└── README.md       # This file
```

---

## 🎯 How to Use

1. **Landing Page** → Click "Get Started Free" or "View Live Demo"
2. **Onboarding** → Choose your role, pick a plan, create your first card
3. **Wallet** → See your cards in Apple Pay-style stack
4. **Add Card** → Click "+ Add Card" or use Quick Add shortcuts (🎓 University, 🏢 Company...)
5. **NFC Scan** → Click the purple "NFC Scan" button for animated verification
6. **Flip Card** → Click any card to see QR code on the back
7. **Upgrade Plan** → Click "Upgrade Plan" in the wallet sidebar
8. **Revenue Dashboard** → Click "Revenue" in the top nav

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `Ctrl + K` | Open card designer |
| `Escape` | Close any modal |

---

## 🏗️ Tech Stack

- **HTML5** — Semantic structure
- **Vanilla CSS** — Custom properties, glassmorphism, keyframe animations
- **Vanilla JS (ES6+)** — No frameworks, no build tools
- **QRCode.js** — QR code generation on card backs
- **Font Awesome 6** — Icons
- **Google Fonts** — Inter + Outfit typography
- **localStorage** — Client-side data persistence

---

## 📸 Screenshots

### 🏠 Wallet View
Cards displayed in Apple Pay-style with 3D tilt, NFC icon pulsing, and action buttons.

### 🎨 Card Designer
Live preview card updates as you type. 3 tabs: Identity · Design · Organization.

### 📡 NFC Scanning
Animated ripple rings → 6-step verification sequence → Identity Verified ✅

### 💰 Revenue Dashboard
MRR tracking, commission breakdown, plan distribution chart, subscription table.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

Built with ❤️ by [AHADKHATTAK1](https://github.com/AHADKHATTAK1)
