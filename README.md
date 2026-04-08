# ⛓️ CertChain: Blockchain-Based Certificate Verification System

CertChain is a secure, decentralized application (DApp) designed to eliminate academic credential fraud. It uses cryptographic hashing and Ethereum blockchain technology to ensure that certificates are authentic, immutable, and instantly verifiable.

## 🚀 How It Works

1.  **SHA-256 Hashing:** When a certificate PDF is uploaded, the system generates a unique cryptographic fingerprint (Hash).
2.  **Blockchain Integration:** This hash is stored on the **Ethereum Blockchain** (via Smart Contracts), creating a permanent record that cannot be deleted or modified.
3.  **Instant Verification:** To verify, a user uploads the original PDF. The system re-hashes the file and compares it with the blockchain record. If the hashes match, it's **VALID**; otherwise, it's flagged as **TAMPERED**.



## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3 (Modern Glassmorphism UI), JavaScript (ES6)
-   **Backend:** Node.js, Express.js
-   **Database:** MongoDB (Metadata caching)
-   **Blockchain:** Solidity, Hardhat, Ethers.js
-   **Security:** SHA-256 Hashing Algorithm

## 📂 Key Features

-   **Modern UI:** Responsive dark-mode interface with glassmorphism effects.
-   **QR Code Integration:** Automatically generates QR codes for instant verification via mobile.
-   **Real-time Status:** Displays "Blockchain Active" status using live network connectivity.
-   **Anti-Fraud:** Detects even a 1-pixel change in the document.

## 🔧 Installation & Setup 

2. Install Dependencies
Navigate to the backend and blockchain folders and run:

Bash
npm install
3. Smart Contract Compilation
Bash
npx hardhat compile
4. Start the Application
Bash
npm start
Built with  by R.Sunil Subramanian

### 1. Clone the Repository
```bash
git clone [https://github.com/SunilSubramanian02/certchain-verification-system.git](https://github.com/SunilSubramanian02/certchain-verification-system.git)
