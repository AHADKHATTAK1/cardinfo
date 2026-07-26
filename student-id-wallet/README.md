# Student / College ID → Apple Wallet + Google Wallet

Ye project aapke school/college/university ke ID card ko **Apple Wallet** aur
**Google Wallet** mein "Add" karne wala button/system banata hai — jese
boarding pass ya membership card add hoti hai.

## Ye kaise kaam karta hai (architecture)

```
Student data (DB/CSV)
      │
      ▼
  Node.js server (ye project)
      │
      ├──► Apple Wallet: .pkpass file generate + sign karta hai
      │      (browser mein "Add to Apple Wallet" button se download hoti hai)
      │
      └──► Google Wallet: signed JWT link generate karta hai
             (browser mein "Add to Google Wallet" button se open hoti hai)
```

Real card number kahin store nahi hota — ye sirf ek **digital ID pass**
hai (naam, roll number, department, photo, barcode/QR), payment card nahi.

## Aapko khud ye 2 cheezen leni hongi (main provide nahi kar sakta)

### 1. Apple Wallet ke liye
1. [Apple Developer Program](https://developer.apple.com/programs/) join karein ($99/saal) — school/college ke naam se
2. Developer portal mein ek **Pass Type ID** banayein (e.g. `pass.com.yourcollege.studentid`)
3. Uske liye ek certificate generate karein aur `.p12` file ke tor par export karein
4. Apple ka `WWDR.pem` (Apple Worldwide Developer Relations certificate) download karein
5. Ye 2 files `config/certs/` folder mein rakhein:
   - `signerCert.p12`
   - `wwdr.pem`

### 2. Google Wallet ke liye
1. [Google Wallet Console](https://pay.google.com/business/console) mein signup karein aur **Issuer Account** banwayein (Google approve karta hai, 1-2 din lagte hain)
2. Google Cloud Console mein ek **Service Account** banayein, aur uski JSON key download karein
3. Wo JSON file `config/certs/google-service-account.json` ke naam se rakhein
4. Apna Issuer ID `.env` mein daalein

## Setup

```bash
npm install
cp .env.example .env
# .env mein apni details bharein
node server.js
```

Phir `http://localhost:3000/preview/12345` khol kar dekhen (12345 = demo student ID).

## Files

- `apple-wallet/generateApplePass.js` — .pkpass banata aur sign karta hai
- `apple-wallet/passModel/pass.json` — pass ka template (fields, colors, barcode)
- `google-wallet/generateGooglePass.js` — Google Wallet JWT link banata hai
- `server.js` — dono ke liye routes + demo preview page
- `public/index.html` — student ke liye "Add to Wallet" buttons wala page

## Zaroori images (khud banwayen/design karayen)

Apple pass ke liye ye images `apple-wallet/passModel/` mein honi chahiye:
- `icon.png` (29x29) aur `icon@2x.png` (58x58)
- `logo.png` (160x50) — college ka logo
- `strip.png` (312x84) — background banner (optional)

Bina in images ke Apple pass generate nahi hoga.
