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

// Important: CORS setup for Vercel connection
app.use(cors({ origin: "*" }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Blockchain Setup
const artifactPath = path.join(__dirname, "..", "blockchain", "artifacts", "contracts", "CertChain.sol", "CertChain.json");
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const CONTRACT_ABI = artifact.abi;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Routes
app.get("/", (req, res) => res.send("CertChain Server is Running ✅"));
app.get("/ping", (req, res) => res.send("pong"));

// 1. Add Certificate to DB and Blockchain
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
        console.error("Error:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// 2. Verify PDF Hash on Blockchain
app.post("/verify-pdf", upload.single("pdf"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "PDF required" });
        const pdfHash = createHash("sha256").update(req.file.buffer).digest("hex");
        
        const isOnChain = await contract.verifyCertificate(pdfHash);

        if (isOnChain) {
            const certificate = await Certificate.findOne({ pdfHash });
            res.status(200).json({ blockchainVerified: true, data: certificate });
        } else {
            res.status(200).json({ blockchainVerified: false });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(process.env.PORT || 5000, () => console.log("Server & DB Live ✅"));
    })
    .catch(err => console.log("DB Connection Failed:", err));