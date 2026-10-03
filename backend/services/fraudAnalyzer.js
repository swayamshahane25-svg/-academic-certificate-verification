function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function compareField(documentValue, blockchainValue) {
  const doc = normalizeValue(documentValue);
  const blk = normalizeValue(blockchainValue);

  return {
    documentValue: documentValue || "",
    blockchainValue: blockchainValue || "",
    match: doc && blk ? doc === blk : doc === blk && !!doc,
  };
}

function calculateRiskScore(fieldComparison, hashMatch) {
  let mismatches = 0;

  for (const field of Object.keys(fieldComparison)) {
    if (!fieldComparison[field].match) {
      mismatches += 1;
    }
  }

  if (!hashMatch) {
    mismatches += 2;
  }

  const score = Math.min(100, mismatches * 18 + (hashMatch ? 0 : 12));

  if (score < 25) return 10;
  if (score < 50) return 35;
  if (score < 75) return 65;
  return 88;
}

function determineRiskLevel(riskScore) {
  if (riskScore <= 25) return "LOW RISK";
  if (riskScore <= 60) return "MEDIUM RISK";
  return "HIGH RISK";
}

function explainRisk(fieldComparison, hashMatch, blockchainFound, certificateId) {
  const reasons = [];

  if (!blockchainFound) {
    reasons.push("No matching blockchain record was found for this certificate ID.");
  }

  const mismatchedFields = Object.entries(fieldComparison)
    .filter(([, result]) => !result.match)
    .map(([field]) => field);

  if (mismatchedFields.length > 0) {
    reasons.push(
      `The uploaded document does not match the blockchain record for: ${mismatchedFields.join(", ")}.`
    );
  }

  if (!hashMatch) {
    reasons.push("The uploaded PDF hash differs from the blockchain record hash.");
  }

  if (blockchainFound && mismatchedFields.length === 0 && hashMatch) {
    reasons.push("Blockchain record matches the uploaded certificate and the document hash is consistent.");
  }

  if (!certificateId) {
    reasons.push("No certificate ID could be confidently extracted from the document.");
  }

  return reasons;
}

function analyzeFraud({
  extractedData,
  blockchainData,
  hash,
  hashMatch,
  certificateId,
}) {
  const comparisonFields = [
    "studentName",
    "degree",
    "department",
    "university",
    "issuer",
  ];

  const fieldComparison = {};

  comparisonFields.forEach((field) => {
    fieldComparison[field] = compareField(
      extractedData?.[field],
      blockchainData?.[field]
    );
  });

  const blockchainFound = !!(blockchainData && blockchainData.certificateId);

  const riskScore = determineRiskScore(
    calculateRiskScore(fieldComparison, !!hashMatch),
    blockchainFound,
    hashMatch,
    certificateId
  );

  const riskLevel = determineRiskLevel(riskScore);
  const reasons = explainRisk(
    fieldComparison,
    !!hashMatch,
    blockchainFound,
    certificateId
  );

  return {
    certificateId: certificateId || extractedData?.certificateId || "",
    extractedData: extractedData || {},
    blockchainData: blockchainData || null,
    hash: hash || "",
    hashMatch: !!hashMatch,
    fieldComparison,
    riskLevel,
    riskScore,
    reasons,
    blockchainFound,
  };
}

function determineRiskScore(value, blockchainFound, hashMatch, certificateId) {
  if (!blockchainFound) {
    return 90;
  }

  if (!certificateId) {
    return 60;
  }

  if (!hashMatch) {
    return 75;
  }

  return value;
}

module.exports = {
  analyzeFraud,
};
