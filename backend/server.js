const express = require("express");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const crypto = require("crypto");

const { ethers } = require("ethers");
const { extractTextFromPdf, extractCertificateDataFromText } = require("./services/certificateParser");
const { analyzeFraud } = require("./services/fraudAnalyzer");
const { analyzeCertificateWithAI } = require("./services/aiAnalyzer");
const { initializeDatabase } = require("./db");
const authRoutes = require("./authRoutes");
const { authenticateUser, requireRole } = require("./auth");

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

const PORT = process.env.PORT || 5050;

const provider = new ethers.JsonRpcProvider(
  process.env.BLOCKCHAIN_RPC_URL
);

const signer = new ethers.Wallet(
  process.env.PRIVATE_KEY,
  provider
);

const contractAddress = process.env.CONTRACT_ADDRESS;

if (!contractAddress || !process.env.BLOCKCHAIN_RPC_URL || !process.env.PRIVATE_KEY) {
  throw new Error(
    "Missing required env vars: CONTRACT_ADDRESS, BLOCKCHAIN_RPC_URL, and PRIVATE_KEY"
  );
}

const contractABI = [
  "function issueCertificate(string memory _certificateId, string memory _studentName, string memory _degree, string memory _department, string memory _university, string memory _certificateHash, string memory _issuer) public",
  "function verifyCertificate(string memory _certificateId, string memory _certificateHash) public view returns (bool valid, string memory studentName, string memory degree, string memory department, string memory university, string memory issuer, uint256 issueDate, bool revoked)",
  "function revokeCertificate(string memory _certificateId) public",
  "function getCertificateCount() public view returns (uint256)",
  "function getCertificateId(uint256 index) public view returns (string memory)",
  "function getCertificate(string memory _certificateId) public view returns (string memory certificateId, string memory studentName, string memory degree, string memory department, string memory university, string memory certificateHash, string memory issuer, uint256 issueDate, bool revoked)"
];

const certificateRegistry = new ethers.Contract(
  contractAddress,
  contractABI,
  signer
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
      return;
    }

    cb(new Error("Only PDF files are allowed."));
  },
});

(async () => {
  try {
    await initializeDatabase();
    console.log("SQLite database initialized");
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
})();

app.get("/", (req, res) => {
  res.json({
    message: "CertiChain backend is running 🚀"
  });
});

app.get("/api/certificate/:id", async (req, res) => {
  try {
    const certificateId = req.params.id;
    const certificateHash = req.query.hash;

    if (!certificateHash) {
      return res.status(400).json({
        error: "Certificate hash is required"
      });
    }

    const result =
      await certificateRegistry.verifyCertificate(
        certificateId,
        certificateHash
      );

    res.json({
      certificateId,
      valid: result[0],
      studentName: result[1],
      degree: result[2],
      department: result[3],
      university: result[4],
      issuer: result[5],
      issueDate: result[6].toString(),
      revoked: result[7]
    });
  } catch (error) {
    console.error("Verification error:", error);

    res.status(500).json({
      error: "Blockchain verification failed",
      details: error.message
    });
  }
});

app.post("/api/certificate/issue", authenticateUser, requireRole("ADMIN", "ISSUER"), async (req, res) => {
  try {
    const {
      certificateId,
      studentName,
      studentEmail,
      degree,
      department,
      university,
      certificateHash,
      issuer
    } = req.body;

    if (
      !certificateId ||
      !studentName ||
      !studentEmail ||
      !degree ||
      !department ||
      !university ||
      !certificateHash ||
      !issuer
    ) {
      return res.status(400).json({
        error: "All certificate fields are required"
      });
    }

    console.log("Issuing certificate:", certificateId);
    console.log("Using signer:", await signer.getAddress());

    const transaction =
      await certificateRegistry.issueCertificate(
        certificateId,
        studentName,
        degree,
        department,
        university,
        certificateHash,
        issuer
      );

    console.log("Transaction sent:", transaction.hash);

    await transaction.wait();

    console.log("Certificate issued successfully.");

    res.json({
      success: true,
      message: "Certificate issued successfully",
      certificateId,
      studentEmail,
      studentName,
      degree,
      department,
      university,
      issuer,
      certificateHash,
      transactionHash: transaction.hash,
    });
  } catch (error) {
    console.error("Issuance error:", error);

    res.status(500).json({
      error: "Certificate issuance failed",
      details: error.shortMessage || error.message,
    });
  }
});

app.post("/api/certificate/revoke", authenticateUser, requireRole("ADMIN", "ISSUER"), async (req, res) => {
  try {
    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        error: "Certificate ID is required",
      });
    }

    console.log("Revoking certificate:", certificateId);

    const transaction = await certificateRegistry.revokeCertificate(certificateId);
    await transaction.wait();

    res.json({
      success: true,
      message: "Certificate revoked successfully",
      certificateId,
      transactionHash: transaction.hash,
    });
  } catch (error) {
    console.error("Revocation error:", error);

    res.status(500).json({
      error: "Certificate revocation failed",
      details: error.shortMessage || error.message,
    });
  }
});

app.get("/api/dashboard/stats", authenticateUser, requireRole("ADMIN", "ISSUER"), async (req, res) => {
  try {
    const count =
      await certificateRegistry.getCertificateCount();

    const total = Number(count);

    let verified = 0;
    let revoked = 0;

    for (let i = 0; i < total; i++) {
      const certificateId =
        await certificateRegistry.getCertificateId(i);

      const certificate =
        await certificateRegistry.getCertificate(
          certificateId
        );

      const certificateHash = certificate[5];
      const isRevoked = certificate[8];

      if (certificateHash) {
        verified++;
      }

      if (isRevoked) {
        revoked++;
      }
    }

    res.json({
      totalCertificates: total,
      verifiedCertificates: verified,
      revokedCertificates: revoked
    });
  } catch (error) {
    console.error("Dashboard error:", error);

    res.status(500).json({
      error: "Unable to load dashboard statistics"
    });
  }
});

app.get("/api/certificates", authenticateUser, requireRole("ADMIN", "ISSUER"), async (req, res) => {
  try {
    const count =
      await certificateRegistry.getCertificateCount();

    const total = Number(count);

    const certificates = [];

    for (let i = 0; i < total; i++) {
      const certificateId =
        await certificateRegistry.getCertificateId(i);

      const certificate =
        await certificateRegistry.getCertificate(
          certificateId
        );

      certificates.push({
        certificateId: certificate[0],
        studentName: certificate[1],
        degree: certificate[2],
        department: certificate[3],
        university: certificate[4],
        certificateHash: certificate[5],
        issuer: certificate[6],
        issueDate: certificate[7].toString(),
        revoked: certificate[8]
      });
    }

    res.json({
      certificates
    });
  } catch (error) {
    console.error("Certificate list error:", error);

    res.status(500).json({
      error: "Unable to load certificates"
    });
  }
});

app.get("/api/certificate/lookup/:id", async (req, res) => {
  try {
    const certificateId = req.params.id;

    if (!certificateId) {
      return res.status(400).json({
        error: "Certificate ID is required"
      });
    }

    const certificate = await certificateRegistry.getCertificate(certificateId);

    if (!certificate || !certificate[0]) {
      return res.status(404).json({
        error: "Certificate not found",
        valid: false
      });
    }

    res.json({
      valid: true,
      certificateId: certificate[0],
      studentName: certificate[1],
      degree: certificate[2],
      department: certificate[3],
      university: certificate[4],
      certificateHash: certificate[5],
      issuer: certificate[6],
      issueDate: certificate[7].toString(),
      revoked: certificate[8]
    });
  } catch (error) {
    console.error("Certificate lookup error:", error);

    res.status(500).json({
      error: "Unable to look up certificate metadata",
      details: error.shortMessage || error.message
    });
  }
});

app.post("/api/fraud/analyze", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a valid PDF certificate."
      });
    }

    const pdfBuffer = req.file.buffer;
    const fileHash = crypto.createHash("sha256").update(pdfBuffer).digest("hex");

    const extractedText = await extractTextFromPdf(pdfBuffer);
    const extractedData = extractCertificateDataFromText(extractedText);

    const certificateId = (extractedData.certificateId || "").trim();
    let blockchainData = null;
    let hashMatch = false;

    if (certificateId) {
      try {
        const blockchainCertificate = await certificateRegistry.getCertificate(certificateId);

        if (blockchainCertificate && blockchainCertificate[0]) {
          blockchainData = {
            certificateId: blockchainCertificate[0],
            studentName: blockchainCertificate[1],
            degree: blockchainCertificate[2],
            department: blockchainCertificate[3],
            university: blockchainCertificate[4],
            certificateHash: blockchainCertificate[5],
            issuer: blockchainCertificate[6],
            issueDate: blockchainCertificate[7].toString(),
            revoked: blockchainCertificate[8],
          };

          if (blockchainData.certificateHash) {
            hashMatch = blockchainData.certificateHash.toLowerCase() === fileHash.toLowerCase();
          }
        }
      } catch (lookupError) {
        console.warn("Blockchain lookup for fraud analysis failed:", lookupError.message);
      }
    }

    const result = analyzeFraud({
      extractedData,
      blockchainData,
      hash: fileHash,
      hashMatch,
      certificateId,
    });

    const aiAnalysis = await analyzeCertificateWithAI({
      certificateId,
      extractedData,
      blockchainData,
      hash: fileHash,
      hashMatch,
      riskLevel: result.riskLevel,
      riskScore: result.riskScore,
      reasons: result.reasons,
    });

    res.json({
      ...result,
      fileName: req.file.originalname,
      extractedData,
      aiAnalysis,
    });
  } catch (error) {
    console.error("Fraud analysis error:", error);

    res.status(500).json({
      error: "Unable to analyze the uploaded certificate.",
      details: error.message
    });
  }
});

app.use("/api/auth", authRoutes);

app.get("/api/admin/users", authenticateUser, requireRole("ADMIN"), async (req, res) => {
  try {
    const { listUsers } = require("./db");
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Unable to load users." });
  }
});

app.listen(PORT, () => {
  console.log(
    `Backend server running on http://localhost:${PORT}`
  );

  console.log(
    `Connected contract: ${contractAddress}`
  );

  console.log(
    `Backend signer: ${signer.address}`
  );
});