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

// CORS for Vercel
app.use(cors({ origin: "*" }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Contract Setup
const artifactPath = path.join(__dirname, "..", "blockchain", "artifacts", "contracts", "CertChain.sol", "CertChain.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const CONTRACT_ABI = artifact.abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// AI Analysis Logic
function analyzeCertificate(buffer) {
    const text = buffer.toString("latin1").toLowerCase();
    const suspicious = [];
    const positive = [];
    if (/university|college|institute|academy|school|coursera|udemy|nptel/.test(text)) positive.push("Institution detected");
    else suspicious.push("No institution found");
    if (/certificate|completion|achievement|awarded/.test(text)) positive.push("Keywords found");
    else suspicious.push("Keywords missing");
    const isSuspicious = suspicious.length >= 3;
    return { isSuspicious, suspicious, positive, verdict: isSuspicious ? "Suspicious" : "Looks Genuine" };
}

// Routes
app.get("/", (req, res) => res.send("CertChain Backend is Live! ✅"));

app.post("/add-certificate", upload.single("pdf"), async (req, res) => {
    try {
        const { candidateName, course, certificateId } = req.body;
        if (!req.file) return res.status(400).json({ error: "PDF required" });

        const pdfHash = createHash("sha256").update(req.file.buffer).digest("hex");
        const newCertificate = new Certificate({ candidateName, course, certificateId, pdfHash });
        await newCertificate.save();

        const tx = await contract.addCertificate(pdfHash);
        await tx.wait();

        const qrData = `https://certchain-verification-system.onrender.com/verify/${certificateId}`;
        const qrCode = await QRCode.toDataURL(qrData);

        res.status(201).json({ message: "Stored on Blockchain", data: newCertificate, qrCode, blockchainHash: pdfHash });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post("/verify-pdf", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "PDF required" });
        const pdfHash = createHash("sha256").update(req.file.buffer).digest("hex");
        const aiResult = analyzeCertificate(req.file.buffer);
        const isOnChain = await contract.verifyCertificate(pdfHash);

        if (isOnChain) {
            const certificate = await Certificate.findOne({ pdfHash });
            res.status(200).json({ blockchainVerified: true, data: certificate, aiAnalysis: aiResult });
        } else {
            res.status(200).json({ blockchainVerified: false, aiAnalysis: aiResult });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Server Start
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(process.env.PORT || 5000, () => console.log("Server & DB Connected ✅"));
    })
    .catch(err => console.log("DB Error:", err));