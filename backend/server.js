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

// CORS — allow all origins
app.use(cors({ origin: "*" }));

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

app.get("/", (req, res) => {
  res.send("CertChain Server Running