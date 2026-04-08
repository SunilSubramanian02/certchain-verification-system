# ⛓️ CertChain: Blockchain-Based Certificate Verification System

A secure, decentralized application (DApp) designed to eliminate academic credential fraud. CertChain uses cryptographic hashing and Ethereum blockchain technology to ensure that certificates are authentic and tamper-proof.

## 🚀 How It Works
1. **Hashing:** When a certificate PDF is uploaded, the system generates a unique **SHA-256 hash**.
2. **Blockchain Storage:** This hash is stored on the **Ethereum Blockchain** (EVM), creating an immutable record.
3. **Verification:** To verify, a user uploads a PDF. The system re-generates the hash and compares it with the one stored on the blockchain.
4. **Instant Detection:** If even a single character in the PDF is changed, the hashes won't match, and the system flags it as **FAKE**.

## 🛠️ Tech Stack
- **Frontend:** HTML5, CSS3 (Glassmorphism UI), JavaScript (ES6)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (for metadata caching)
- **Blockchain:** Solidity, Hardhat, Ethers.js
- **Security:** SHA-256 Hashing Algorithm

## 📂 Features
- **Modern UI:** Responsive dark-mode interface with glassmorphism effects.
- **QR Code Integration:** Automatically generates QR codes for instant verification.
- **Real-time Status:** Displays "Blockchain Active" status using live connectivity.
- **Secure Storage:** Metadata is stored in MongoDB while proof of authenticity is on-chain.

## 🔧 Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/SunilSubramanian02/certchain-verification-system.git](https://github.com/SunilSubramanian02/certchain-verification-system.git)
