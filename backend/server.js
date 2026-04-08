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
app.use(cors());

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
const CONTRACT_ADDRESS = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Test route
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

    const qrData = `http://localhost:5000/verify/${certificateId}`;
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

// POST → Verify PDF
app.post("/verify-pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }

    const pdfHash = createHash("sha256")
      .update(req.file.buffer)
      .digest("hex");

    const isOnChain = await contract.verifyCertificate(pdfHash);

    if (isOnChain) {
      const certificate = await Certificate.findOne({ pdfHash });
      res.status(200).json({
        message: "Certificate is VALID ✅",
        blockchainVerified: true,
        data: certificate
      });
    } else {
      res.status(200).json({
        message: "Certificate is FAKE ❌",
        blockchainVerified: false
      });
    }

  } catch (error) {
    console.log("Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET → Verify by ID
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