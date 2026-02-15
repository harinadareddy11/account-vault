<div align="center">

# 🔐 AccountVault

### Secure Identity & Credential Management App (Android)

**Privacy-First • Offline-First • Encrypted by Design**

[![React Native](https://img.shields.io/badge/React_Native-Expo-blue?logo=react)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-green?logo=supabase)](https://supabase.com)
[![EAS Build](https://img.shields.io/badge/Build-EAS-orange?logo=expo)](https://expo.dev/eas)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)

📦 **[Download Production APK](https://github.com/harinadareddy11/account-vault/releases)**

</div>

---

## 😤 The Problem

> *"Which email did I use to sign up for this?"*
> *"Did this API key expire? When?"*
> *"I have 3 Gmail accounts — which one owns my AWS?"*

Students and developers typically juggle **5+ email identities** across cloud platforms, coding profiles, SaaS tools, and subscriptions. The result:

- ⏳ Wasted hours on account recovery and credential hunting
- 🔁 Reused passwords across platforms without realising it
- 💸 Forgotten paid subscriptions silently draining money
- 🔑 Expired API keys breaking projects at the worst time
- 😵 Zero visibility into *which identity owns what*

**Existing password managers solve storage — but not identity relationships.**

---

## ✅ The Solution

**AccountVault** is not a password manager clone.

It's an **identity relationship mapper with developer-first UX** — a local-first credential vault built around how developers and students actually think about their accounts.

| Capability | What it solves |
|---|---|
| 📧 Email-centric reverse lookup | Instantly see every service tied to an email |
| 🤖 Automatic clipboard detection for API keys | Never manually paste and lose a key again |
| 🔔 Smart expiry notifications | Get alerted before API keys, passwords, and subscriptions expire |
| 📊 Analytics dashboard | Spot password reuse, subscription costs, and security risks at a glance |
| ☁️ Optional cloud backup with auto-sync | Encrypted backup — available when you need it, invisible when you don't |

---

## 🎯 Who Is This For?

- 🧑‍💻 **Developers** managing multiple cloud accounts, API keys, and SaaS subscriptions
- 🎓 **Students** with separate academic, personal, and project email identities
- 👥 **Anyone** who has ever said *"I forgot which email I used"*

---

## ✨ Core Features

### 🔐 Secure Credential Storage
- AES-based encrypted data storage
- Local SQLite database for complete offline access
- Secure master password system with no plaintext persistence

### 📧 Email-Centric Identity Mapping
- View all services and accounts associated with each email identity
- Reverse lookup — search a service, find which email owns it
- Category-based grouping (Cloud, Dev Tools, Social, Subscriptions, etc.)

### 🤖 Smart Detection
- Automatic API key detection from clipboard using regex patterns
- Prompts to assign detected keys to the right project instantly
- Reduces manual entry and copy-paste errors

### 📊 Analytics Dashboard
- Password reuse monitor — highlights dangerous overlaps
- Expiry timeline — upcoming expirations in one view
- Subscription cost tracker — know what you're paying and where
- Security health score *(upcoming)*

### 🔔 Smart Notifications
- Expiry alerts before API keys, tokens, or subscriptions lapse
- Security reminders for accounts not accessed in a while
- Renewal notifications with action shortcuts

### 👤 Authentication & Security
- Supabase authentication (Email/Password)
- Biometric unlock (Fingerprint / Face ID)
- Secure session persistence using Expo SecureStore

### ☁️ Optional Cloud Sync
- Zero-knowledge approach — data encrypted client-side before upload
- Auto-sync when connected; fully functional offline
- Restore vault on new device in seconds

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| ⚛️ React Native (Expo) | Cross-platform mobile development |
| 🔐 Expo Secure Store | Secure master key handling |
| 🗄️ SQLite | Local offline encrypted database |
| ☁️ Supabase | Authentication & optional cloud sync |
| 🔔 Expo Notifications | Expiry & security alerts |
| 🧭 React Navigation | App navigation |
| 📦 EAS Build | Production Android APK generation |

---

## 🏗 Architecture

```
React Native (Frontend)
        ⬇
Supabase Authentication
        ⬇
Encrypted Local Storage (SQLite + SecureStore)
        ⬇
Optional Cloud Sync (Supabase — encrypted before upload)
```

**Key Design Principles:**
- ✅ Offline-first — fully functional without internet
- ✅ Privacy-focused — no plaintext password storage ever
- ✅ Zero-knowledge cloud sync — encrypted client-side
- ✅ Identity-first architecture — emails are the root entity, not services
- ✅ Developer UX — clipboard detection, API key tracking, project mapping

---

## 🚀 Getting Started (Development)

### Prerequisites
- Node.js >= 18
- Expo CLI
- Expo Go app (for testing on device)

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/harinadareddy11/account-vault.git
cd account-vault
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Start Development Server
```bash
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android/iOS device.

---

## 📦 Production Build

The production Android APK is built using **Expo EAS Build**.

### Generate APK
```bash
eas build -p android --profile preview
```

### Download Latest Release
👉 **[https://github.com/harinadareddy11/account-vault/releases](https://github.com/harinadareddy11/account-vault/releases)**

---

## 🔐 Security Design

| Principle | Implementation |
|---|---|
| Encrypted Storage | AES encryption on all sensitive fields before saving |
| No Plaintext Persistence | Master password never stored as plain text |
| Secure Key Handling | Expo SecureStore used for master key |
| Safe Cloud Integration | Supabase anon key only — no service role key exposure |
| Biometric Lock | Fingerprint / Face ID authentication layer |
| Zero-Knowledge Sync | Data encrypted on device before any cloud upload |

---

## 📁 Project Structure

```
account-vault/
├── src/
│   ├── screens/        # App screens (Home, Vault, Analytics, Settings)
│   ├── components/     # Reusable UI components
│   ├── utils/          # Encryption helpers, regex detectors, formatters
│   ├── database/       # SQLite schema and queries
│   ├── contexts/       # React Context providers (auth, vault, theme)
│   └── types/          # TypeScript type definitions
├── assets/             # Icons and images
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
└── README.md
```

---

## 🗺 Roadmap

- [x] AES encrypted local storage
- [x] Email-centric identity mapping
- [x] Biometric authentication
- [x] Supabase cloud sync
- [x] API key clipboard detection
- [ ] Security health score
- [ ] Subscription cost analytics
- [ ] Import from CSV / 1Password / Bitwarden
- [ ] iOS build via EAS

---

## 🎯 Key Highlights

- ✅ Solves a real problem that password managers don't address
- ✅ Production-ready signed Android APK via Expo EAS
- ✅ Offline-first architecture — no internet required
- ✅ AES-encrypted local database with biometric access
- ✅ Developer-focused UX — clipboard detection, API key tracking
- ✅ Clean modular TypeScript codebase

---

## 👨‍💻 Author

**A. Hari Nada Reddy**
🔗 GitHub: [harinadareddy11](https://github.com/harinadareddy11)

---

<div align="center">

⭐ If you found this project useful, consider starring the repository.

*Built for developers, by a developer.*

</div>
