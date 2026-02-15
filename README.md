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

## 🎯 Overview

**AccountVault** is a secure, privacy-focused mobile application designed to help developers and students manage multiple online accounts efficiently.

Unlike traditional password managers, AccountVault focuses on:

| Feature | Description |
|---|---|
| 📧 Email-Centric Mapping | Organize all accounts under their associated email identities |
| 🔐 Local Encrypted Storage | AES-encrypted SQLite database — works fully offline |
| ☁️ Optional Cloud Sync | Zero-knowledge Supabase sync — encrypted before upload |
| 🔔 Smart Expiry Tracking | Alerts for API keys, passwords, and subscriptions |
| 📱 Biometric Authentication | Fingerprint / Face ID unlock support |

---

## ✨ Core Features

### 🔐 Secure Credential Storage
- AES-based encrypted data storage
- Local SQLite database for complete offline access
- Secure master password system with no plaintext persistence

### 👤 Authentication & Security
- Supabase authentication (Email/Password)
- Biometric unlock (Fingerprint / Face ID)
- Secure session persistence using Expo SecureStore

### 📧 Email-Centric Identity Mapping
- View all accounts associated with a specific email
- Reverse lookup for service ownership
- Category-based grouping for organized access

### 📊 Smart Analytics
- Track total accounts and password reuse
- Identify expiring credentials at a glance
- Subscription cost tracking *(upcoming)*

### 🔔 Smart Notifications
- Expiry alerts and renewal reminders
- Security health check notifications

### ☁️ Optional Cloud Sync
- Supabase integration with zero-knowledge approach
- Data encrypted client-side before upload
- Offline-first — cloud sync is fully optional

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
- ✅ Secure session handling with biometric support

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

---

## 📁 Project Structure

```
account-vault/
├── src/
│   ├── screens/        # App screens (Home, Vault, Settings, etc.)
│   ├── components/     # Reusable UI components
│   ├── utils/          # Encryption helpers, regex, formatters
│   ├── database/       # SQLite schema and queries
│   ├── contexts/       # React Context providers
│   └── types/          # TypeScript type definitions
├── assets/             # Icons and images
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
└── README.md
```

---

## 🎯 Key Highlights

- ✅ Production-ready signed Android APK via Expo EAS
- ✅ Offline-first architecture — no internet required
- ✅ AES-encrypted local database with biometric access
- ✅ Clean modular codebase built with TypeScript
- ✅ Supabase anon key only — secure cloud integration

---

## 👨‍💻 Author

**A. Hari Nada Reddy**

🔗 GitHub: [harinadareddy11](https://github.com/harinadareddy11)

---

<div align="center">

⭐ If you found this project useful, consider starring the repository.

*Built with security in mind.*

</div>
