function getAiSettings() {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const rawApiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY || "";
  const baseUrl = (process.env.AI_API_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || "gpt-4o-mini";
  const aiEnabled = (process.env.AI_ENABLED || "true").toLowerCase() !== "false";

  return {
    provider,
    apiKey: rawApiKey.trim(),
    baseUrl,
    model,
    enabled: aiEnabled,
  };
}

function fallbackAiAnalysis(context, reason) {
  const issues = [
    "AI analysis is currently unavailable.",
    "Deterministic blockchain verification and SHA-256 hash checks remain the authoritative evidence.",
  ];

  if (reason) {
    issues.push(reason);
  }

  return {
    enabled: false,
    status: "Unavailable",
    provider: "none",
    model: "n/a",
    summary: "AI review is disabled or not configured for this deployment.",
    findings: issues,
    recommendation: "Use blockchain verification, document hash comparisons, and rule-based fraud checks as the source of truth.",
    confidence: "Low",
    sourceOfTruth: "Blockchain record + hash comparison",
    reason,
  };
}

function sanitizeJson(text) {
  if (!text) return null;

  const cleaned = text.trim();
  const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    return fenced[1].trim();
  }

  return cleaned;
}

function normalizeAiOutput(raw, provider, model) {
  const summary = String(raw?.summary || "AI review completed.").trim();
  const recommendation = String(raw?.recommendation || "Review the blockchain and document evidence before taking action.").trim();
  const findings = Array.isArray(raw?.findings)
    ? raw.findings.map((item) => String(item).trim()).filter(Boolean)
    : [
        "AI review identified no explicit discrepancies in the submitted certificate details.",
      ];

  const confidence = String(raw?.confidence || "Medium").trim();

  return {
    enabled: true,
    status: "Available",
    provider,
    model,
    summary,
    findings,
    recommendation,
    confidence,
    sourceOfTruth: "Blockchain record + hash comparison",
  };
}

async function callOpenAICompatible({ apiKey, baseUrl, model, prompt }) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a cautious academic certificate fraud analyst. Use only the evidence provided. Never invent blockchain records or claim a certificate is authentic without matching blockchain and hash evidence. Give concise JSON output with summary, findings, recommendation, and confidence fields.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI provider request failed (${response.status}): ${errorBody}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI provider returned no content.");
  }

  const parsed = JSON.parse(sanitizeJson(content));

  return normalizeAiOutput(parsed, "openai-compatible", model);
}

async function analyzeCertificateWithAI(context) {
  const settings = getAiSettings();

  if (!settings.enabled || !settings.apiKey) {
    return fallbackAiAnalysis(
      context,
      "AI provider is not configured. Configure AI_API_KEY and AI_API_BASE_URL to enable AI-assisted review."
    );
  }

  try {
    const prompt = `
      Analyze this academic certificate for fraud risk using only the provided evidence.
      Important rules:
      - The blockchain record and document hash are authoritative.
      - Never claim authenticity if the certificate ID is missing or if the hash mismatches the blockchain version.
      - If there are mismatches, explain them as suspicious findings, not proof of validity.
      - Use a concise but helpful explanation.

      Evidence:
      ${JSON.stringify({
        certificateId: context.certificateId || "",
        extractedData: context.extractedData || {},
        blockchainData: context.blockchainData || null,
        hash: context.hash || "",
        hashMatch: !!context.hashMatch,
        riskLevel: context.riskLevel || "UNKNOWN",
        riskScore: context.riskScore || 0,
        reasons: context.reasons || [],
      }, null, 2)}

      Return JSON with these keys only: summary, findings, recommendation, confidence.
    `;

    if (settings.provider === "openai") {
      return await callOpenAICompatible({
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model,
        prompt,
      });
    }

    return await callOpenAICompatible({
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl,
      model: settings.model,
      prompt,
    });
  } catch (error) {
    console.warn("AI fraud analysis failed:", error.message);
    return fallbackAiAnalysis(context, error.message);
  }
}

module.exports = {
  analyzeCertificateWithAI,
};
