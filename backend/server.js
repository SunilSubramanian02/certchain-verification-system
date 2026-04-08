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

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "../frontend")));

// Blockchain setup
const artifactPath = path.join(
  __dirname, "..", "blockchain", "artifacts", "contracts",
  "CertChain.sol", "CertChain.json"
);
const artifact = JSON.parse(readFileSync(artifactPath, "utf8"));
const CONTRACT_ABI = artifact.abi;
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

// Test route
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// POST → Add Certificate
app.post("/add-certificate", async (req, res) => {
  try {
    const { candidateName, course, certificateId } = req.body;

    const newCertificate = new Certificate(req.body);
    await newCertificate.save();

    const hash = createHash("sha256")
      .update(candidateName + course + certificateId)
      .digest("hex");

    const tx = await contract.addCertificate(hash);
    await tx.wait();
    console.log("Hash stored on blockchain ✅:", hash);

    const qrData = `http://localhost:5000/verify/${certificateId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.status(201).json({
      message: "Certificate Added ✅",
      data: newCertificate,
      qrCode,
      blockchainHash: hash
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET → Verify Certificate
app.get("/verify/:id", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id
    });

    if (!certificate) {
      return res.status(404).json({ message: "Certificate Not Found ❌" });
    }

    const hash = createHash("sha256")
      .update(certificate.candidateName + certificate.course + certificate.certificateId)
      .digest("hex");

    const isOnChain = await contract.verifyCertificate(hash);

    res.status(200).json({
      message: isOnChain ? "Certificate Verified on Blockchain ✅" : "Not found on Blockchain ⚠️",
      data: certificate,
      blockchainVerified: isOnChain,
      hash
    });

  } catch (error) {
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