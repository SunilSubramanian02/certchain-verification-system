import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Certificate from "./models/Certificate.js";
import QRCode from "qrcode";
import { ethers } from "ethers";
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import multer from "multer";

dotenv.config();

const app = express();

// CORS fix for Vercel
app.use(cors({
  origin: [
    "https://cert-chain-system.vercel.app",
    "http://localhost:5000",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Blockchain setup
const artifactPath = path.join(
  __dirname, "..", "blockchain", "artifacts", "contracts",
  "CertChain.sol", "CertChain.json"
);
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const CONTRACT_ABI = artifact.abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// ── AI Rule-based Certificate Analysis ──────────────────
function analyzeCertificate(buffer) {
  const text = buffer.toString("latin1").toLowerCase();
  const suspicious = [];
  const positive = [];

  if (/university|college|institute|academy|school|coursera|udemy|nptel/.test(text)) {
    positive.push("Institution name detected");
  } else {
    suspicious.push("No institution name found");
  }

  if (/certificate|certif|completion|achievement|awarded|successfully/.test(text)) {
    positive.push("Certificate keywords found");
  } else {
    suspicious.push("No certificate keywords found");
  }

  if (/201[0-9]|202[0-9]|january|february|march|april|may|june|july|august|september|october|november|december/.test(text)) {
    positive.push("Date detected");
  } else {
    suspicious.push("No date found");
  }

  if (/awarded to|presented to|certify that|has successfully|has completed/.test(text)) {
    positive.push("Proper certificate format detected");
  } else {
    suspicious.push("Standard certificate format missing");
  }

  if (/signature|director|principal|dean|authorized|signed|instructor|professor/.test(text)) {
    positive.push("Authority reference found");
  } else {
    suspicious.push("No authority signature found");
  }

  const isSuspicious = suspicious.length >= 3;

  return {
    isSuspicious,
    suspicious,
    positive,
    verdict: isSuspicious ? "⚠️ Suspicious Certificate" : "✅ Looks Genuine"
  };
}
// ────────────────────────────────────────────────────────

// Test route
app.get("/", (req, res) => {
  res.send("CertChain Server Running 🚀");
});

app.get("/ping", (req, res) => {
  res.send("Server Running 🚀");
});

// POST → Add Certificate
app.post("/add-certificate", upload.single("pdf"), async (req, res) => {
  try {
    const { candidateName, course, certificateId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }

    const pdfHash = createHash("sha256")
      .update(req.file.buffer)
      .digest("hex");

    const newCertificate = new Certificate({
      candidateName,
      course,
      certificateId,
      pdfHash
    });
    await newCertificate.save();

    const tx = await contract.addCertificate(pdfHash);
    await tx.wait();
    console.log("PDF Hash stored on blockchain ✅:", pdfHash);

    const qrData = `https://certchain-verification-system.onrender.com/verify/${certificateId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.status(201).json({
      message: "Certificate Added ✅",
      data: newCertificate,
      qrCode,
      blockchainHash: pdfHash
    });

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST → Verify PDF (with AI Analysis)
app.post("/verify-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }

    const pdfHash = createHash("sha256")
      .update(req.file.buffer)
      .digest("hex");

    // AI Analysis
    const aiResult = analyzeCertificate(req.file.buffer);
    console.log("AI Analysis:", aiResult.verdict);

    // Blockchain check
    const isOnChain = await contract.verifyCertificate(pdfHash);

    if (isOnChain) {
      const certificate = await Certificate.findOne({ pdfHash });
      res.status(200).json({
        message: "Certificate is VALID ✅",
        blockchainVerified: true,
        data: certificate,
        aiAnalysis: aiResult
      });
    } else {
      res.status(200).json({
        message: "Certificate is FAKE ❌",
        blockchainVerified: false,
        aiAnalysis: aiResult
      });
    }

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET → Verify by ID (QR scan)
app.get("/verify/:id", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id
    });

    if (!certificate) {
      return res.status(404).json({ message: "Certificate Not Found ❌" });
    }

    const isOnChain = await contract.verifyCertificate(certificate.pdfHash);

    res.status(200).json({
      message: isOnChain ? "Certificate Verified ✅" : "Not on Blockchain ⚠️",
      data: certificate,
      blockchainVerified: isOnChain
    });

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Connect DB and start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");
    app.listen(5000, () => console.log("Server started on port 5000"));
  })
  .catch((err) => console.log(err));