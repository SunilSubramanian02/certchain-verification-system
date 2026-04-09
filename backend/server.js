import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Certificate from "./models/Certificate.js";
import QRCode from "qrcode";
import { ethers } from "ethers";
import { createHash } from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend")));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ── BLOCKCHAIN SETUP (SEPOLIA) ──────────────────────────
const CONTRACT_ADDRESS = "0x4d2a32C0FD5FA03a8aa0184D9e10C5E2B001FF08";
const provider = new ethers.JsonRpcProvider("https://eth-sepolia.g.alchemy.com/v2/WRdUQx1uRHqEc7gtpWBsy");

const wallet = new ethers.Wallet(
  "ae645d02167757963272057f7e50a66e61cb1085a960c5e8e6b3d10f875350e8",
  provider
);

// FULL JSON ABI (This is much more stable than Human-Readable ABI)
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "_id", "type": "string"},
      {"internalType": "string", "name": "_name", "type": "string"},
      {"internalType": "string", "name": "_course", "type": "string"},
      {"internalType": "string", "name": "_date", "type": "string"}
    ],
    "name": "issueCertificate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_id", "type": "string"}],
    "name": "verifyCertificate",
    "outputs": [
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "string", "name": "", "type": "string"},
      {"internalType": "address", "name": "", "type": "address"},
      {"internalType": "uint256", "name": "", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Routes
app.post("/add-certificate", upload.single("pdf"), async (req, res) => {
  try {
    const { candidateName, course, certificateId } = req.body;
    if (!req.file) return res.status(400).json({ error: "PDF file required" });

    const pdfHash = createHash("sha256").update(req.file.buffer).digest("hex");

    // 1. Store on MongoDB
    const newCertificate = new Certificate({
      candidateName, course, certificateId, pdfHash
    });
    await newCertificate.save();

    // 2. Store on Blockchain
    console.log(`Attempting to issue certificate: ${certificateId}`);
    const dateNow = new Date().toLocaleDateString();
    
    // IMPORTANT: Adding manual gasLimit and using the wallet as signer
    const tx = await contract.issueCertificate(certificateId, candidateName, course, dateNow, {
        gasLimit: 300000 
    });
    
    console.log("Transaction Hash Sent:", tx.hash);
    const receipt = await tx.wait();

    if (receipt.status === 0) {
        throw new Error("Transaction Reverted by Blockchain. Try a totally different Certificate ID.");
    }

    console.log("Blockchain Confirmation Success ✅");

    const qrData = `http://localhost:5000/verify/${certificateId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.status(201).json({
      message: "Success! Certificate stored on Blockchain ✅",
      data: newCertificate,
      qrCode,
      blockchainHash: tx.hash
    });

  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({ error: error.message });
  }
});

// Other routes (verify-pdf, ping etc.) remain the same...
// ... (Keep your verify-pdf and mongo connection logic as is) ...

app.post("/verify-pdf", upload.single("pdf"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "PDF file required" });
      const pdfHash = createHash("sha256").update(req.file.buffer).digest("hex");
      const certificate = await Certificate.findOne({ pdfHash });
      if (certificate) {
        res.status(200).json({ message: "Certificate is VALID ✅", blockchainVerified: true, data: certificate });
      } else {
        res.status(200).json({ message: "Certificate is FAKE ❌", blockchainVerified: false });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
    app.listen(5000, () => console.log("Server started on port 5000 - Sepolia Mode 🚀"));
  })
  .catch((err) => console.log(err));