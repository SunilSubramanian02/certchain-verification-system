import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Certificate from "./models/Certificate.js";
import QRCode from "qrcode";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Test route
app.get("/", (req, res) => {
  res.send("Server Running 🚀");
});

// POST API → Add Certificate
app.post("/add-certificate", async (req, res) => {
  try {
    const newCertificate = new Certificate(req.body);
    await newCertificate.save();

    const qrData = `http://localhost:5000/verify/${newCertificate.certificateId}`;
    const qrCode = await QRCode.toDataURL(qrData);

    res.status(201).json({
      message: "Certificate Added ✅",
      data: newCertificate,
      qrCode: qrCode
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// GET API → Verify Certificate
app.get("/verify/:id", async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.id
    });

    if (!certificate) {
      return res.status(404).json({
        message: "Certificate Not Found ❌"
      });
    }

    res.status(200).json({
      message: "Certificate Verified ✅",
      data: certificate
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// Connect DB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected ✅");

    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));