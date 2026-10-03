const { PDFParse } = require("pdf-parse");

function normalizeText(value) {
  if (!value) return "";

  return String(value)
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function findPattern(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return normalizeText(match[1]);
    }
  }

  return "";
}

function extractCertificateDataFromText(pdfText) {
  const text = normalizeText(pdfText || "");

  const certificateId = findPattern(text, [
    /(?:Certificate\s*ID|Certificate\s*No\.|Certif?icate\s*No)\s*[:#-]?\s*([A-Za-z0-9-]+)(?=\s*(?:Student|Degree|Department|University|Issuer|$))/i,
    /(?:ID)\s*[:#-]?\s*([A-Z]{2,}-\d+)(?=\s*(?:Student|Degree|Department|University|Issuer|$))/i,
    /([A-Z]{2,}-\d+)(?=\s*(?:Student|Degree|Department|University|Issuer|$))/,
  ]);

  const studentName = findPattern(text, [
    /Student\s*Name\s*[:\-]?\s*([A-Z][A-Za-z' .-]+?)(?=\s*(?:Degree|Department|University|Issuer|Certificate|$))/i,
    /Name\s*[:\-]?\s*([A-Z][A-Za-z' .-]+?)(?=\s*(?:Degree|Department|University|Issuer|Certificate|$))/i,
  ]);

  const degree = findPattern(text, [
    /Degree\s*[:\-]?\s*([A-Za-z0-9 .,-]+?)(?=\s*(?:Department|University|Issuer|Certificate|$))/i,
    /Program\s*[:\-]?\s*([A-Za-z0-9 .,-]+?)(?=\s*(?:Department|University|Issuer|Certificate|$))/i,
  ]);

  const department = findPattern(text, [
    /Department\s*[:\-]?\s*([A-Za-z0-9 .,-]+?)(?=\s*(?:University|Issuer|Certificate|$))/i,
    /Faculty\s*[:\-]?\s*([A-Za-z0-9 .,-]+?)(?=\s*(?:University|Issuer|Certificate|$))/i,
  ]);

  const university = findPattern(text, [
    /University\s*[:\-]?\s*([A-Za-z0-9 .,&()-]+?)(?=\s*(?:Issuer|Certificate|$))/i,
    /Institution\s*[:\-]?\s*([A-Za-z0-9 .,&()-]+?)(?=\s*(?:Issuer|Certificate|$))/i,
  ]);

  const issuer = findPattern(text, [
    /Issuer\s*[:\-]?\s*([A-Za-z0-9 .,&()-]+?)(?=\s*(?:--|$))/i,
    /Issued\s*By\s*[:\-]?\s*([A-Za-z0-9 .,&()-]+?)(?=\s*(?:--|$))/i,
  ]);

  const issueDate = findPattern(text, [
    /Issue\s*Date\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /Issued\s*On\s*[:\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
  ]);

  return {
    certificateId: certificateId || "",
    studentName: studentName || "",
    degree: degree || "",
    department: department || "",
    university: university || "",
    issuer: issuer || "",
    issueDate: issueDate || "",
    rawText: text,
  };
}

async function extractTextFromPdf(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("A valid PDF buffer is required.");
  }

  const parser = new PDFParse({ data: buffer });
  const parsed = await parser.getText();

  if (!parsed || !parsed.text || !normalizeText(parsed.text).trim()) {
    throw new Error("The uploaded PDF could not be parsed for text.");
  }

  return parsed.text;
}

function normalizedText(value) {
  return normalizeText(value);
}

module.exports = {
  extractTextFromPdf,
  extractCertificateDataFromText,
  normalizedText,
};
